import React, { useState, useRef, useEffect, useContext } from 'react';
import { FiFolder, FiMoreHorizontal, FiChevronDown, FiChevronRight, FiPlus, FiEdit2, FiTrash2, FiShare2, FiInfo } from 'react-icons/fi';
import styles from '../../pages/dashboard/DashboardPage.module.css';

// 컴포넌트 사용에 필요한 AppContext 정의 (실제 사용하는 파일에서 AppContext를 가져옴)
const AppContext = React.createContext({});

// 커스텀 TreeNode 컴포넌트
const TreeNode = ({ node, onSelect, selectedNodeId, onDelete, onRename }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  
  // AppContext에서 필요한 함수들 가져오기
  const { setShowCreateFolderModal, setSelectedNodeId } = useContext(AppContext);
  
  const isSelected = node.id === selectedNodeId;
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  
  const handleClickOutside = (e) => {
    // 버튼 클릭은 버튼 이벤트 핸들러에서 처리하므로 제외
    if (buttonRef.current && buttonRef.current.contains(e.target)) {
      return;
    }
    
    // 메뉴와 메뉴 내부 요소가 아닌 경우에만 메뉴 닫기
    if (menuRef.current && !menuRef.current.contains(e.target)) {
      setShowMenu(false);
    }
  };
  
  useEffect(() => {
    // 메뉴가 열려있을 때만 document 클릭 이벤트 리스너 추가
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    
    // 컴포넌트 언마운트 시 이벤트 리스너 정리
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);
  
  const handleMenuToggle = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };
  
  // 폴더 추가 기능
  const handleAddFolder = () => {
    setSelectedNodeId(node.id); // 현재 노드를 선택 상태로 변경
    setShowCreateFolderModal(true); // 폴더 생성 모달 열기
    setShowMenu(false); // 더보기 메뉴 닫기
  };
  
  // 폴더 확장/축소 토글
  const toggleExpand = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  // 더보기 메뉴 옵션
  const menuOptions = [
    { id: 'add', icon: FiPlus, label: '새로운 폴더', action: handleAddFolder },
    { id: 'edit', icon: FiEdit2, label: '이름 수정', action: () => onRename(node.id) },
    { id: 'delete', icon: FiTrash2, label: '삭제', action: () => onDelete(node.id) },
    { id: 'share', icon: FiShare2, label: '공유', action: () => console.log('공유', node.id) },
    { id: 'info', icon: FiInfo, label: '상세보기', action: () => console.log('상세보기', node.id) },
  ];

  return (
    <div className={styles.treeNodeContainer}>
      <div 
        className={`${styles.treeNode} ${isSelected ? styles.selected : ''}`}
        onClick={() => onSelect(node)}
      >
        <div className={styles.nodeLeft}>
          {hasChildren && (
            <span 
              className={styles.expandIcon}
              onClick={toggleExpand}
            >
              {isExpanded ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
            </span>
          )}
          <FiFolder color="#10b981" />
          <span className={styles.nodeName}>{node.name}</span>
        </div>
        <button
          className={styles.moreButton}
          onClick={handleMenuToggle}
          ref={buttonRef}
        >
          <FiMoreHorizontal />
        </button>
        {showMenu && (
          <div 
            className={styles.moreMenu} 
            ref={menuRef}
          >
            {menuOptions.map((option) => (
              <button key={option.id} onClick={(e) => {
                e.stopPropagation();
                option.action();
              }}>
                {React.createElement(option.icon, { size: 14 })}
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* 자식 노드 렌더링 */}
      {hasChildren && isExpanded && (
        <div className={styles.nodeChildren}>
          {node.children.map(child => (
            <TreeNode 
              key={child.id} 
              node={child}
              onSelect={onSelect}
              selectedNodeId={selectedNodeId}
              onDelete={onDelete}
              onRename={onRename}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TreeNode;
export { AppContext }; 
import React, { useState, useRef, useEffect } from 'react';
import { FiChevronRight, FiFolder, FiMoreVertical, FiEdit2, FiTrash2, FiShare2, FiInfo } from 'react-icons/fi';
import styles from './ProjectTree.module.css';

const TreeItem = ({ item, level = 0, onToggle, onAction, isExpanded }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={styles.treeItem} style={{ paddingLeft: `${level * 20}px` }}>
      <div className={styles.itemHeader}>
        <button 
          className={`${styles.toggleButton} ${isExpanded ? styles.expanded : ''}`}
          onClick={() => onToggle(item.id)}
        >
          <FiChevronRight />
        </button>
        <div className={styles.itemContent}>
          <FiFolder className={styles.folderIcon} />
          <span className={styles.itemName}>{item.name}</span>
          <span className={styles.itemCount}>({item.count || 0})</span>
        </div>
        <div className={styles.itemActions}>
          <button 
            className={styles.moreButton}
            onClick={() => setShowMenu(!showMenu)}
          >
            <FiMoreVertical />
          </button>
          {showMenu && (
            <div className={styles.moreMenu} ref={menuRef}>
              <button onClick={() => onAction('rename', item)}>
                <FiEdit2 />
                <span>이름 수정</span>
              </button>
              <button onClick={() => onAction('delete', item)}>
                <FiTrash2 />
                <span>삭제</span>
              </button>
              <button onClick={() => onAction('share', item)}>
                <FiShare2 />
                <span>공유</span>
              </button>
              <button onClick={() => onAction('details', item)}>
                <FiInfo />
                <span>상세보기</span>
              </button>
            </div>
          )}
        </div>
      </div>
      {isExpanded && item.children && (
        <div className={styles.children}>
          {item.children.map(child => (
            <TreeItem
              key={child.id}
              item={child}
              level={level + 1}
              onToggle={onToggle}
              onAction={onAction}
              isExpanded={child.isExpanded}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ProjectTree = ({ 
  selectedProject,
  onProjectSelect,
  projects,
  structure,
  onToggle,
  onAction 
}) => {
  return (
    <div className={styles.projectTree}>
      <div className={styles.selectWrapper}>
        <select
          value={selectedProject || ''}
          onChange={(e) => onProjectSelect(e.target.value ? Number(e.target.value) : null)}
          className={styles.projectSelect}
        >
          <option value="">프로젝트 선택</option>
          {projects.map(project => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>
      
      {selectedProject && structure && (
        <div className={styles.treeStructure}>
          {structure.map(item => (
            <TreeItem
              key={item.id}
              item={item}
              onToggle={onToggle}
              onAction={onAction}
              isExpanded={item.isExpanded}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectTree; 
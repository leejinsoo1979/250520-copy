import React, { useState, useRef, useEffect, useMemo, createContext, useContext, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FiSearch, FiGrid, FiList, FiPlus, FiFolder, FiFile,
  FiMoreVertical, FiEdit2, FiTrash2, FiShare2, FiInfo,
  FiLogOut, FiClipboard, FiUpload, FiUser, FiSettings,
  FiUsers, FiStar, FiClock, FiCheck, FiChevronDown, FiChevronsRight, FiChevronRight, FiHome, FiBox, FiDownload, FiFolderPlus, FiMoreHorizontal, FiShoppingBag, FiLayout, FiMenu, FiChevronLeft, FiArchive, FiX, FiFileText, FiAlertCircle, FiCircle, FiArrowLeft, FiArrowRight, FiAlertTriangle, FiCheckSquare
} from 'react-icons/fi';
import styles from './DashboardPage.module.css';
import logo from '../../assets/icons/logo.png';
import emptySharedIcon from '../../assets/icons/empty-shared.svg';
import emptyStarredIcon from '../../assets/icons/empty-starred.svg';
import CreateProjectModal from '../../components/dashboard/CreateProjectModal';
import CreateFolderModal from '../../components/dashboard/CreateFolderModal';
import RoomViewer3D from '../../components/common/RoomViewer3D';
import DesignStepModal from '../../components/designSteps/DesignStepModal';
import { ErrorBoundary } from 'react-error-boundary';

// Design options with icons
const designOptions = [
  { 
    id: 'wardrobe', 
    name: '옷장 디자인', 
    icon: FiGrid,
    type: 'wardrobe'
  },
  { 
    id: 'shoes', 
    name: '신발장 디자인', 
    icon: FiArchive,
    type: 'shoeCabinet'
  },
  { 
    id: 'kitchen', 
    name: '키친 디자인', 
    icon: FiHome,
    type: 'kitchen'
  }
];

// Installation locations for dropdown
const installationLocations = ['거실', '침실', '드레스룸', '주방', '아이방', '서재', '직접입력'];

// Menu items configuration
const menuItems = [
  { id: 'all', icon: FiGrid, label: '전체 프로젝트' },
  { id: 'starred', icon: FiStar, label: '중요 프로젝트' },
  { id: 'shared', icon: FiUsers, label: '공유 프로젝트' },
];

const footerMenuItems = [
  { id: 'profile', icon: FiUser, label: '내 정보 관리' },
  { id: 'team', icon: FiUsers, label: '팀 계정 관리' },
  { id: 'settings', icon: FiSettings, label: '설정' },
  { id: 'logout', icon: FiLogOut, label: '로그아웃' },
];

// 커스텀 TreeNode 컴포넌트 - 이미지 스타일에 맞게 수정
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

  // 이름 수정 팝업 관련 상태
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [nodeToRename, setNodeToRename] = useState(null);
  const [newNodeName, setNewNodeName] = useState('');

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

// AppContext 생성
const AppContext = createContext({});

// Design Card Component
const DesignCard = ({ option, onSelect }) => {
  return (
    <div className={styles.designCard} onClick={() => onSelect(option)}>
        <div className={styles.designIcon}>
        {React.createElement(option.icon, { size: 24 })}
        </div>
      <div className={styles.designCardText}>{option.name}</div>
        </div>
  );
};

// Folder Card Component
const FolderCard = ({ folder, onClick }) => {
  return (
    <div className={styles.designCard} onClick={() => onClick(folder)}>
      <div className={styles.designIcon}>
        {folder.type === 'file' ? <FiFile size={24} /> : <FiFolder size={24} />}
      </div>
      <div className={styles.designCardText}>{folder.name}</div>
    </div>
  );
};

// Project Select Component
const ProjectSelect = ({ projects, selectedProject, onSelectProject, onNewProject }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  return (
    <div className={styles.projectSelect} ref={dropdownRef}>
      <button 
        className={`${styles.projectSelectButton} ${isOpen ? styles.open : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedProject ? selectedProject.name : '프로젝트 선택'}
        <FiChevronDown className={`${styles.dropdownIcon} ${isOpen ? styles.open : ''}`} />
        </button>
      
      {isOpen && (
        <div className={styles.projectDropdown}>
          <button 
            className={styles.dropdownItem} 
            onClick={() => {
              onSelectProject(null);
              setIsOpen(false);
            }}
          >
            전체 프로젝트
        </button>
          
          {projects.map(project => (
            <button 
              key={project.id} 
              className={styles.dropdownItem}
              onClick={() => {
                onSelectProject(project);
                setIsOpen(false);
              }}
            >
              {project.name}
            </button>
          ))}
          
          <div className={styles.dropdownDivider}></div>
          
          <button 
            className={styles.newProjectButton}
            onClick={() => {
              onNewProject();
              setIsOpen(false);
            }}
          >
            <FiPlus size={18} />
            <span>새 프로젝트</span>
        </button>
      </div>
      )}
    </div>
  );
};

// 성공 메시지 컴포넌트
const SuccessMessage = ({ message, onClose, onConfirm }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={styles.successMessage}>
      <div className={styles.successIcon}>
        <FiCheck size={24} />
      </div>
      <p>{message}</p>
      <button onClick={onConfirm || onClose}>
        확인
      </button>
    </div>
  );
};

// 모달 컴포넌트
const Modal = ({ title, children, onClose }) => {
  return (
    <div className={styles.modalOverlay} onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className={styles.popupContent}>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
};

// Main Component
const DashboardPage = () => {
  const [projects, setProjects] = useState(() => {
    const savedProjects = localStorage.getItem('projects');
    return savedProjects ? JSON.parse(savedProjects) : [];
  });
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [activeMenu, setActiveMenu] = useState('all');
  const [newlyCreatedProject, setNewlyCreatedProject] = useState(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState('success');
  const [sortOption, setSortOption] = useState('newest');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const sortDropdownRef = useRef(null);
  
  // 삭제 확인 팝업 관련 상태
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [nodeToDelete, setNodeToDelete] = useState(null);
  
  // 이름 수정 팝업 관련 상태
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [nodeToRename, setNodeToRename] = useState(null);
  const [newNodeName, setNewNodeName] = useState('');
  
  // 트리 컨테이너 접기/펴기 상태
  const [isTreeCollapsed, setIsTreeCollapsed] = useState(false);
  
  const navigate = useNavigate();
  const { logout: authLogout } = useAuth();
  const fileInputRef = useRef(null);
  const [showDesignStepModal, setShowDesignStepModal] = useState(false);
  const [selectedDesignType, setSelectedDesignType] = useState(null);
  const [isDesignModalOpen, setIsDesignModalOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDiagramModal, setShowDiagramModal] = useState(false);
  
  // 폼 데이터 상태 추가
  const [formData, setFormData] = useState({
    designTitle: '',
    installationLocation: '',
    customLocation: '',
    spaceInfo: {
      spaceType: 'built-in',
      wallPosition: 'left',
      width: 200,
      height: 230,
      hasAirConditioner: false,
      acPosition: 'top',
      acWidth: 0,
      acHeight: 0,
      acDepth: 0,
      floorFinishHeight: 0
    },
    fitOption: 'normal',
    sizeSettings: {
      width: 200,
      height: 230,
      depth: 60
    },
    baseSettings: {
      hasBase: true,
      baseHeight: 10
    }
  });

  // Save projects to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('projects', JSON.stringify(projects));
  }, [projects]);

  // 초기 데이터 로드 후 첫 번째 프로젝트 선택
  useEffect(() => {
    if (projects.length > 0 && !selectedProject && activeMenu !== 'all') {
      setSelectedProject(projects[0]);
      setSelectedNodeId(projects[0].id);
    }
  }, [projects, selectedProject, activeMenu]);

  // 메뉴 변경 시 처리
  useEffect(() => {
    // 전체 프로젝트, 중요 프로젝트, 공유 프로젝트 메뉴 전환 시 항상 프로젝트 선택 상태 초기화
    if (activeMenu === 'all' || activeMenu === 'starred' || activeMenu === 'shared') {
      setSelectedProject(null);
      setSelectedNodeId(null);
    }
  }, [activeMenu]);

  // 선택된 프로젝트 객체
  const selectedProjectObj = useMemo(() => {
    return projects.find(project => project.id === selectedProject?.id) || null;
  }, [projects, selectedProject]);

  // 현재 선택된 노드
  const selectedNode = useMemo(() => {
    if (!selectedNodeId || !selectedProjectObj) return null;
    
    // 선택된 노드가 프로젝트인 경우
    if (selectedNodeId === selectedProjectObj.id) return selectedProjectObj;
    
    // 재귀적으로 해당 ID를 가진 노드 찾기
    const findNode = (nodes) => {
      if (!Array.isArray(nodes)) return null;
      
      for (const node of nodes) {
        if (!node) continue;
        if (node.id === selectedNodeId) return node;
        if (Array.isArray(node.children) && node.children.length > 0) {
          const foundNode = findNode(node.children);
          if (foundNode) return foundNode;
        }
      }
      return null;
    };
    
    return findNode(selectedProjectObj.children || []);
  }, [selectedNodeId, selectedProjectObj]);

  // 현재 선택된 노드의 하위 콘텐츠 (폴더와 디자인)
  const selectedNodeContents = useMemo(() => {
    if (!selectedNode) return [];
    console.log('selectedNode:', selectedNode);
    console.log('selectedNode.children:', selectedNode.children);
    return Array.isArray(selectedNode.children) ? selectedNode.children : [];
  }, [selectedNode]);

  // 정렬 옵션에 따라 콘텐츠 정렬
  const sortedNodeContents = useMemo(() => {
    if (!selectedNodeContents || selectedNodeContents.length === 0) return [];
    
    console.log('sortedNodeContents 정렬 전:', selectedNodeContents);
    const sorted = [...selectedNodeContents].sort((a, b) => {
      switch (sortOption) {
        case 'newest':
          return b.id.localeCompare(a.id); // ID에는 timestamp가 포함되어 있으므로
        case 'oldest':
          return a.id.localeCompare(b.id);
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });
    console.log('sortedNodeContents 정렬 후:', sorted);
    return sorted;
  }, [selectedNodeContents, sortOption]);

  // 프로젝트 생성 핸들러
  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    
    const newProject = {
      id: `project-${Date.now()}`,
      name: newProjectName,
      type: 'project',
      children: []
    };
    
    // 새 프로젝트를 배열 맨 앞에 추가 (최상단에 표시하기 위함)
    const updatedProjects = [newProject, ...projects];
    setProjects(updatedProjects);
    
    // 새 프로젝트를 바로 선택하고 '전체 프로젝트' 메뉴로 전환
    setSelectedProject(newProject);
    setSelectedNodeId(newProject.id);
    setActiveMenu('all');
    setNewProjectName('');
    setShowCreateProjectModal(false);
    
    // 중앙 팝업 메시지 표시
    setPopupMessage('프로젝트가 생성되었습니다');
    setShowSuccessPopup(true);
  };

  // 폴더 생성 핸들러
  const handleCreateFolder = () => {
    if (!newFolderName.trim() || !selectedProject) return;
    
    const newFolder = {
      id: `folder-${Date.now()}`,
      name: newFolderName,
      type: 'folder',
      children: []
    };

    // If a node is selected, add the folder to that node
    if (selectedNode && selectedNode.type === 'folder') {
      const updatedProjects = projects.map(project => {
        if (project.id === selectedNode.id) {
          // Find the selected node and add the folder to its children
          const addFolderToNode = (nodes) => {
            return nodes.map(node => {
              if (node.id === selectedNode.id) {
                return {
                  ...node,
                  children: [...(node.children || []), newFolder]
                };
              } else if (node.children) {
                return {
                  ...node,
                  children: addFolderToNode(node.children)
                };
              }
              return node;
            });
          };

          return {
            ...project,
            children: addFolderToNode(project.children)
          };
        }
        return project;
      });

      setProjects(updatedProjects);
    } else {
      // Add the folder directly to the project
      const updatedProjects = projects.map(project => {
        if (project.id === selectedProject.id) {
          return {
            ...project,
            children: [...(project.children || []), newFolder]
          };
        }
        return project;
      });

      setProjects(updatedProjects);
    }

    setNewFolderName('');
    setShowCreateFolderModal(false);
    
    // 성공 메시지 표시
    setSuccessMessage('폴더가 생성되었습니다.');
    setShowSuccessMessage(true);
  };

  // Get path for selected node
  const getNodePath = (projectNode, targetId, currentPath = []) => {
    if (projectNode.id === targetId) {
      return [...currentPath, projectNode];
    }

    if (projectNode.children) {
      for (const child of projectNode.children) {
        const path = getNodePath(child, targetId, [...currentPath, projectNode]);
        if (path.length) return path;
      }
    }

    return [];
  };

  // 노드 선택 핸들러
  const handleNodeSelect = (node) => {
    if (!node) return;
    setSelectedNodeId(node.id);
  };

  // 폴더 클릭 핸들러
  const handleFolderClick = (folder) => {
    console.log('폴더 클릭:', folder);
    
    // 파일 타입이고 디자인 데이터가 있는 경우 에디터로 바로 이동
    if (folder.type === 'file') {
      console.log('디자인 파일 클릭, 에디터로 이동:', folder.id);
      
      // 세션 스토리지에 디자인 데이터 저장 (안전한 데이터 전달용)
      try {
        sessionStorage.setItem('lastDesignData', JSON.stringify(folder));
        console.log('디자인 데이터를 세션 스토리지에 저장했습니다.');
      } catch (err) {
        console.error('세션 스토리지 저장 오류:', err);
      }
      
      // 에디터 페이지로 이동
      navigate(`/editor/${folder.id}`);
      return;
    }
    
    // 폴더인 경우 선택만 진행
    setSelectedNodeId(folder.id);
  };

  // Get node path
  const nodePath = selectedNodeId && selectedProjectObj
    ? getNodePath(selectedProjectObj, selectedNodeId, [])
    : [];

  // 로그아웃과 함께 localStorage 초기화 함수 추가
  const logout = () => {
    // localStorage의 프로젝트 데이터 초기화
    localStorage.removeItem('projects');
    setProjects([]);
    setSelectedProject(null);
    setSelectedNodeId(null);
    
    // 로그아웃 처리
    authLogout();
  };

  // 프로젝트 데이터 초기화 함수
  const resetProjects = () => {
    localStorage.removeItem('projects');
    setProjects([]);
    setSelectedProject(null);
    setSelectedNodeId(null);
    setShowSuccessMessage(true);
    setSuccessMessage('프로젝트 데이터가 초기화되었습니다.');
  };

  // 삭제 확인 팝업 관련 핸들러
  const handleDeleteConfirm = (nodeId) => {
    const nodeToDelete = projects.find(p => p.id === nodeId) || 
      (selectedProjectObj && findNodeById(selectedProjectObj, nodeId));
      
    setNodeToDelete(nodeToDelete);
    setShowDeleteConfirmModal(true);
  };
  
  // 노드를 ID로 찾는 함수
  const findNodeById = (rootNode, nodeId) => {
    if (rootNode.id === nodeId) return rootNode;
    
    if (rootNode.children) {
      for (const child of rootNode.children) {
        const found = findNodeById(child, nodeId);
        if (found) return found;
      }
    }
    
    return null;
  };

  // 노드 삭제 핸들러 추가
  const handleDeleteNode = () => {
    if (!nodeToDelete) return;
    
    const nodeId = nodeToDelete.id;
    
    // 삭제하려는 노드가 프로젝트인 경우
    if (nodeToDelete.type === 'project') {
      // 프로젝트 자체를 삭제
      const updatedProjects = projects.filter(project => project.id !== nodeId);
      setProjects(updatedProjects);
      
      // 선택된 프로젝트가 삭제되었으므로, 선택을 해제하거나 다른 프로젝트 선택
      if (updatedProjects.length > 0) {
        setSelectedProject(updatedProjects[0]);
        setSelectedNodeId(updatedProjects[0].id);
      } else {
        setSelectedProject(null);
        setSelectedNodeId(null);
      }
      
      setSuccessMessage('프로젝트가 삭제되었습니다.');
      setShowSuccessMessage(true);
    } else {
      // 프로젝트 내의 폴더/파일을 삭제하는 경우
      const deleteNodeFromChildren = (nodes) => {
        if (!Array.isArray(nodes)) return nodes;
        
        const updatedNodes = nodes.filter(node => node.id !== nodeId);
        
        return updatedNodes.map(node => {
          if (node.children && node.children.length > 0) {
            return {
              ...node,
              children: deleteNodeFromChildren(node.children)
            };
          }
          return node;
        });
      };
      
      // 프로젝트의 children에서 노드 삭제
      const updatedProjects = projects.map(project => {
        if (project.id === selectedProjectObj.id) {
          return {
            ...project,
            children: deleteNodeFromChildren(project.children)
          };
        }
        return project;
      });
      
      setProjects(updatedProjects);
      
      // 삭제된 노드가 현재 선택된 노드인 경우, 상위 노드 선택
      if (selectedNodeId === nodeId) {
        setSelectedNodeId(selectedProjectObj.id);
      }
      
      setSuccessMessage('항목이 삭제되었습니다.');
      setShowSuccessMessage(true);
    }
    
    // 삭제 확인 모달 닫기
    setShowDeleteConfirmModal(false);
    setNodeToDelete(null);
  };

  // 삭제 확인 모달 닫기 핸들러
  const handleCancelDelete = () => {
    setShowDeleteConfirmModal(false);
    setNodeToDelete(null);
  };

  // 중앙 성공 팝업 닫기 핸들러
  const handleCloseSuccessPopup = () => {
    setShowSuccessPopup(false);
    setPopupMessage('');
    setPopupType('success');
  };

  // 이름 수정 모달 표시 핸들러
  const handleRenameConfirm = (nodeId) => {
    const nodeToRename = projects.find(p => p.id === nodeId) || 
      (selectedProjectObj && findNodeById(selectedProjectObj, nodeId));
      
    if (nodeToRename) {
      setNodeToRename(nodeToRename);
      setNewNodeName(nodeToRename.name);
      setShowRenameModal(true);
    }
  };
  
  // 이름 수정 적용 핸들러
  const handleRename = () => {
    if (!nodeToRename || !newNodeName.trim()) return;
    
    const nodeId = nodeToRename.id;
    
    // 프로젝트명 수정인 경우
    if (nodeToRename.type === 'project') {
      const updatedProjects = projects.map(project => {
        if (project.id === nodeId) {
        return {
          ...project,
            name: newNodeName
        };
      }
      return project;
      });
      
      setProjects(updatedProjects);
      
      // 이름 변경된 프로젝트가 현재 선택된 프로젝트인 경우 업데이트
      if (selectedProject && selectedProject.id === nodeId) {
        setSelectedProject({
          ...selectedProject,
          name: newNodeName
        });
      }
      
      setSuccessMessage('프로젝트 이름이 변경되었습니다.');
      setShowSuccessMessage(true);
    } else {
      // 폴더명 수정인 경우
      const updateNodeName = (nodes) => {
        if (!Array.isArray(nodes)) return nodes;
        
        return nodes.map(node => {
          if (node.id === nodeId) {
            return {
              ...node,
              name: newNodeName
            };
          } else if (node.children && node.children.length > 0) {
            return {
              ...node,
              children: updateNodeName(node.children)
            };
          }
          return node;
        });
      };
      
      // 프로젝트의 하위 노드 이름 변경
      const updatedProjects = projects.map(project => {
        if (project.id === selectedProjectObj.id) {
          return {
            ...project,
            children: updateNodeName(project.children)
          };
        }
        return project;
      });
      
      setProjects(updatedProjects);
      setSuccessMessage('폴더 이름이 변경되었습니다.');
      setShowSuccessMessage(true);
    }
    
    // 이름 수정 모달 닫기
    setShowRenameModal(false);
    setNodeToRename(null);
    setNewNodeName('');
  };

  // 이름 수정 모달 닫기 핸들러
  const handleCancelRename = () => {
    setShowRenameModal(false);
    setNodeToRename(null);
    setNewNodeName('');
  };

  // 트리 토글 핸들러
  const toggleTreeVisibility = () => {
    setIsTreeCollapsed(prevState => !prevState);
  };

  // 상태 변경 추적을 위한 useEffect
  useEffect(() => {
    // 상태 변경 감지만 하고 강제 리렌더링 시도를 제거
    console.log("트리 상태 변경됨:", isTreeCollapsed);
  }, [isTreeCollapsed]);

  // 정렬 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
        setShowSortDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 다른 컴포넌트에 전달할 컨텍스트 값
  const contextValue = {
    projects,
    setProjects,
    selectedProject,
    setSelectedProject,
    selectedNodeId,
    setSelectedNodeId,
    setShowCreateFolderModal,
    setShowCreateProjectModal
  };

  // 디자인 옵션 클릭 핸들러 (DO NOT REMOVE OR MODIFY)
  const handleDesignOptionClick = (designType) => {
    console.log("Design option clicked:", designType);
    
    // 신발장이나 키친 디자인일 경우 준비중 팝업 표시
    if (designType === 'shoeCabinet' || designType === 'kitchen') {
      setPopupMessage('준비중입니다');
      setShowSuccessPopup(true);
      // 알림 타입 설정 (준비중 타입으로 설정)
      setPopupType('info');
      return;
    }
    
    // 옷장 디자인은 기존대로 처리
    setSelectedDesignType(designType);
    setShowDesignStepModal(true);
    console.log("showDesignStepModal set to true");
  };

  // 다이어그램 레이아웃 모달 컴포넌트
  const DiagramLayoutModal = ({ onClose }) => {
  return (
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.designStepModalContent} onClick={(e) => e.stopPropagation()}>
          <div className={styles.diagramLayout}>
            <div className={styles.topContainer}>
              상단 컨테이너
            </div>
            <div className={styles.middleContainer}>
              <div className={styles.viewerContainer}>
                뷰어 컨테이너
              </div>
              <div className={styles.optionsContainer}>
                옵션 입력 컨테이너
              </div>
            </div>
            <div className={styles.bottomContainer}>
              하단 컨테이너
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AppContext.Provider value={contextValue}>
    <div className={styles.container}>
        {/* Header Container */}
        <div className={styles.headerContainer}>
        <div className={styles.headerLeft}>
            <div className={styles.logo}>
              <img src={logo} alt="Logo" width="100" />
          </div>
        </div>
        <div className={styles.headerRight}>
            <div className={styles.profileSection}>
          <button className={styles.logoutButton} onClick={logout}>
                <FiLogOut size={20} />
            로그아웃
          </button>
        </div>
          </div>
        </div>

        {/* 트리 토글 버튼 - 프로젝트가 선택되지 않았을 때는 숨김 */}
        {selectedProject && activeMenu === 'all' && (
          <button 
            className={styles.treeCollapseToggle}
            style={{ 
              left: isTreeCollapsed ? '280px' : '560px',
              zIndex: 30,
              position: 'fixed'
            }}
            onClick={toggleTreeVisibility}
          >
            {isTreeCollapsed ? (
              <FiChevronRight size={18} />
            ) : (
              <FiChevronLeft size={18} />
            )}
          </button>
        )}

        {/* 메인 컨텐츠 */}
      <div className={styles.mainContent}>
          {/* 왼쪽 메뉴 컨테이너 - 너비 300px */}
          <aside className={`${styles.menuContainer} ${showMobileMenu ? styles.mobileMenuOpen : ''}`}>
            <div className={styles.profileArea}>
              <div className={styles.profileImage} onClick={() => fileInputRef.current?.click()}>
                {profileImage ? (
                  <img src={profileImage} alt="프로필" />
                ) : (
                  <FiUser size={48} color="#aaa" />
                )}
                <div className={styles.profileBadge}>
                  <FiPlus size={28} color="#fff" />
              </div>
              </div>
              <h2 className={styles.profileNameText}>
                <span className={styles.profileId}>admin</span>
                <span className={styles.separator}>ㅣ</span>
                <span className={styles.profileNickname}>jinsoolee</span>
              </h2>
              <button className={styles.updateProfileButton}>
                Update Profile
              </button>
            </div>
            <div className={styles.menuButtons}>
              <button
                className={styles.newProjectButton}
                onClick={() => setShowCreateProjectModal(true)}
              >
                <FiPlus size={20} /> 신규 프로젝트 생성
              </button>
              <button
                className={styles.inviteButton}
              >
                <FiUsers size={20} /> 사용자 초대
              </button>
          </div>
            <nav className={styles.menuNav}>
              {menuItems.map(item => (
                <button
                  key={item.id}
                  className={`${styles.menuItem} ${activeMenu === item.id ? styles.active : ''}`}
                  onClick={() => {
                    // 먼저 프로젝트 상태를 즉시 리셋
                    if (item.id === 'starred' || item.id === 'shared' || item.id === 'all') {
                      setSelectedProject(null);
                      setSelectedNodeId(null);
                    }
                    // 그 다음에 메뉴 상태 변경
                    setActiveMenu(item.id);
                  }}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
            <div className={styles.menuFooter}>
              {footerMenuItems.map(item => (
                <button
                  key={item.id}
                  className={styles.menuItem}
                  onClick={() => item.id === 'logout' && logout()}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </button>
              ))}
              <button
                className={styles.menuItem}
                onClick={resetProjects}
              >
                <FiTrash2 size={18} />
                <span>프로젝트 초기화</span>
            </button>
          </div>
          </aside>

          {/* 가운데 트리 컨테이너 - 너비 330px */}
          <div 
            className={`${styles.treeContainer} ${(!selectedProject || activeMenu === 'starred' || activeMenu === 'shared') ? styles.hidden : ''} ${isTreeCollapsed ? styles.collapsed : ''}`}
            style={{ 
              transform: isTreeCollapsed ? 'translateX(-280px)' : 'translateX(0)',
              opacity: isTreeCollapsed ? 0 : 1,
              pointerEvents: isTreeCollapsed ? 'none' : 'auto',
              visibility: isTreeCollapsed ? 'hidden' : 'visible',
              position: 'fixed',
              zIndex: 5,
              width: '280px',
              left: '280px',
              top: '70px',
              bottom: 0
            }}
          >
            <div className={styles.projectSelectContainer}>
              <ProjectSelect
                projects={projects}
                selectedProject={selectedProject}
                onSelectProject={(project) => {
                  setSelectedProject(project);
                  setSelectedNodeId(project.id);
                }}
                onNewProject={() => setShowCreateProjectModal(true)}
              />
            </div>
            
            <div className={styles.folderTreeContainer}>
              {selectedProjectObj ? (
                <div className={styles.folderTree}>
                  <TreeNode
                    node={selectedProjectObj}
                    onSelect={handleNodeSelect}
                    selectedNodeId={selectedNodeId}
                    onDelete={handleDeleteConfirm}
                    onRename={handleRenameConfirm}
                  />
          </div>
              ) : (
                <div className={styles.emptyTree}>
                  프로젝트를 선택하거나 생성해 주세요.
                </div>
              )}
            </div>
          </div>

          {/* 오른쪽 파일 영역 컨테이너 */}
          <div 
            className={styles.fileContentContainer}
            style={{ 
              marginLeft: (!selectedProject || activeMenu === 'starred' || activeMenu === 'shared') ? '280px' : (isTreeCollapsed ? '280px' : '560px'),
              width: (!selectedProject || activeMenu === 'starred' || activeMenu === 'shared') ? 'calc(100% - 280px)' : (isTreeCollapsed ? 'calc(100% - 280px)' : 'calc(100% - 560px)'),
              transition: 'all 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)'
            }}
          >
            {/* 파일 리스트 헤더 - 높이 90px */}
            <div className={styles.fileListHeaderContainer}>
              <div className={styles.breadcrumbContainer}>
                {!selectedProject ? (
                  <div className={styles.breadcrumb}>
                    <span className={styles.pathItem}>
                      {activeMenu === 'all' && '전체 프로젝트'}
                      {activeMenu === 'starred' && '중요 프로젝트'}
                      {activeMenu === 'shared' && '공유 프로젝트'}
                    </span>
                  </div>
                ) : (
                  nodePath.length > 0 && (
                    <div className={styles.breadcrumb}>
                      {nodePath.map((node, index) => (
                        <React.Fragment key={node.id}>
                          {index > 0 && <FiChevronRight size={16} />}
                          <span 
                            className={styles.pathItem}
                            onClick={() => setSelectedNodeId(node.id)}
                          >
                            {node.name}
                          </span>
                        </React.Fragment>
                      ))}
                    </div>
                  )
                )}
              </div>
            
              <div className={styles.searchContainer}>
              <div className={styles.searchBar}>
                  <FiSearch size={16} color="#6b7280" />
                <input
                  type="text"
                    placeholder="파일 검색..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
                <button className={styles.searchButton}>
                  <FiSearch size={16} color="#ffffff" />
                </button>
              <button className={styles.exportButton}>
                  <FiDownload size={16} />
                  <span>내보내기</span>
              </button>
              </div>
              
              <div className={styles.viewContainer}>
                <div className={styles.viewOptions}>
                <button
                    className={`${styles.gridButton} ${viewMode === 'grid' ? styles.active : ''}`}
                    onClick={() => setViewMode('grid')}
                >
                    <FiGrid size={16} />
                </button>
                <button
                    className={`${styles.listButton} ${viewMode === 'list' ? styles.active : ''}`}
                    onClick={() => setViewMode('list')}
                >
                    <FiList size={16} />
                </button>
              </div>
                <div className={styles.sortContainer}>
                <button 
                  className={styles.sortButton}
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                    ref={sortDropdownRef}
                  >
                    <span className={styles.sortLabel}>
                      {sortOption === 'newest' && '최신순'}
                      {sortOption === 'oldest' && '오래된순'}
                      {sortOption === 'name_asc' && '이름 (오름차순)'}
                      {sortOption === 'name_desc' && '이름 (내림차순)'}
                    </span>
                    <FiChevronDown size={16} className={showSortDropdown ? styles.rotated : ''} />
                </button>
                {showSortDropdown && (
                    <div className={styles.sortDropdown} ref={sortDropdownRef}>
                      <button 
                        className={`${styles.sortOption} ${sortOption === 'newest' ? styles.active : ''}`}
                        onClick={() => {
                          setSortOption('newest');
                          setShowSortDropdown(false);
                        }}
                      >
                        최신순
                      </button>
                      <button 
                        className={`${styles.sortOption} ${sortOption === 'oldest' ? styles.active : ''}`}
                        onClick={() => {
                          setSortOption('oldest');
                          setShowSortDropdown(false);
                        }}
                      >
                        오래된순
                      </button>
                      <button 
                        className={`${styles.sortOption} ${sortOption === 'name_asc' ? styles.active : ''}`}
                        onClick={() => {
                          setSortOption('name_asc');
                          setShowSortDropdown(false);
                        }}
                      >
                        이름 (오름차순)
                      </button>
                      <button 
                        className={`${styles.sortOption} ${sortOption === 'name_desc' ? styles.active : ''}`}
                        onClick={() => {
                          setSortOption('name_desc');
                          setShowSortDropdown(false);
                        }}
                      >
                        이름 (내림차순)
                      </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
            {/* 파일 리스트 내용 */}
            <div className={styles.fileListContainer}>
              {projects.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>현재 생성된 프로젝트가 없습니다. 좌측에서 '신규 프로젝트 생성'을 눌러 시작하세요.</p>
                  <button onClick={() => setShowCreateProjectModal(true)}>
                    <FiPlus /> 신규 프로젝트 생성
                  </button>
                </div>
              ) : activeMenu === 'all' && !selectedProject ? (
                // 전체 프로젝트 보기 모드 - 모든 프로젝트를 카드로 표시
                <div className={`${styles.designGrid} ${viewMode === 'list' ? styles.listView : ''}`}>
                  {/* 모든 프로젝트를 카드로 표시 */}
                  {projects.map(project => (
                    <div 
                      key={project.id}
                      className={styles.designCard}
                      onClick={() => {
                        setSelectedProject(project);
                        setSelectedNodeId(project.id);
                      }}
                    >
                      <div className={styles.designIcon}>
                        <FiFolder size={24} />
                      </div>
                      <div className={styles.designCardText}>{project.name}</div>
                    </div>
                  ))}
                </div>
              ) : activeMenu === 'starred' ? (
                // 중요 프로젝트 메뉴
                <div className={styles.emptyState}>
                  <div className={styles.emptyStateIcon}>
                    <img src={emptyStarredIcon} alt="빈 중요 프로젝트" />
                  </div>
                  <h2>프로젝트 없음</h2>
                  <p>북마크된 프로젝트가 없습니다.</p>
                </div>
              ) : activeMenu === 'shared' ? (
                // 공유 프로젝트 메뉴
                <div className={styles.emptyState}>
                  <div className={styles.emptyStateIcon}>
                    <img src={emptySharedIcon} alt="빈 공유 프로젝트" />
                  </div>
                  <h2>프로젝트 없음</h2>
                  <p>공유된 프로젝트가 없습니다.</p>
                </div>
              ) : selectedProject ? (
                // 선택된 프로젝트의 내용 보기 모드
                <div className={`${styles.designGrid} ${viewMode === 'list' ? styles.listView : ''}`}>
                  {/* 항상 맨 앞에 디자인 생성 카드 고정 */}
                  <div className={styles.designCard}>
                    <div className={styles.designIcon}>
                      <FiPlus size={24} />
                    </div>
                    <div className={styles.designCardText}>디자인 생성</div>
                    <div className={styles.designOptions}>
                      {designOptions.map(option => (
                        <div 
                          key={option.id} 
                          className={styles.designOption}
                          onClick={() => handleDesignOptionClick(option.type)}
                        >
                          {React.createElement(option.icon, { size: 24, color: "#fff" })}
                          <span>{option.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
              
                  {/* 선택된 노드의 하위 콘텐츠 (폴더 및 디자인 파일) */}
                  {sortedNodeContents.map(item => (
                    <FolderCard 
                      key={item.id} 
                      folder={item}
                      onClick={handleFolderClick}
                    />
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <p>좌측에서 프로젝트를 선택하면 프로젝트 내용이 여기에 표시됩니다.</p>
                  </div>
                )}
            </div>
              </div>
            </div>

        {/* 작은 성공 메시지 (우측 하단) */}
        {showSuccessMessage && (
          <SuccessMessage 
            message={successMessage} 
            onClose={() => setShowSuccessMessage(false)}
            onConfirm={() => {
              if (newlyCreatedProject) {
                setSelectedProject(newlyCreatedProject);
                setNewlyCreatedProject(null);
              }
              setShowSuccessMessage(false);
            }}
          />
        )}

        {/* 중앙 성공/안내 팝업 메시지 */}
        {showSuccessPopup && (
          <div className={styles.centerPopup}>
            <div className={styles.popupContent}>
              <div className={styles.popupIcon}>
                {popupType === 'success' ? (
                  <FiCheck size={32} color="#10b981" />
                ) : (
                  <FiAlertCircle size={32} color="#3b82f6" />
                )}
              </div>
              <p>{popupMessage}</p>
              <button 
                className={popupType === 'success' ? styles.confirmButton : styles.infoButton} 
                onClick={handleCloseSuccessPopup}
              >
                확인
              </button>
            </div>
          </div>
        )}

        {/* 이름 수정 모달 */}
        {showRenameModal && nodeToRename && (
          <div className={styles.centerPopup}>
            <div className={styles.popupContent}>
              <div className={styles.popupIcon}>
                <FiEdit2 size={32} color="#10b981" />
                        </div>
              <h3>이름 수정</h3>
              <input
                type="text"
                className={styles.modalInput}
                placeholder="새 이름 입력"
                value={newNodeName}
                onChange={(e) => setNewNodeName(e.target.value)}
                autoFocus
              />
              <div className={styles.popupButtons}>
                <button 
                  className={styles.cancelButton}
                  onClick={handleCancelRename}
                >
                  취소
                </button>
                <button 
                  className={styles.confirmButton}
                  onClick={handleRename}
                >
                  확인
                </button>
                      </div>
                  </div>
                </div>
        )}

        {/* 삭제 확인 모달 */}
        {showDeleteConfirmModal && nodeToDelete && (
          <div className={styles.centerPopup}>
            <div className={styles.popupContent}>
              <div className={styles.popupIcon}>
                <FiTrash2 size={32} color="#ef4444" />
              </div>
              <p>"{nodeToDelete.name}"을(를) 삭제하시겠습니까?</p>
              <p className={styles.deleteWarning}>이 작업은 되돌릴 수 없습니다.</p>
              <div className={styles.popupButtons}>
                <button 
                  className={styles.cancelButton}
                  onClick={handleCancelDelete}
                >
                  취소
                </button>
                <button 
                  className={styles.deleteButton}
                  onClick={handleDeleteNode}
                >
                  삭제
                </button>
            </div>
          </div>
        </div>
        )}

        {/* 프로젝트 생성 모달 */}
        {showCreateProjectModal && (
          <Modal title="새 프로젝트 생성" onClose={() => {
            setShowCreateProjectModal(false);
            setNewProjectName("");
          }}>
            <input
              type="text"
              className={styles.modalInput}
              placeholder="프로젝트 이름을 입력하세요"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              autoFocus
            />
            <div className={styles.popupButtons}>
              <button 
                className={styles.cancelButton}
                onClick={() => {
                  setShowCreateProjectModal(false);
                  setNewProjectName("");
                }}
              >
                취소
              </button>
              <button 
                className={styles.confirmButton}
                onClick={handleCreateProject}
              >
                생성
              </button>
      </div>
          </Modal>
        )}

        {/* 폴더 생성 모달 */}
        {showCreateFolderModal && (
          <Modal title="새 폴더 생성" onClose={() => {
            setShowCreateFolderModal(false);
            setNewFolderName("");
          }}>
            <input
              type="text"
              className={styles.modalInput}
              placeholder="폴더 이름을 입력하세요"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              autoFocus
            />
            <div className={styles.popupButtons}>
              <button 
                className={styles.cancelButton}
                onClick={() => {
                  setShowCreateFolderModal(false);
                  setNewFolderName("");
                }}
              >
                취소
              </button>
              <button 
                className={styles.confirmButton}
                onClick={handleCreateFolder}
              >
                생성
              </button>
        </div>
          </Modal>
        )}

        {/* 파일 업로드 용 숨김 인풋 */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (event) => {
                setProfileImage(event.target.result);
              };
              reader.readAsDataURL(file);
            }
          }}
        />

        {/* 디자인 스텝 모달 */}
        {showDesignStepModal && (
          <DesignStepModal 
            isOpen={showDesignStepModal}
            onClose={() => setShowDesignStepModal(false)}
            onSave={(formData) => {
              // Handle saving the design data
              console.log("Design data saved:", formData);
              
              // 단내림과 바닥마감재 정보가 올바르게 포함되어 있는지 확인
              console.log("에어컨 단내림:", formData.spaceInfo?.hasAirConditioner, formData.spaceInfo?.acUnit);
              console.log("바닥마감재:", formData.spaceInfo?.hasFloorFinish, formData.spaceInfo?.floorThickness);
              
              // 필요한 정보가 없으면 추가
              if (formData.spaceInfo) {
                if (!formData.spaceInfo.acUnit) {
                  formData.spaceInfo.acUnit = { 
                    position: 'left', 
                    width: 900, 
                    depth: 200,
                    present: formData.spaceInfo.hasAirConditioner === 'yes'
                  };
                } else {
                  formData.spaceInfo.acUnit.present = formData.spaceInfo.hasAirConditioner === 'yes';
                }

                // 바닥마감재 정보 확인
                if (formData.spaceInfo.hasFloorFinish === 'yes' && !formData.spaceInfo.floorThickness) {
                  formData.spaceInfo.floorThickness = 20; // 기본값 설정
                }
              }
              
              // 현재 선택된 프로젝트에 디자인 파일 추가
              if (selectedProject) {
                console.log("선택된 프로젝트:", selectedProject);
                console.log("선택된 노드 ID:", selectedNodeId);
                
                const designId = `design-${Date.now()}`;
                const newDesign = {
                  id: designId,
                  type: 'file',
                  name: formData.designTitle || `${selectedDesignType} 디자인`,
                  designType: selectedDesignType,
                  author: "jinsoolee",
                  updatedAt: new Date().toISOString(),
                  data: formData,
                  thumbnail: null,
                  parentId: selectedNodeId || selectedProject.id
                };
                
                console.log("생성할 새 디자인:", newDesign);
                
                // 세션 스토리지에 디자인 데이터 저장 (안전한 데이터 전달용)
                try {
                  sessionStorage.setItem('lastDesignData', JSON.stringify(newDesign));
                  console.log('디자인 데이터를 세션 스토리지에 저장했습니다.');
                } catch (err) {
                  console.error('세션 스토리지 저장 오류:', err);
                }
                
                // 프로젝트 복사 및 새 디자인 추가
                const updatedProjects = projects.map(project => {
                  if (project.id === selectedProject.id) {
                    // 디자인 파일 추가 (최상위 레벨 또는 하위 폴더)
                    const addDesignToNode = (nodes) => {
                      return nodes.map(node => {
                        if (node.id === (selectedNodeId || selectedProject.id)) {
                          console.log("디자인 추가 대상 노드:", node);
                          return {
                            ...node,
                            children: [...(node.children || []), newDesign]
                          };
                        } else if (node.children) {
                          return {
                            ...node,
                            children: addDesignToNode(node.children)
                          };
                        }
                        return node;
                      });
                    };
                    
                    let updatedProject;
                    if (selectedNodeId) {
                      // 선택된 노드가 있으면 그 노드의 하위로 추가
                      updatedProject = {
                        ...project,
                        children: addDesignToNode(project.children || [])
                      };
                    } else {
                      // 없으면 프로젝트 최상위에 추가
                      updatedProject = {
                        ...project,
                        children: [...(project.children || []), newDesign]
                      };
                    }
                    
                    console.log("업데이트된 프로젝트:", updatedProject);
                    return updatedProject;
                  }
                  return project;
                });
                
                console.log("모든 프로젝트 업데이트 후:", updatedProjects);
                
                setProjects(updatedProjects);
                localStorage.setItem('projects', JSON.stringify(updatedProjects));
                
                // 성공 메시지 표시
                setPopupMessage(`${newDesign.name} 디자인이 생성되었습니다.`);
                setShowSuccessPopup(true);
                
                // 에디터 페이지로 이동
                setTimeout(() => {
                  navigate(`/editor/${designId}`);
                }, 500);
              } else {
                // 선택된 프로젝트가 없을 경우 알림
                setPopupMessage('디자인을 저장할 프로젝트를 먼저 선택해주세요.');
                setShowSuccessPopup(true);
              }
              
              setShowDesignStepModal(false);
            }}
            initialData={formData}
          />
        )}

        {/* 다이어그램 레이아웃 모달 */}
        {showDiagramModal && <DiagramLayoutModal onClose={() => setShowDiagramModal(false)} />}
    </div>
    </AppContext.Provider>
  );
};

export default DashboardPage;
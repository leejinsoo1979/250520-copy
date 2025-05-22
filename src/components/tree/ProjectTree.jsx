import React, { useState } from 'react';
import { Tree } from 'react-arborist';
import { FiFolder, FiFile, FiMoreVertical, FiEdit2, FiTrash2, FiShare2, FiInfo } from 'react-icons/fi';
import styles from './ProjectTree.module.css';

const Node = ({ node, style, dragHandle }) => {
  const [showMenu, setShowMenu] = useState(false);
  
  const handleMoreClick = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleMenuAction = (action, e) => {
    e.stopPropagation();
    setShowMenu(false);
    
    switch (action) {
      case 'edit':
        console.log('Edit:', node.data.name);
        break;
      case 'delete':
        console.log('Delete:', node.data.name);
        break;
      case 'share':
        console.log('Share:', node.data.name);
        break;
      case 'details':
        console.log('Details:', node.data.name);
        break;
    }
  };

  return (
    <div
      className={`${styles.node} ${node.state.isSelected ? styles.selected : ''}`}
      style={style}
      ref={dragHandle}
      onClick={() => {
        if (!node || !node.data) {
          console.warn('Invalid node clicked:', node);
          return;
        }
        if (node.data.isFolder) {
          node.toggle();
        } else {
          node.select();
        }
      }}
    >
      <div className={styles.nodeContent}>
        <span className={styles.icon}>
          {node.data.isFolder ? <FiFolder /> : <FiFile />}
        </span>
        <span className={styles.name}>{node.data.name}</span>
        <button className={styles.moreButton} onClick={handleMoreClick}>
          <FiMoreVertical />
        </button>
      </div>
      
      {showMenu && (
        <div className={styles.menu}>
          <button onClick={(e) => handleMenuAction('edit', e)}>
            <FiEdit2 /> 이름 수정
          </button>
          <button onClick={(e) => handleMenuAction('delete', e)}>
            <FiTrash2 /> 삭제
          </button>
          <button onClick={(e) => handleMenuAction('share', e)}>
            <FiShare2 /> 공유
          </button>
          <button onClick={(e) => handleMenuAction('details', e)}>
            <FiInfo /> 상세보기
          </button>
        </div>
      )}
    </div>
  );
};

const ProjectTree = ({ structure = [], onSelect }) => {
  return (
    <div className={styles.treeContainer}>
      <Tree
        data={structure}
        openByDefault={false}
        width={280}
        height={600}
        indent={24}
        rowHeight={36}
        overscanCount={5}
        paddingTop={12}
        paddingBottom={12}
        selection="single"
        onSelect={(node) => {
          if (!node || !node.data) {
            console.warn('Invalid node selected:', node);
            return;
          }
          if (!node.data.isFolder) {
            onSelect?.(node.data);
          }
        }}
      >
        {Node}
      </Tree>
    </div>
  );
};

export default ProjectTree; 
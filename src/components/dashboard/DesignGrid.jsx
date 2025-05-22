import React from 'react';
import { FiPlus, FiCopy, FiEdit3, FiTrash2 } from 'react-icons/fi';
import styles from './DesignGrid.module.css';

const formatDate = (date) => {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date));
};

const DesignCard = ({ design, onEdit, onCopy, onDelete }) => {
  return (
    <div className={styles.designCard} onClick={() => onEdit(design.id)}>
      <div className={styles.cardContent}>
        <div className={styles.thumbnail}>
          {design.thumbnail || <div className={styles.placeholderThumbnail} />}
        </div>
        <div className={styles.designInfo}>
          <h3 className={styles.designName}>{design.name}</h3>
          <div className={styles.designMeta}>
            <span className={styles.author}>{design.author}</span>
            <span className={styles.date}>{formatDate(design.updatedAt)}</span>
          </div>
        </div>
      </div>
      <div className={styles.hoverContent}>
        <button 
          className={styles.actionButton}
          onClick={(e) => {
            e.stopPropagation();
            onCopy(design.id);
          }}
        >
          <FiCopy />
          <span>복제</span>
        </button>
        <button 
          className={styles.actionButton}
          onClick={(e) => {
            e.stopPropagation();
            onEdit(design.id);
          }}
        >
          <FiEdit3 />
          <span>편집</span>
        </button>
        <button 
          className={`${styles.actionButton} ${styles.deleteButton}`}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(design.id);
          }}
        >
          <FiTrash2 />
          <span>삭제</span>
        </button>
      </div>
    </div>
  );
};

const CreateDesignCard = ({ onClick }) => {
  return (
    <div className={`${styles.designCard} ${styles.createCard}`} onClick={onClick}>
      <div className={styles.cardContent}>
        <div className={styles.createIcon}>
          <FiPlus size={24} />
        </div>
        <span className={styles.createText}>새로운 디자인</span>
      </div>
    </div>
  );
};

const EmptyState = () => {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>
        <FiPlus size={32} />
      </div>
      <p>디자인을 생성하거나 프로젝트를 선택하세요</p>
    </div>
  );
};

const DesignGrid = ({ 
  designs = [], 
  onCreateDesign,
  onEditDesign,
  onCopyDesign,
  onDeleteDesign,
  viewMode = 'grid'
}) => {
  if (!designs.length) {
    return <EmptyState />;
  }

  return (
    <div className={`${styles.designGrid} ${styles[viewMode]}`}>
      <CreateDesignCard onClick={onCreateDesign} />
      {designs.map(design => (
        <DesignCard
          key={design.id}
          design={design}
          onEdit={onEditDesign}
          onCopy={onCopyDesign}
          onDelete={onDeleteDesign}
        />
      ))}
    </div>
  );
};

export default DesignGrid; 
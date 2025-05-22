import React from 'react';
import { FiFolderPlus } from 'react-icons/fi';
import styles from './EmptyState.module.css';

const EmptyState = () => {
  return (
    <div className={styles.emptyState}>
      <div className={styles.content}>
        <div className={styles.icon}>
          <FiFolderPlus size={48} />
        </div>
        <h3>프로젝트가 없습니다</h3>
        <p>좌측에서 프로젝트를 선택하거나 생성해주세요.</p>
      </div>
    </div>
  );
};

export default EmptyState; 
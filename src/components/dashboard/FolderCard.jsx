import React from 'react';
import { FiFolder } from 'react-icons/fi';
import styles from './FolderCard.module.css';

const FolderCard = ({ folder, onClick }) => {
  return (
    <div className={styles.folderCard} onClick={onClick}>
      <div className={styles.folderIcon}>
        <FiFolder size={32} />
      </div>
      <span className={styles.folderName}>{folder.name}</span>
    </div>
  );
};

export default FolderCard; 
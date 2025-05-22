import React from 'react';
import styles from '../../pages/dashboard/DashboardPage.module.css';

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

export default Modal; 
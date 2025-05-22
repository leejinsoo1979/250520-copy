import React from 'react';
import styles from '../../pages/dashboard/DashboardPage.module.css';

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

export default DesignCard; 
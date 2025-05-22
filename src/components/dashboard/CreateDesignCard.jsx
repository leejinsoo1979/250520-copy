import React, { useState } from 'react';
import { FiPlus, FiShoppingBag, FiPackage, FiHome } from 'react-icons/fi';
import styles from './CreateDesignCard.module.css';

const CreateDesignCard = ({ onSelectDesignType }) => {
  const [showOptions, setShowOptions] = useState(false);
  
  const handleMouseEnter = () => {
    setShowOptions(true);
  };
  
  const handleMouseLeave = () => {
    setShowOptions(false);
  };
  
  const handleOptionClick = (type) => {
    onSelectDesignType(type);
    setShowOptions(false);
  };
  
  return (
    <div 
      className={styles.createCard} 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={styles.cardContent}>
        <div className={styles.designIcon}>
          <FiPlus size={32} />
        </div>
        <span className={styles.designText}>디자인 생성</span>
      </div>
      
      <div className={`${styles.options} ${showOptions ? styles.show : ''}`}>
        <button 
          className={styles.optionButton}
          onClick={() => handleOptionClick('wardrobe')}
        >
          <FiShoppingBag className={styles.optionIcon} />
          <span>옷장 디자인</span>
        </button>
        <button 
          className={styles.optionButton}
          onClick={() => handleOptionClick('shoebox')}
        >
          <FiPackage className={styles.optionIcon} />
          <span>신발장 디자인</span>
        </button>
        <button 
          className={styles.optionButton}
          onClick={() => handleOptionClick('kitchen')}
        >
          <FiHome className={styles.optionIcon} />
          <span>키친 디자인</span>
        </button>
      </div>
    </div>
  );
};

export default CreateDesignCard; 
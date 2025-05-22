import React, { useState, useEffect } from 'react';
import styles from './Step2Content.module.css';
import commonStyles from './common.module.css';
import { FiCheck, FiFileText } from 'react-icons/fi';

const Step1Content = ({ formData, errors, handleChange, onEnter }) => {
  const [titleEntered, setTitleEntered] = useState(false);
  const [locationEntered, setLocationEntered] = useState(false);

  // 입력 완료 여부를 체크
  useEffect(() => {
    setTitleEntered(formData.designTitle && formData.designTitle.trim() !== '');
    setLocationEntered(
      formData.isCustomLocation 
        ? formData.customLocation && formData.customLocation.trim() !== ''
        : formData.installationLocation && formData.installationLocation !== ''
    );
  }, [formData.designTitle, formData.installationLocation, formData.customLocation, formData.isCustomLocation]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && formData.designTitle.trim() && 
        (formData.isCustomLocation ? formData.customLocation.trim() : formData.installationLocation)) {
      e.preventDefault();
      onEnter();
    }
  };

  return (
    <div className={styles.step2Container} style={{ gap: '0' }}>
      <div className={styles.containerLeft} style={{ padding: '0' }}>
        {/* 아이콘 섹션 - 3D 뷰어 대신 아이콘 표시 */}
        <div className={commonStyles.viewerContainer} style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center',
          backgroundColor: '#ffffff'
        }}>
          <div style={{ 
            width: '120px', 
            height: '120px', 
            borderRadius: '60px', 
            backgroundColor: '#00C092', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <FiFileText size={60} color="#fff" />
          </div>
          <h3 style={{ color: '#333', marginBottom: '10px' }}>기본 정보 입력</h3>
          <p style={{ color: '#666', textAlign: 'center', maxWidth: '400px' }}>
            디자인의 기본 정보를 입력해주세요
          </p>
        </div>
      </div>
      
      <div className={styles.containerRight}>
        <h2 className={styles.stepTitle}>
          <span className={styles.stepNumber}>STEP 1</span>
          <span className={styles.stepDescription}>기본 정보 입력</span>
        </h2>
        
        <div className={styles.formSection} style={{ padding: '20px' }}>
          <div className={commonStyles.section}>
            <div className={commonStyles.fieldGroup} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <label className={commonStyles.label} style={{ minWidth: '100px' }}>카테고리</label>
              <div className={styles.formInputWrapper} style={{ flex: 1, position: 'relative' }}>
                <div className={`${styles.checkIcon} ${formData.category ? styles.visible : ''}`} style={{ position: 'absolute', left: '-24px', top: '50%', transform: 'translateY(-50%)' }}>
                  <FiCheck size={16} />
                </div>
                <input
                  type="text"
                  className={styles.formInput}
                  value={formData.category}
                  disabled
                  style={{
                    backgroundColor: 'white',
                    border: 'none',
                    fontWeight: '600',
                    fontSize: '16px',
                    padding: '0',
                    color: '#333',
                    width: '100%'
                  }}
                />
              </div>
            </div>
          </div>

          <div className={commonStyles.section}>
            <div className={commonStyles.fieldGroup}>
              <label className={commonStyles.label} style={{ display: 'flex', alignItems: 'center' }}>
                디자인 제목
                {titleEntered && (
                  <span style={{ marginLeft: '8px', color: '#00C092' }}>
                    <FiCheck size={16} />
                  </span>
                )}
              </label>
              <input
                type="text"
                className={`${commonStyles.inputField} ${errors.designTitle ? styles.formInputError : ''}`}
                value={formData.designTitle}
                onChange={(e) => handleChange('designTitle', e.target.value)}
                placeholder="디자인 제목을 입력하세요"
                onKeyDown={handleKeyDown}
              />
              {errors.designTitle && (
                <div className={commonStyles.errorText}>{errors.designTitle}</div>
              )}
            </div>
          </div>

          <div className={commonStyles.section}>
            <div className={commonStyles.fieldGroup}>
              <label className={commonStyles.label} style={{ display: 'flex', alignItems: 'center' }}>
                설치 위치
                {locationEntered && (
                  <span style={{ marginLeft: '8px', color: '#00C092' }}>
                    <FiCheck size={16} />
                  </span>
                )}
              </label>
              <select
                className={`${commonStyles.inputField} ${errors.installationLocation ? styles.formInputError : ''}`}
                value={formData.installationLocation}
                onChange={(e) => {
                  handleChange('installationLocation', e.target.value);
                  handleChange('isCustomLocation', e.target.value === 'custom');
                }}
                onKeyDown={handleKeyDown}
              >
                <option value="">위치 선택</option>
                <option value="custom">직접 입력</option>
                <option value="안방">안방</option>
                <option value="작은방">작은방</option>
                <option value="드레스룸">드레스룸</option>
                <option value="거실">거실</option>
                <option value="주방">주방</option>
                <option value="현관">현관</option>
              </select>
              {formData.isCustomLocation && (
                <input
                  type="text"
                  className={`${commonStyles.inputField} ${errors.customLocation ? styles.formInputError : ''}`}
                  value={formData.customLocation}
                  onChange={(e) => handleChange('customLocation', e.target.value)}
                  placeholder="설치 위치를 입력하세요"
                  style={{ marginTop: '8px' }}
                  onKeyDown={handleKeyDown}
                />
              )}
              {errors.installationLocation && (
                <div className={commonStyles.errorText}>{errors.installationLocation}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step1Content; 
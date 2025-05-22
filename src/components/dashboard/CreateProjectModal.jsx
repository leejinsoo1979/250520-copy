import React, { useState, useEffect, useRef } from 'react';
import styles from './CreateProjectModal.module.css';

const CreateProjectModal = ({ isOpen, onClose, onCreate }) => {
  const [projectName, setProjectName] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  
  // 모달이 열릴 때 input에 포커스
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 100);
    }
  }, [isOpen]);
  
  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!projectName.trim()) {
      setError('프로젝트 이름을 입력해주세요');
      return;
    }
    
    onCreate(projectName.trim());
    setProjectName('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  // 인라인 스타일 정의
  const modalStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center', 
    alignItems: 'center',
    zIndex: 1000
  };

  const contentStyle = {
    backgroundColor: 'white',
    padding: '35px',
    borderRadius: '10px',
    width: '500px',
    border: '1px solid #4AD4C7'
  };

  const titleStyle = {
    margin: '0 0 30px',
    fontSize: '24px',
    textAlign: 'center',
    color: '#000',
    fontWeight: '600'
  };

  const inputStyle = {
    width: '100%',
    height: '60px',
    padding: '0 20px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '20px',
    marginBottom: '25px'
  };

  const actionsStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '10px'
  };

  const buttonBaseStyle = {
    flex: 1,
    height: '55px',
    borderRadius: '5px',
    fontSize: '20px',
    cursor: 'pointer',
    border: 'none'
  };

  const cancelButtonStyle = {
    ...buttonBaseStyle,
    backgroundColor: '#f4f4f4',
    color: '#000'
  };

  const submitButtonStyle = {
    ...buttonBaseStyle,
    backgroundColor: '#4AD4C7',
    color: 'white'
  };

  const errorStyle = {
    color: '#e53e3e',
    fontSize: '16px',
    marginTop: '-20px',
    marginBottom: '20px'
  };

  return (
    <div style={modalStyle} onClick={onClose}>
      <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={titleStyle}>프로젝트 이름</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={projectName}
            onChange={(e) => {
              setProjectName(e.target.value);
              setError('');
            }}
            placeholder="서초 레미안"
            ref={inputRef}
            style={inputStyle}
          />
          {error && <div style={errorStyle}>{error}</div>}
          <div style={actionsStyle}>
            <button type="button" style={cancelButtonStyle} onClick={onClose}>
              취소
            </button>
            <button type="submit" style={submitButtonStyle}>
              확인
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;
import React from 'react';
import PropTypes from 'prop-types';

// 모듈 아이템 컴포넌트
const ModuleItem = ({ module, isSelected, onClick, onDragStart }) => {
  // 드래그 시작 핸들러
  const handleDragStart = (e) => {
    console.log('ModuleItem 드래그 시작:', module.name);
    
    // 드래그 데이터 설정
    e.dataTransfer.setData('text/plain', JSON.stringify({
      id: module.id,
      name: module.name,
      type: module.type
    }));
    
    // 커스텀 핸들러 호출 (있는 경우)
    if (onDragStart) {
      onDragStart(e, module);
    }
  };
  
  return (
    <div
      onClick={() => onClick(module)}
      draggable={true}
      onDragStart={handleDragStart}
      style={{
        padding: '10px',
        border: isSelected ? '2px solid #2196f3' : '1px solid #ddd',
        borderRadius: '4px',
        marginBottom: '10px',
        background: isSelected ? '#e3f2fd' : '#fff',
        cursor: 'pointer',
        position: 'relative',
        boxShadow: isSelected ? '0 0 8px rgba(33, 150, 243, 0.5)' : '0 2px 4px rgba(0,0,0,0.1)',
        transition: 'all 0.2s ease'
      }}
    >
      <div style={{ fontWeight: 'bold' }}>{module.name}</div>
      <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
        {module.dimensions.width} x {module.dimensions.height} mm
      </div>
      <div style={{ 
        fontSize: '11px', 
        color: '#888', 
        marginTop: '3px',
        fontStyle: 'italic'
      }}>
        드래그하여 배치하세요
      </div>
      {isSelected && (
        <div style={{
          position: 'absolute',
          top: '-8px',
          right: '-8px',
          background: '#2196f3',
          color: 'white',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          ✓
        </div>
      )}
    </div>
  );
};

ModuleItem.propTypes = {
  module: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    dimensions: PropTypes.shape({
      width: PropTypes.number.isRequired,
      height: PropTypes.number.isRequired,
      depth: PropTypes.number.isRequired
    }).isRequired
  }).isRequired,
  isSelected: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  onDragStart: PropTypes.func
};

export default ModuleItem; 
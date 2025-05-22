import React, { useState, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useDrag } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DndProvider } from 'react-dnd';

// 드래그 가능한 모듈 아이템
const DraggableModuleItem = ({ module, onDragStart, onDragEnd }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'FURNITURE_MODULE',
    item: { ...module },
    begin: () => {
      if (onDragStart) onDragStart(module);
      return module;
    },
    end: (item, monitor) => {
      const didDrop = monitor.didDrop();
      if (onDragEnd) onDragEnd(module, didDrop);
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  // 모듈 썸네일 스타일
  const style = {
    opacity: isDragging ? 0.5 : 1,
    cursor: 'move',
    border: '1px solid #ccc',
    padding: '10px',
    marginBottom: '8px',
    background: '#f9f9f9',
    borderRadius: '4px',
    boxShadow: isDragging ? 'none' : '0 2px 3px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  };

  return (
    <div ref={drag} style={style}>
      <div 
        style={{ 
          width: '40px', 
          height: '40px', 
          backgroundColor: '#ddd',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px'
        }}
      >
        {getModuleIcon(module.type)}
      </div>
      <div>
        <div style={{ fontWeight: 'bold' }}>{module.name}</div>
        <div style={{ fontSize: '12px', color: '#777' }}>
          {module.dimensions.width} x {module.dimensions.height} mm
        </div>
      </div>
    </div>
  );
};

// 각 모듈 타입별 아이콘
const getModuleIcon = (type) => {
  switch (type) {
    case 'drawer':
      return '🗄️';
    case 'shelf':
      return '📚';
    case 'hanging':
      return '👔';
    case 'door':
      return '🚪';
    case 'accessory':
      return '🧺';
    case 'cabinet':
      return '🪑';
    default:
      return '📦';
  }
};

// 드롭 영역
const ModuleDropArea = ({ onDrop, children }) => {
  return (
    <div 
      style={{ 
        width: '100%', 
        height: '100%',
        position: 'relative'
      }}
    >
      {children}
    </div>
  );
};

// 모듈 드래그앤드롭 관리자
const ModuleDragManager = ({ modules, children, onModuleDrop, onModuleSelect }) => {
  const [activeDragModule, setActiveDragModule] = useState(null);
  
  // 드래그 시작 핸들러
  const handleDragStart = useCallback((module) => {
    setActiveDragModule(module);
  }, []);
  
  // 드래그 종료 핸들러
  const handleDragEnd = useCallback((module, didDrop) => {
    setActiveDragModule(null);
  }, []);
  
  // 모듈 선택 핸들러
  const handleModuleSelect = useCallback((module) => {
    if (onModuleSelect) onModuleSelect(module);
  }, [onModuleSelect]);
  
  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ display: 'flex', height: '100%' }}>
        {/* 좌측 모듈 목록 */}
        <div style={{ width: '250px', padding: '10px', borderRight: '1px solid #ddd', overflowY: 'auto' }}>
          <h3 style={{ marginBottom: '15px', fontSize: '16px' }}>가구 모듈</h3>
          {modules.map(module => (
            <DraggableModuleItem 
              key={module.id} 
              module={module} 
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onClick={() => handleModuleSelect(module)}
            />
          ))}
        </div>
        
        {/* 메인 콘텐츠 영역 (드롭 영역) */}
        <div style={{ flex: 1, position: 'relative' }}>
          <ModuleDropArea onDrop={onModuleDrop}>
            {children}
          </ModuleDropArea>
        </div>
      </div>
    </DndProvider>
  );
};

ModuleDragManager.propTypes = {
  modules: PropTypes.array.isRequired,
  children: PropTypes.node,
  onModuleDrop: PropTypes.func,
  onModuleSelect: PropTypes.func
};

ModuleDragManager.defaultProps = {
  modules: []
};

export default ModuleDragManager; 
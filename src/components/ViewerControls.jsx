import React from 'react';
import PropTypes from 'prop-types';

const ViewerControls = ({ mode, onModeChange, options, onOptionsChange }) => {
  // 뷰어 모드 전환 핸들러
  const handleModeChange = (newMode) => {
    if (newMode !== mode) {
      onModeChange(newMode);
    }
  };

  // 치수 변경 핸들러
  const handleDimensionChange = (field, value) => {
    // 숫자 값으로 변환
    const numValue = parseInt(value, 10);
    
    // 유효한 값인지 확인
    if (isNaN(numValue)) return;
    
    // 각 필드에 대한 최소/최대값 검증
    const limits = {
      width: { min: 300, max: 2000 },
      depth: { min: 300, max: 1500 },
      height: { min: 1000, max: 3000 }
    };
    
    const { min, max } = limits[field];
    if (numValue < min || numValue > max) return;
    
    // 옵션 업데이트
    onOptionsChange({
      ...options,
      [field]: numValue
    });
  };

  // 색상 변경 핸들러
  const handleColorChange = (e) => {
    onOptionsChange({
      ...options,
      color: e.target.value
    });
  };
  
  return (
    <div className="viewer-controls">
      {/* 모드 전환 버튼 */}
      <div className="mode-switch">
        <button 
          className={`mode-button ${mode === '2D' ? 'active' : ''}`}
          onClick={() => handleModeChange('2D')}
        >
          2D
        </button>
        <button 
          className={`mode-button ${mode === '3D' ? 'active' : ''}`}
          onClick={() => handleModeChange('3D')}
        >
          3D
        </button>
      </div>
      
      {/* 치수 및 옵션 컨트롤 */}
      <div className="dimension-controls">
        <div className="control-group">
          <label>너비:</label>
          <input
            type="number"
            min="300"
            max="2000"
            value={options.width}
            onChange={(e) => handleDimensionChange('width', e.target.value)}
          />
          <span className="unit">mm</span>
        </div>
        
        <div className="control-group">
          <label>깊이:</label>
          <input
            type="number"
            min="300"
            max="1500"
            value={options.depth}
            onChange={(e) => handleDimensionChange('depth', e.target.value)}
          />
          <span className="unit">mm</span>
        </div>
        
        <div className="control-group">
          <label>높이:</label>
          <input
            type="number"
            min="1000"
            max="3000"
            value={options.height}
            onChange={(e) => handleDimensionChange('height', e.target.value)}
          />
          <span className="unit">mm</span>
        </div>
        
        <div className="control-group">
          <label>색상:</label>
          <input
            type="color"
            value={options.color}
            onChange={handleColorChange}
          />
        </div>
      </div>
      
      <style jsx>{`
        .viewer-controls {
          padding: 15px;
          background-color: #f5f5f5;
          border-top: 1px solid #ddd;
        }
        
        .mode-switch {
          display: flex;
          justify-content: center;
          margin-bottom: 15px;
        }
        
        .mode-button {
          padding: 8px 20px;
          border: 1px solid #ccc;
          background: white;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        
        .mode-button:first-child {
          border-radius: 4px 0 0 4px;
        }
        
        .mode-button:last-child {
          border-radius: 0 4px 4px 0;
        }
        
        .mode-button.active {
          background-color: #00C092;
          color: white;
          border-color: #00C092;
        }
        
        .dimension-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          margin-top: 15px;
        }
        
        .control-group {
          display: flex;
          align-items: center;
        }
        
        .control-group label {
          margin-right: 5px;
          font-weight: 500;
        }
        
        .control-group input[type="number"] {
          width: 70px;
          padding: 5px;
        }
        
        .unit {
          margin-left: 5px;
          font-size: 0.9em;
          color: #666;
        }
      `}</style>
    </div>
  );
};

ViewerControls.propTypes = {
  mode: PropTypes.oneOf(['2D', '3D']).isRequired,
  onModeChange: PropTypes.func.isRequired,
  options: PropTypes.shape({
    width: PropTypes.number.isRequired,
    depth: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    color: PropTypes.string.isRequired,
  }).isRequired,
  onOptionsChange: PropTypes.func.isRequired,
};

export default ViewerControls; 
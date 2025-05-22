import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import SizeUtils from '../../utils/sizeUtils';

/**
 * 수평 캐비닛 컴포넌트
 * 여러 캐비닛을 가로 방향으로 배치하여 표시합니다.
 */
const HorizontalCabinets = ({
  frame,
  frameSize,
  frameColor = '#F8F8F8',
  modules = [],
  modulesGap,
  handleFrameSizeChange,
  scale = 0.1,
  framePropertiesMetaData,
  currentAngleView = 'Front',
  setCurrentAngleView
}) => {
  // 캐비닛 상태
  const [cabinets, setCabinets] = useState([]);
  const [activeCabinet, setActiveCabinet] = useState(null);
  
  // 프레임 데이터
  const frameData = frame || {};
  const dimensions = frameData.data?.dimensions || { width: 2400, height: 2400, depth: 550 };
  
  // modulesGap에서 필요한 데이터 추출
  const hasAirConditioner = modulesGap?.hasAirConditioner || false;
  const acUnit = modulesGap?.acUnit || null;
  
  // 단내림 정보
  const acInfo = hasAirConditioner && acUnit ? {
    position: acUnit.position || 'left',
    width: acUnit.width || 900,
    depth: acUnit.depth || 200,
  } : null;
  
  // 프레임 색상 설정
  const [frameColorState, setFrameColorState] = useState(frameColor);
  
  useEffect(() => {
    setFrameColorState(frameColor);
  }, [frameColor]);
  
  // 모듈 데이터 변경 시 캐비닛 업데이트
  useEffect(() => {
    if (modules && modules.length > 0) {
      // 모듈 데이터로부터 캐비닛 생성 로직
      const newCabinets = modules.map(module => ({
        id: module.id,
        width: module.width,
        height: module.height,
        depth: module.depth,
        x: module.x,
        y: module.y,
        color: module.color,
        type: module.type
      }));
      
      setCabinets(newCabinets);
    } else {
      setCabinets([]);
    }
  }, [modules]);
  
  // 프레임 크기 변경 시 상위 컴포넌트에 알림
  useEffect(() => {
    if (handleFrameSizeChange && frameSize) {
      handleFrameSizeChange({
        left: frameSize.left,
        right: frameSize.right,
        top: frameSize.top,
        bottom: frameSize.bottom
      });
    }
  }, [frameSize, handleFrameSizeChange]);
  
  // 캐비닛 클릭 핸들러
  const handleCabinetClick = (cabinet) => {
    setActiveCabinet(cabinet.id === activeCabinet ? null : cabinet.id);
  };
  
  // 픽셀 단위로 변환된 값들
  const width = SizeUtils.mmToPx(dimensions.width, scale);
  const height = SizeUtils.mmToPx(dimensions.height, scale);
  const depth = SizeUtils.mmToPx(dimensions.depth, scale);
  
  return (
    <div 
      className="horizontal-cabinets"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: '#FFF'
      }}
    >
      {/* 수직 가이드라인 표시 */}
      <div className="guidelines vertical">
        {Array.from({ length: 9 }).map((_, i) => (
          <div 
            key={`v-guide-${i}`}
            className="guideline vertical"
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${i * (100 / 8)}%`,
              width: '1px',
              backgroundColor: 'rgba(0,0,0,0.1)',
              zIndex: 1
            }}
          />
        ))}
      </div>
      
      {/* 수평 가이드라인 표시 */}
      <div className="guidelines horizontal">
        {Array.from({ length: 5 }).map((_, i) => (
          <div 
            key={`h-guide-${i}`}
            className="guideline horizontal"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: `${i * 25}%`,
              height: '1px',
              backgroundColor: 'rgba(0,0,0,0.1)',
              zIndex: 1
            }}
          />
        ))}
      </div>
      
      {/* 프레임 렌더링 */}
      <div 
        className="frame"
        style={{
          position: 'absolute',
          top: '5%',
          left: '5%',
          width: '90%',
          height: '90%',
          border: `2px solid ${frameColorState}`,
          backgroundColor: 'rgba(248, 248, 248, 0.3)',
          boxSizing: 'border-box',
          zIndex: 2
        }}
      >
        {/* 단내림 영역 표시 */}
        {hasAirConditioner && acInfo && (
          <div 
            className={`ac-unit ${acInfo.position}`}
            style={{
              position: 'absolute',
              [acInfo.position]: 0,
              top: 0,
              width: `${(acInfo.width / dimensions.width) * 100}%`,
              height: `${(acInfo.depth / dimensions.height) * 40}%`, // 40%는 시각적 효과
              backgroundColor: 'rgba(200, 200, 200, 0.5)',
              borderBottom: '2px dashed rgba(100, 100, 100, 0.5)',
              borderRight: acInfo.position === 'left' ? '2px dashed rgba(100, 100, 100, 0.5)' : 'none',
              borderLeft: acInfo.position === 'right' ? '2px dashed rgba(100, 100, 100, 0.5)' : 'none',
              zIndex: 3
            }}
          >
            <span style={{ fontSize: '10px', padding: '2px' }}>단내림</span>
          </div>
        )}
        
        {/* 캐비닛 렌더링 */}
        {cabinets.map(cabinet => {
          const left = (cabinet.x / dimensions.width) * 100;
          const top = (cabinet.y / dimensions.height) * 100;
          const cabinetWidth = (cabinet.width / dimensions.width) * 100;
          const cabinetHeight = (cabinet.height / dimensions.height) * 100;
          
          return (
            <div 
              key={cabinet.id}
              className={`cabinet ${activeCabinet === cabinet.id ? 'active' : ''}`}
              style={{
                position: 'absolute',
                left: `${left}%`,
                top: `${top}%`,
                width: `${cabinetWidth}%`,
                height: `${cabinetHeight}%`,
                backgroundColor: cabinet.color || '#FFF',
                border: `1px solid ${activeCabinet === cabinet.id ? '#007BFF' : '#DDD'}`,
                boxSizing: 'border-box',
                zIndex: activeCabinet === cabinet.id ? 5 : 4,
                cursor: 'pointer',
                boxShadow: activeCabinet === cabinet.id ? '0 0 10px rgba(0,123,255,0.5)' : 'none'
              }}
              onClick={() => handleCabinetClick(cabinet)}
            >
              <div className="cabinet-label" style={{ fontSize: '10px', padding: '2px' }}>
                {cabinet.type || '캐비닛'}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* 뷰 제어 버튼 */}
      <div 
        className="view-controls"
        style={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          zIndex: 10
        }}
      >
        {['Front', 'Top', 'Left', 'Right'].map(view => (
          <button
            key={view}
            className={`view-btn ${currentAngleView === view ? 'active' : ''}`}
            style={{
              margin: '0 5px',
              padding: '3px 8px',
              backgroundColor: currentAngleView === view ? '#007BFF' : '#EEE',
              color: currentAngleView === view ? '#FFF' : '#333',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
            onClick={() => setCurrentAngleView && setCurrentAngleView(view)}
          >
            {view}
          </button>
        ))}
      </div>
    </div>
  );
};

HorizontalCabinets.propTypes = {
  frame: PropTypes.object,
  frameSize: PropTypes.object,
  frameColor: PropTypes.string,
  modules: PropTypes.array,
  modulesGap: PropTypes.object,
  handleFrameSizeChange: PropTypes.func,
  scale: PropTypes.number,
  framePropertiesMetaData: PropTypes.object,
  currentAngleView: PropTypes.string,
  setCurrentAngleView: PropTypes.func
};

export default HorizontalCabinets; 
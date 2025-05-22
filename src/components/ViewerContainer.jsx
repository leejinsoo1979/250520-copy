import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import TwoDViewer from './new-editor/TwoDViewer';
import RoomViewer3D from './common/RoomViewer3D';

const ViewerContainer = ({
  initialOptions,
  onChange,
  hideViewButtons = false,
  installationType = 'built-in',
  hasAirConditioner = false,
  hasFloorFinish = false,
  acUnitPosition = 'left',
  floorFinishType = 'wood',
  showFrame = true
}) => {
  const [currentOptions, setCurrentOptions] = useState({
    width: initialOptions?.width || 4800,
    height: initialOptions?.height || 2400,
    depth: initialOptions?.depth || 1500,
    color: initialOptions?.color || '#e0e0e0'
  });
  
  const [viewerMode, setViewerMode] = useState('2D');
  const [viewType, setViewType] = useState('front');
  const [viewerKey, setViewerKey] = useState(Date.now());
  const [twoDViewerMounted, setTwoDViewerMounted] = useState(true);
  const [viewerError, setViewerError] = useState(null);
  
  // 실제 사용할 설치 타입, 에어컨 단내림, 바닥 마감재 속성 추출
  const [currentInstallationType, setCurrentInstallationType] = useState(
    initialOptions?.installationType || installationType
  );
  const [currentHasAirConditioner, setCurrentHasAirConditioner] = useState(
    initialOptions?.acUnitEnabled || hasAirConditioner
  );
  const [currentAcUnitPosition, setCurrentAcUnitPosition] = useState(
    initialOptions?.acUnitPosition || acUnitPosition
  );
  const [currentHasFloorFinish, setCurrentHasFloorFinish] = useState(
    initialOptions?.floorFinish?.isEnabled || hasFloorFinish
  );
  const [currentFloorFinishType, setCurrentFloorFinishType] = useState(floorFinishType);
  
  // 에어컨 단내림 크기 상태 추가
  const [currentAcUnitWidth, setCurrentAcUnitWidth] = useState(
    initialOptions?.acUnitWidth || 1000
  );
  const [currentAcUnitDepth, setCurrentAcUnitDepth] = useState(
    initialOptions?.acUnitDepth || 200
  );
  
  // 상위 컴포넌트로부터 받은 props 변경 감지 및 내부 상태 업데이트
  useEffect(() => {
    if (initialOptions) {
      if (initialOptions.width || initialOptions.height || initialOptions.depth) {
        setCurrentOptions(prev => ({
          ...prev,
          width: initialOptions.width || prev.width,
          height: initialOptions.height || prev.height,
          depth: initialOptions.depth || prev.depth
        }));
      }
      
      if (initialOptions.installationType) {
        setCurrentInstallationType(initialOptions.installationType);
      }
      
      if (initialOptions.acUnitEnabled !== undefined) {
        setCurrentHasAirConditioner(initialOptions.acUnitEnabled);
      }
      
      if (initialOptions.acUnitPosition) {
        setCurrentAcUnitPosition(initialOptions.acUnitPosition);
      }
      
      if (initialOptions.acUnitWidth) {
        setCurrentAcUnitWidth(initialOptions.acUnitWidth);
      }
      
      if (initialOptions.acUnitDepth) {
        setCurrentAcUnitDepth(initialOptions.acUnitDepth);
      }
      
      if (initialOptions.floorFinish?.isEnabled !== undefined) {
        setCurrentHasFloorFinish(initialOptions.floorFinish.isEnabled);
      }
      
      if (initialOptions.floorFinishType) {
        setCurrentFloorFinishType(initialOptions.floorFinishType);
      }
    }
  }, [initialOptions]);
  
  // 옵션 변경 핸들러
  const handleOptionsChange = (newOptions) => {
    setCurrentOptions(prev => {
      const updated = { ...prev, ...newOptions };
      if (typeof onChange === 'function') {
        onChange(updated);
      }
      return updated;
    });
  };
  
  // 뷰어 모드 전환 (2D <-> 3D)
  const handleViewerModeChange = (mode) => {
    try {
      if (mode === viewerMode) return;
      
      console.log(`뷰어 모드 변경: ${viewerMode} -> ${mode}`);
      setViewerError(null);
      
      // 모드 변경 시 viewerKey를 갱신하여 컴포넌트 리렌더링 유도
      const newKey = Date.now();
      setViewerKey(newKey);
      
      // 2D 모드로 전환 시 TwoDViewer 마운트 확인
      if (mode === '2D' && !twoDViewerMounted) {
        setTwoDViewerMounted(true);
      }
      
      // 약간의 지연 후에 모드 변경 (상태 업데이트 충돌 방지)
      setTimeout(() => {
        setViewerMode(mode);
      }, 50);
    } catch (error) {
      console.error("뷰어 모드 전환 오류:", error);
      setViewerError("뷰어 모드 전환 중 오류가 발생했습니다.");
    }
  };
  
  // 뷰 타입 변경 (정면도, 평면도, 좌측면도, 우측면도)
  const handleViewTypeChange = (type) => {
    try {
      console.log(`뷰 타입 변경: ${viewType} -> ${type}`);
      setViewType(type);
      
      // 뷰 타입 변경 시 viewerKey 갱신
      setViewerKey(Date.now());
    } catch (error) {
      console.error("뷰 타입 변경 오류:", error);
      setViewerError("뷰 타입 변경 중 오류가 발생했습니다.");
    }
  };
  
  // 에러 핸들러
  const handleViewerError = (error) => {
    console.error("뷰어 오류:", error);
    setViewerError(error.message || "뷰어 렌더링 중 오류가 발생했습니다.");
  };
  
  // 에러 발생 시 표시할 컴포넌트
  const ErrorDisplay = () => (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#fff8f8',
      padding: '20px',
      textAlign: 'center'
    }}>
      <h3 style={{ color: '#d32f2f', margin: '0 0 10px 0' }}>뷰어 오류</h3>
      <p>{viewerError}</p>
      <button
        style={{
          padding: '8px 16px',
          backgroundColor: '#f44336',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginTop: '10px'
        }}
        onClick={() => {
          setViewerError(null);
          setViewerKey(Date.now());
        }}
      >
        다시 시도
      </button>
    </div>
  );
  
  return (
    <Container>
      <ControlPanel>
        <ButtonGroup>
          <ControlButton 
            $active={viewerMode === '2D'} 
            onClick={() => handleViewerModeChange('2D')}
          >
            2D
          </ControlButton>
          <ControlButton 
            $active={viewerMode === '3D'} 
            onClick={() => handleViewerModeChange('3D')}
          >
            3D
          </ControlButton>
        </ButtonGroup>
      </ControlPanel>
      
      {viewerError && <ErrorDisplay />}
      
      {!viewerError && twoDViewerMounted && (
        <div style={{ 
          display: viewerMode === '2D' ? 'flex' : 'none',
          width: '100%', 
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          zIndex: viewerMode === '2D' ? 5 : 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f0f0f0',
          border: '1px solid #e0e0e0',
          borderRadius: '8px'
        }}>
          <div style={{
            width: '90%',
            height: '90%',
            maxWidth: '950px',
            maxHeight: '650px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            backgroundColor: '#ffffff',
            borderRadius: '4px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
          }}>
            <TwoDViewer 
              key={`2d-${viewerKey}`}
              dimensions={{
                width: currentOptions.width,
                height: currentOptions.height,
                depth: currentOptions.depth,
              }}
              viewType={viewType}
              hasAirConditioner={currentHasAirConditioner}
              hasFloorFinish={currentHasFloorFinish}
              acUnitPosition={currentAcUnitPosition}
              acUnitWidth={currentAcUnitWidth}
              acUnitDepth={currentAcUnitDepth}
              floorFinishHeight={initialOptions?.floorFinish?.height || 50}
              installationType={currentInstallationType}
              showFrame={showFrame}
            />
          </div>
        </div>
      )}
      
      {!viewerError && (
        <div style={{ 
          display: viewerMode === '3D' ? 'block' : 'none',
          width: '100%', 
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          zIndex: viewerMode === '3D' ? 5 : 1
        }}>
          <RoomViewer3D 
            key={`3d-${viewerKey}`}
            spaceInfo={{
              width: currentOptions.width,
              height: currentOptions.height,
              depth: currentOptions.depth,
              spaceType: currentInstallationType,
              wallPosition: currentAcUnitPosition,
              hasAirConditioner: currentHasAirConditioner,
              acUnit: { 
                position: currentAcUnitPosition, 
                width: currentAcUnitWidth, 
                depth: currentAcUnitDepth 
              },
              hasFloorFinish: currentHasFloorFinish,
              floorFinishType: currentFloorFinishType,
              floorThickness: initialOptions?.floorFinish?.height || 0
            }}
            placementInfo={{
              type: currentInstallationType,
              width: currentOptions.width,
              height: currentOptions.height,
              depth: currentOptions.depth,
              clearance: { left: 0, right: 0, top: 0 },
              fit: 'normal',
              showFrame: showFrame,
              wallPosition: currentAcUnitPosition
            }}
            options={currentOptions}
            showFrame={showFrame}
            projectionMode="perspective"
            viewType={viewType}
            onError={handleViewerError}
          />
        </div>
      )}
    </Container>
  );
};

ViewerContainer.propTypes = {
  initialOptions: PropTypes.shape({
    width: PropTypes.number,
    height: PropTypes.number,
    depth: PropTypes.number,
    color: PropTypes.string,
    acUnitWidth: PropTypes.number,
    acUnitDepth: PropTypes.number
  }),
  onChange: PropTypes.func,
  hideViewButtons: PropTypes.bool,
  installationType: PropTypes.string,
  hasAirConditioner: PropTypes.bool,
  hasFloorFinish: PropTypes.bool,
  acUnitPosition: PropTypes.string,
  floorFinishType: PropTypes.string,
  showFrame: PropTypes.bool
};

const Container = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  background-color: #ffffff;
  overflow: hidden;
  border-radius: 8px;
`;

const ControlPanel = styled.div`
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 20px;
  z-index: 10;
  padding: 8px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 4px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 4px;
`;

const ControlButton = styled.button`
  padding: 6px 12px;
  background-color: ${props => props.$active ? '#00C092' : 'white'};
  color: ${props => props.$active ? 'white' : '#333'};
  border: 1px solid ${props => props.$active ? '#00C092' : '#ddd'};
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => props.$active ? '#00A87F' : '#f0f0f0'};
  }
`;

const ButtonContainer = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  z-index: 10;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

export default ViewerContainer; 
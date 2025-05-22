import React, { createContext, useState, useContext, useEffect } from 'react';
import PropTypes from 'prop-types';

// 3D Room을 위한 컨텍스트 생성
const RoomContext = createContext();

/**
 * Room 관련 상태를 관리하는 Provider 컴포넌트
 */
export const RoomProvider = ({ 
  children,
  initialSpaceInfo,
  initialPlacementInfo,
  initialViewMode = 'normal'
}) => {
  // --- 프레임 치수 상태 ---
  const [frameProperties, setFrameProperties] = useState({
    leftFrameWidth: 50, // mm
    rightFrameWidth: 50, // mm
    topFrameHeight: 50, // mm
    frameThickness: 20, // mm
    baseHeight: 80, // mm
    baseDepth: 580, // mm
    endPanelThickness: 20 // mm
  });
  
  // --- 공간 정보 상태 ---
  const [spaceInfo, setSpaceInfo] = useState(initialSpaceInfo || {
    width: 4200, // mm
    depth: 2400, // mm
    height: 2400, // mm
    spaceType: 'built-in',
    wallPosition: 'left',
    hasAirConditioner: false,
    acUnit: { position: 'left', width: 850, depth: 200 },
    hasFloorFinish: false,
    floorFinishType: 'wood',
    floorThickness: 0
  });
  
  // --- 배치 정보 상태 ---
  const [placementInfo, setPlacementInfo] = useState(initialPlacementInfo || {
    type: 'built-in',
    wallPosition: 'left',
    hasBase: true,
    baseHeight: 80,
    baseDepth: 580,
    placementType: 'floor',
    raiseHeight: 0,
    focusedFrame: null
  });
  
  // --- 뷰 모드 상태 ---
  const [viewMode, setViewMode] = useState(initialViewMode);
  
  // --- 포커스된 요소 상태 ---
  const [focusedElement, setFocusedElement] = useState(null);
  
  // --- 디버그 모드 상태 ---
  const [debugMode, setDebugMode] = useState(false);
  
  // --- 초기 props 변경 시 상태 업데이트 ---
  useEffect(() => {
    if (initialSpaceInfo) {
      setSpaceInfo(initialSpaceInfo);
    }
  }, [initialSpaceInfo]);
  
  useEffect(() => {
    if (initialPlacementInfo) {
      setPlacementInfo(initialPlacementInfo);
    }
  }, [initialPlacementInfo]);
  
  useEffect(() => {
    if (initialViewMode) {
      setViewMode(initialViewMode);
    }
  }, [initialViewMode]);
  
  // --- 편의를 위한 변환된 치수 계산 ---
  // mm를 m로 변환
  const dimensions = {
    widthM: spaceInfo.width / 1000,
    heightM: spaceInfo.height / 1000,
    depthM: spaceInfo.depth / 1000,
    leftFrameWidth: frameProperties.leftFrameWidth / 1000,
    rightFrameWidth: frameProperties.rightFrameWidth / 1000,
    topFrameHeight: frameProperties.topFrameHeight / 1000,
    frameThickness: frameProperties.frameThickness / 1000,
    baseHeightM: frameProperties.baseHeight / 1000,
    baseDepthM: frameProperties.baseDepth / 1000,
    endPanelThickness: frameProperties.endPanelThickness / 1000,
    floorThicknessM: spaceInfo.floorThickness / 1000
  };
  
  // --- 옵션 구성 ---
  const spaceType = placementInfo?.type || spaceInfo?.spaceType || 'built-in';
  const normalizedSpaceType = spaceType === 'standing' ? 'free-standing' : 
                            (spaceType === 'semi-standing' ? 'semi-standing' : 'built-in');
  const wallPosition = normalizedSpaceType === 'semi-standing' ? 
                     (placementInfo?.wallPosition || spaceInfo?.wallPosition || 'left') : null;
  
  const options = {
    spaceType: normalizedSpaceType,
    wallPosition,
    hasAirConditioner: spaceInfo.hasAirConditioner,
    acUnit: spaceInfo.acUnit,
    hasBase: placementInfo.hasBase,
    hasFloorFinish: spaceInfo.hasFloorFinish === true || spaceInfo.hasFloorFinish === 'yes',
    floorThicknessM: spaceInfo.floorThickness / 1000,
    placementType: placementInfo.placementType,
    raiseHeightM: placementInfo.raiseHeight / 1000
  };
  
  // --- 메서드들 ---
  // 프레임 속성 업데이트
  const updateFrameProperties = (newProperties) => {
    setFrameProperties(prev => ({ ...prev, ...newProperties }));
  };
  
  // 공간 정보 업데이트
  const updateSpaceInfo = (newInfo) => {
    setSpaceInfo(prev => ({ ...prev, ...newInfo }));
  };
  
  // 배치 정보 업데이트
  const updatePlacementInfo = (newInfo) => {
    setPlacementInfo(prev => ({ ...prev, ...newInfo }));
  };
  
  // 요소 포커스 설정
  const focusElement = (elementName) => {
    setFocusedElement(elementName);
    setPlacementInfo(prev => ({ ...prev, focusedFrame: elementName }));
  };
  
  // 디버그 모드 토글
  const toggleDebugMode = () => {
    setDebugMode(prev => !prev);
  };
  
  const contextValue = {
    // 상태
    spaceInfo,
    placementInfo,
    frameProperties,
    viewMode,
    focusedElement,
    debugMode,
    
    // 계산된 값
    dimensions,
    options,
    
    // 메서드
    updateFrameProperties,
    updateSpaceInfo,
    updatePlacementInfo,
    setViewMode,
    focusElement,
    toggleDebugMode
  };
  
  return (
    <RoomContext.Provider value={contextValue}>
      {children}
    </RoomContext.Provider>
  );
};

RoomProvider.propTypes = {
  children: PropTypes.node.isRequired,
  initialSpaceInfo: PropTypes.object,
  initialPlacementInfo: PropTypes.object,
  initialViewMode: PropTypes.string
};

/**
 * Room 컨텍스트를 사용하기 위한 훅
 * @returns {Object} Room 컨텍스트 값
 */
export const useRoomContext = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoomContext must be used within a RoomProvider');
  }
  return context;
};

export default RoomContext; 
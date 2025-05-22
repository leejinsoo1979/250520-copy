import React, { useState, useEffect, useCallback } from "react";
import { Switch } from "./ui/switch";
import { View, Box, Ruler, Settings } from "lucide-react";
import RoomViewer3D from "../common/RoomViewer3D";
import { useEditor } from "@context/EditorContext";

// cn utility 함수 추가
const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

export const EditorView = ({
  viewMode,
  setViewMode,
  isToggle1On = true,
  setIsToggle1On,
  isToggle2On = false,
  setIsToggle2On,
  designData,
  dimensions,
  spaceType,
  wallPosition = "left",
  frameColor = "#F8F8F8",
  modulesGap,
  handleModuleGapChange
}) => {
  // 모든 필요한 값과 함수를 EditorContext에서 가져오기
  const {
    cameraView, 
    setCameraView,
    viewMode: editorViewMode,
    setViewMode: setEditorViewMode,
    showGrid: editorShowGrid,
    setShowGrid: setEditorShowGrid,
    showShadows: editorShowShadows,
    setShowShadows: setEditorShowShadows,
    doorCount,
    setDoorCount,
    frameProperties,
    updateFrameProperty,
    updateViewers,
    viewer3DRef
  } = useEditor();

  // 로컬 상태 초기화
  const [activeDirection, setActiveDirection] = useState(cameraView || "Front");
  const [showShadows, setShowShadows] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showFrame, setShowFrame] = useState(true);
  const [showModuleSlots, setShowModuleSlots] = useState(true);
  
  // 단내림 설정 상태 저장용 ref
  const airConditionerStateRef = React.useRef({
    hasAirConditioner: frameProperties?.hasAirConditioner || 'no',
    acUnit: frameProperties?.acUnit || null
  });

  // frameProperties 변경 감지 및 저장
  useEffect(() => {
    if (frameProperties?.hasAirConditioner) {
      airConditionerStateRef.current = {
        hasAirConditioner: frameProperties.hasAirConditioner,
        acUnit: frameProperties.acUnit ? { ...frameProperties.acUnit } : null
      };
      console.log('[EditorView] 단내림 설정 저장:', airConditionerStateRef.current);
    }
  }, [frameProperties?.hasAirConditioner, frameProperties?.acUnit]);
  
  // slotStatuses는 doorCount에 따라 생성
  const [slotStatuses, setSlotStatuses] = useState(Array(doorCount).fill('empty'));
  const [hoveredSlot, setHoveredSlot] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showDimensionType, setShowDimensionType] = useState("both"); // 치수 표시 타입: "both", "dimensions", "guides"
  
  // EditorContext의 cameraView가 변경될 때 activeDirection 업데이트
  useEffect(() => {
    if (cameraView && cameraView !== activeDirection) {
      setActiveDirection(cameraView);
    }
  }, [cameraView]);

  // doorCount가 변경될 때 slotStatuses 업데이트
  useEffect(() => {
    console.log('[EditorView] doorCount 변경됨:', doorCount);
    // doorCount가 변경되면 상태 초기화
    setSlotStatuses(Array(doorCount).fill('empty'));
    
    // modulesGap 업데이트 - doorCount가 변경되면 handleModuleGapChange 호출
    if (modulesGap?.doorCount !== doorCount) {
      console.log('[EditorView] modulesGap doorCount 동기화:', doorCount);
      handleModuleGapChange('doorCount', doorCount);
    }
  }, [doorCount, handleModuleGapChange]);
  
  // 기본 치수 정보
  const defaultDimensions = {
    width: dimensions?.width || 2400,
    height: dimensions?.height || 2400,
    depth: dimensions?.depth || 600
  };

  // 실제 프레임 크기를 3D 뷰어로부터 받을 때 상위 컴포넌트로 전달
  const handleFrameSizeUpdate = useCallback((frameSizes) => {
    console.log('실제 프레임 크기 업데이트:', frameSizes);
    
    // 상위 컴포넌트로 실제 프레임 크기 전달
    if (handleModuleGapChange) {
      // 각 프레임 속성 업데이트
      handleModuleGapChange('left', frameSizes.left);
      handleModuleGapChange('right', frameSizes.right);
      handleModuleGapChange('top', frameSizes.top);
      handleModuleGapChange('bottom', frameSizes.bottom);
      
      // 엔드패널 정보도 필요하면 추가
      if (frameSizes.endPanelLeft) {
        handleModuleGapChange('endPanelLeft', frameSizes.endPanelLeft);
      }
      if (frameSizes.endPanelRight) {
        handleModuleGapChange('endPanelRight', frameSizes.endPanelRight);
      }
    }
  }, [handleModuleGapChange]);

  // 치수 표시 handler
  const handleToggleGrid = (checked) => {
    setIsToggle1On(checked);
    setShowGrid(checked);
  };

  // 그림자 표시 handler
  const handleToggleShadows = (checked) => {
    setIsToggle2On(checked);
    setShowShadows(checked);
  };

  // view mode handler
  const handleViewModeChange = (mode) => {
    if (setViewMode) {
      setViewMode(mode);
    }
    
    // EditorContext의 viewMode도 함께 업데이트
    if (setEditorViewMode) {
      setEditorViewMode(mode);
    }
    
    // 뷰어 업데이트
    setTimeout(() => {
      if (updateViewers) {
        updateViewers();
      }
    }, 50);
  };

  // 방향 변경 핸들러 수정 - 단내림 설정 복원 로직 제거
  const handleDirectionChange = (direction) => {
    console.log('[EditorView] 방향 변경 시작:', { 
      현재방향: activeDirection, 
      새방향: direction
    });
    
    // 로컬 상태 업데이트
    setActiveDirection(direction);
    
    // EditorContext의 cameraView 업데이트
    if (setCameraView) {
      setCameraView(direction);
          
      // 뷰어 업데이트
      setTimeout(() => {
        if (updateViewers) {
          updateViewers();
        }
      }, 50);
    } else {
      // 뷰어 업데이트
      setTimeout(() => {
        if (updateViewers) {
          updateViewers();
        }
      }, 50);
    }
  };

  // 뷰 타입 계산
  const getViewType = () => {
    switch (activeDirection) {
      case "Front": return "front";
      case "Top": return "top";
      case "Left": return "left";
      case "Right": return "right";
      default: return "front";
    }
  };

  // 3D 렌더링 옵션
  const viewerOptions = {
    dimensions: defaultDimensions,
    showGrid: showGrid,
    showShadows: showShadows,
    showFrame: true,
    frameColor: frameColor,
    frameThickness: 50,
  };

  // 슬롯 호버 핸들러
  const handleSlotHover = (slotIndex, isHovering) => {
    if (isHovering) {
      setHoveredSlot(slotIndex);
      const newStatuses = [...slotStatuses];
      if (newStatuses[slotIndex] === 'empty') {
        newStatuses[slotIndex] = 'hover';
        setSlotStatuses(newStatuses);
      }
    } else {
      setHoveredSlot(null);
      const newStatuses = [...slotStatuses];
      if (newStatuses[slotIndex] === 'hover') {
        newStatuses[slotIndex] = 'empty';
        setSlotStatuses(newStatuses);
      }
    }
  };
  
  // 슬롯 클릭 핸들러
  const handleSlotClick = (slotIndex) => {
    setSelectedSlot(slotIndex);
    const newStatuses = [...slotStatuses];
    
    // 이전에 선택된 슬롯이 있으면 상태 초기화
    if (selectedSlot !== null && selectedSlot !== slotIndex) {
      newStatuses[selectedSlot] = 'empty';
    }
    
    // 새 슬롯 선택
    newStatuses[slotIndex] = newStatuses[slotIndex] === 'selected' ? 'empty' : 'selected';
    setSlotStatuses(newStatuses);
  };
  
  // 프레임 데이터 계산 함수
  const getFrameData = () => {
    const frameData = {
      enabled: true,
      color: frameColor,
      thickness: 20
    };

    // modulesGap이 있으면 해당 값 사용, 없으면 기본값 사용
    if (modulesGap) {
      // 각 프레임의 width 값 추출
      if (modulesGap.left && typeof modulesGap.left === 'object') {
        frameData.leftWidth = modulesGap.left.width || 50;
      } else {
        frameData.leftWidth = 50;
      }

      if (modulesGap.right && typeof modulesGap.right === 'object') {
        frameData.rightWidth = modulesGap.right.width || 50;
      } else {
        frameData.rightWidth = 50;
      }

      if (modulesGap.top && typeof modulesGap.top === 'object') {
        frameData.topWidth = modulesGap.top.width || 50;
      } else {
        frameData.topWidth = 50;
      }

      if (modulesGap.bottom && typeof modulesGap.bottom === 'object') {
        frameData.bottomHeight = modulesGap.bottom.height || 80;
      } else {
        frameData.bottomHeight = 80;
      }
    } else {
      // 기본값 설정
      frameData.leftWidth = 50;
      frameData.rightWidth = 50;
      frameData.topWidth = 50;
      frameData.bottomHeight = 80;
    }

    console.log('Frame data calculated:', frameData);
    return frameData;
  };

  // 치수 타입 변경 핸들러
  const handleDimensionTypeChange = (type) => {
    console.log('[EditorView] 치수 타입 변경:', type);
    setShowDimensionType(type);
  };

  // 단내림(에어컨) 자동 초기화
  useEffect(() => {
    if (
      modulesGap?.hasAirConditioner === 'yes' &&
      (!modulesGap.acUnit || !modulesGap.acUnit.position)
    ) {
      handleModuleGapChange('acUnit', {
        width: 200,
        depth: dimensions?.depth || 600,  // Z축 (깊이) - 공간 깊이와 동일
        height: 580,  // Y축 (높이) - 기본값 580mm
        position: 'left',
        present: true
      });
    }
  }, [modulesGap?.hasAirConditioner, modulesGap?.acUnit, handleModuleGapChange, dimensions?.depth]);

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="bg-white px-4 py-2 border-b border-gray-200">
        <div className="flex items-center justify-between w-full">
          {/* 아이콘과 토글 스위치 */}
          <div className="flex items-center space-x-12">
            <div className="flex items-center gap-2">
              <Ruler className="h-5 w-5 text-gray-500" />
              <div className="flex items-center gap-1 w-28">
                <span className={cn(
                  "text-xs w-8 text-center",
                  isToggle1On ? "text-[#10b981]" : "text-gray-500"
                )}>ON</span>
                <Switch 
                  checked={isToggle1On} 
                  onCheckedChange={handleToggleGrid}
                  className={cn(
                    "mx-1",
                    isToggle1On ? "data-[state=checked]:bg-[#10b981]" : "data-[state=unchecked]:bg-gray-200"
                  )}
                />
                <span className="text-xs w-8 text-center text-gray-500">OFF</span>
              </div>
            </div>

            {/* 치수 타입 라디오 버튼 - 토글이 ON일 때만 표시 */}
            {isToggle1On && (
              <div className="flex items-center gap-2 ml-2">
                <div className="flex space-x-3">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="dimensionType"
                      value="both"
                      checked={showDimensionType === "both"}
                      onChange={() => handleDimensionTypeChange("both")}
                      className="w-3.5 h-3.5 text-emerald-500 accent-emerald-500 mr-1"
                    />
                    <span className="text-xs text-gray-700">모두</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="dimensionType"
                      value="dimensions"
                      checked={showDimensionType === "dimensions"}
                      onChange={() => handleDimensionTypeChange("dimensions")}
                      className="w-3.5 h-3.5 text-emerald-500 accent-emerald-500 mr-1"
                    />
                    <span className="text-xs text-gray-700">치수</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="dimensionType"
                      value="guides"
                      checked={showDimensionType === "guides"}
                      onChange={() => handleDimensionTypeChange("guides")}
                      className="w-3.5 h-3.5 text-emerald-500 accent-emerald-500 mr-1"
                    />
                    <span className="text-xs text-gray-700">가이드</span>
                  </label>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-500" />
              <div className="flex items-center gap-1 w-28">
                <span className={cn(
                  "text-xs w-8 text-center",
                  isToggle2On ? "text-[#10b981]" : "text-gray-500"
                )}>ON</span>
                <Switch 
                  checked={isToggle2On} 
                  onCheckedChange={handleToggleShadows}
                  className={cn(
                    "mx-1",
                    isToggle2On ? "data-[state=checked]:bg-[#10b981]" : "data-[state=unchecked]:bg-gray-200"
                  )}
                />
                <span className="text-xs w-8 text-center text-gray-500">OFF</span>
              </div>
            </div>
          </div>

          {/* 3D/2D 버튼 */}
          <div className="h-9 overflow-hidden rounded-md border border-emerald-500 flex">
            <button
              onClick={() => handleViewModeChange("3D")}
              className={cn(
                "flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors w-16 focus:outline-none",
                viewMode === "3D"
                  ? "bg-emerald-500 text-white"
                  : "bg-white text-emerald-500"
              )}
            >
              3D
            </button>
            <button
              onClick={() => handleViewModeChange("2D")}
              className={cn(
                "flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors w-16 focus:outline-none",
                viewMode === "2D"
                  ? "bg-emerald-500 text-white"
                  : "bg-white text-emerald-500"
              )}
            >
              2D
            </button>
          </div>

          {/* 방향 버튼 */}
          <div className="h-9 overflow-hidden rounded-md border border-emerald-500 flex">
            <button 
              onClick={() => handleDirectionChange("Front")}
              className={cn(
                "flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors w-20 focus:outline-none",
                activeDirection === "Front"
                  ? "bg-emerald-500 text-white"
                  : "bg-white text-emerald-500"
              )}
            >
              정면
            </button>
            <button 
              onClick={() => handleDirectionChange("Top")}
              className={cn(
                "flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors w-20 focus:outline-none",
                activeDirection === "Top"
                  ? "bg-emerald-500 text-white"
                  : "bg-white text-emerald-500"
              )}
            >
              상부
            </button>
            <button 
              onClick={() => handleDirectionChange("Left")}
              className={cn(
                "flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors w-20 focus:outline-none",
                activeDirection === "Left"
                  ? "bg-emerald-500 text-white"
                  : "bg-white text-emerald-500"
              )}
            >
              좌측면
            </button>
            <button 
              onClick={() => handleDirectionChange("Right")}
              className={cn(
                "flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors w-20 focus:outline-none",
                activeDirection === "Right"
                  ? "bg-emerald-500 text-white"
                  : "bg-white text-emerald-500"
              )}
            >
              우측면
            </button>
          </div>
        </div>
      </div>

      {/* 주요 내용 영역 */}
      <div className="flex-1 relative">
        <div className="absolute inset-0">
          {/* 3D 렌더링 영역 */}
          {viewMode === "3D" ? (
            <RoomViewer3D
              options={viewerOptions}
              projectionMode="perspective"
              viewType={getViewType().toLowerCase()}
              showFrame={true}
              showShadows={showShadows}
              showGrid={showGrid}
              spaceInfo={{
                width: defaultDimensions.width,
                height: defaultDimensions.height,
                depth: defaultDimensions.depth,
                spaceType: spaceType || "built-in",
                wallPosition: wallPosition,
                // 단내림(에어컨) 정보 추가
                hasAirConditioner: frameProperties.hasAirConditioner === 'yes',
                acUnit: frameProperties.acUnit && frameProperties.hasAirConditioner === 'yes' ? 
                  { 
                    width: frameProperties.acUnit.width,     // X축 (폭)
                    depth: defaultDimensions.depth, // Z축 (깊이) - 공간 깊이와 동일 (공간의 범주)
                    height: frameProperties.acUnit.height,   // Y축 (높이) - 사용자 입력값
                    position: frameProperties.acUnit.position || 'left',
                    present: true
                  } : 
                  null
              }}
              placementInfo={{
                showDimensionLines: isToggle1On,
                type: spaceType || "built-in",
                wallPosition: wallPosition,
                hasBase: true,
                baseHeight: modulesGap?.bottom?.height || 80,
                baseDepth: 580,
                // 단내림(에어컨) 정보 추가 - 축 정보 명시
                hasAirConditioner: frameProperties.hasAirConditioner === 'yes',
                acUnit: frameProperties.acUnit && frameProperties.hasAirConditioner === 'yes' ? 
                  { 
                    width: frameProperties.acUnit.width,     // X축 (폭)
                    depth: defaultDimensions.depth, // Z축 (깊이) - 공간 깊이와 동일 (공간의 범주)
                    height: frameProperties.acUnit.height,   // Y축 (높이) - 사용자 입력값
                    position: frameProperties.acUnit.position || 'left',
                    present: true
                  } : 
                  null
              }}
              frameColor={frameColor}
              frameThickness={20}
              frameData={getFrameData()}
              step={3}
              wallOpacity={0.75}
              outlineMode={false}
              showModuleSlots={showModuleSlots && (isToggle1On ? (showDimensionType === "both" || showDimensionType === "guides") : true)}
              doorCount={doorCount}
              slotStatuses={slotStatuses}
              onSlotHover={handleSlotHover}
              onSlotClick={handleSlotClick}
              onFrameSizeChange={handleFrameSizeUpdate}
              showDimensionLines={isToggle1On}
              showDimensions={isToggle1On ? (showDimensionType === "both" || showDimensionType === "dimensions") : false}
              showGuides={true}
            />
          ) : (
            <RoomViewer3D
              options={viewerOptions}
              projectionMode="orthographic"
              viewType={getViewType().toLowerCase()}
              showFrame={true}
              showShadows={false}
              showGrid={showGrid}
              spaceInfo={{
                width: defaultDimensions.width,
                height: defaultDimensions.height,
                depth: defaultDimensions.depth,
                spaceType: spaceType || "built-in",
                wallPosition: wallPosition,
                // 단내림(에어컨) 정보 추가
                hasAirConditioner: frameProperties.hasAirConditioner === 'yes',
                acUnit: frameProperties.acUnit && frameProperties.hasAirConditioner === 'yes' ? 
                  { 
                    width: frameProperties.acUnit.width,     // X축 (폭)
                    depth: defaultDimensions.depth, // Z축 (깊이) - 공간 깊이와 동일 (공간의 범주)
                    height: frameProperties.acUnit.height,   // Y축 (높이) - 사용자 입력값
                    position: frameProperties.acUnit.position || 'left',
                    present: true
                  } : 
                  null
              }}
              placementInfo={{
                showDimensionLines: isToggle1On,
                type: spaceType || "built-in",
                wallPosition: wallPosition,
                hasBase: true,
                baseHeight: modulesGap?.bottom?.height || 80,
                baseDepth: 580,
                // 단내림(에어컨) 정보 추가 - 축 정보 명시
                hasAirConditioner: frameProperties.hasAirConditioner === 'yes',
                acUnit: frameProperties.acUnit && frameProperties.hasAirConditioner === 'yes' ? 
                  { 
                    width: frameProperties.acUnit.width,     // X축 (폭)
                    depth: defaultDimensions.depth, // Z축 (깊이) - 공간 깊이와 동일 (공간의 범주)
                    height: frameProperties.acUnit.height,   // Y축 (높이) - 사용자 입력값
                    position: frameProperties.acUnit.position || 'left',
                    present: true
                  } : 
                  null
              }}
              frameColor={frameColor}
              frameThickness={20}
              frameData={getFrameData()}
              step={3}
              wallOpacity={0.75}
              outlineMode={false}
              showModuleSlots={showModuleSlots && (isToggle1On ? (showDimensionType === "both" || showDimensionType === "guides") : true)}
              doorCount={doorCount}
              slotStatuses={slotStatuses}
              onSlotHover={handleSlotHover}
              onSlotClick={handleSlotClick}
              onFrameSizeChange={handleFrameSizeUpdate}
              showDimensionLines={isToggle1On}
              showDimensions={isToggle1On ? (showDimensionType === "both" || showDimensionType === "dimensions") : false}
              showGuides={true}
            />
          )}
        </div>
      </div>
    </div>
  );
};
import React, { useState, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Navbar } from "./Navbar";
import { LeftSidebar } from "./LeftSidebar";
import { RightSidebar } from "./RightSidebar";
import { EditorView } from "./EditorView";
import RoomViewer3D from "../common/RoomViewer3D";
import { EditorProvider, useEditor } from "@context/EditorContext";
import styles from './Editor.module.css';
import { getRandomColor, generateId } from '../../utils/common';
import { showToast } from '../../utils/toast';
import { useNavigate } from 'react-router-dom';
import { getDefaultDesignData } from '../../utils/defaultData';

// Default very light gray frame color (#F8F8F8) - even lighter than Step3
const DEFAULT_FRAME_COLOR = "#F8F8F8";

// 에어컨 단내림 기본값 상수 정의
const DEFAULT_AC_UNIT_WIDTH = 900;  // 단내림 기본 폭 900mm
const DEFAULT_AC_UNIT_HEIGHT = 200; // 단내림 기본 높이 200mm

export const Editor = ({ initialData = null }) => {
  const navigate = useNavigate();
  
  // useEditor 훅 추가
  const editorContext = useEditor();
  
  const [designData, setDesignData] = useState(() => {
    return initialData || getDefaultDesignData();
  });
  
  const [viewMode, setViewMode] = useState("3D");
  const [isToggle1On, setIsToggle1On] = useState(true);
  const [isToggle2On, setIsToggle2On] = useState(false);
  const [spaceType, setSpaceType] = useState("built-in");
  const [wallPosition, setWallPosition] = useState("left");
  
  const [selectedModule, setSelectedModule] = useState(null);
  
  const [dimensions, setDimensions] = useState({
    width: initialData?.spaceInfo?.width || 4800,
    depth: 580,
    height: initialData?.spaceInfo?.height || 2400,
  });
  
  // 기본 도어 개수 설정
  const [doorCount, setDoorCount] = useState(initialData?.doorCount || 8);
  
  const [modulesGap, setModulesGap] = useState({
    doorCount: initialData?.doorCount || 8,
    left: {
      width: initialData?.sizeSettings?.left || 50,
      height: dimensions.height
    },
    right: {
      width: initialData?.sizeSettings?.right || 50,
      height: dimensions.height
    },
    top: {
      width: initialData?.sizeSettings?.top || 50,
      height: 50
    },
    bottom: {
      width: calculateBottomFrameWidth(dimensions.width),
      height: initialData?.baseSettings?.baseHeight || 80
    },
    hasBase: initialData?.baseSettings?.hasBase !== false,
    baseHeight: initialData?.baseSettings?.baseHeight || 80,
    hasAirConditioner: initialData?.data?.spaceInfo?.hasAirConditioner === 'yes',
    acUnit: initialData?.data?.spaceInfo?.acUnit || { position: 'left', width: 900, depth: 200 },
    hasFloorFinish: initialData?.data?.spaceInfo?.hasFloorFinish === 'yes',
    floorThickness: initialData?.data?.spaceInfo?.floorThickness || 20,
    fitOption: initialData?.fitOption || 'normal',
    placementType: initialData?.placementSettings?.type || 'floor',
    raiseHeight: initialData?.placementSettings?.raiseHeight || 30
  });
  
  console.log('Editor: 초기 modulesGap 설정 (특히 단내림):', { 
    hasAirConditioner: modulesGap.hasAirConditioner,
    acUnit: modulesGap.acUnit 
  });
  
  const [frameColor, setFrameColor] = useState(DEFAULT_FRAME_COLOR);
  
  const [sceneData, setSceneData] = useState({
    dimensions: {
      width: dimensions.width,
      depth: dimensions.depth,
      height: dimensions.height,
    },
  });
  
  useEffect(() => {
    if (initialData) {
      setDesignData(initialData);
      console.log('Editor: 디자인 데이터 로드됨:', initialData);
      console.log('Editor: 단내림 설정 확인:', initialData?.data?.spaceInfo?.hasAirConditioner);
      
      if (initialData.data && initialData.data.spaceInfo) {
        const { width, height, depth } = initialData.data.spaceInfo;
        setDimensions({
          width: width || 2120,
          height: height || 2400,
          depth: depth || 550
        });
      } else if (initialData.dimensions) {
        setDimensions({
          width: initialData.dimensions.width,
          height: initialData.dimensions.height,
          depth: initialData.dimensions.depth,
        });
      }
      
      if (initialData.data && initialData.data.sizeSettings) {
        const { left, right, top, bottom } = initialData.data.sizeSettings;
        if (left || right || top || bottom) {
          setModulesGap({
            ...modulesGap,
            left: { ...modulesGap.left, width: left || 50 },
            right: { ...modulesGap.right, width: right || 50 },
            top: { ...modulesGap.top, width: top || 40 },
            bottom: { ...modulesGap.bottom, height: bottom || 60 }
          });
        }
      }
      
      if (initialData.data && initialData.data.spaceInfo) {
        setSpaceType(initialData.data.spaceInfo.spaceType || "built-in");
        setWallPosition(initialData.data.spaceInfo.wallPosition || "left");
        
        // 단내림 정보 업데이트
        const hasAC = initialData.data.spaceInfo.hasAirConditioner === 'yes';
        console.log('Editor: 단내림 업데이트:', hasAC);
        
        setModulesGap(prev => ({
          ...prev,
          hasAirConditioner: hasAC,
          acUnit: initialData.data.spaceInfo.acUnit || prev.acUnit
        }));
      }
      
      if (initialData.data && initialData.data.frameSettings && initialData.data.frameSettings.color) {
        setFrameColor(initialData.data.frameSettings.color);
      } else if (initialData.data && initialData.data.frameColor) {
        setFrameColor(initialData.data.frameColor);
      } else {
        setFrameColor(DEFAULT_FRAME_COLOR);
      }
    }
  }, [initialData]);
  
  useEffect(() => {
    setSceneData({
      ...sceneData,
      dimensions: {
        width: dimensions.width,
        depth: dimensions.depth,
        height: dimensions.height,
      },
    });
  }, [dimensions]);
  
  const updateDesignData = () => {
    const updatedData = {
      id: designData?.id || generateId(),
      title: designData?.title || "New Design",
      category: designData?.category || "옷장",
      createdAt: designData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      data: {
        ...(designData?.data || {}),
        spaceType,
        wallPosition,
        dimensions,
        modulesGap,
        frameColor,
        frameSettings: {
          ...(designData?.data?.frameSettings || {}),
          color: frameColor
        },
        baseSettings: {
          ...(designData?.data?.baseSettings || {}),
          spaceType,
          wallPosition,
          dimensions,
          modulesGap,
          frameColor,
        },
        doorCount
      },
    };
    
    setDesignData(updatedData);
    return updatedData;
  };
  
  const handleFrameColorChange = (color) => {
    console.log(`[Editor] Frame color changing to: ${color}, Current spaceType: ${spaceType}`);
    
    setFrameColor(color);
    
    const updatedData = designData ? { ...designData } : { data: {} };
    if (!updatedData.data) updatedData.data = {};
    
    // 프레임 색상 변경만 하고 다른 속성은 그대로 유지
    updatedData.data.frameColor = color;
    
    // 프레임 설정 업데이트
    if (!updatedData.data.frameSettings) {
      updatedData.data.frameSettings = { color };
    } else {
      updatedData.data.frameSettings = { 
        ...updatedData.data.frameSettings, 
        color 
      };
    }
    
    // 베이스 설정 업데이트
    if (!updatedData.data.baseSettings) {
      updatedData.data.baseSettings = { frameColor: color };
    } else {
      updatedData.data.baseSettings = {
        ...updatedData.data.baseSettings,
        frameColor: color
      };
    }
    
    // 패널 설정 업데이트
    if (!updatedData.data.panelSettings) {
      updatedData.data.panelSettings = { color };
    } else {
      updatedData.data.panelSettings = {
        ...updatedData.data.panelSettings,
        color
      };
    }
    
    // 엔드 패널 설정 업데이트
    if (!updatedData.data.endPanelSettings) {
      updatedData.data.endPanelSettings = { color };
    } else {
      updatedData.data.endPanelSettings = {
        ...updatedData.data.endPanelSettings,
        color
      };
    }
    
    // 사이드 패널 설정 업데이트
    if (!updatedData.data.sidePanel) {
      updatedData.data.sidePanel = { color };
    } else {
      updatedData.data.sidePanel = {
        ...updatedData.data.sidePanel,
        color
      };
    }
    
    console.log('[Editor] 모든 패널 색상 업데이트 완료:', color);
    
    // 단내림 설정과 기타 속성은 그대로 유지 (spaceInfo 객체 보존)
    if (updatedData.data.spaceInfo) {
      updatedData.data.spaceInfo = {
        ...updatedData.data.spaceInfo,
        // 단내림 정보 명시적으로 보존
        hasAirConditioner: updatedData.data.spaceInfo.hasAirConditioner,
        acUnit: updatedData.data.spaceInfo.acUnit
      };
    }
    
    // 중요: modulesGap 상태가 변경되지 않도록 방지 (기존 단내림 설정 보존)
    console.log('[Editor] 색상 변경 전 단내림 상태:', modulesGap.hasAirConditioner, modulesGap.acUnit);
    
    // modulesGap 객체를 보존하면서 필요한 경우 designData로부터 업데이트
    const currentSpaceInfo = updatedData.data.spaceInfo || {};
    setModulesGap(prev => ({
      ...prev,
      hasAirConditioner: currentSpaceInfo.hasAirConditioner === 'yes' ? true : prev.hasAirConditioner,
      acUnit: currentSpaceInfo.acUnit ? { ...currentSpaceInfo.acUnit } : prev.acUnit
    }));
    
    setDesignData(updatedData);
    console.log('[Editor] 프레임 색상 업데이트 완료 (단내림 설정 유지):', color);
  };
  
  const handleDimensionChange = (dimension, value) => {
    setDimensions(prev => ({
      ...prev,
      [dimension]: value,
    }));
  };

  const handleModuleGapChange = (side, value) => {
    console.log(`[Editor] handleModuleGapChange: ${side} = `, value);
    setModulesGap(prev => ({
      ...prev,
      [side]: value,
    }));
    
    // 모듈 갭이 변경될 때마다 업데이트된 디자인 데이터도 반영
    const updatedData = {
      ...designData,
      data: {
        ...(designData?.data || {}),
        modulesGap: {
          ...(designData?.data?.modulesGap || {}),
          [side]: value
        }
      }
    };
    setDesignData(updatedData);
  };
  
  // 특별 속성 변경 처리 함수 (에어컨 단내림, 바닥 마감 등)
  const handleSpecialPropertyChange = (property, value, options = {}) => {
    console.log('[Editor] 특별 속성 변경 요청:', property, value, options);
    // 내부 플래그 설정 (중복 업데이트 방지)
    isInternalUpdate.current = true;
    
    const isAcUnit = property === 'acUnit';
    
    // 유효성 검사 플래그
    // acUnit의 경우 사용자 직접 요청 여부 확인 (더 많은 플래그 검사)
    const isPositionLocked = isAcUnit && value && (
      value._positionLocked === true || 
      options.preservePosition === true ||
      options.lockPosition === true
    );
    
    const isForceCorrection = isAcUnit && value && (
      value._forceCorrection === true || 
      options.forceCorrection === true
    );
    
    const isHardOverride = isAcUnit && value && value._hardOverride === true;
    const currentPosition = isAcUnit && value ? value.position : (prevAcUnit?.position || 'left');
    
    // 단내림 속성 상태 초기화
    // 이전 단내림 속성을 변수에 저장 (null 검사 추가)
    const prevAcUnit = modulesGap?.acUnit;
    
    // 단내림 존재 상태 변경 시
    if (property === 'hasAirConditioner') {
      console.log('[Editor] 단내림 상태 변경 요청:', value, '현재 설정:', modulesGap?.hasAirConditioner);
      
      // 토글 값이 "yes"인 경우, 즉시 기본 위치로 단내림 표시
      if (value === 'yes') {
        // 이전 acUnit 값이 있으면 그대로 사용, 없으면 기본값 생성
        const defaultAcUnit = {
          width: DEFAULT_AC_UNIT_WIDTH,   // 기본 폭: 900mm
          depth: dimensions?.depth || 600,   // 기본 깊이(Z축): 공간 깊이와 동일
          height: DEFAULT_AC_UNIT_HEIGHT,   // 기본 높이(Y축): 200mm
          position: 'left', // 기본 위치: 좌측
          present: true,
          _userAction: true,
          _timestamp: Date.now()
        };
        
        // 이전 설정 복원 또는 기본값 사용
        const acUnitToUse = prevAcUnit ? { ...prevAcUnit, present: true } : defaultAcUnit;
        
        // 상태 업데이트
        setModulesGap(prev => ({
          ...prev,
          hasAirConditioner: value,
          acUnit: acUnitToUse
        }));
        
        // 에디터 뷰에서도 실시간 업데이트
        if (editorContext) {
          editorContext.updateFrameProperty('hasAirConditioner', value);
          editorContext.updateFrameProperty('acUnit', acUnitToUse);
        }
      } else {
        // 에어컨 단내림 없음 설정 - 이전 설정은 유지하지만 present 값을 false로 변경
        const updatedAcUnit = prevAcUnit ? { ...prevAcUnit, present: false } : null;
        
        // 상태 업데이트
        setModulesGap(prev => ({
          ...prev,
          hasAirConditioner: value,
          acUnit: updatedAcUnit
        }));
        
        // 에디터 뷰에서도 실시간 업데이트
        if (editorContext) {
          editorContext.updateFrameProperty('hasAirConditioner', value);
          if (updatedAcUnit) {
            editorContext.updateFrameProperty('acUnit', updatedAcUnit);
          }
        }
      }
      
      // 반드시 상태 업데이트 후 설계 데이터 갱신
      setTimeout(() => {
        updateDesignData();
        isInternalUpdate.current = false;
      }, 100);
      
      return;
    }
    
    // 단내림 속성 변경 시
    if (isAcUnit) {
      console.log('[Editor] 단내림 속성 변경:', value);
      
      // 새 디자인 데이터 생성
      const updatedDesignData = { ...designData };
      
      // 단내림 객체 변경 - 필수 존재 확인
      if (!updatedDesignData.spaceInfo) {
        updatedDesignData.spaceInfo = {};
      }
      
      // 특수 플래그 확인
      // 1. 위치 고정 (position 변경 없이 다른 값만 변경)
      if (isPositionLocked) {
        console.log('[Editor] 단내림 위치 고정 모드 - 현재 위치 유지:', currentPosition);
        
        updatedDesignData.spaceInfo.acUnit = {
          ...value,
          position: currentPosition,
          depth: dimensions?.depth || 600, // Z축 (깊이) - 공간의 깊이와 동일
          height: value?.height || DEFAULT_AC_UNIT_HEIGHT // Y축 (높이) - 사용자 설정값 또는 기본값 200
        };
      }
      // 2. 하드 오버라이드 (모든 속성을 제공된 값으로 그대로 대체)
      else if (isHardOverride) {
        console.log('[Editor] 단내림 속성 하드 오버라이드');
        
        updatedDesignData.spaceInfo.acUnit = { ...value };
      }
      // 3. 일반 업데이트 (값 그대로 사용)
      else {
        updatedDesignData.spaceInfo.acUnit = {
          ...value,
          depth: dimensions?.depth || 600, // Z축 (깊이) - 공간의 깊이와 동일
          // 사용자 설정 height 그대로 유지 - 명시적으로 유지 설정
          height: value?.height || (prevAcUnit?.height || DEFAULT_AC_UNIT_HEIGHT) // 사용자 설정값 또는 이전값, 없으면 기본값 200
        };
      }
      
      // 단내림 존재 여부 업데이트
      updatedDesignData.spaceInfo.hasAirConditioner = 'yes';
      
      // 디자인 데이터 갱신
      setDesignData(updatedDesignData);
      
      // 모듈 간격 상태 업데이트
      setModulesGap(prev => ({
        ...prev,
        hasAirConditioner: 'yes', // 단내림 존재 상태 설정
        acUnit: updatedDesignData.spaceInfo.acUnit // 단내림 객체 업데이트
      }));
      
      // 에디터 뷰 업데이트 (EditorContext)
      if (editorContext) {
        // 단내림 존재 유무 명시적 업데이트
        editorContext.updateFrameProperty('hasAirConditioner', 'yes');
        
        // acUnit 객체가 이미 EditorContext에 있을 경우, 기존 속성 유지하고 변경값만 업데이트
        if (editorContext.frameProperties?.acUnit) {
          updateFrameProperty('acUnit', {
            ...value,
            depth: dimensions?.depth || 600, // Z축 (깊이) - 공간의 깊이와 동일
            // 사용자 설정 height 그대로 유지 - 명시적으로 유지 설정
            height: value?.height || (prevAcUnit?.height || DEFAULT_AC_UNIT_HEIGHT) // 사용자 설정값 또는 이전값, 없으면 기본값 200
          });
        } else {
          updateFrameProperty('acUnit', {
            ...value,
            depth: dimensions?.depth || 600, // Z축 (깊이) - 공간의 깊이와 동일
            // 사용자 설정 height 그대로 유지 - 명시적으로 유지 설정
            height: value?.height || (prevAcUnit?.height || DEFAULT_AC_UNIT_HEIGHT) // 사용자 설정값 또는 이전값, 없으면 기본값 200
          });
        }
      }
      
      // 반드시 상태 업데이트 후 설계 데이터 갱신
      setTimeout(() => {
        updateDesignData();
        isInternalUpdate.current = false;
      }, 100);
      
      return;
    }
    
    console.log('[Editor] 특수 속성 변경 완료:', property);
  };
  
  const handleSpaceTypeChange = (type) => {
    console.log(`[Editor] Space type changing to: ${type}`);
    setSpaceType(type);
    
    const updatedData = designData ? { ...designData } : { data: {} };
    if (!updatedData.data) updatedData.data = {};
    
    if (!updatedData.data.spaceInfo) {
      updatedData.data.spaceInfo = { spaceType, wallPosition };
    } else {
      updatedData.data.spaceInfo.spaceType = type;
    }
    
    if (updatedData.data.baseSettings) {
      updatedData.data.baseSettings.spaceType = type;
    } else {
      updatedData.data.baseSettings = { spaceType: type };
    }
    
    if (type === 'standing') {
      setWallPosition(null);
    } else if (type === 'semi-standing' && !wallPosition) {
      setWallPosition('left');
    }
    
    let leftWidth, rightWidth;
    
    if (type === 'semi-standing') {
      if (wallPosition === 'left') {
        leftWidth = 50;
        rightWidth = 20;
      } else {
        leftWidth = 20;
        rightWidth = 50;
      }
    } else if (type === 'standing') {
      leftWidth = 20;
      rightWidth = 20;
    } else {
      leftWidth = 50;
      rightWidth = 50;
    }
    
    setModulesGap(prev => ({
      ...prev,
      left: { ...prev.left, width: leftWidth },
      right: { ...prev.right, width: rightWidth }
    }));
    
    setDesignData(updatedData);
  };
  
  const handleWallPositionChange = (position) => {
    console.log(`[Editor] Wall position changing to: ${position}`);
    setWallPosition(position);
    
    const updatedData = designData ? { ...designData } : { data: {} };
    if (!updatedData.data) updatedData.data = {};
    
    if (!updatedData.data.spaceInfo) {
      updatedData.data.spaceInfo = { spaceType, wallPosition: position };
    } else {
      updatedData.data.spaceInfo.wallPosition = position;
    }
    
    if (updatedData.data.baseSettings) {
      updatedData.data.baseSettings.wallPosition = position;
    } else {
      updatedData.data.baseSettings = { wallPosition: position };
    }
    
    if (spaceType === 'semi-standing') {
      let leftWidth, rightWidth;
      
      if (position === 'left') {
        leftWidth = 50;
        rightWidth = 20;
      } else {
        leftWidth = 20;
        rightWidth = 50;
      }
      
      setModulesGap(prev => ({
        ...prev,
        left: { ...prev.left, width: leftWidth },
        right: { ...prev.right, width: rightWidth }
      }));
    }
    
    setDesignData(updatedData);
  };
  
  const handleSave = () => {
    try {
      const updatedData = updateDesignData();
      
      console.log('디자인 저장:', updatedData);
      
      showToast('디자인이 저장되었습니다.');
    } catch (error) {
      console.error('디자인 저장 실패:', error);
      showToast('디자인 저장에 실패했습니다.', 'error');
    }
  };

  const initialDesignData = {
    data: {
      spaceInfo: {
        width: dimensions.width,
        height: dimensions.height,
        depth: dimensions.depth,
        spaceType: spaceType
      },
      doorCount: doorCount
    }
  };

  const handleModuleSelect = (moduleInfo) => {
    console.log("선택된 모듈 정보:", moduleInfo);
    setSelectedModule(moduleInfo);
  };

  function calculateBottomFrameWidth(width) {
    return width - 100;
  }

  // 단내림 관련 상태 변경 감지 및 로깅
  useEffect(() => {
    console.log('[Editor] 단내림 상태 변경 감지 - 위치:', modulesGap?.acUnit?.position);
    
    // 단내림 위치에 따른 추가 처리 (필요한 경우)
    if (modulesGap?.hasAirConditioner && modulesGap?.acUnit) {
      console.log('[Editor] 현재 단내림 전체 정보:', {
        hasAirConditioner: modulesGap.hasAirConditioner,
        position: modulesGap.acUnit.position,
        width: modulesGap.acUnit.width,
        height: modulesGap.acUnit.height,
        depth: modulesGap.acUnit.depth
      });
    }
  }, [modulesGap?.hasAirConditioner, modulesGap?.acUnit?.position]);
  
  // 에디터 뷰로 전달 시 추가 로그
  useEffect(() => {
    if (modulesGap?.acUnit?.position) {
      console.log(`[Editor] EditorView로 전달될 단내림 위치: ${modulesGap.acUnit.position}`);
    }
  }, [modulesGap?.acUnit?.position]);

  // updateFrameProperty 함수 정의
  const updateFrameProperty = (property, value) => {
    console.log(`[Editor] 프레임 속성 업데이트: ${property} = `, value);
    
    if (editorContext && editorContext.updateFrameProperty) {
      // EditorContext에 있는 함수 사용
      editorContext.updateFrameProperty(property, value);
    } else {
      // EditorContext가 없거나 함수가 없는 경우 자체적으로 처리
      if (property === 'acUnit') {
        setModulesGap(prev => ({
          ...prev,
          acUnit: {
            ...prev.acUnit,
            ...value
          }
        }));
      } else if (property === 'hasAirConditioner') {
        setModulesGap(prev => ({
          ...prev,
          hasAirConditioner: value === 'yes'
        }));
      }
      
      console.log(`[Editor] 로컬 상태 업데이트: ${property}`);
    }
  };

  return (
    <EditorProvider initialDesignData={initialDesignData}>
      <div className={styles.editorContainer}>
        <Navbar 
          title={designData.title || "새 디자인"} 
          onSave={handleSave} 
        />
        <div className={styles.editorContent}>
          <LeftSidebar 
            frameColor={frameColor}
            handleFrameColorChange={handleFrameColorChange}
            onModuleSelect={handleModuleSelect}
          />
          <EditorView 
            viewMode={viewMode} 
            setViewMode={setViewMode} 
            isToggle1On={isToggle1On}
            setIsToggle1On={setIsToggle1On}
            isToggle2On={isToggle2On}
            setIsToggle2On={setIsToggle2On}
            designData={designData}
            dimensions={dimensions}
            spaceType={spaceType}
            wallPosition={wallPosition}
            frameColor={frameColor}
            modulesGap={modulesGap}
            handleModuleGapChange={handleModuleGapChange}
            handleFrameColorChange={handleFrameColorChange}
          />
          {/* 개발용 로그: 단내림 정보가 제대로 전달되고 있는지 확인 */}
          {console.log('단내림 현재 상태 (EditorView로 전달):', modulesGap.hasAirConditioner, modulesGap.acUnit)}
          <RightSidebar 
            dimensions={dimensions}
            handleDimensionChange={handleDimensionChange}
            modulesGap={modulesGap}
            handleModuleGapChange={handleModuleGapChange}
            handleSpecialPropertyChange={handleSpecialPropertyChange}
            spaceType={spaceType}
            handleSpaceTypeChange={handleSpaceTypeChange}
            wallPosition={wallPosition}
            handleWallPositionChange={handleWallPositionChange}
          />
        </div>
      </div>
    </EditorProvider>
  );
};
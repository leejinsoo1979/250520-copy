import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

// 에디터 컨텍스트 생성
const EditorContext = createContext();

// useEditor 훅 정의
export function useEditor() {
  const context = useContext(EditorContext);
  if (context === undefined) {
    console.warn('useEditor must be used within a EditorProvider');
    return null;
  }
  return context;
}

// 에디터 컨텍스트 제공자 컴포넌트
export function EditorProvider({ children, initialDesignData }) {
  console.log('=== EditorProvider 컴포넌트 마운트 ===');
  console.log('initialDesignData 수신:', initialDesignData);
  
  // 선택된 카테고리 상태
  const [selectedCategory, setSelectedCategory] = useState('tall'); // 'tall', 'base', 'panel'
  
  // 선택된 도구 상태
  const [selectedTool, setSelectedTool] = useState('selection'); // 'selection', 'move', 'resize', 'rotate'
  
  // 선택된 요소 상태
  const [selectedElement, setSelectedElement] = useState(null);
  
  // 뷰 모드 상태
  const [viewMode, setViewMode] = useState('3D'); // '3D' 또는 '2D'
  
  // 카메라 뷰 상태
  const [cameraView, setCameraView] = useState('Front'); // 'Front', 'Top', 'Left', 'Right'
  
  // 그리드 표시 상태
  const [showGrid, setShowGrid] = useState(true);
  
  // 그림자 표시 상태 (비활성화 상태로 시작)
  const [showShadows, setShowShadows] = useState(false);
  
  // 도어 개수 상태 추가
  const [doorCount, setDoorCount] = useState(8);
  
  // 선택된 모듈 상태 추가
  const [selectedModule, setSelectedModule] = useState(null);
  
  // 단내림 좌/우 영역 상태 추가
  const [activeLayoutArea, setActiveLayoutArea] = useState("left");
  
  // 뷰어 레퍼런스
  const viewer3DRef = useRef(null);
  const viewer2DRef = useRef(null);
  
  // 공간 치수 상태
  const [roomDimensions, setRoomDimensions] = useState({
    width: 4800,   // mm 단위
    height: 2400,  // mm 단위
    depth: 1500    // mm 단위
  });
  
  // 설치 유형 상태
  const [installationType, setInstallationType] = useState('built-in'); // 'built-in', 'free-standing', 'semi-standing'
  
  // 벽 위치 상태 (semi-standing에서만 사용)
  const [wallPosition, setWallPosition] = useState('left'); // 'left', 'right'
  
  // 프레임 속성 상태
  const [frameProperties, setFrameProperties] = useState({
    leftFrameWidth: 50,     // mm 단위
    rightFrameWidth: 50,    // mm 단위  
    topFrameHeight: 50,     // mm 단위
    frameThickness: 20,     // mm 단위
    baseHeight: 80,        // 받침대 높이 (mm 단위)
    baseDepth: 580,         // 받침대 깊이 - 뒷벽에서 앞으로 580mm 돌출 (mm 단위)
    endPanelThickness: 20,  // 엔드 패널 두께 (mm 단위)
    focusedFrame: null,     // 현재 포커스된 프레임 (강조 표시용)
    // 에어컨 단내림 정보
    hasAirConditioner: 'no', // 에어컨 단내림 유무 ('yes' 또는 'no'), 기본값 'no'로 변경
    acUnit: {
      position: 'left',     // 에어컨 위치 ('left' 또는 'right')
      width: 900,           // 에어컨 폭 (mm 단위) - 900mm로 수정
      height: 200,          // 에어컨 높이 - 기본값 200mm로 변경
      danHeight: 200,       // 단내림 높이 - 기본값 200mm, y축 아래 방향으로만 조절 가능
      minHeight: 50,       // 최소 높이 50mm
      maxHeight: roomDimensions.height,      // 최대 높이 - 설정된 공간 높이와 동기화
      present: true         // 에어컨 존재 여부
    },
    // 단내림 좌/우 영역 도어 개수
    leftDoorCount: 4,       // 단내림이 있을 때 좌측 영역 도어 개수
    rightDoorCount: 4,      // 단내림이 있을 때 우측 영역 도어 개수
    
    // 바닥 마감재 정보
    hasFloorFinish: 'no',  // 바닥 마감재 유무 ('yes' 또는 'no'), 기본값 'no'로 변경
    floorThickness: 20,      // 바닥 마감재 두께 (mm 단위)
    
    // 받침대 정보
    hasBase: 'yes',         // 받침대 유무 ('yes' 또는 'no'), 기본값 'yes'
    raiseHeight: 0,         // 받침대 없을 때 배치 높이 (mm 단위)
    
    // 프레임 모드 정보 추가
    frameMode: 'surround',  // 프레임 모드 ('surround' 또는 'nosurround'), 기본값 'surround'
    edgeThickness: '2mm'    // 노서라운드 모드에서의 엣지 두께 ('2mm' 또는 '3mm'), 기본값 '2mm'
  });
  
  // 카메라 뷰 변경 추적
  useEffect(() => {
    console.log('[EditorContext] 카메라 뷰 변경:', cameraView);
    
    // 뷰가 변경되어도 단내림 설정을 초기화하지 않음
    // 단순히 뷰어만 업데이트
    updateViewers();
    
  }, [cameraView]);
  
  // 공간 치수 업데이트 함수
  const updateRoomDimensions = (dimension, value) => {
    const numValue = Number(value);
    
    // 값이 숫자이고 0보다 큰지 확인
    if (!isNaN(numValue) && numValue > 0) {
      // 이전 상태를 기반으로 새 상태 설정
      setRoomDimensions(prev => {
        const updated = { ...prev, [dimension]: numValue };
        
        // 공간 치수 변경 시 프레임 속성도 비율에 맞게 업데이트
        // (이전 치수에 대한 비율을 유지하면서)
        const ratioMap = {
          width: dimension === 'width' ? numValue / prev.width : 1,
          height: dimension === 'height' ? numValue / prev.height : 1,
          depth: dimension === 'depth' ? numValue / prev.depth : 1
        };
        
        // 프레임 속성 비율 업데이트
        setFrameProperties(prevFrame => {
          // 좌측 프레임 폭은 전체 너비의 비율 유지
          const leftFrameWidth = Math.round(prevFrame.leftFrameWidth * ratioMap.width);
          
          // 우측 프레임 폭은 전체 너비의 비율 유지
          const rightFrameWidth = Math.round(prevFrame.rightFrameWidth * ratioMap.width);
          
          // 상부 프레임 높이는 전체 높이의 비율 유지
          const topFrameHeight = Math.round(prevFrame.topFrameHeight * ratioMap.height);
          
          // 프레임 두께는 전체 깊이의 비율 유지
          const frameThickness = Math.round(prevFrame.frameThickness * ratioMap.depth);
          
          // 받침대 깊이는 전체 깊이의 비율 유지
          const baseDepth = Math.round(prevFrame.baseDepth * ratioMap.depth);
          
          // 엔드 패널 두께는 전체 너비의 비율 유지
          const endPanelThickness = Math.round(prevFrame.endPanelThickness * ratioMap.width);
          
          return {
            ...prevFrame,
            leftFrameWidth,
            rightFrameWidth,
            topFrameHeight,
            frameThickness,
            baseDepth,
            endPanelThickness
          };
        });
        
        return updated;
      });
    }
  };
  
  // 프레임 속성 업데이트 함수
  const updateFrameProperty = (property, value) => {
    // 단내림 속성 업데이트 로깅 강화
    if (property === 'hasAirConditioner') {
      console.log('[EditorContext] 단내림 상태 업데이트 직전:', { 현재: frameProperties.hasAirConditioner, 변경값: value });
    } else if (property === 'acUnit') {
      console.log('[EditorContext] 단내림 설정 업데이트 직전:', { 현재: frameProperties.acUnit, 변경값: value });
    }
    
    // acUnit 객체를 직접 업데이트하는 경우
    if (property === 'acUnit' && typeof value === 'object') {
      console.log('[EditorContext] acUnit 객체 업데이트:', value);
      setFrameProperties(prev => ({
        ...prev,
        acUnit: {
          ...prev.acUnit,
          ...value
        },
        focusedFrame: 'acUnit'
      }));
      
      // 프레임 속성 변경 즉시 뷰어 업데이트
      updateViewers();
      return;
    }
    
    // 문자열 값을 처리해야 하는 속성들
    const stringProperties = ['hasAirConditioner', 'hasFloorFinish', 'hasBase', 'frameMode', 'edgeThickness'];
    const numValue = stringProperties.includes(property) ? value : Number(value);
    
    // 값 유효성 확인 (문자열 속성은 문자열 그대로 사용, 숫자 속성은 숫자 확인)
    if (stringProperties.includes(property) || (!isNaN(numValue) && numValue >= 0)) {
      console.log(`[EditorContext] 프레임 속성 업데이트: ${property} = ${value}`);
      
      // 프레임 속성 업데이트
      setFrameProperties(prev => ({
        ...prev,
        [property]: stringProperties.includes(property) ? value : numValue,
        // 속성 변경 시 포커스 설정 (강조 표시용)
        focusedFrame: property
      }));
      
      // 단내림 상태가 변경된 경우 특별 처리
      if (property === 'hasAirConditioner') {
        // 단내림 상태 변경 후 즉시 확인 로그
        setTimeout(() => {
          console.log('[EditorContext] 단내림 상태 변경 후:', frameProperties.hasAirConditioner, '→', value);
        }, 0);
      }
      
      // 프레임 모드 변경 시 특별 처리
      if (property === 'frameMode') {
        console.log(`[EditorContext] 프레임 모드 변경: ${value}`);
      }
      
      // 엣지 두께 변경 시 특별 처리
      if (property === 'edgeThickness') {
        console.log(`[EditorContext] 엣지 두께 변경: ${value}`);
      }
      
      // 프레임 속성 변경 즉시 뷰어 업데이트
      updateViewers();
    }
  };
  
  // 받침대 폭 계산 함수 (설치 유형과 벽 위치에 따라 다름)
  const calculateBaseWidth = () => {
    const { width } = roomDimensions;
    const { leftFrameWidth, rightFrameWidth, endPanelThickness } = frameProperties;
    
    console.log('[EditorContext] 받침대 폭 계산 - 입력값:', {
      설치유형: installationType,
      벽위치: wallPosition,
      공간너비: width,
      좌측프레임너비: leftFrameWidth,
      우측프레임너비: rightFrameWidth,
      엔드패널두께: endPanelThickness
    });
    
    let baseWidth = 0;
    
    if (installationType === 'built-in') {
      // 빌트인 타입: 전체 폭에서 좌우 프레임 폭을 뺀 값
      baseWidth = width - leftFrameWidth - rightFrameWidth;
    } else if (installationType === 'free-standing') {
      // 프리스탠딩 타입: 전체 폭에서 좌우 엔드패널 두께를 뺀 값
      baseWidth = width - (endPanelThickness * 2);
    } else if (installationType === 'semi-standing') {
      // 세미스탠딩 타입: 벽 위치에 따라 다름
      if (wallPosition === 'left') {
        // 좌측 벽: 전체 폭에서 좌측 프레임 폭과 우측 엔드패널 두께를 뺀 값
        baseWidth = width - leftFrameWidth - endPanelThickness;
      } else { // 'right'
        // 우측 벽: 전체 폭에서 우측 프레임 폭과 좌측 엔드패널 두께를 뺀 값
        baseWidth = width - rightFrameWidth - endPanelThickness;
      }
    }
    
    console.log('[EditorContext] 받침대 폭 계산 결과:', baseWidth, 'mm');
    
    return baseWidth;
  };
  
  // 뷰어 업데이트 함수
  const updateViewers = () => {
    if (viewer3DRef.current) {
      viewer3DRef.current.updateScene();
    }
    if (viewer2DRef.current) {
      viewer2DRef.current.updateScene();
    }
  };
  
  // 설치 유형이나 벽 위치가 변경될 때마다 뷰어 업데이트
  useEffect(() => {
    updateViewers();
    console.log('[EditorContext] 설치 유형 또는 벽 위치 변경:', installationType, wallPosition);
    console.log('[EditorContext] 현재 받침대 폭:', calculateBaseWidth(), 'mm');
  }, [installationType, wallPosition]);
  
  // 프레임 속성이 변경될 때마다 뷰어 업데이트
  useEffect(() => {
    updateViewers();
    console.log('[EditorContext] 프레임 속성 변경:', frameProperties);
    console.log('[EditorContext] 현재 받침대 폭:', calculateBaseWidth(), 'mm');
  }, [frameProperties]);
  
  // 초기 디자인 데이터 로드
  useEffect(() => {
    if (initialDesignData && initialDesignData.data) {
      console.log('초기 디자인 데이터 로드:', initialDesignData);
      
      const { data } = initialDesignData;
      
      // 공간 정보 설정
      if (data.spaceInfo) {
        // 공간 치수 설정
        if (data.spaceInfo.width && data.spaceInfo.height && data.spaceInfo.depth) {
          setRoomDimensions({
            width: data.spaceInfo.width,
            height: data.spaceInfo.height,
            depth: data.spaceInfo.depth || 1500 // 기본값 1500mm
          });
        }
        
        // 설치 유형 설정
        if (data.spaceInfo.spaceType) {
          setInstallationType(data.spaceInfo.spaceType);
        }
        
        // 벽 위치 설정
        if (data.spaceInfo.wallPosition) {
          setWallPosition(data.spaceInfo.wallPosition);
        }
        
        // 도어 개수 설정
        if (data.spaceInfo.doorCount) {
          setDoorCount(data.spaceInfo.doorCount);
        }
      }
      
      // 단내림 상태 확인 및 로그 출력
      const hasAC = data.spaceInfo?.hasAirConditioner === 'yes' ? 'yes' : 'no';
      console.log('[EditorContext] 단내림 상태 로드:', hasAC);
      if (hasAC === 'yes' && data.spaceInfo?.acUnit) {
        console.log('[EditorContext] 단내림 설정 로드:', data.spaceInfo.acUnit);
      }
      
      // 프레임 속성 설정 (병합하여 처리)
      const newFrameProperties = {
        ...frameProperties, // 기본값 유지
        
        // 공간 정보 관련 설정
        hasAirConditioner: hasAC,
        hasFloorFinish: data.spaceInfo?.hasFloorFinish === 'yes' ? 'yes' : 'no',
        floorThickness: parseInt(data.spaceInfo?.floorThickness || frameProperties.floorThickness, 10),
        
        // 받침대 관련 설정
        hasBase: data.spaceInfo?.hasBase === 'yes' ? 'yes' : 'no',
        baseHeight: parseInt(data.spaceInfo?.baseHeight || frameProperties.baseHeight, 10),
        baseDepth: parseInt(data.spaceInfo?.baseDepth || frameProperties.baseDepth, 10),
        
        // 프레임 모드 정보
        frameMode: data.frameSettings?.frameMode || frameProperties.frameMode,
        edgeThickness: data.frameSettings?.edgeThickness || frameProperties.edgeThickness,
        
        // 프레임 크기 설정
        leftFrameWidth: parseInt(data.sizeSettings?.left || frameProperties.leftFrameWidth, 10),
        rightFrameWidth: parseInt(data.sizeSettings?.right || frameProperties.rightFrameWidth, 10),
        topFrameHeight: parseInt(data.sizeSettings?.top || frameProperties.topFrameHeight, 10),
        
        // 단내림 설정 - 스텝2,3에서 설정한 값을 우선 적용
        acUnit: {
          ...frameProperties.acUnit, // 기본값 유지 (present, minHeight, maxHeight 등)
          position: data.spaceInfo?.acUnit?.position || 'left', // 기본값 'left'
          width: data.spaceInfo?.acUnit?.width || 900, // 기본값 900mm
          height: data.spaceInfo?.acUnit?.height || 200, // 기본값 200mm
          danHeight: data.spaceInfo?.acUnit?.danHeight || 200, // 기본값 200mm
          present: hasAC === 'yes' // 단내림 유무에 따라 설정
        }
      };
      
      console.log('[EditorContext] 업데이트된 프레임 속성:', newFrameProperties);
      
      // 프레임 속성 업데이트
      setFrameProperties(newFrameProperties);
    }
  }, [initialDesignData]);
  
  // 모든 컨텍스트 값 정의
  const value = {
    // 기본 에디터 상태
    selectedCategory,
    setSelectedCategory,
    selectedTool,
    setSelectedTool,
    selectedElement,
    setSelectedElement,
    viewMode,
    setViewMode,
    cameraView,
    setCameraView,
    showGrid,
    setShowGrid,
    showShadows,
    setShowShadows,
    
    // 공간 및 설치 관련
    roomDimensions,
    updateRoomDimensions,
    installationType,
    setInstallationType,
    wallPosition,
    setWallPosition,
    
    // 프레임 및 설정 관련
    frameProperties,
    updateFrameProperty,
    calculateBaseWidth,
    
    // 도어 관련
    doorCount,
    setDoorCount,
    
    // 모듈 관련
    selectedModule,
    setSelectedModule,
    
    // 뷰어 레퍼런스 및 업데이트
    viewer3DRef,
    viewer2DRef,
    updateViewers,
    
    // 단내림 좌/우 영역 관련
    activeLayoutArea,
    setActiveLayoutArea
  };
  
  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
}

// 프로퍼티 타입 검증
EditorProvider.propTypes = {
  children: PropTypes.node.isRequired,
  initialDesignData: PropTypes.object
}; 
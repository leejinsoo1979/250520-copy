import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import styles from './Step2Content.module.css';
import commonStyles from './common.module.css';
import RoomViewer3D from '../common/RoomViewer3D';
import StepViewTwoDViewer from '../StepViewTwoDViewer';
import { FiCheck } from 'react-icons/fi';
import ViewerContainer from '../ViewerContainer';

// 애니메이션 키프레임 스타일 정의
const animationStyle = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const Step2Content = ({ formData, errors, handleChange, handleNestedChange, viewerMode, setViewerMode, setViewerModeInFormData }) => {
  const [widthError, setWidthError] = useState(null);
  const [heightError, setHeightError] = useState(null);
  const [localDimensions, setLocalDimensions] = useState({
    width: formData.spaceInfo.width || '',
    height: formData.spaceInfo.height || ''
  });
  const [debounceTimer, setDebounceTimer] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [activeDimensionField, setActiveDimensionField] = useState(null);
  
  // 캐비닛 프리뷰 ref 정의
  const cabinetPreviewRef = useRef(null);
  
  // 2D/3D 모드 전환을 위한 상태 추가
  // viewerMode, setViewerMode are now received from props
  
  const [viewerData, setViewerData] = useState({
    spaceInfo: {
      ...formData.spaceInfo,
      depth: 1500 // 공간 깊이는 1500mm로 고정
    },
    placementInfo: {
      type: formData.spaceInfo.spaceType || 'built-in',
      width: Number(formData.spaceInfo.width || 4800),
      height: Number(formData.spaceInfo.height || 2400),
      depth: 580, // 공간 깊이는 580mm로 고정
      clearance: { left: 0, right: 0, top: 0 },
      fit: 'normal',
      showFrame: false
    }
  });
  const [floorThickness, setFloorThickness] = useState(
    formData.spaceInfo.floorThickness || 20
  );
  const [showDimensions, setShowDimensions] = useState(false);

  // 2D 뷰어를 위한 모듈 옵션 상태
  const [moduleOptions, setModuleOptions] = useState({
    width: formData.spaceInfo?.width || 4800,
          depth: 1500, // 공간 깊이는 1500mm로 고정 (프레임 깊이는 580mm로 별도)
    height: formData.spaceInfo?.height || 2400,
    color: '#FFFFFF',
    hasAirConditioner: formData.spaceInfo?.hasAirConditioner === 'yes',
    acUnitPosition: formData.spaceInfo?.acUnit?.position || 'left',
    acUnitWidth: formData.spaceInfo?.acUnit?.width || 900,
    acUnitDepth: formData.spaceInfo?.acUnit?.depth || 200,
    hasFloorFinish: formData.spaceInfo?.hasFloorFinish === 'yes',
    floorFinishHeight: formData.spaceInfo?.floorThickness || 20,
    showDimensions: true, // 항상 치수선 표시 활성화
    step: 'step2' // 명시적으로 step2 단계임을 표시
  });

  // 디바운스 함수 최적화 - useCallback으로 래핑
  const debounce = useCallback((callback, delay) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(callback, delay);
    setDebounceTimer(timer);
    return timer;
  }, [debounceTimer]);

  // 차원 변경 핸들러 최적화
  const handleDimensionChange = useCallback((dimension, value) => {
    // 입력값이 빈 문자열이거나 숫자인지 확인 (숫자만 허용)
    if (value === '' || /^\d+$/.test(value)) {
      // 입력 중 표시
      setIsTyping(true);
      
      // 숫자로 변환
      const numValue = value === '' ? 0 : parseInt(value, 10);
      
      // 즉시 유효성 검사 실행
      let isValid = true;
      if (dimension === 'width') {
        if (numValue !== 0 && (numValue < 1200 || numValue > 8000)) {
          setWidthError('너비는 1200mm에서 8000mm 사이여야 합니다.');
          isValid = false;
        } else {
          setWidthError(null);
        }
      } else if (dimension === 'height') {
        if (numValue !== 0 && (numValue < 1500 || numValue > 3500)) {
          setHeightError('높이는 1500mm에서 3500mm 사이여야 합니다.');
          isValid = false;
        } else {
          setHeightError(null);
        }
      }
      
      // 로컬 상태에 직접 입력된 값 그대로 저장 (처리하지 않음)
      setLocalDimensions(prev => ({
        ...prev,
        [dimension]: value
      }));
      
      // 폼데이터는 유효한 경우에만 업데이트
      if (value !== '' && isValid && numValue > 0) {
        handleNestedChange('spaceInfo', dimension, numValue);
        
        // 즉시 뷰어 데이터 업데이트 (자동 반영)
        setViewerData(prev => ({
          ...prev,
          spaceInfo: {
            ...prev.spaceInfo,
            [dimension]: numValue
          },
          placementInfo: {
            ...prev.placementInfo,
            [dimension]: numValue
          }
        }));
      }
      
      // 입력 완료 표시
      setIsTyping(false);
    }
  }, [handleNestedChange]);

  // 타이핑이 아닌 다른 입력 (버튼 클릭 등)에 의한 변경 감지 - 최적화
  useEffect(() => {
    if (isTyping) return; // 타이핑 중이면 무시

    // 입력 필드의 내용이 변경될 때는 여기서 처리하지 않음
    // 치수 변경이 아닌 다른 옵션만 처리 (공간 타입, 벽 위치, 에어컨 등)
    if (
      formData.spaceInfo.spaceType !== viewerData.placementInfo.type ||
      formData.spaceInfo.wallPosition !== viewerData.spaceInfo.wallPosition ||
      formData.spaceInfo.hasAirConditioner !== viewerData.spaceInfo.hasAirConditioner ||
      formData.spaceInfo.hasFloorFinish !== viewerData.spaceInfo.hasFloorFinish ||
      formData.spaceInfo.floorThickness !== viewerData.spaceInfo.floorThickness ||
      JSON.stringify(formData.spaceInfo.acUnit) !== JSON.stringify(viewerData.spaceInfo.acUnit)
    ) {
      // 버튼 클릭 등에 의한 즉시 반영이 필요한 변경만 반영
      setViewerData(prev => ({
        spaceInfo: {
          ...formData.spaceInfo,
          // 치수 관련 항목은 이전 값 유지
          width: prev.spaceInfo.width,
          height: prev.spaceInfo.height,
          depth: 580 // 공간 깊이는 580mm로 고정
        },
        placementInfo: {
          ...prev.placementInfo,
          type: formData.spaceInfo.spaceType || 'built-in',
          // 치수 관련 항목은 이전 값 유지
          width: prev.placementInfo.width,
          height: prev.placementInfo.height,
          depth: 580,
          showDimensionLines: showDimensions, // 치수선 표시 여부 유지
          viewMode: "normal", // 항상 정면 뷰 유지
          showFrame: false // 프레임 표시 안함
        }
      }));
    }
  }, [
    formData.spaceInfo.spaceType, 
    formData.spaceInfo.wallPosition, 
    formData.spaceInfo.hasAirConditioner, 
    formData.spaceInfo.hasFloorFinish,
    formData.spaceInfo.floorThickness,
    formData.spaceInfo.acUnit,
    isTyping,
    viewerData,
    showDimensions
  ]);

  // 변경 내용 반영 버튼 클릭 핸들러 - 최적화
  const handleApplyChanges = useCallback(() => {
    setIsTyping(false); // 입력 중 상태 해제
    
    // width와 height 값 유효성 검사
    const widthValue = formData.spaceInfo.width || 0;
    const heightValue = formData.spaceInfo.height || 0;
    
    // 유효범위 확인
    let width = widthValue;
    let height = heightValue;
    
    let isValid = true;
    
    // 폭 유효성 검사
    if (width < 1200 || width > 8000) {
      isValid = false;
      // 유효하지 않을 경우 이전 값 유지 또는 기본값 사용
      width = viewerData.spaceInfo.width || 4800;
      setWidthError('너비는 1200mm에서 8000mm 사이여야 합니다.');
    } else {
      setWidthError(null);
    }
    
    // 높이 유효성 검사
    if (height < 1500 || height > 3500) {
      isValid = false;
      // 유효하지 않을 경우 이전 값 유지 또는 기본값 사용
      height = viewerData.spaceInfo.height || 2400;
      setHeightError('높이는 1500mm에서 3500mm 사이여야 합니다.');
    } else {
      setHeightError(null);
    }
    
    // 유효하지 않은 경우 로컬 상태 업데이트
    if (!isValid) {
      setLocalDimensions({
        width: width,
        height: height
      });
    }
    
    // 현재 formData의 값을 viewerData에 반영 (유효성 검사 통과한 값만)
    setViewerData({
      spaceInfo: {
        ...formData.spaceInfo,
        width: width,
        height: height,
        depth: 580 // 공간 깊이는 580mm로 고정
      },
      placementInfo: {
        type: formData.spaceInfo.spaceType || 'built-in',
        wallPosition: formData.spaceInfo.wallPosition || 'left',
        width: Number(width),
        height: Number(height),
        depth: 580,
        clearance: { left: 0, right: 0, top: 0 }, // Step2에서는 프레임 표시 안함
        fit: 'normal',
        showFrame: false, // 프레임 표시 안함
        showDimensionLines: showDimensions, // 치수선 표시 여부
        viewMode: "normal" // 항상 정면 뷰 유지
      }
    });
    
    console.log('뷰어 데이터 업데이트:', {
      width: width,
      height: height
    });
  }, [formData.spaceInfo, viewerData.spaceInfo, setWidthError, setHeightError, showDimensions]);

  // 바닥 두께 변경 핸들러 최적화
  const handleFloorThicknessChange = useCallback((value) => {
    // 입력값이 빈 문자열이거나 숫자인지 확인
    if (value === '' || /^\d+$/.test(value)) {
      // 빈 문자열이면 그대로 사용, 숫자인 경우에만 정수 변환
      const cleanedValue = value === '' ? '' : String(parseInt(value, 10));
      setFloorThickness(cleanedValue);
      
      // 디바운스 대신 즉시 처리
      const numValue = cleanedValue === '' ? 0 : Number(cleanedValue);
      
      // 유효성 검사 (10mm ~ 100mm)
      const isValid = numValue >= 10 && numValue <= 100;
      
      // 유효한 경우에만 폼데이터 업데이트
      if (isValid) {
        // 폼데이터 업데이트
        handleNestedChange('spaceInfo', 'floorThickness', numValue);
        
        // 즉시 뷰어 데이터 업데이트
        setViewerData(prev => ({
          ...prev,
          spaceInfo: {
            ...prev.spaceInfo,
            floorThickness: numValue
          },
          placementInfo: {
            ...prev.placementInfo,
            floorThickness: numValue
          }
        }));
        
        // 모듈 옵션도 업데이트
        setModuleOptions(prev => ({
          ...prev,
          floorFinish: {
            isEnabled: formData.spaceInfo.hasFloorFinish === 'yes',
            height: numValue
          },
          floorFinishHeight: numValue // 명시적으로 floorFinishHeight 속성도 업데이트
        }));
      }
    }
  }, [handleNestedChange, formData.spaceInfo.hasFloorFinish]);

  // 바닥 마감재 두께 blur 처리
  const handleFloorThicknessBlur = () => {
    // 바닥 마감재 높이 값 유효성 검사 및 업데이트
    setFocusedField(null);
    
    const thickness = parseInt(floorThickness, 10);
    if (isNaN(thickness)) {
      setFloorThickness('10'); // 기본 최소값으로 설정
      handleNestedChange('spaceInfo.floorThickness', 10);
      return;
    }
    
    if (thickness < 10) {
      setFloorThickness('10');
      handleNestedChange('spaceInfo.floorThickness', 10);
    } else if (thickness > 100) {
      setFloorThickness('100');
      handleNestedChange('spaceInfo.floorThickness', 100);
    } else {
      setFloorThickness(thickness.toString());
      handleNestedChange('spaceInfo.floorThickness', thickness);
    }
  };

  // 바닥 마감재 변경 핸들러 최적화
  const handleFloorFinishChange = useCallback((value) => {
    handleNestedChange('spaceInfo', 'hasFloorFinish', value);
    
    // 없음 선택 시 두께값도 초기화
    if (value === 'no') {
      handleNestedChange('spaceInfo', 'floorThickness', 20);
      setFloorThickness(20);
      
      // 모듈 옵션도 업데이트 - 마감재 없음
      setModuleOptions(prev => ({
        ...prev,
        floorFinish: {
          isEnabled: false,
          height: 20
        },
        floorFinishHeight: 20 // 명시적으로 floorFinishHeight 속성도 업데이트
      }));
    } else if (value === 'yes') {
      // 마감재 있음을 선택했고 두께가 없거나 0이면 기본값 설정
      const currentThickness = parseInt(floorThickness, 10);
      const newThickness = (!currentThickness || currentThickness < 10) ? 20 : currentThickness;
      
      handleNestedChange('spaceInfo', 'floorThickness', newThickness);
      setFloorThickness(newThickness.toString());
      
      // 모듈 옵션도 업데이트 - 마감재 있음
      setModuleOptions(prev => ({
        ...prev,
        floorFinish: {
          isEnabled: true,
          height: newThickness
        },
        floorFinishHeight: newThickness // 명시적으로 floorFinishHeight 속성도 업데이트
      }));
    }
    
    // 뷰어 데이터도 즉시 업데이트
    setViewerData(prev => ({
      ...prev,
      spaceInfo: {
        ...prev.spaceInfo,
        hasFloorFinish: value,
        floorThickness: value === 'no' ? 0 : (parseInt(floorThickness, 10) || 20)
      }
    }));
  }, [handleNestedChange, floorThickness]);

  // 에어컨 필드 blur 처리
  const handleAcFieldBlur = useCallback((field) => {
    setFocusedField(null);
    setActiveDimensionField(null);
    
    if (!formData.spaceInfo.acUnit) return;
    
    const value = formData.spaceInfo.acUnit[field];
    
    if (value === '' || isNaN(value)) {
      // 빈 값이거나 숫자가 아니면 기본값 설정
      const defaultValue = field === 'width' ? 900 : 200;
      handleNestedChange('spaceInfo', 'acUnit', {
        ...formData.spaceInfo.acUnit,
        [field]: defaultValue
      });
      
      // 모듈 옵션도 업데이트
      if (field === 'width') {
        setModuleOptions(prev => ({
          ...prev,
          acUnitWidth: defaultValue
        }));
      } else if (field === 'depth') {
        setModuleOptions(prev => ({
          ...prev,
          acUnitDepth: defaultValue
        }));
      }
      return;
    }
    
    // 숫자로 변환
    const numValue = parseInt(value, 10);
    
    // 값이 유효한지 확인
    let isValid = true;
    const minSize = 50;
    let maxSize = Number.MAX_SAFE_INTEGER;
    let finalValue = numValue;
    
    if (field === 'width') {
      // 가로폭은 공간 가로 내경사이즈가 유효범위
      maxSize = formData.spaceInfo.width || 0;
    } else if (field === 'depth') {
      // 두께(높이)는 공간의 높이가 유효범위
      maxSize = formData.spaceInfo.height || 0;
    }
    
    if (numValue < minSize || numValue > maxSize) {
      isValid = false;
      // 범위를 벗어나면 경계값으로 조정
      finalValue = numValue < minSize ? minSize : maxSize;
      
      // 값 조정 후 업데이트
      handleNestedChange('spaceInfo', 'acUnit', {
        ...formData.spaceInfo.acUnit,
        [field]: finalValue
      });
      
      // 모듈 옵션도 업데이트
      if (field === 'width') {
        setModuleOptions(prev => ({
          ...prev,
          acUnitWidth: finalValue
        }));
      } else if (field === 'depth') {
        setModuleOptions(prev => ({
          ...prev,
          acUnitDepth: finalValue
        }));
      }
    }
    
    // 값이 유효하거나 조정 후 뷰어 업데이트
    setViewerData(prev => ({
      ...prev,
      spaceInfo: {
        ...prev.spaceInfo,
        acUnit: {
          ...prev.spaceInfo.acUnit,
          [field]: finalValue
        }
      }
    }));
    
  }, [formData.spaceInfo.acUnit, formData.spaceInfo.width, formData.spaceInfo.height, handleNestedChange]);

  // 에어컨 단내림 변경 핸들러 최적화
  const handleAcUnitChange = useCallback((field, value) => {
    // 위치 속성인 경우 그대로 처리
    if (field === 'position') {
      handleNestedChange('spaceInfo', 'acUnit', {
        ...formData.spaceInfo.acUnit,
        [field]: value,
        present: true
      });
      // 즉시 moduleOptions에도 반영
      if (field === 'position') {
        setModuleOptions(prev => ({
          ...prev,
          acUnitPosition: value
        }));
      }
      return;
    }

    // 숫자 속성에 대한 처리
    if (value === '' || /^\d+$/.test(value)) {
      // Always allow updating with empty string, even if not a valid number
      handleNestedChange('spaceInfo', 'acUnit', {
        ...formData.spaceInfo.acUnit,
        [field]: value,
        present: true
      });

      // Only proceed to validation and update viewer state if value is a number
      if (value === '') return;

      const tempValue = parseInt(value, 10);
      // 최소/최대 크기 체크 (최소 50mm, 최대는 공간 크기)
      let isValid = true;
      const minSize = 50;
      let maxSize = Number.MAX_SAFE_INTEGER;

      if (field === 'width') {
        // 가로폭은 공간 가로 내경사이즈가 유효범위
        maxSize = formData.spaceInfo.width || 0;
      } else if (field === 'depth') {
        // 두께는 공간의 높이가 유효범위
        maxSize = formData.spaceInfo.height || 0;
      }

      if (tempValue < minSize || tempValue > maxSize) {
        isValid = false;
      }

      // 유효한 경우에만 폼데이터 업데이트
      if (isValid) {
        // 폼데이터 업데이트
        handleNestedChange('spaceInfo', 'acUnit', {
          ...formData.spaceInfo.acUnit,
          [field]: tempValue,
          present: true
        });

        // 즉시 moduleOptions에도 반영
        if (field === 'width') {
          setModuleOptions(prev => ({
            ...prev,
            acUnitWidth: tempValue
          }));
        } else if (field === 'depth') {
          setModuleOptions(prev => ({
            ...prev,
            acUnitDepth: tempValue
          }));
        }
      }
    }
  }, [formData.spaceInfo.acUnit, formData.spaceInfo.width, formData.spaceInfo.height, handleNestedChange]);

  // 에어컨 유무 변경 핸들러 최적화
  const handleAirConditionerChange = useCallback((value) => {
    handleNestedChange('spaceInfo', 'hasAirConditioner', value);
    
    // 에어컨 없음 선택 시, acUnit 기본값 설정
    if (value === 'no') {
      handleNestedChange('spaceInfo', 'acUnit', { 
        position: 'left', 
        width: 900, 
        depth: 200,
        present: false 
      });
    } else {
      // 에어컨 있음 선택 시
      handleNestedChange('spaceInfo', 'acUnit', { 
        ...formData.spaceInfo.acUnit, 
        position: formData.spaceInfo.acUnit?.position || 'left',
        width: formData.spaceInfo.acUnit?.width || 900,
        depth: formData.spaceInfo.acUnit?.depth || 200,
        present: true
      });
    }
    
    // 즉시 moduleOptions에도 반영
    setModuleOptions(prev => ({
      ...prev,
      hasAirConditioner: value === 'yes',
      acUnitPosition: formData.spaceInfo.acUnit?.position || 'left',
      acUnitWidth: formData.spaceInfo.acUnit?.width || 900,
      acUnitDepth: 200
    }));
    
    // viewerData에도 즉시 반영
    setViewerData(prev => ({
      ...prev,
      spaceInfo: {
        ...prev.spaceInfo,
        hasAirConditioner: value,
        acUnit: {
          position: formData.spaceInfo.acUnit?.position || 'left',
          width: formData.spaceInfo.acUnit?.width || 900,
          depth: 200,
          present: value === 'yes'
        }
      }
    }));
  }, [formData.spaceInfo.acUnit, handleNestedChange]);

  // 컴포넌트 마운트 시 또는 formData 변경 시 기본값 설정
  useEffect(() => {
    // 첫 마운트 시에만 실행
    const defaultValues = {
      width: formData.spaceInfo.width || 4800,
      height: formData.spaceInfo.height || 2400,
      depth: 580,
      hasAirConditioner: formData.spaceInfo.hasAirConditioner || 'no',
      hasFloorFinish: formData.spaceInfo.hasFloorFinish || 'no',
      floorThickness: formData.spaceInfo.floorThickness || 0
    };
    
    // 로컬 상태 초기화
    setLocalDimensions({
      width: defaultValues.width,
      height: defaultValues.height
    });
    
    // 뷰어 데이터 초기화
    setViewerData({
      spaceInfo: {
        ...formData.spaceInfo,
        spaceType: formData.spaceInfo.spaceType || 'built-in',
        wallPosition: formData.spaceInfo.wallPosition || 'left',
        depth: 580,
        acUnit: formData.spaceInfo.acUnit || { position: 'left', width: 900, depth: 200 }
      },
      placementInfo: {
        type: formData.spaceInfo.spaceType || 'built-in',
        wallPosition: formData.spaceInfo.wallPosition || 'left',
        width: Number(defaultValues.width),
        height: Number(defaultValues.height),
        depth: 580,
        clearance: { left: 0, right: 0, top: 0 },
        fit: 'normal',
        showDimensionLines: showDimensions, // 치수선 표시 여부
        viewMode: "normal", // 항상 정면 뷰 유지
        showFrame: false // 프레임 표시 안함
      }
    });
  }, [showDimensions, formData.spaceInfo]);

  // 3D 뷰어 생성 및 캐싱
  const roomViewer = useMemo(() => {
    if (!formData.spaceInfo) return null;
    
    // Ensure boolean conversion for hasFloorFinish
    const spaceInfoWithBooleans = {
      ...viewerData.spaceInfo,
      hasAirConditioner: viewerData.spaceInfo.hasAirConditioner === 'yes',
      hasFloorFinish: viewerData.spaceInfo.hasFloorFinish === 'yes'
    };
    
    // 뷰어에 표시할 데이터 준비
    return (
      <RoomViewer3D 
        spaceInfo={spaceInfoWithBooleans}
        placementInfo={viewerData.placementInfo}
        showFrame={false}
        step={2}
        viewMode="normal" // 항상 정면 뷰 유지
      />
    );
  }, [viewerData, formData.spaceInfo, showDimensions]);

  // 입력 필드 포커스 핸들러
  const handleFieldFocus = (fieldName) => {
    setFocusedField(fieldName);
    
    // 필드 이름에 따라 적절한 dimensionField 값 매핑
    let dimensionField = null;
    if (fieldName === 'width') {
      dimensionField = 'width';
    } else if (fieldName === 'height') {
      dimensionField = 'height';
    } else if (fieldName === 'acWidth') {
      dimensionField = 'acUnitWidth';
    } else if (fieldName === 'acDepth') {
      // acDepth 필드일 때는 치수선 표시하지 않음
      dimensionField = null;
    } else if (fieldName === 'floorThickness') {
      dimensionField = 'floorFinishHeight';
    }
    
    // activeDimensionField 설정하여 TwoDViewer에서 해당 치수선을 강조하도록 함
    setActiveDimensionField(dimensionField);
    console.log('활성 치수 필드 설정됨:', dimensionField); // 디버깅 로그 추가
    
    // 2D 뷰어에서 치수선 표시 활성화
    setShowDimensions(true);
    
    // 2D 모드가 아닌 경우 2D 모드로 전환
    if (viewerMode !== '2D') {
      toggleViewerMode('2D');
    }
  };

  // 입력 필드 포커스 해제 핸들러
  const handleFieldBlur = () => {
    setFocusedField(null);
    setActiveDimensionField(null);
  };

  // 클릭 이벤트로 활성 필드 초기화
  const resetDimensionField = useCallback(() => {
    setFocusedField(null);
    setActiveDimensionField(null);
    console.log("차원 필드 초기화됨");
  }, []);
  
  // 키 입력 이벤트 핸들러 - Enter 키 입력 시 변경사항 적용 (preventDefault 제거)
  const handleKeyDown = useCallback((e, dimension) => {
    if (e.key === 'Enter') {
      // Enter 키를 눌렀을 때 blur 처리만 실행 (preventDefault 제거)
      handleFieldBlur();
    }
  }, [handleFieldBlur]);

  // 공간 유형 변경 핸들러
  const handleSpaceTypeChange = (e) => {
    const spaceType = e.target.value;
    
    // 이전 단내림 설정 보존
    const currentAcSettings = {
      hasAirConditioner: formData.spaceInfo.hasAirConditioner,
      acUnit: formData.spaceInfo.acUnit
    };
    
    // 선반형일 경우 벽 위치는 null로 설정 (없음)
    const updatedWallPosition = spaceType === 'standing' ? null : formData.spaceInfo.wallPosition;
    
    // 로컬 상태와 폼 데이터를 동시에 업데이트 (단내림 정보 유지)
    setViewerData(prev => ({
      ...prev,
      spaceInfo: {
        ...prev.spaceInfo,
        spaceType: spaceType,
        wallPosition: updatedWallPosition,
        // 단내림 정보 유지
        hasAirConditioner: currentAcSettings.hasAirConditioner,
        acUnit: currentAcSettings.acUnit
      },
      placementInfo: {
        ...prev.placementInfo,
        type: spaceType,
        wallPosition: updatedWallPosition,
        // 단내림 정보 유지
        hasAirConditioner: currentAcSettings.hasAirConditioner === 'yes',
        acUnit: currentAcSettings.acUnit,
        showDimensionLines: showDimensions,
        viewMode: "normal", // 항상 정면 뷰 유지
        showFrame: false // 프레임 표시 안함
      }
    }));
    
    console.log('Updated spaceType:', spaceType, 'wallPosition:', updatedWallPosition, '단내림 설정 유지:', currentAcSettings);
    
    // 상위 컴포넌트에 변경 사항 전달 (단내림 정보는 유지)
    handleNestedChange('spaceInfo', 'spaceType', spaceType);
    
    // 선반형일 경우 벽 위치를 null로 설정
    if (spaceType === 'standing') {
      handleNestedChange('spaceInfo', 'wallPosition', null);
      
      // 배치 정보도 업데이트
      handleNestedChange('placementInfo.type', spaceType);
      handleNestedChange('placementInfo.wallPosition', null);
    }
  };

  const toggleDimensions = useCallback(() => {
    setShowDimensions(prev => !prev);
  }, []);

  // 모듈 옵션 업데이트 핸들러
  const handleUpdateModuleOptions = (newOptions) => {
    setModuleOptions(newOptions);
    // 치수 정보도 함께 업데이트
    if (newOptions.width) {
      handleDimensionChange('width', newOptions.width.toString());
    }
    if (newOptions.height) {
      handleDimensionChange('height', newOptions.height.toString());
    }
    // 에어컨 단내림 폭과 두께 업데이트
    if (newOptions.acUnitWidth && formData.spaceInfo.hasAirConditioner === 'yes') {
      handleAcUnitChange('width', newOptions.acUnitWidth.toString());
    }
    if (newOptions.acUnitDepth && formData.spaceInfo.hasAirConditioner === 'yes') {
      handleAcUnitChange('depth', newOptions.acUnitDepth.toString());
    }
    // viewerMode 변경이 있으면 formData에도 반영
    if (
      typeof setViewerModeInFormData === 'function' &&
      typeof newOptions.viewerMode !== 'undefined' &&
      newOptions.viewerMode !== viewerMode
    ) {
      setViewerModeInFormData(newOptions.viewerMode);
    }
  };
  
  // 뷰어 모드 전환 핸들러
  const toggleViewerMode = (mode) => {
    setViewerMode(mode);
    
    // 2D 모드일 때는 치수선 표시를 활성화(3D에서 해당 작업은 RoomViewer3D에서 처리)
    if (mode === '2D' && activeDimensionField) {
      setShowDimensions(true);
    }
    
    // viewerMode 상태 업데이트
    if (typeof setViewerModeInFormData === 'function') {
      setViewerModeInFormData(mode);
    }
  };
  
  // 뷰 타입은 항상 정면도로 고정
  
  // 버튼 스타일 함수
  const buttonStyle = (isActive) => ({
    padding: '8px 16px',
    backgroundColor: isActive ? '#00C092' : '#f0f0f0',
    color: isActive ? '#fff' : '#333',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '5px',
    fontWeight: isActive ? 'bold' : 'normal',
    fontSize: '14px',
    transition: 'all 0.2s ease'
  });
  
  // 뷰 타입 버튼 스타일
  const viewTypeButtonStyle = (isActive) => ({
    padding: '6px 12px',
    backgroundColor: isActive ? '#00C092' : '#f0f0f0',
    color: isActive ? '#fff' : '#333',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '5px',
    fontWeight: isActive ? 'bold' : 'normal',
    fontSize: '13px',
    transition: 'all 0.2s ease'
  });
  
  // formData 변경 시 moduleOptions 업데이트
  useEffect(() => {
    setModuleOptions({
      width: formData.spaceInfo.width || 4800,
      depth: 580, // 공간 깊이는 580mm로 고정
      height: formData.spaceInfo.height || 2400,
      color: '#FFFFFF',
      acUnitWidth: formData.spaceInfo.acUnit?.width || 900,
      acUnitDepth: formData.spaceInfo.acUnit?.depth || 200,
      floorFinish: {
        isEnabled: formData.spaceInfo.hasFloorFinish === 'yes',
        height: parseInt(formData.spaceInfo.floorThickness || 20, 10)
      },
      floorFinishHeight: parseInt(formData.spaceInfo.floorThickness || 20, 10), // 명시적으로 floorFinishHeight 속성도 설정
      step: 'step2' // 항상 step2로 설정하여 프레임이 표시되지 않도록 함
    });
  }, [
    formData.spaceInfo.width,
    formData.spaceInfo.height,
    formData.spaceInfo.acUnit?.width,
    formData.spaceInfo.acUnit?.depth,
    formData.spaceInfo.hasFloorFinish,
    formData.spaceInfo.floorThickness
  ]);

  // focusedField가 변경될 때 activeDimensionField 업데이트
  useEffect(() => {
    // 필드 이름에 따라 적절한 dimensionField 값 매핑
    if (focusedField === 'width') {
      setActiveDimensionField('width');
    } else if (focusedField === 'height') {
      setActiveDimensionField('height');
    } else if (focusedField === 'acWidth') {
      setActiveDimensionField('acUnitWidth');
    } else if (focusedField === 'acDepth') {
      setActiveDimensionField('acUnitDepth');
    } else if (focusedField === 'floorThickness') {
      setActiveDimensionField('floorFinishHeight');
    } else {
      // 선택된 필드가 없으면 null로 설정
      setActiveDimensionField(null);
    }
    
    console.log('활성화된 치수 필드:', focusedField, '→', activeDimensionField);
  }, [focusedField]);

  // StepViewTwoDViewer에 전달할 최종 모듈 옵션 계산
  const finalModuleOptions = useMemo(() => {
    return {
      ...moduleOptions,
      // 활성화된 치수 필드가 있을 때 항상 치수선 표시 활성화
      showDimensions: true,
      step: 'step2'
    };
  }, [moduleOptions]);

  // 단내림 깊이(높이) 필드 변경 핸들러 - acDepth 필드를 특별히 처리
  const handleAcDepthChange = (e) => {
    const value = e.target.value;
    
    // 입력값이 빈 문자열이거나 숫자인지 확인
    if (value === '' || /^\d+$/.test(value)) {
      const numValue = value === '' ? 0 : parseInt(value, 10);
      
      // 유효성 검사 (최소 50mm, 최대 공간 높이)
      const maxHeight = formData.spaceInfo.height || 2400;
      const isValid = numValue >= 50 && numValue <= maxHeight;
      
      // 일단 UI 값은 항상 업데이트
      if (formData.spaceInfo.acUnit) {
        // 직접 acUnitDepth 값을 변경
        console.log('단내림 깊이 변경:', value);
        
        // 모듈 옵션 업데이트 - 단내림 깊이 변경
        setModuleOptions(prev => ({
          ...prev,
          acUnitDepth: numValue
        }));
        
        // acUnitDepth 차원 필드 강제 활성화 (매우 중요)
        setActiveDimensionField('acUnitDepth');
        
        // 콘솔에 로그 추가 - 디버깅용
        console.log('단내림 깊이 필드 변경 - 활성화된 치수 필드:', 'acUnitDepth');
        
        // 유효한 값인 경우에만 폼 데이터 업데이트
        handleNestedChange('spaceInfo', 'acUnit', {
          ...formData.spaceInfo.acUnit,
          depth: value === '' ? '' : numValue
        });
        
        // 300ms 후에 다시 한번 activeDimensionField 설정 (타이밍 문제 해결용)
        setTimeout(() => {
          setActiveDimensionField('acUnitDepth');
          console.log('타임아웃 후 activeDimensionField 재설정:', 'acUnitDepth');
        }, 300);
      }
    }
  };

  return (
    <div className={styles.step2Container}>
      <div className={styles.containerLeft} style={{ flex: '6' }}>
        {/* 왼쪽 컬럼 - 뷰어 부분 */}
        <div className={commonStyles.viewerContainer} style={{ height: '100%', position: 'relative' }}>
          {/* 2D/3D 모드 전환 버튼 */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100
          }}>
            <div className={styles.toggleButtonGroup} style={{ display: 'flex' }}>
              <button
                className={`${styles.toggleButton} ${viewerMode === '2D' ? styles.toggleButtonActive : ''}`}
                onClick={() => toggleViewerMode('2D')}
              >
                2D
              </button>
              <button
                className={`${styles.toggleButton} ${viewerMode === '3D' ? styles.toggleButtonActive : ''}`}
                onClick={() => toggleViewerMode('3D')}
              >
                3D
              </button>
            </div>
          </div>

          {/* 2D 모드인 경우 TwoDViewer 컴포넌트 표시 */}
          {viewerMode === '2D' ? (
            <StepViewTwoDViewer 
              options={finalModuleOptions}
              viewType="front" // 항상 정면도로 설정
              hasAirConditioner={formData.spaceInfo.hasAirConditioner === 'yes'}
              acUnitPosition={formData.spaceInfo.acUnit?.position || 'left'}
              acUnitWidth={Number(formData.spaceInfo.acUnit?.width) || 900}
              acUnitDepth={Number(formData.spaceInfo.acUnit?.depth) || 200}
              hasFloorFinish={formData.spaceInfo.hasFloorFinish === 'yes'}
              floorFinishHeight={Number(formData.spaceInfo.floorThickness) || 20}
              installationType={formData.spaceInfo.spaceType || 'built-in'}
              activeDimensionField={activeDimensionField}
              onDimensionFieldReset={resetDimensionField}
              showDimensions={true} // 항상 치수선 표시 활성화
              hideViewButtons={true} // 뷰 버튼 숨기기
            />
          ) : (
            // 3D 모드인 경우 RoomViewer3D 표시
            <RoomViewer3D
              spaceInfo={{
                ...viewerData.spaceInfo,
                hasAirConditioner: viewerData.spaceInfo.hasAirConditioner === 'yes',
                hasFloorFinish: viewerData.spaceInfo.hasFloorFinish === 'yes',
                floorThickness: Number(viewerData.spaceInfo.floorThickness || 0)
              }}
              placementInfo={viewerData.placementInfo}
              showFrame={false}
              step={2}
              viewMode="normal"
            />
          )}
        </div>
      </div>
      
      <div className={styles.containerRight}>
        <h2 className={styles.stepTitle}>
          <span className={styles.stepNumber}>STEP 2</span>
          <span className={styles.stepDescription}>공간 정보 입력</span>
        </h2>
        
        {/* 아래 콘텐츠를 div로 감싸고 스크롤 설정 */}
        <div style={{ overflow: 'auto', paddingRight: '10px' }}>
          <div className={commonStyles.formSection}>
            {/* 설치 타입 선택 */}
            <div className={commonStyles.section}>
              <h3 className={commonStyles.categoryTitle}>설치 타입</h3>
              <div className={styles.toggleButtonGroup}>
                <button
                  className={`${styles.toggleButton} ${formData.spaceInfo.spaceType === 'built-in' ? styles.toggleButtonActive : ''}`}
                  onClick={() => {
                    const newValue = 'built-in';
                    handleNestedChange('spaceInfo', 'spaceType', newValue);
                    // 즉시 뷰어 데이터 업데이트
                    const wallPos = formData.spaceInfo.wallPosition || 'left';
                    const newViewerData = {
                      ...viewerData,
                      spaceInfo: {
                        ...viewerData.spaceInfo,
                        spaceType: newValue
                      },
                      placementInfo: {
                        ...viewerData.placementInfo,
                        type: newValue, // placementInfo.type도 함께 업데이트
                        wallPosition: wallPos, // 현재 wallPosition 상태 유지
                        showDimensionLines: showDimensions, // 치수선 표시 여부 유지
                        viewMode: "normal", // 항상 정면 뷰 유지
                        showFrame: false // 프레임 표시 안함
                      }
                    };
                    console.log('빌트인 선택, 업데이트 데이터:', newViewerData);
                    setViewerData(newViewerData);
                  }}
                >
                  빌트인
                </button>
                <button
                  className={`${styles.toggleButton} ${formData.spaceInfo.spaceType === 'semi-standing' ? styles.toggleButtonActive : ''}`}
                  onClick={() => {
                    const newValue = 'semi-standing';
                    const wallPos = formData.spaceInfo.wallPosition || 'left';
                    handleNestedChange('spaceInfo', 'spaceType', newValue);
                    handleNestedChange('spaceInfo', 'wallPosition', wallPos);
                    // 즉시 뷰어 데이터 업데이트
                    const newViewerData = {
                      ...viewerData,
                      spaceInfo: {
                        ...viewerData.spaceInfo,
                        spaceType: newValue,
                        wallPosition: wallPos
                      },
                      placementInfo: {
                        ...viewerData.placementInfo,
                        type: newValue, // placementInfo.type도 함께 업데이트
                        wallPosition: wallPos, // wallPosition도 placementInfo에 추가
                        showDimensionLines: showDimensions, // 치수선 표시 여부 유지
                        viewMode: "normal", // 항상 정면 뷰 유지
                        showFrame: false // 프레임 표시 안함
                      }
                    };
                    console.log('세미스탠딩 선택, 업데이트 데이터:', newViewerData);
                    setViewerData(newViewerData);
                  }}
                >
                  세미스탠딩
                </button>
                <button
                  className={`${styles.toggleButton} ${formData.spaceInfo.spaceType === 'standing' ? styles.toggleButtonActive : ''}`}
                  onClick={() => {
                    const newValue = 'standing';
                    handleNestedChange('spaceInfo', 'spaceType', newValue);
                    handleNestedChange('spaceInfo', 'wallPosition', null); // wallPosition을 null로 설정
                    // 즉시 뷰어 데이터 업데이트
                    const newViewerData = {
                      ...viewerData,
                      spaceInfo: {
                        ...viewerData.spaceInfo,
                        spaceType: newValue,
                        wallPosition: null
                      },
                      placementInfo: {
                        ...viewerData.placementInfo,
                        type: newValue, // placementInfo.type도 함께 업데이트
                        wallPosition: null, // 스탠딩은 벽이 없음 (null로 설정)
                        showDimensionLines: showDimensions, // 치수선 표시 여부 유지
                        viewMode: "normal", // 항상 정면 뷰 유지
                        showFrame: false // 프레임 표시 안함
                      }
                    };
                    console.log('프리스탠딩 선택, 업데이트 데이터:', newViewerData);
                    setViewerData(newViewerData);
                  }}
                >
                  프리스탠딩
                </button>
              </div>
            </div>
            
            {/* 벽 위치 선택 - 반 스탠딩인 경우에만 표시 */}
            {formData.spaceInfo.spaceType === 'semi-standing' && (
              <div className={commonStyles.section}>
                <h3 className={commonStyles.categoryTitle}>벽 위치</h3>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <div className={styles.toggleButtonGroup} style={{ flex: '1' }}>
                    <button
                      className={`${styles.toggleButton} ${formData.spaceInfo.wallPosition === 'left' ? styles.toggleButtonActive : ''}`}
                      onClick={() => {
                        const newValue = 'left';
                        console.log('벽 위치 변경:', newValue);
                        handleNestedChange('spaceInfo', 'wallPosition', newValue);
                        
                        // 즉시 뷰어 데이터 업데이트
                        const newViewerData = {
                          ...viewerData,
                          spaceInfo: {
                            ...viewerData.spaceInfo,
                            wallPosition: newValue
                          },
                          placementInfo: {
                            ...viewerData.placementInfo,
                            type: formData.spaceInfo.spaceType,
                            wallPosition: newValue,
                            showDimensionLines: showDimensions, // 치수선 표시 여부 유지
                            viewMode: "normal", // 항상 정면 뷰 유지
                            showFrame: false // 프레임 표시 안함
                          }
                        };
                        console.log('좌측 벽 선택, 업데이트 데이터:', newViewerData);
                        setViewerData(newViewerData);
                      }}
                    >
                      좌측
                    </button>
                    <button
                      className={`${styles.toggleButton} ${formData.spaceInfo.wallPosition === 'right' ? styles.toggleButtonActive : ''}`}
                      onClick={() => {
                        const newValue = 'right';
                        console.log('벽 위치 변경:', newValue);
                        handleNestedChange('spaceInfo', 'wallPosition', newValue);
                        
                        // 즉시 뷰어 데이터 업데이트
                        const newViewerData = {
                          ...viewerData,
                          spaceInfo: {
                            ...viewerData.spaceInfo,
                            wallPosition: newValue
                          },
                          placementInfo: {
                            ...viewerData.placementInfo,
                            type: formData.spaceInfo.spaceType,
                            wallPosition: newValue,
                            showDimensionLines: showDimensions, // 치수선 표시 여부 유지
                            viewMode: "normal", // 항상 정면 뷰 유지
                            showFrame: false // 프레임 표시 안함
                          }
                        };
                        console.log('우측 벽 선택, 업데이트 데이터:', newViewerData);
                        setViewerData(newViewerData);
                      }}
                    >
                      우측
                    </button>
                  </div>
                  <div style={{ flex: '1' }}></div>
                </div>
              </div>
            )}
            
            {/* 공간 치수 설정 */}
            <div className={commonStyles.section}>
              <h3 className={commonStyles.categoryTitle}>공간 크기</h3>
              
              {/* 폭과 높이 입력 필드를 한 줄에 배치 */}
              <div style={{ display: 'flex', gap: '16px' }}>
                {/* 폭 입력 */}
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div className={commonStyles.fieldGroup} style={{ marginBottom: 0, position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666', fontSize: '14px', pointerEvents: 'none' }}>폭</span>
                    <input
                      type="text"
                      id="width"
                      name="width"
                      value={localDimensions.width}
                      onChange={(e) => handleDimensionChange('width', e.target.value)}
                      className={`${commonStyles.inputField} ${widthError ? styles.inputError : ''}`}
                      onFocus={() => handleFieldFocus('width')}
                      onBlur={handleFieldBlur}
                      onKeyDown={(e) => handleKeyDown(e, 'width')}
                      style={{ paddingLeft: '30px', paddingRight: '35px', textAlign: 'center' }}
                      placeholder="1200-8000"
                    />
                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666', fontSize: '14px', pointerEvents: 'none' }}>mm</span>
                  </div>
                  <div style={{ minHeight: '16px', marginTop: '2px' }}>
                    {widthError && <div className={commonStyles.errorText}>{widthError}</div>}
                    {focusedField === 'width' && !widthError && (
                      <div className={commonStyles.errorText} style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
                        유효범위: 1200 ~ 8000mm
                      </div>
                    )}
                  </div>
                </div>
                
                {/* 높이 입력 */}
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div className={commonStyles.fieldGroup} style={{ marginBottom: 0, position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666', fontSize: '14px', pointerEvents: 'none' }}>높이</span>
                    <input
                      type="text"
                      id="height"
                      name="height"
                      value={localDimensions.height}
                      onChange={(e) => handleDimensionChange('height', e.target.value)}
                      className={`${commonStyles.inputField} ${heightError ? styles.inputError : ''}`}
                      onFocus={() => handleFieldFocus('height')}
                      onBlur={handleFieldBlur}
                      onKeyDown={(e) => handleKeyDown(e, 'height')}
                      style={{ paddingLeft: '30px', paddingRight: '35px', textAlign: 'center' }}
                      placeholder="1500-3500"
                    />
                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666', fontSize: '14px', pointerEvents: 'none' }}>mm</span>
                  </div>
                  <div style={{ minHeight: '16px', marginTop: '2px' }}>
                    {heightError && <div className={commonStyles.errorText}>{heightError}</div>}
                    {focusedField === 'height' && !heightError && (
                      <div className={commonStyles.errorText} style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
                        유효범위: 1500 ~ 3500mm
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* 에어컨 단내림 선택 */}
            <div className={commonStyles.section}>
              <h3 className={commonStyles.categoryTitle}>에어컨 단내림</h3>
              <div style={{ display: 'flex', gap: '15px' }}>
                <div className={styles.toggleButtonGroup} style={{ flex: '1' }}>
                  <button
                    className={`${styles.toggleButton} ${formData.spaceInfo.hasAirConditioner === 'no' ? styles.toggleButtonActive : ''}`}
                    onClick={() => handleAirConditionerChange('no')}
                  >
                    없음
                  </button>
                  <button
                    className={`${styles.toggleButton} ${formData.spaceInfo.hasAirConditioner === 'yes' ? styles.toggleButtonActive : ''}`}
                    onClick={() => handleAirConditionerChange('yes')}
                  >
                    있음
                  </button>
                </div>
                
                {/* 에어컨 단내림 있음 선택 시 좌측/우측 버튼 바로 표시 */}
                {formData.spaceInfo.hasAirConditioner === 'yes' ? (
                  <div className={styles.toggleButtonGroup} style={{ flex: '1' }}>
                    <button
                      className={`${styles.toggleButton} ${formData.spaceInfo.acUnit?.position === 'left' ? styles.toggleButtonActive : ''}`}
                      onClick={() => handleAcUnitChange('position', 'left')}
                    >
                      좌측
                    </button>
                    <button
                      className={`${styles.toggleButton} ${formData.spaceInfo.acUnit?.position === 'right' ? styles.toggleButtonActive : ''}`}
                      onClick={() => handleAcUnitChange('position', 'right')}
                    >
                      우측
                    </button>
                  </div>
                ) : (
                  <div style={{ flex: '1' }}></div>
                )}
              </div>
              
              {/* 에어컨 단내림 있음 선택 시 추가 옵션 표시 */}
              {formData.spaceInfo.hasAirConditioner === 'yes' && (
                <div style={{ marginTop: '15px' }}>
                  <h3 className={commonStyles.categoryTitle}>단내림 크기</h3>
                  <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <div className={commonStyles.fieldGroup} style={{ marginBottom: 0, position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666', fontSize: '14px', pointerEvents: 'none' }}>폭</span>
                        <input
                          type="text"
                          id="acWidth"
                          name="acWidth"
                          value={formData.spaceInfo.acUnit?.width || ''}
                          onChange={(e) => handleAcUnitChange('width', e.target.value)}
                          className={commonStyles.inputField}
                          onFocus={() => handleFieldFocus('acWidth')}
                          onBlur={handleFieldBlur}
                          onKeyDown={(e) => e.key === 'Enter' && handleFieldBlur()}
                          style={{ paddingLeft: '30px', paddingRight: '35px', textAlign: 'center' }}
                          placeholder="가로 폭"
                        />
                        <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666', fontSize: '14px', pointerEvents: 'none' }}>mm</span>
                      </div>
                      <div style={{ minHeight: '24px', marginTop: '4px' }}>
                        {focusedField === 'acWidth' && (
                          <div className={commonStyles.errorText} style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
                            유효범위: 최소 50mm, 최대 공간 폭 -50mm
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <div className={commonStyles.fieldGroup} style={{ marginBottom: 0, position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666', fontSize: '14px', pointerEvents: 'none' }}>높이</span>
                        <input
                          type="text"
                          id="acDepth"
                          name="acDepth"
                          value={formData.spaceInfo.acUnit?.depth || ''}
                          onChange={handleAcDepthChange}
                          className={commonStyles.inputField}
                          onFocus={() => handleFieldFocus('acDepth')}
                          onBlur={handleFieldBlur}
                          onKeyDown={(e) => e.key === 'Enter' && handleFieldBlur()}
                          style={{ paddingLeft: '30px', paddingRight: '35px', textAlign: 'center' }}
                          placeholder="높이"
                        />
                        <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666', fontSize: '14px', pointerEvents: 'none' }}>mm</span>
                      </div>
                      <div style={{ minHeight: '24px', marginTop: '4px' }}>
                                              {focusedField === 'acDepth' && (
                        <div className={commonStyles.errorText} style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
                          유효범위: 최소 50mm, 최대 {formData.spaceInfo.height || 2400}mm
                        </div>
                      )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* 바닥 마감재 선택 */}
            <div className={commonStyles.section}>
              <h3 className={commonStyles.categoryTitle}>바닥 마감재</h3>
              <div style={{ display: 'flex', gap: '15px' }}>
                <div className={styles.toggleButtonGroup} style={{ flex: '1' }}>
                  <button
                    className={`${styles.toggleButton} ${formData.spaceInfo.hasFloorFinish === 'no' ? styles.toggleButtonActive : ''}`}
                    onClick={() => handleFloorFinishChange('no')}
                  >
                    없음
                  </button>
                  <button
                    className={`${styles.toggleButton} ${formData.spaceInfo.hasFloorFinish === 'yes' ? styles.toggleButtonActive : ''}`}
                    onClick={() => handleFloorFinishChange('yes')}
                  >
                    있음
                  </button>
                </div>
                
                {/* 마감재 있음 선택 시 두께 입력 필드 바로 표시 */}
                {formData.spaceInfo.hasFloorFinish === 'yes' ? (
                  <div style={{ flex: 1 }}>
                    <div className={commonStyles.fieldGroup} style={{ margin: 0, position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666', fontSize: '14px', pointerEvents: 'none' }}>높이</span>
                      <input
                        type="text"
                        id="floorThickness"
                        name="floorThickness"
                        value={floorThickness}
                        onChange={(e) => handleFloorThicknessChange(e.target.value)}
                        className={commonStyles.inputField}
                        onFocus={() => handleFieldFocus('floorThickness')}
                        onBlur={handleFloorThicknessBlur}
                        onKeyDown={(e) => e.key === 'Enter' && handleFieldBlur()}
                        style={{ paddingLeft: '30px', paddingRight: '35px', textAlign: 'center' }}
                        placeholder="높이"
                      />
                      <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666', fontSize: '14px', pointerEvents: 'none' }}>mm</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ flex: '1' }}></div>
                )}
              </div>
              
              {/* 마감재 높이 입력 필드 에러 메시지 */}
              {formData.spaceInfo.hasFloorFinish === 'yes' && (
                <div style={{ display: 'flex', marginTop: '1px' }}>
                  <div style={{ flex: 1 }}></div>
                  <div style={{ flex: 1 }}>
                    {focusedField === 'floorThickness' && (
                      <div className={commonStyles.errorText} style={{ animation: 'fadeIn 0.3s ease-in-out', minHeight: '16px' }}>
                        유효범위: 10 ~ 100mm
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* 버튼을 스크롤 영역 내부로 이동 */}
          <div style={{ marginTop: '15px', paddingBottom: '20px' }}>
            {/* 변경 내용 반영하기 버튼 제거 */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step2Content; 

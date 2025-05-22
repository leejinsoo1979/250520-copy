import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styles from './Step2Content.module.css'; // Step2와 동일한 스타일 사용
import commonStyles from './common.module.css';
import RoomViewer3D from '../common/RoomViewer3D';
import StepViewTwoDViewer from '../StepViewTwoDViewer';
import { FiCheck } from 'react-icons/fi';

const Step3Content = ({ formData, errors, handleChange, handleNestedChange, onUpdatePlacementInfo }) => {
  // 2D/3D 모드 전환을 위한 상태 추가
  const [viewerMode, setViewerMode] = useState('2D'); // 기본값을 '2D'로 설정
  const [viewType, setViewType] = useState('front');

  // 프레임 설정 상태 관리
  const [frameSettings, setFrameSettings] = useState({
    left: formData.sizeSettings?.left || 50,
    right: formData.sizeSettings?.right || 50,
    top: formData.sizeSettings?.top || 50
  });

  // 노서라운드 프레임 폭 설정 (2mm 또는 3mm)
  const [noSurroundFrameWidth, setNoSurroundFrameWidth] = useState(3);

  // 현재 포커스된 프레임 필드 상태
  const [focusedFrame, setFocusedFrame] = useState(null);

  // 받침대 설정 상태 관리 (기본값 80mm)
  const [baseHeight, setBaseHeight] = useState(
    formData.baseSettings?.baseHeight || 80
  );

  // 배치 설정 상태 관리
  const [placementType, setPlacementType] = useState(
    formData.placementSettings?.type || 'floor'
  );

  // 띄움 높이 상태 관리
  const [raiseHeight, setRaiseHeight] = useState(
    formData.placementSettings?.raiseHeight || 30
  );

  // 입력 완료 체크 상태
  const [fitOptionSelected, setFitOptionSelected] = useState(formData.fitOption !== '');
  const [baseSettingComplete, setBaseSettingComplete] = useState(true);
  const [placementSettingComplete, setPlacementSettingComplete] = useState(true);

  // 옵션 선택 상태 체크
  useEffect(() => {
    setFitOptionSelected(formData.fitOption !== '');
    setBaseSettingComplete(true); // 기본적으로 완료된 상태로 설정
    setPlacementSettingComplete(placementType === 'floor' || (placementType === 'raised' && raiseHeight > 0));
  }, [formData.fitOption, placementType, raiseHeight]);

  // 맞춤 옵션 변경 핸들러
  const handleFitOptionChange = (option) => {
    handleChange('fitOption', option);
    
    // 맞춤 옵션에 따라 프레임 설정 변경
    if (option === 'tight') {
      // 노서라운드 - 좌우는 기본 3mm 고정 프레임, 상단은 50mm (필드는 비활성화)
      setFrameSettings({
        left: noSurroundFrameWidth,
        right: noSurroundFrameWidth,
        top: 50 // 상단 여백 값을 50mm로 설정
      });
      handleNestedChange('sizeSettings', 'left', noSurroundFrameWidth);
      handleNestedChange('sizeSettings', 'right', noSurroundFrameWidth);
      handleNestedChange('sizeSettings', 'top', 50); // 상단 여백 50mm로 설정
    } else {
      // 서라운드 - 세미 스탠딩 모드인 경우 벽 위치에 따라 설정 조정
      const currentTop = frameSettings.top;
      
      if (formData.spaceInfo.spaceType === 'semi-standing') {
        if (formData.spaceInfo.wallPosition === 'left') {
          // 좌측에 벽이 있는 경우
          // 벽이 있는 쪽(좌측)은 일반 프레임(50mm), 벽이 없는 쪽(우측)은 엔드패널(20mm) 적용
          console.log("세미스탠딩 모드: 좌측 벽 - 좌측 50mm, 우측 20mm 설정");
          handleNestedChange('sizeSettings', 'left', 50); // 벽 측에 일반 프레임 50mm
          handleNestedChange('sizeSettings', 'right', 20); // 우측에 엔드패널(20mm) 적용
          setFrameSettings(prev => ({...prev, left: 50, right: 20}));
          
          // 좌측에 단내림이 있는 경우, 단내림 하부 프레임 길이를 계산
          const hasAirConditioner = formData.spaceInfo?.acUnit?.present === true;
          const acUnitPosition = formData.spaceInfo?.acUnit?.position || 'left';
          const acUnitWidth = formData.spaceInfo?.acUnit?.width || 900;
          if (hasAirConditioner && acUnitPosition === 'left' && acUnitWidth === 900) {
            // 단내림 하부에 생성되는 프레임은 850mm (단내림 900mm - 좌측 프레임 50mm)
            handleNestedChange('acSettings', 'lowerFrameLength', 850);
          }
        } else if (formData.spaceInfo.wallPosition === 'right') {
          // 우측에 벽이 있는 경우
          // 벽이 있는 쪽(우측)은 일반 프레임(50mm), 벽이 없는 쪽(좌측)은 엔드패널(20mm) 적용
          console.log("세미스탠딩 모드: 우측 벽 - 좌측 20mm, 우측 50mm 설정");
          handleNestedChange('sizeSettings', 'left', 20); // 좌측에 엔드패널(20mm) 적용 
          handleNestedChange('sizeSettings', 'right', 50); // 우측 벽에 일반 프레임 50mm
          setFrameSettings(prev => ({...prev, left: 20, right: 50}));
          
          // 우측에 단내림이 있는 경우, 단내림 하부 프레임 길이를 계산
          if (hasAirConditioner && acUnitPosition === 'right' && acUnitWidth === 900) {
            // 단내림 하부에 생성되는 프레임은 850mm (단내림 900mm - 우측 프레임 50mm)
            handleNestedChange('acSettings', 'lowerFrameLength', 850);
          }
        }
      } else if (formData.spaceInfo.spaceType === 'free-standing' || formData.spaceInfo.spaceType === 'standing') {
        // 프리스탠딩/스탠딩 - 양쪽 모두 20mm 패널
        setFrameSettings({
          left: 20,
          right: 20,
          top: currentTop
        });
        handleNestedChange('sizeSettings', 'left', 20);
        handleNestedChange('sizeSettings', 'right', 20);
      } else {
        // 기본 빌트인 - 좌우 50mm, 상단은 유지
        setFrameSettings({
          left: 50,
          right: 50,
          top: currentTop
        });
        handleNestedChange('sizeSettings', 'left', 50);
        handleNestedChange('sizeSettings', 'right', 50);
      }
      
      // 상단 프레임은 항상 변경된 값으로 설정
      handleNestedChange('sizeSettings', 'top', currentTop);
    }
  };

  // 노서라운드 프레임 폭 변경 핸들러
  const handleNoSurroundFrameWidthChange = (width) => {
    const numWidth = parseInt(width, 10);
    setNoSurroundFrameWidth(numWidth);
    
    // 프레임 설정 업데이트
    if (formData.fitOption === 'tight') {
      setFrameSettings({
        left: numWidth,
        right: numWidth,
        top: 50 // 상단 여백 값은 50mm로 유지
      });
      handleNestedChange('sizeSettings', 'left', numWidth);
      handleNestedChange('sizeSettings', 'right', numWidth);
      // 상단 여백 값은 변경하지 않음
    }
  };

  // 프레임 설정 변경 핸들러
  const handleFrameChange = (field, value) => {
    // 세미스탠딩 모드에서 엔드패널 쪽 입력은 무시 (읽기 전용)
    const isReadOnly = 
      (field === 'left' && formData.spaceInfo.spaceType === 'semi-standing' && formData.spaceInfo.wallPosition === 'right') ||
      (field === 'right' && formData.spaceInfo.spaceType === 'semi-standing' && formData.spaceInfo.wallPosition === 'left');
    
    // 읽기 전용 필드인 경우 변경하지 않음
    if (isReadOnly) {
      console.log(`${field} 필드는 읽기 전용입니다 (엔드패널 자동 적용).`);
      return;
    }
    
    // 빈 문자열이거나 숫자인지 확인
    if (value === '' || /^\d+$/.test(value)) {
      console.log(`${field} 필드 값 변경: ${value}`);
      
      // 일단 입력값을 그대로 state에 업데이트
      setFrameSettings(prev => ({
        ...prev,
        [field]: value
      }));
      
      // 빈 값이 아니고 적용할 때만 유효성 검사 수행
      if (value !== '') {
        const numValue = parseInt(value, 10);
        let showError = false;
        let finalValue = numValue;
        
        // 좌우 프레임의 경우 유효범위 체크 (40~100mm)
        if ((field === 'left' || field === 'right') && (numValue < 40 || numValue > 100)) {
          showError = true;
          console.log(`${field} 필드 유효범위 오류: ${numValue}mm (40~100mm 허용)`);
          // 오류 메시지만 표시하고 값은 변경하지 않음
        }
        
        // 오류 메시지 업데이트
        setFrameSettings(prev => ({
          ...prev,
          [`${field}Error`]: showError ? `유효범위는 40~100mm입니다.` : ''
        }));
      
        // 유효한 값일 때만 FormData 업데이트
        if (!showError) {
          handleNestedChange('sizeSettings', field, numValue);
          console.log(`FormData 업데이트: sizeSettings.${field} = ${numValue}`);
          
          // 현재 옵션 생성 (frameSettings에서 값을 가져옴)
          const currentOptions = {
            leftFrameWidth: field === 'left' ? numValue : frameSettings.left,
            rightFrameWidth: field === 'right' ? numValue : frameSettings.right,
            upperFrameWidth: field === 'top' ? numValue : frameSettings.top,
            width: formData.spaceInfo?.width || 4800,
            depth: formData.spaceInfo?.depth || 3000, 
            height: formData.spaceInfo?.height || 2400,
            color: '#FFFFFF',
            floorFinishHeight: formData.spaceInfo?.floorThickness || 20
          };
          
          console.log('모듈 옵션 업데이트:', currentOptions);
          // 옵션 업데이트 - 직접 호출
          handleUpdateModuleOptions(currentOptions);
        }
      }
    }
  };

  // 인풋 필드 선택 및 포커스 핸들러 개선
  const handleInputFocus = (field) => {
    console.log(`Focus on field: ${field}`);
    setFocusedFrame(field);
    // activeDimensionField는 TwoDViewer에서 직접 매핑하므로 여기서는 설정하지 않음
  };

  const handleInputBlur = (field) => {
    console.log(`Blur from field: ${field}`);
    
    // 포커스를 잃을 때 최종 유효성 검사 및 값 적용
    const value = frameSettings[field];
    
    if (value !== '') {
      const numValue = parseInt(value, 10);
      let finalValue = numValue;
      
      // 좌우 프레임의 경우 유효범위 체크 (40~100mm)
      if ((field === 'left' || field === 'right') && (numValue < 40 || numValue > 100)) {
        finalValue = 50; // 범위 밖이면 기본값 50으로 설정
        setFrameSettings(prev => ({
          ...prev,
          [field]: finalValue,
          [`${field}Error`]: ''
        }));
      }
      
      // FormData 업데이트
      handleNestedChange('sizeSettings', field, finalValue);
    }
    
    setFocusedFrame(null);
  };

  // 받침대 설정 변경 핸들러
  const handleBaseToggle = (hasBase) => {
    // 받침대 유무 상태 업데이트
    handleNestedChange('baseSettings', 'hasBase', hasBase);
    
    // 받침대가 없는 경우 높이를 0으로 설정
    if (!hasBase) {
      handleNestedChange('baseSettings', 'baseHeight', 0);
      setBaseHeight(0); // 로컬 상태 업데이트
    } else {
      // 받침대가 있는 경우 기본 높이를 80mm로 설정
      handleNestedChange('baseSettings', 'baseHeight', 80);
      setBaseHeight(80); // 로컬 상태 업데이트
    }
    
    // 업데이트된 상태로 설정
    setBaseSettingComplete(true);
    
    // 즉시 placementInfo 업데이트를 위해 콜백 호출
    if (onUpdatePlacementInfo) {
      const updatedBaseSettings = {
        ...formData.baseSettings,
        hasBase,
        baseHeight: hasBase ? 80 : 0
      };
      
      onUpdatePlacementInfo({
        ...placementInfo,
        hasBase,
        baseHeight: hasBase ? 80 : 0
      });
    }
  };

  const handleBaseHeightChange = (value) => {
    // 입력값이 빈 문자열이거나 숫자인지 확인
    if (value === '' || /^\d+$/.test(value)) {
      setBaseHeight(value);
      
      // 유효성 검사 (50mm ~ 150mm)
      if (value !== '') {
        const numValue = parseInt(value, 10);
        if (numValue >= 50 && numValue <= 150) {
          handleNestedChange('baseSettings', 'baseHeight', numValue);
        }
      }
    }
  };
  
  // 받침대 높이 입력 필드 포커스 핸들러
  const handleBaseHeightFocus = () => {
    setFocusedFrame('baseHeight');
    // 부모 컴포넌트의 handleNestedChange를 통해 focusedFrame 값을 전달
    handleNestedChange('baseSettings', 'focusedFrame', 'baseHeight');
  };
  
  // 받침대 높이 입력 필드 블러 핸들러
  const handleBaseHeightBlur = () => {
    setFocusedFrame(null);
    // 부모 컴포넌트의 handleNestedChange를 통해 focusedFrame 값을 null로 전달
    handleNestedChange('baseSettings', 'focusedFrame', null);
    
    // 값이 범위를 벗어나면 기본값으로 설정
    if (baseHeight === '' || parseInt(baseHeight, 10) < 50 || parseInt(baseHeight, 10) > 150) {
      const defaultHeight = 80;
      setBaseHeight(defaultHeight);
      handleNestedChange('baseSettings', 'baseHeight', defaultHeight);
    }
  };

  // 배치 타입 변경 핸들러
  const handlePlacementTypeChange = (type) => {
    setPlacementType(type);
    handleNestedChange('placementSettings', 'type', type);
  };
  
  // 띄움 높이 변경 핸들러
  const handleRaiseHeightChange = (value) => {
    // 입력값이 빈 문자열이거나 숫자인지 확인
    if (value === '' || /^\d+$/.test(value)) {
      setRaiseHeight(value);
      
      // 폼데이터 업데이트 (유효성 검사 제외)
      if (value !== '') {
        const numValue = parseInt(value, 10);
        
        // 최소 20mm 이상 필요
        if (numValue >= 20) {
          handleNestedChange('placementSettings', 'raiseHeight', numValue);
          setPlacementSettingComplete(true);
        } else {
          setPlacementSettingComplete(false);
        }
      } else {
        setPlacementSettingComplete(false);
      }
    }
  };
  
  // 띄움 높이 포커스 핸들러
  const handleRaiseHeightFocus = () => {
    setFocusedFrame('raiseHeight');
  };
  
  // 띄움 높이 블러 핸들러
  const handleRaiseHeightBlur = () => {
    setFocusedFrame(null);
    
    // 값이 유효하지 않으면 기본값으로 설정
    if (raiseHeight === '' || parseInt(raiseHeight, 10) < 20) {
      const defaultHeight = 30;
      setRaiseHeight(defaultHeight);
      handleNestedChange('placementSettings', 'raiseHeight', defaultHeight);
      setPlacementSettingComplete(true);
    }
  };

  // 컴포넌트 마운트 시 또는 formData 변경 시 기본값 설정
  useEffect(() => {
    // 항상 80mm로 설정
    handleNestedChange('baseSettings', 'baseHeight', 80);
    setBaseHeight(80);
    
    // 초기 프레임 설정값 로드
    setFrameSettings({
      left: formData.sizeSettings?.left || 50,
      right: formData.sizeSettings?.right || 50,
      top: formData.sizeSettings?.top || 50
    });
    
    // 초기 프레임 설정 값이 없을 경우 기본값으로 50mm 설정
    if (!formData.sizeSettings?.left) {
      handleNestedChange('sizeSettings', 'left', 50);
    }
    if (!formData.sizeSettings?.right) {
      handleNestedChange('sizeSettings', 'right', 50);
    }
    if (!formData.sizeSettings?.top) {
      handleNestedChange('sizeSettings', 'top', 50);
    }
    
    // 단내림 정보 확인
    const hasAirConditioner = formData.spaceInfo?.acUnit?.present === true;
    const acUnitPosition = formData.spaceInfo?.acUnit?.position || 'left';
    const acUnitWidth = formData.spaceInfo?.acUnit?.width || 900;
    
    // 스탠딩 타입에 따른 프레임 폭 설정
    if (formData.spaceInfo.spaceType === 'semi-standing') {
      if (formData.spaceInfo.wallPosition === 'left') {
        // 좌측에 벽이 있는 경우
        // 벽이 있는 쪽(좌측)은 일반 프레임(50mm), 벽이 없는 쪽(우측)은 엔드패널(20mm) 적용
        console.log("세미스탠딩 모드: 좌측 벽 - 좌측 50mm, 우측 20mm 설정");
        handleNestedChange('sizeSettings', 'left', 50); // 벽 측에 일반 프레임 50mm
        handleNestedChange('sizeSettings', 'right', 20); // 우측에 엔드패널(20mm) 적용
        setFrameSettings(prev => ({...prev, left: 50, right: 20}));
        
        // 좌측에 단내림이 있는 경우, 단내림 하부 프레임 길이를 계산
        if (hasAirConditioner && acUnitPosition === 'left' && acUnitWidth === 900) {
          // 단내림 하부에 생성되는 프레임은 850mm (단내림 900mm - 좌측 프레임 50mm)
          handleNestedChange('acSettings', 'lowerFrameLength', 850);
        }
      } else if (formData.spaceInfo.wallPosition === 'right') {
        // 우측에 벽이 있는 경우
        // 벽이 있는 쪽(우측)은 일반 프레임(50mm), 벽이 없는 쪽(좌측)은 엔드패널(20mm) 적용
        console.log("세미스탠딩 모드: 우측 벽 - 좌측 20mm, 우측 50mm 설정");
        handleNestedChange('sizeSettings', 'left', 20); // 좌측에 엔드패널(20mm) 적용 
        handleNestedChange('sizeSettings', 'right', 50); // 우측 벽에 일반 프레임 50mm
        setFrameSettings(prev => ({...prev, left: 20, right: 50}));
        
        // 우측에 단내림이 있는 경우, 단내림 하부 프레임 길이를 계산
        if (hasAirConditioner && acUnitPosition === 'right' && acUnitWidth === 900) {
          // 단내림 하부에 생성되는 프레임은 850mm (단내림 900mm - 우측 프레임 50mm)
          handleNestedChange('acSettings', 'lowerFrameLength', 850);
        }
      }
    } else if (formData.spaceInfo.spaceType === 'free-standing' || formData.spaceInfo.spaceType === 'standing') {
      // 프리스탠딩이나 스탠딩인 경우 양쪽 모두 20mm 패널 적용
      console.log("프리스탠딩/스탠딩 모드: 좌우 모두 20mm 설정");
      handleNestedChange('sizeSettings', 'left', 20);
      handleNestedChange('sizeSettings', 'right', 20);
      setFrameSettings(prev => ({...prev, left: 20, right: 20}));
    } else {
      // 빌트인 모드: 좌우 50mm 기본 설정
      console.log("빌트인 모드: 좌우 모두 50mm 기본 설정");
      handleNestedChange('sizeSettings', 'left', 50);
      handleNestedChange('sizeSettings', 'right', 50);
      setFrameSettings(prev => ({...prev, left: 50, right: 50}));
    }

    // 프레임 색상 설정 저장 (에디터로 넘어갈 때 유지하기 위함)
    handleNestedChange('frameSettings', 'color', "#F8F8F8");

    // 모듈 옵션 초기화
    const initialModuleOptions = {
      width: formData.spaceInfo?.width || 4800,
      depth: formData.spaceInfo?.depth || 3000,
      height: formData.spaceInfo?.height || 2400,
      color: '#FFFFFF',
      frameColor: '#F8F8F8', // 프레임 색상 명시적 설정
      floorFinishHeight: formData.spaceInfo?.floorThickness || 20,
      leftFrameWidth: formData.sizeSettings?.left || 50,
      rightFrameWidth: formData.sizeSettings?.right || 50,
      upperFrameWidth: formData.sizeSettings?.top || 50,
      step: 'step3',
      showWalls: formData.spaceInfo.spaceType === 'built-in' // 빌트인일 때만 벽 표시
    };
    
    setModuleOptions(initialModuleOptions);
    
  }, [formData.spaceInfo.spaceType, formData.spaceInfo.wallPosition]);

  const [showDimensions, setShowDimensions] = useState(false);

  // 가구 크기 계산 (3D 모델용)
  const placementInfo = {
    type: formData.spaceInfo?.spaceType || 'built-in',
    wallPosition: formData.spaceInfo?.wallPosition || 'left',
    width: Number(formData.spaceInfo?.width || 4800),
    height: Number(formData.spaceInfo?.height || 2400),
    depth: Number(formData.spaceInfo?.depth || 3000),
    baseHeight: formData.baseSettings?.hasBase ? Number(formData.baseSettings?.baseHeight || 80) : 0,
    hasBase: formData.baseSettings?.hasBase === true,
    raiseHeight: Number(formData.placementSettings?.raiseHeight || 0),
    placementType: formData.placementSettings?.type || 'floor',
    clearance: {
      left: Number(formData.sizeSettings?.left || 50),
      right: Number(formData.sizeSettings?.right || 50),
      top: Number(formData.sizeSettings?.top || 50),
      // frameCutouts logic: Only add AC unit if it exists
      frameCutouts:
        formData.spaceInfo.hasAirConditioner === 'yes'
          ? [
              {
                type: 'acUnit',
                position: formData.spaceInfo.acUnit?.position || 'left',
                width: Number(formData.spaceInfo.acUnit?.width || 900),
                depth: Number(formData.spaceInfo.acUnit?.depth || 200),
                wrapAsMolding: true
              }
            ]
          : [],
    },
    fit: formData.fitOption || 'normal',
    focusedFrame: focusedFrame,
    acUnit:
      formData.spaceInfo.hasAirConditioner === 'yes'
        ? {
            position: formData.spaceInfo.acUnit?.position || 'left',
            width: Number(formData.spaceInfo.acUnit?.width || 900),
            depth: Number(formData.spaceInfo.acUnit?.depth || 200)
          }
        : undefined,
    hasAirConditioner: formData.spaceInfo.hasAirConditioner === 'yes',
    showFrame: true, // 명시적으로 프레임 표시 설정
    isBuiltIn: formData.spaceInfo?.spaceType === 'built-in', // 빌트인 여부 명시적 설정
    showWalls: formData.spaceInfo?.spaceType === 'built-in' // 빌트인일 때만 벽 표시
  };

  // 치수 표시 토글 핸들러
  const toggleDimensions = useCallback(() => {
    setShowDimensions(prev => !prev);
  }, []);

  // 2D 뷰어를 위한 모듈 옵션 상태
  const [moduleOptions, setModuleOptions] = useState({
    width: formData.spaceInfo?.width || 4800,
    depth: formData.spaceInfo?.depth || 3000,
    height: formData.spaceInfo?.height || 2400,
    color: '#FFFFFF',
    floorFinishHeight: formData.spaceInfo?.floorThickness || 20,
    leftFrameWidth: formData.sizeSettings?.left || 50,
    rightFrameWidth: formData.sizeSettings?.right || 50,
    upperFrameWidth: formData.sizeSettings?.top || 50,
    step: 'step3'
  });
  
  // 모듈 옵션 업데이트 핸들러
  const handleUpdateModuleOptions = useCallback((newOptions) => {
    console.log('handleUpdateModuleOptions 호출됨:', newOptions);
    
    // 세미스탠딩 모드일 때 특수 처리
    if (formData.spaceInfo.spaceType === 'semi-standing') {
      if (formData.spaceInfo.wallPosition === 'left') {
        // 좌측 벽이면 좌측 50mm, 우측 20mm로 강제 설정
        newOptions.leftFrameWidth = 50;
        newOptions.rightFrameWidth = 20;
      } else if (formData.spaceInfo.wallPosition === 'right') {
        // 우측 벽이면 좌측 20mm, 우측 50mm로 강제 설정
        newOptions.leftFrameWidth = 20;
        newOptions.rightFrameWidth = 50;
      }
    } else if (formData.spaceInfo.spaceType === 'free-standing' || formData.spaceInfo.spaceType === 'standing') {
      // 프리스탠딩/스탠딩 모드는 양쪽 20mm
      newOptions.leftFrameWidth = 20;
      newOptions.rightFrameWidth = 20;
    }
    
    setModuleOptions(prev => ({
      ...prev,
      ...newOptions,
      frameColor: "#F8F8F8" // 일관된 밝은 회색 프레임 색상 유지
    }));

    // 프레임 설정 상태도 업데이트
    if (newOptions.leftFrameWidth !== undefined) {
      setFrameSettings(prev => ({
        ...prev,
        left: parseInt(newOptions.leftFrameWidth, 10)
      }));
      handleNestedChange('sizeSettings', 'left', parseInt(newOptions.leftFrameWidth, 10));
    }
    
    if (newOptions.rightFrameWidth !== undefined) {
      setFrameSettings(prev => ({
        ...prev,
        right: parseInt(newOptions.rightFrameWidth, 10)
      }));
      handleNestedChange('sizeSettings', 'right', parseInt(newOptions.rightFrameWidth, 10));
    }
    
    if (newOptions.upperFrameWidth !== undefined) {
      setFrameSettings(prev => ({
        ...prev,
        top: parseInt(newOptions.upperFrameWidth, 10)
      }));
      handleNestedChange('sizeSettings', 'top', parseInt(newOptions.upperFrameWidth, 10));
    }
    
    // 프레임 색상 설정 저장 (에디터로 넘어갈 때 유지하기 위함)
    handleNestedChange('frameSettings', 'color', "#F8F8F8");
  }, [handleNestedChange, formData.spaceInfo.spaceType, formData.spaceInfo.wallPosition]);
  
  // 뷰어 모드 전환 핸들러
  const toggleViewerMode = (mode) => {
    setViewerMode(mode);
    handleChange('viewerMode', mode);
  };
  
  // 뷰 타입 변경 핸들러
  const changeViewType = (type) => {
    setViewType(type);
  };
  
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
  
  // formData가 변경될 때 moduleOptions 업데이트
  useEffect(() => {
    setModuleOptions({
      width: formData.spaceInfo?.width || 4800,
      depth: formData.spaceInfo?.depth || 3000,
      height: formData.spaceInfo?.height || 2400,
      color: '#FFFFFF',
      floorFinishHeight: formData.spaceInfo?.floorThickness || 20,
      leftFrameWidth: formData.sizeSettings?.left || 50,
      rightFrameWidth: formData.sizeSettings?.right || 50,
      upperFrameWidth: formData.sizeSettings?.top || 50,
      step: 'step3'
    });
  }, [formData.spaceInfo, formData.sizeSettings]);

  // 캔버스 클릭 시 치수선 강조 초기화
  const resetDimensionField = useCallback(() => {
    setFocusedFrame(null);
    console.log("치수 필드 초기화됨");
  }, []);

  // 3D 뷰어 및 2D 뷰어 렌더링 섹션
  const renderViewer = () => {
    if (viewerMode === '3D') {
      // baseDepth 값이 있는지 확인하고 명시적으로 전달
      const enhancedPlacementInfo = {
        ...placementInfo,
        baseDepth: 580, // 명시적으로 기본값 설정 (기존 코드에서는 580mm로 가정)
        // 에어컨 단내림 정보 명시적으로 전달
        hasAirConditioner: formData.spaceInfo.hasAirConditioner === 'yes',
        acUnit: {
          position: formData.spaceInfo.acUnit?.position || 'left',
          width: Number(formData.spaceInfo.acUnit?.width || 900),
          depth: Number(formData.spaceInfo.acUnit?.depth || 200),
          present: formData.spaceInfo.hasAirConditioner === 'yes'
        }
      };
      
      console.log('3D 뷰어에 전달되는 정보:', enhancedPlacementInfo);
      console.log('현재 포커스된 필드:', focusedFrame); // 디버깅 출력 추가
      
      return (
        <RoomViewer3D
          spaceInfo={{
            ...formData.spaceInfo,
            hasAirConditioner: formData.spaceInfo.hasAirConditioner === 'yes',
            acUnit: {
              position: formData.spaceInfo.acUnit?.position || 'left',
              width: Number(formData.spaceInfo.acUnit?.width || 900),
              depth: Number(formData.spaceInfo.acUnit?.depth || 200),
              present: formData.spaceInfo.hasAirConditioner === 'yes'
            }
          }}
          viewMode="normal"
          placementInfo={enhancedPlacementInfo}
          showFrame={true}
          wallOpacity={1.0}
          frameColor="#F8F8F8"
          frameData={{
            enabled: true,
            color: "#F8F8F8",
            thickness: 20,
            leftWidth: frameSettings.left,
            rightWidth: frameSettings.right,
            topWidth: frameSettings.top
          }}
          viewType="front"
          step={3}
          showWalls={formData.spaceInfo.spaceType === 'built-in'}
          showModuleSlots={true}
          doorCount={8}
          slotStatuses={[]}
          onSlotHover={(slotIndex) => console.log('Slot hover:', slotIndex)}
          onSlotClick={(slotIndex) => console.log('Slot click:', slotIndex)}
          activeField={focusedFrame} // 현재 포커스된 필드 전달
        />
      );
    } else {
      return (
        <StepViewTwoDViewer
          viewType={viewType}
          options={{
            width: formData.spaceInfo?.width || 4800,
            height: formData.spaceInfo?.height || 2400,
            depth: formData.spaceInfo?.depth || 3000,
            color: '#FFFFFF',
            leftFrameWidth: frameSettings.left,
            rightFrameWidth: frameSettings.right,
            upperFrameWidth: frameSettings.top,
            floorFinishHeight: formData.spaceInfo?.floorThickness || 20,
            baseHeight: baseHeight,
            step: 'step3',
            fitOption: formData.fitOption
          }}
          installationType={formData.spaceInfo?.spaceType || 'built-in'}
          wallPosition={formData.spaceInfo?.wallPosition || 'left'}
          hasAirConditioner={formData.spaceInfo.hasAirConditioner === 'yes'}
          acUnitPosition={formData.spaceInfo.acUnit?.position || 'left'}
          acUnitWidth={Number(formData.spaceInfo.acUnit?.width || 900)}
          acUnitDepth={Number(formData.spaceInfo.acUnit?.depth || 200)}
          hasFloorFinish={formData.spaceInfo?.hasFloorFinish === 'yes'}
          floorFinishHeight={formData.spaceInfo?.floorThickness || 20}
          hasBase={baseHeight > 0}
          baseHeight={baseHeight}
          activeDimensionField={focusedFrame === 'left' ? 'leftFrame' : 
                               focusedFrame === 'right' ? 'rightFrame' : 
                               focusedFrame === 'top' ? 'topFrame' : 
                               focusedFrame === 'baseHeight' ? 'baseHeight' : 
                               focusedFrame === 'raiseHeight' ? 'raiseHeight' : null}
          onDimensionFieldReset={() => setFocusedFrame(null)}
          hideViewButtons={true} // 정면도/우측면도 버튼 숨기기
          showWalls={formData.spaceInfo.spaceType === 'built-in'} // 빌트인 모드일 때 벽 표시
        />
      );
    }
  };

  return (
    <div className={styles.step2Container} style={{ gap: '0' }}>
      <div className={styles.containerLeft} style={{ padding: '0', flex: '6' }}>
        {/* 뷰어 컨테이너 */}
        <div className={commonStyles.viewerContainer} style={{ border: 'none', outline: 'none', height: '100%', position: 'relative' }}>
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
          
          {/* 현재 모드에 따라 적절한 뷰어 컴포넌트 렌더링 */}
          {renderViewer()}
        </div>
      </div>
      
      <div className={styles.containerRight} style={{ flex: '4', padding: '0 15px' }}>
        <h2 className={styles.stepTitle}>
          <span className={styles.stepNumber}>STEP 3</span>
          <span className={styles.stepDescription}>옷장 배치 설정</span>
        </h2>
        
        <div className={styles.formSection} style={{ padding: '15px 0' }}>
          {/* 맞춤 옵션 */}
          <div className={commonStyles.section}>
            <h3 className={commonStyles.categoryTitle} style={{ display: 'flex', alignItems: 'center' }}>
              맞춤 옵션
              {fitOptionSelected && (
                <span style={{ marginLeft: '8px', color: '#00C092' }}>
                  <FiCheck size={16} />
                </span>
              )}
            </h3>
            <div className={styles.toggleButtonGroup}>
              <button
                className={`${styles.toggleButton} ${formData.fitOption === 'tight' ? styles.toggleButtonActive : ''}`}
                onClick={() => handleFitOptionChange('tight')}
                style={{ outline: 'none' }}
              >
                노서라운드 (타이트)
              </button>
              <button
                className={`${styles.toggleButton} ${formData.fitOption === 'normal' ? styles.toggleButtonActive : ''}`}
                onClick={() => handleFitOptionChange('normal')}
                style={{ outline: 'none' }}
              >
                서라운드 (일반)
              </button>
            </div>
          </div>
          
          {/* 프레임 설정 - 맞춤 옵션에 따라 다른 UI 제공 */}
          <div className={commonStyles.section} style={{ marginBottom: '10px' }}>
            <h3 className={commonStyles.categoryTitle} style={{ marginBottom: '4px' }}>{formData.fitOption === 'tight' ? '이격거리 설정' : '프레임 설정'}</h3>
            
            {formData.fitOption === 'normal' ? (
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {formData.spaceInfo.spaceType === 'free-standing' || formData.spaceInfo.spaceType === 'standing' ? (
                  <div className={commonStyles.fieldGroup} style={{ width: '100%', marginBottom: '4px' }}>
                    <label className={commonStyles.label} style={{ marginBottom: '2px' }}>상단 (mm)</label>
                    <input
                      type="number"
                      min="40"
                      max="100"
                      value={frameSettings.top}
                      onChange={(e) => handleFrameChange('top', e.target.value)}
                      className={commonStyles.inputField}
                      onFocus={() => handleInputFocus('top')}
                      onBlur={() => handleInputBlur('top')}
                    />
                    <p className={commonStyles.description} style={{ fontSize: '10px', lineHeight: '1.1', marginTop: '1px' }}>
                      {formData.spaceInfo.spaceType === 'free-standing' ? 
                        '좌우측 프레임은 폭 20mm, 깊이 580mm 패널로 자동 적용됩니다.' : 
                        '스탠딩 모드에서는 좌우 프레임이 폭 20mm, 깊이 580mm 패널로 자동 적용됩니다.'}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* 좌측 여백 - 세미 스탠딩의 좌측 벽 위치일 경우 프레임, 우측 벽 위치일 경우 엔드패널 */}
                    <div style={{ flex: '1' }}>
                      <div className={commonStyles.fieldGroup} style={{ marginBottom: '4px' }}>
                        <label className={commonStyles.label} style={{ marginBottom: '2px' }}>
                          {formData.spaceInfo.spaceType === 'semi-standing' && formData.spaceInfo.wallPosition === 'left' 
                            ? '좌측(벽) (mm)' 
                            : formData.spaceInfo.spaceType === 'semi-standing' && formData.spaceInfo.wallPosition === 'right'
                              ? '좌측(엔드패널) (mm)'
                              : '좌측 (mm)'}
                        </label>
                        <input
                          type="number"
                          min="40"
                          max="100"
                          value={frameSettings.left}
                          onChange={(e) => handleFrameChange('left', e.target.value)}
                          className={`${commonStyles.inputField} ${(formData.spaceInfo.spaceType === 'semi-standing' && formData.spaceInfo.wallPosition === 'right') ? commonStyles.readonlyInput : ''}`}
                          onFocus={() => handleInputFocus('left')}
                          onBlur={() => handleInputBlur('left')}
                          disabled={formData.spaceInfo.spaceType === 'semi-standing' && formData.spaceInfo.wallPosition === 'right'}
                        />
                        {frameSettings.leftError && (
                          <p className={commonStyles.errorText} style={{ fontSize: '10px', marginTop: '1px' }}>
                            {frameSettings.leftError}
                          </p>
                        )}
                        {formData.spaceInfo.spaceType === 'semi-standing' && formData.spaceInfo.wallPosition === 'left' && (
                          <p className={commonStyles.description} style={{ fontSize: '10px', lineHeight: '1.1', marginTop: '1px' }}>
                            좌측 벽에 붙어있음 (50mm 프레임 적용)
                          </p>
                        )}
                        {formData.spaceInfo.spaceType === 'semi-standing' && formData.spaceInfo.wallPosition === 'right' && (
                          <p className={commonStyles.description} style={{ fontSize: '10px', lineHeight: '1.1', marginTop: '1px' }}>
                            좌측은 열린 공간 (20mm 엔드패널 자동 적용)
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div style={{ flex: '1' }}>
                      <div className={commonStyles.fieldGroup} style={{ marginBottom: '4px' }}>
                        <label className={commonStyles.label} style={{ marginBottom: '2px' }}>
                          {formData.spaceInfo.spaceType === 'semi-standing' && formData.spaceInfo.wallPosition === 'right' 
                            ? '우측(벽) (mm)' 
                            : formData.spaceInfo.spaceType === 'semi-standing' && formData.spaceInfo.wallPosition === 'left'
                              ? '우측(엔드패널) (mm)'
                              : '우측 (mm)'}
                        </label>
                        <input
                          type="number"
                          min="40"
                          max="100"
                          value={frameSettings.right}
                          onChange={(e) => handleFrameChange('right', e.target.value)}
                          className={`${commonStyles.inputField} ${(formData.spaceInfo.spaceType === 'semi-standing' && formData.spaceInfo.wallPosition === 'left') ? commonStyles.readonlyInput : ''}`}
                          onFocus={() => handleInputFocus('right')}
                          onBlur={() => handleInputBlur('right')}
                          disabled={formData.spaceInfo.spaceType === 'semi-standing' && formData.spaceInfo.wallPosition === 'left'}
                        />
                        {frameSettings.rightError && (
                          <p className={commonStyles.errorText} style={{ fontSize: '10px', marginTop: '1px' }}>
                            {frameSettings.rightError}
                          </p>
                        )}
                        {formData.spaceInfo.spaceType === 'semi-standing' && formData.spaceInfo.wallPosition === 'right' && (
                          <p className={commonStyles.description} style={{ fontSize: '10px', lineHeight: '1.1', marginTop: '1px' }}>
                            우측 벽에 붙어있음 (50mm 프레임 적용)
                          </p>
                        )}
                        {formData.spaceInfo.spaceType === 'semi-standing' && formData.spaceInfo.wallPosition === 'left' && (
                          <p className={commonStyles.description} style={{ fontSize: '10px', lineHeight: '1.1', marginTop: '1px' }}>
                            우측은 열린 공간 (20mm 엔드패널 자동 적용)
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* 상단 여백 필드 - 모든 경우에 표시 */}
                    <div style={{ flex: '1' }}>
                      <div className={commonStyles.fieldGroup} style={{ marginBottom: '4px' }}>
                        <label className={commonStyles.label} style={{ marginBottom: '2px' }}>상단 (mm)</label>
                        <input
                          type="number"
                          min="40"
                          max="100"
                          value={frameSettings.top}
                          onChange={(e) => handleFrameChange('top', e.target.value)}
                          className={commonStyles.inputField}
                          onFocus={() => handleInputFocus('top')}
                          onBlur={() => handleInputBlur('top')}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                  노서라운드 옵션 선택 시 이격거리를 선택해주세요:
                </p>
                <div className={styles.toggleButtonGroup} style={{ marginBottom: '4px' }}>
                  <button
                    className={`${styles.toggleButton} ${noSurroundFrameWidth === 2 ? styles.toggleButtonActive : ''}`}
                    onClick={() => handleNoSurroundFrameWidthChange(2)}
                  >
                    2mm
                  </button>
                  <button
                    className={`${styles.toggleButton} ${noSurroundFrameWidth === 3 ? styles.toggleButtonActive : ''}`}
                    onClick={() => handleNoSurroundFrameWidthChange(3)}
                  >
                    3mm
                  </button>
                </div>
                {(formData.spaceInfo.spaceType === 'semi-standing' || formData.spaceInfo.spaceType === 'free-standing' || formData.spaceInfo.spaceType === 'standing') && (
                  <p className={commonStyles.description} style={{ fontSize: '10px', lineHeight: '1.1', marginTop: '1px' }}>
                    {formData.spaceInfo.spaceType === 'semi-standing' ? 
                      '벽이 트여있는쪽 프레임은 폭 20mm, 깊이 580mm 패널로 적용됩니다.' :
                      '좌우측 프레임은 폭 20mm, 깊이 580mm 패널로 자동 적용됩니다.'}
                  </p>
                )}
                
                <h4 className={commonStyles.categoryTitle} style={{ marginTop: '8px', marginBottom: '4px' }}>프레임 설정</h4>
                <div className={commonStyles.fieldGroup} style={{ marginBottom: '4px' }}>
                  <label className={commonStyles.label} style={{ marginBottom: '2px' }}>상단 (mm)</label>
                  <input
                    type="number"
                    min="40"
                    max="100"
                    value={frameSettings.top}
                    onChange={(e) => handleFrameChange('top', e.target.value)}
                    className={commonStyles.inputField}
                    onFocus={() => handleInputFocus('top')}
                    onBlur={() => handleInputBlur('top')}
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* 받침대 설정 */}
          <div className={commonStyles.section} style={{ marginBottom: '8px' }}>
            <h3 className={commonStyles.categoryTitle} style={{ display: 'flex', alignItems: 'center', marginBottom: '3px' }}>
              받침대 설정
              {baseSettingComplete && (
                <span style={{ marginLeft: '8px', color: '#00C092' }}>
                  <FiCheck size={16} />
                </span>
              )}
            </h3>
            <div className={styles.toggleButtonGroup} style={{ marginBottom: '4px' }}>
              <button
                className={`${styles.toggleButton} ${formData.baseSettings.hasBase ? styles.toggleButtonActive : ''}`}
                onClick={() => handleBaseToggle(true)}
                style={{ outline: 'none' }}
              >
                받침대 있음
              </button>
              <button
                className={`${styles.toggleButton} ${!formData.baseSettings.hasBase ? styles.toggleButtonActive : ''}`}
                onClick={() => handleBaseToggle(false)}
                style={{ outline: 'none' }}
              >
                받침대 없음
              </button>
            </div>
            
            {formData.baseSettings.hasBase && (
              <div className={commonStyles.fieldGroup} style={{ marginBottom: '4px' }}>
                <label className={commonStyles.label} style={{ marginBottom: '2px' }}>받침대 높이 (mm)</label>
                <input
                  type="number"
                  min="50"
                  max="150"
                  value={baseHeight}
                  onChange={(e) => handleBaseHeightChange(e.target.value)}
                  className={commonStyles.inputField}
                  placeholder="80"
                  onFocus={() => handleBaseHeightFocus()}
                  onBlur={() => handleBaseHeightBlur()}
                  style={{ height: '36px', boxSizing: 'border-box' }}
                />
                <p className={commonStyles.description} style={{ fontSize: '10px', lineHeight: '1.1', marginTop: '1px' }}>
                  받침대는 프레임 내부에 위치하며, 뒷벽에서부터 580mm 깊이로 생성됩니다.
                </p>
              </div>
            )}
          </div>
          
          {/* 배치 설정 - 받침대가 없을 때만 표시 */}
          {!formData.baseSettings.hasBase && (
            <div className={commonStyles.section} style={{ marginBottom: '10px' }}>
              <h3 className={commonStyles.categoryTitle} style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                배치 설정
                {placementSettingComplete && (
                  <span style={{ marginLeft: '8px', color: '#00C092' }}>
                    <FiCheck size={16} />
                  </span>
                )}
              </h3>
              <div className={styles.toggleButtonGroup} style={{ marginBottom: '4px' }}>
                <button
                  className={`${styles.toggleButton} ${placementType === 'floor' ? styles.toggleButtonActive : ''}`}
                  onClick={() => handlePlacementTypeChange('floor')}
                >
                  바닥에 배치
                </button>
                <button
                  className={`${styles.toggleButton} ${placementType === 'raised' ? styles.toggleButtonActive : ''}`}
                  onClick={() => handlePlacementTypeChange('raised')}
                >
                  띄워서 배치
                </button>
              </div>
              
              {placementType === 'raised' && (
                <div className={commonStyles.fieldGroup} style={{ marginBottom: '4px' }}>
                  <label className={commonStyles.label} style={{ marginBottom: '2px' }}>띄움 높이 (mm)</label>
                  <input
                    type="number"
                    min="20"
                    value={raiseHeight}
                    onChange={(e) => handleRaiseHeightChange(e.target.value)}
                    className={commonStyles.inputField}
                    placeholder="30"
                    onFocus={() => handleRaiseHeightFocus()}
                    onBlur={() => handleRaiseHeightBlur()}
                  />
                  <p className={commonStyles.description} style={{ fontSize: '10px', lineHeight: '1.1', marginTop: '1px' }}>
                    바닥으로부터 옷장이 띄워지는 높이입니다.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Step3Content; 
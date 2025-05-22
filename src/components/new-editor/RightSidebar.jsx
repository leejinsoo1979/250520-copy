import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Minus, Plus, ChevronRight, ChevronLeft, ChevronDown } from "lucide-react";
import { useEditor } from '@context/EditorContext';
import { Slider, Radio } from 'antd';

// cn utility 함수 추가 (좌측바와 동일)
const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

// 단내림 관련 상수 정의
const DEFAULT_AC_UNIT_WIDTH = 900; // 단내림 기본 폭(mm)
const DEFAULT_AC_UNIT_HEIGHT = 200; // 단내림 기본 높이(mm)

// 기본 프레임 속성 정의
const defaultFrameProperties = {
  left: { width: 50, depth: 20, height: 2400 },
  right: { width: 50, depth: 20, height: 2400 },
  top: { width: 4600, depth: 20, height: 50 },
  bottom: { width: 4600, depth: 580, height: 80 },
  endPanelLeft: { width: 20, depth: 580, height: 2400, visible: false },
  endPanelRight: { width: 20, depth: 580, height: 2400, visible: false }
};

// DimensionInput 컴포넌트 - +/- 버튼 및 입력 필드
const DimensionInput = ({
  label,
  value,
  onChange,
  unit = "",
  min = 0,
  max = 10000,
  step = 10,
}) => {
  // 입력 중인 임시 값을 저장하는 상태 추가
  const [inputValue, setInputValue] = useState(value);

  // 컴포넌트가 마운트되거나 외부 value가 변경되면 inputValue 동기화
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // 입력 필드 값 변경 핸들러 - 임시 값만 업데이트
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  // 입력 완료 시 값 적용 핸들러
  const handleInputCommit = () => {
    const newValue = parseInt(inputValue, 10);
    // 유효한 숫자인지 확인
    if (!isNaN(newValue)) {
      // 최소값과 최대값 범위 내에서 값을 설정
      const clampedValue = Math.min(Math.max(newValue, min), max);
      onChange(clampedValue);
    } else {
      // 유효하지 않은 입력 시 원래 값으로 복원
      setInputValue(value);
    }
  };

  // 키 입력 핸들러 - Enter 키 처리
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleInputCommit();
    }
  };

  return (
    <div className="flex items-center my-3">
      <div className="w-14 text-sm text-gray-600">{label}</div>
      <div className="flex-1 flex items-center justify-end">
          <button
          className="h-6 w-6 flex items-center justify-center text-gray-600 border border-gray-300 rounded-[2px]"
            onClick={() => onChange(Math.max(min, value - 1))}
          >
          <Minus size={14} />
          </button>
        <div className="mx-2 w-28 flex justify-end border border-gray-300 rounded-[2px] bg-gray-50">
          <input
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputCommit}
            onKeyDown={handleKeyDown}
            min={min}
            max={max}
            className="w-full bg-transparent text-sm text-gray-500 text-right pr-2 outline-none"
          />
        </div>
          <button
          className="h-6 w-6 flex items-center justify-center text-gray-600 border border-gray-300 rounded-[2px]"
            onClick={() => onChange(Math.min(max, value + 1))}
          >
          <Plus size={14} />
          </button>
      </div>
    </div>
  );
};

// 도어 개수 선택 컴포넌트
const DoorCountInput = ({
  label,
  value,
  onChange,
  min = 1,
  max = 12,
  spaceWidth,
  spaceType, // 스페이스 타입 props 추가
}) => {
  const [inputValue, setInputValue] = useState(value.toString());
  const [slotLimits, setSlotLimits] = useState({ min: 2, max: 8 });
  const [calculatedSlots, setCalculatedSlots] = useState([]);
  const [currentSlotInfo, setCurrentSlotInfo] = useState(null);
  // 드래그 관련 상태 추가
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);
  
  // debounce를 위한 타이머 참조 저장
  const timerRef = useRef(null);

  // 컴포넌트가 마운트되거나 외부 value가 변경되면 inputValue 동기화
  useEffect(() => {
    console.log('DoorCountInput: 외부 value 변경됨 -', value);
    setInputValue(value.toString());
    
    // 컴포넌트 언마운트 시 타이머 정리
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [value]);
  
  // spaceWidth가 변경될 때만 제한값 계산 - useRef로 불필요한 렌더링 방지
  const lastWidthRef = useRef(spaceWidth);
  const lastValueRef = useRef(value);
  
  useEffect(() => {
    // 너비 또는 도어 개수가 변경되지 않았으면 실행하지 않음
    if (!spaceWidth || (spaceWidth === lastWidthRef.current && value === lastValueRef.current)) return;
    
    // 참조 값 업데이트
    lastWidthRef.current = spaceWidth;
    lastValueRef.current = value;
    
    // 슬롯 제한 계산 - 내경을 바르게 계산
    let innerWidth;
    
    if (typeof spaceType === 'undefined') {
      // 기본값 (빌트인)
      innerWidth = spaceWidth - 100;
    } else if (spaceType === "built-in") {
      innerWidth = spaceWidth - 100; // 빌트인: 전체 폭 - (좌우 프레임 폭 각 50mm)
    } else if (spaceType === "semi-standing") {
      innerWidth = spaceWidth - 70; // 세미스탠딩: 전체 폭 - (한쪽 프레임 50mm + 엔드판넬 20mm)
    } else {
      innerWidth = spaceWidth - 40; // 프리스탠딩: 전체 폭 - (좌,우 엔드판넬 각 20mm)
    }
    
    // 슬롯 너비 제한 값 (mm)
    const MIN_SLOT_WIDTH = 300;
    const MAX_SLOT_WIDTH = 600;
    
    // 최대 슬롯 개수: 내경 너비를 최소 슬롯 너비로 나눈 값 (내림)
    const maxPossibleSlots = Math.floor(innerWidth / MIN_SLOT_WIDTH);
    
    // 최소 슬롯 개수: 내경 너비를 최대 슬롯 너비로 나눈 값 (올림)
    const minRequiredSlots = Math.ceil(innerWidth / MAX_SLOT_WIDTH);
    
    const minSlots = Math.max(1, minRequiredSlots);
    const maxSlots = Math.max(maxPossibleSlots, 1);
    
    // 현재 값이 새 범위를 벗어나면 자동으로 조정 (최소값으로)
    if (value < minSlots || value > maxSlots) {
      console.log(`DoorCountInput: 공간 크기 변경으로 도어 개수 자동 조정 (${value} → ${minSlots}), 내경: ${innerWidth}mm`);
      // 값을 즉시 조정하고 단일 렌더링만 유발
      onChange(minSlots);
    }
  }, [spaceWidth, spaceType, value, onChange]);

  // 입력 필드 값 변경 핸들러 - 임시 값만 업데이트
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  // 최소 및 최대 슬롯 개수 계산
  const calculateSlotLimits = (width) => {
    // 슬롯 너비 제한 값 (mm)
    const MIN_SLOT_WIDTH = 300;
    const MAX_SLOT_WIDTH = 600;
    
    // 최대 슬롯 개수: 내경 너비를 최소 슬롯 너비로 나눈 값 (내림)
    const maxPossibleSlots = Math.floor(width / MIN_SLOT_WIDTH);
    
    // 최소 슬롯 개수: 내경 너비를 최대 슬롯 너비로 나눈 값 (올림)
    const minRequiredSlots = Math.ceil(width / MAX_SLOT_WIDTH);
    
    return {
      min: Math.max(1, minRequiredSlots), // 최소 1개
      max: Math.max(maxPossibleSlots, 1), // 최소 1개
    };
  };

  // 현재 너비에 대한 슬롯 제한 계산 - 설치 타입에 따라 내경 계산
  const getSlotLimits = () => {
    if (!spaceWidth) {
      return { min, max };
    }
    
    // 내경 계산 (설치 타입에 따라 다르게 계산)
    let innerWidth;
    
    if (typeof spaceType === 'undefined') {
      // 기본값 (빌트인)
      innerWidth = spaceWidth - 100;
    } else if (spaceType === "built-in") {
      innerWidth = spaceWidth - 100; // 빌트인: 전체 폭 - (좌우 프레임 폭 각 50mm)
    } else if (spaceType === "semi-standing") {
      innerWidth = spaceWidth - 70; // 세미스탠딩: 전체 폭 - (한쪽 프레임 50mm + 엔드판넬 20mm)
    } else {
      innerWidth = spaceWidth - 40; // 프리스탠딩: 전체 폭 - (좌,우 엔드판넬 각 20mm)
    }
    
    // 내경 기준으로 슬롯 제한 계산
    const { min: calculatedMin, max: calculatedMax } = calculateSlotLimits(innerWidth);
    
    console.log(`도어 개수 제한: ${calculatedMin}개 ~ ${calculatedMax}개 (내경 ${innerWidth}mm 기준)`);
    
    return {
      min: calculatedMin,
      max: calculatedMax,
    };
  };
  
  // 도어 개수 제한 계산
  const calculatedSlotLimits = getSlotLimits();

  // 입력 완료 시 값 적용 핸들러
  const handleInputCommit = () => {
    console.log('DoorCountInput: 입력 커밋 -', inputValue);
    
    const newValue = parseInt(inputValue, 10);
    // 유효한 숫자인지 확인
    if (!isNaN(newValue)) {
      // 최소값과 최대값 범위 내에서 값을 설정
      const clampedValue = Math.min(Math.max(newValue, calculatedSlotLimits.min), calculatedSlotLimits.max);
      
      // 값이 조정되었으면 로그 출력
      if (clampedValue !== newValue) {
        console.log(`DoorCountInput: 입력값(${newValue})이 유효 범위를 벗어나 ${clampedValue}로 조정됨`);
      }
      
      // 값이 실제로 변경되었을 때만 onChange 호출
      if (clampedValue !== value) {
        console.log('DoorCountInput: 최종 값 업데이트 -', clampedValue);
        onChange(clampedValue);
      } else {
        console.log('DoorCountInput: 값 변경 없음 -', clampedValue);
      }
    } else {
      // 유효하지 않은 입력 시 원래 값으로 복원
      console.log('DoorCountInput: 유효하지 않은 입력, 원래 값으로 복원 -', value);
      setInputValue(value.toString());
    }
  };

  // 키 입력 핸들러 - Enter 키 처리
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      console.log('DoorCountInput: Enter 키 입력');
      handleInputCommit();
    }
  };
  
  // 도어 개수 증가 버튼 핸들러
  const handleIncrement = () => {
    const newValue = Math.min(calculatedSlotLimits.max, value + 1);
    if (newValue !== value) {
      console.log('DoorCountInput: 증가 버튼 클릭, 값 업데이트 -', newValue);
      onChange(newValue);
    }
  };
  
  // 도어 개수 감소 버튼 핸들러
  const handleDecrement = () => {
    const newValue = Math.max(calculatedSlotLimits.min, value - 1);
    if (newValue !== value) {
      console.log('DoorCountInput: 감소 버튼 클릭, 값 업데이트 -', newValue);
      onChange(newValue);
    }
  };
  
  // 슬라이더 변경 핸들러
  const handleSliderChange = (e) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue)) {
      console.log('DoorCountInput: 슬라이더 값 변경 -', newValue);
      onChange(newValue);
    }
  };
  
  // 드래그 시작 핸들러
  const handleThumbMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
    
    // 전역 이벤트 리스너 등록
    document.addEventListener('mousemove', handleThumbMouseMove);
    document.addEventListener('mouseup', handleThumbMouseUp);
    document.addEventListener('touchmove', handleThumbTouchMove);
    document.addEventListener('touchend', handleThumbTouchEnd);
  }, []);
  
  // 드래그 이동 핸들러 (마우스용)
  const handleThumbMouseMove = useCallback((e) => {
    if (!isDragging || !sliderRef.current) return;
    
    const sliderRect = sliderRef.current.getBoundingClientRect();
    const sliderWidth = sliderRect.width;
    const offsetX = e.clientX - sliderRect.left;
    
    // 위치를 0~1 사이의 비율로 계산
    let ratio = Math.max(0, Math.min(1, offsetX / sliderWidth));
    
    // 비율을 기반으로 값 계산
    const range = calculatedSlotLimits.max - calculatedSlotLimits.min;
    const newValue = Math.round(ratio * range) + calculatedSlotLimits.min;
    
    // 값이 변경되었을 때만 onChange 호출
    if (newValue !== value) {
      onChange(newValue);
    }
  }, [isDragging, calculatedSlotLimits, value, onChange]);
  
  // 드래그 이동 핸들러 (터치용)
  const handleThumbTouchMove = useCallback((e) => {
    if (!isDragging || !sliderRef.current) return;
    
    const touch = e.touches[0];
    const sliderRect = sliderRef.current.getBoundingClientRect();
    const sliderWidth = sliderRect.width;
    const offsetX = touch.clientX - sliderRect.left;
    
    // 위치를 0~1 사이의 비율로 계산
    let ratio = Math.max(0, Math.min(1, offsetX / sliderWidth));
    
    // 비율을 기반으로 값 계산
    const range = calculatedSlotLimits.max - calculatedSlotLimits.min;
    const newValue = Math.round(ratio * range) + calculatedSlotLimits.min;
    
    // 값이 변경되었을 때만 onChange 호출
    if (newValue !== value) {
      onChange(newValue);
    }
  }, [isDragging, calculatedSlotLimits, value, onChange]);
  
  // 드래그 종료 핸들러
  const handleThumbMouseUp = useCallback(() => {
    setIsDragging(false);
    
    // 전역 이벤트 리스너 제거
    document.removeEventListener('mousemove', handleThumbMouseMove);
    document.removeEventListener('mouseup', handleThumbMouseUp);
    document.removeEventListener('touchmove', handleThumbTouchMove);
    document.removeEventListener('touchend', handleThumbTouchEnd);
  }, []);
  
  // 터치 종료 핸들러
  const handleThumbTouchEnd = useCallback(() => {
    setIsDragging(false);
    
    // 전역 이벤트 리스너 제거
    document.removeEventListener('mousemove', handleThumbMouseMove);
    document.removeEventListener('mouseup', handleThumbMouseUp);
    document.removeEventListener('touchmove', handleThumbTouchMove);
    document.removeEventListener('touchend', handleThumbTouchEnd);
  }, []);
  
  // 컴포넌트 언마운트 시 이벤트 리스너 정리
  useEffect(() => {
    // isDragging 상태가 변경될 때마다 이벤트 리스너 설정
    if (isDragging) {
      document.addEventListener('mousemove', handleThumbMouseMove);
      document.addEventListener('mouseup', handleThumbMouseUp);
      document.addEventListener('touchmove', handleThumbTouchMove);
      document.addEventListener('touchend', handleThumbTouchEnd);
    } else {
      document.removeEventListener('mousemove', handleThumbMouseMove);
      document.removeEventListener('mouseup', handleThumbMouseUp);
      document.removeEventListener('touchmove', handleThumbTouchMove);
      document.removeEventListener('touchend', handleThumbTouchEnd);
    }
    
    // 컴포넌트 언마운트 시 정리
    return () => {
      document.removeEventListener('mousemove', handleThumbMouseMove);
      document.removeEventListener('mouseup', handleThumbMouseUp);
      document.removeEventListener('touchmove', handleThumbTouchMove);
      document.removeEventListener('touchend', handleThumbTouchEnd);
    };
  }, [isDragging, handleThumbMouseMove, handleThumbMouseUp, handleThumbTouchMove, handleThumbTouchEnd]);
  
  // 도어 개수 변경 시 슬롯 너비 계산 (미리보기용)
  const getSlotWidthInfo = () => {
    if (!spaceWidth) return null;
    
    // 내경 계산 (설치 타입에 따라 다르게 계산)
    let innerWidth;
    
    if (typeof spaceType === 'undefined') {
      // 기본값 (빌트인)
      innerWidth = spaceWidth - 100;
    } else if (spaceType === "built-in") {
      innerWidth = spaceWidth - 100; // 빌트인: 전체 폭 - (좌우 프레임 폭 각 50mm)
    } else if (spaceType === "semi-standing") {
      innerWidth = spaceWidth - 70; // 세미스탠딩: 전체 폭 - (한쪽 프레임 50mm + 엔드판넬 20mm)
    } else {
      innerWidth = spaceWidth - 40; // 프리스탠딩: 전체 폭 - (좌,우 엔드판넬 각 20mm)
    }
    
    // 슬롯 너비 계산
    const slotWidth = Math.round(innerWidth / value);
    
    // 300~600mm 범위 내인지 확인
    const isValid = slotWidth >= 300 && slotWidth <= 600;
    
    return {
      width: slotWidth,
      isValid,
    };
  };
  
  // 현재 입력값의 슬롯 너비 계산
  const calculatedSlotInfo = getSlotWidthInfo();
  
  return (
    <div className="flex flex-col my-3">
      <div className="flex items-center">
        <div className="w-14 text-sm text-gray-600">{label}</div>
        <div className="flex-1 flex items-center justify-end">
          <button
            className="h-6 w-6 flex items-center justify-center text-gray-600 border border-gray-300 rounded-[2px]"
            onClick={handleDecrement}
            disabled={value <= calculatedSlotLimits.min}
          >
            <Minus size={14} />
          </button>
          <div className="mx-2 w-28 flex justify-end border border-gray-300 rounded-[2px] bg-gray-50">
            <input
              type="number"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputCommit}
              onKeyDown={handleKeyDown}
              min={calculatedSlotLimits.min}
              max={calculatedSlotLimits.max}
              className="w-full bg-transparent text-sm text-gray-500 text-right pr-2 outline-none"
            />
          </div>
          <button
            className="h-6 w-6 flex items-center justify-center text-gray-600 border border-gray-300 rounded-[2px]"
            onClick={handleIncrement}
            disabled={value >= calculatedSlotLimits.max}
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
      
      {/* 슬라이더 추가 */}
      <div className="mt-3">
        <div className="relative w-full">
          {/* 슬라이더 배경과 분절 마크 */}
          <div ref={sliderRef} className="w-full h-1 bg-gray-200 rounded-lg relative">
            {/* 분절 세로 라인 표시 */}
            {Array.from({ length: calculatedSlotLimits.max - calculatedSlotLimits.min + 1 }).map((_, index) => (
              <div 
                key={index} 
                className={`absolute top-0 w-[1px] h-3 -translate-y-1 ${
                  index + calculatedSlotLimits.min === value ? 'bg-emerald-500' : 'bg-gray-400'
                }`}
                style={{ 
                  left: `${index * (100 / (calculatedSlotLimits.max - calculatedSlotLimits.min))}%`,
                  transform: 'translateX(-50%) translateY(-1px)',
                  opacity: index + calculatedSlotLimits.min === value ? 1 : 0.5
                }}
              />
            ))}
            
            {/* 활성화된 영역 표시 (슬라이더 현재 값까지의 색상) */}
            <div 
              className="absolute top-0 left-0 h-1 bg-emerald-500 rounded-l-lg" 
              style={{ 
                width: `${((value - calculatedSlotLimits.min) / (calculatedSlotLimits.max - calculatedSlotLimits.min)) * 100}%`,
                borderTopRightRadius: value === calculatedSlotLimits.max ? '0.5rem' : '0',
                borderBottomRightRadius: value === calculatedSlotLimits.max ? '0.5rem' : '0'
              }}
            />

            {/* 점 표시 - 현재 선택된 값에만 표시 */}
            <div 
              className="absolute top-0 w-4 h-4 rounded-full border-2 border-white bg-emerald-500 cursor-pointer"
              style={{ 
                left: `${((value - calculatedSlotLimits.min) / (calculatedSlotLimits.max - calculatedSlotLimits.min)) * 100}%`,
                transform: 'translateX(-50%) translateY(-6px)',
                zIndex: 10
              }}
              onMouseDown={handleThumbMouseDown}
              onTouchStart={handleThumbMouseDown}
            />
          </div>
          
          {/* 슬라이더 인풋 */}
          <input
            type="range"
            min={calculatedSlotLimits.min}
            max={calculatedSlotLimits.max}
            value={value}
            onChange={handleSliderChange}
            className="w-full h-2 absolute top-0 left-0 opacity-0 cursor-pointer"
          />
        </div>
        
        {/* 도어 개수 눈금 표시 */}
        <div className="relative w-full mt-1 mb-2 px-1">
          {Array.from({ length: calculatedSlotLimits.max - calculatedSlotLimits.min + 1 }).map((_, index) => (
            <div 
              key={index} 
              className={`absolute text-xs ${
                index + calculatedSlotLimits.min === value ? 'text-emerald-600 font-medium' : 'text-gray-500'
              }`}
              style={{ 
                left: `${index * (100 / (calculatedSlotLimits.max - calculatedSlotLimits.min))}%`,
                transform: 'translateX(-50%)'
              }}
            >
              {index + calculatedSlotLimits.min}
            </div>
          ))}
        </div>
        
        {/* 최소/최대 값 표시 삭제됨 */}
      </div>
      
      {/* 도어 너비 표시 */}
      {calculatedSlotInfo && (
        <div className="mt-2 text-xs">
          <div className="p-2 rounded-sm bg-amber-50 text-amber-600">
            현 사이즈 기준 슬롯 생성 범위: 최소 {calculatedSlotLimits.min}개 ~ 최대 {calculatedSlotLimits.max}개<br/>
            도어 1개 너비: {calculatedSlotInfo.width}mm
          </div>
        </div>
      )}
    </div>
  );
};

// 프레임 속성 입력 컴포넌트 - 개선된 버전
const FramePropertyInputImproved = ({
  frameType,
  selectedFrame,
  onSelectFrame,
  frameProperties,
  onUpdateProperty
}) => {
  // EditorContext 접근
  const editorContext = useEditor();
  const contextFrameProperties = editorContext ? editorContext.frameProperties : null;
  
  // 프레임 타입 상태 추가 (서라운드/노서라운드) - EditorContext에서 가져옴
  const [frameMode, setFrameMode] = useState(contextFrameProperties?.frameMode || "surround");
  const [edgeThickness, setEdgeThickness] = useState(contextFrameProperties?.edgeThickness || "2mm");
  
  // EditorContext의 frameMode/edgeThickness가 변경될 때 상태 동기화
  useEffect(() => {
    if (contextFrameProperties?.frameMode) {
      setFrameMode(contextFrameProperties.frameMode);
    }
    
    if (contextFrameProperties?.edgeThickness) {
      setEdgeThickness(contextFrameProperties.edgeThickness);
    }
  }, [contextFrameProperties?.frameMode, contextFrameProperties?.edgeThickness]);
  
  // getFrameProperties() 대신 frameProperties 프롭 직접 사용
  // 안전 체크로 기본값 설정
  const frameData = (frameProperties && frameProperties[selectedFrame]) || { width: 0, depth: 0, height: 0 };

  // 엣지 두께 변경 핸들러
  const handleEdgeThicknessChange = (thickness) => {
    setEdgeThickness(thickness);
    
    // EditorContext 업데이트
    if (editorContext?.updateFrameProperty) {
      editorContext.updateFrameProperty('edgeThickness', thickness);
      console.log(`[RightSidebar] 엣지 두께 변경: ${thickness}`);
    }
    
    // 상위 컴포넌트에 변경 사항 전달
    if (onUpdateProperty) {
      onUpdateProperty('edgeThickness', 'edgeThickness', thickness);
    }
  };
  
  // 프레임 모드 변경 핸들러
  const handleFrameModeChange = (mode) => {
    setFrameMode(mode);
    
    // EditorContext 업데이트
    if (editorContext?.updateFrameProperty) {
      editorContext.updateFrameProperty('frameMode', mode);
      console.log(`[RightSidebar] 프레임 모드 변경: ${mode}`);
    }
    
    // 상위 컴포넌트에 변경 사항 전달
    if (onUpdateProperty) {
      onUpdateProperty('frameMode', 'frameMode', mode);
    }
  };
  
  // 입력값을 숫자로 변환하는 헬퍼 함수
  const handleNumericInput = (property, value) => {
    // 문자열을 숫자로 변환
    const numValue = parseInt(value, 10);
    
    // 유효한 숫자인지 확인
    if (!isNaN(numValue)) {
      // 속성에 따라 적절한 범위로 제한
      let minValue = 0;
      let maxValue = 10000;
      
      if (property === 'width') {
        minValue = 10;
        maxValue = 5000;
        
        // 상부 프레임 너비 변경 시 별도 처리
        if (selectedFrame === 'top') {
          const clampedValue = Math.max(minValue, Math.min(maxValue, numValue));
          
          console.log(`[RightSidebar] 상부 프레임 폭 변경: ${clampedValue}mm`);
          onUpdateProperty(selectedFrame, property, clampedValue);
          return; // 이미 처리했으므로 함수 종료
        }
      } else if (property === 'depth') {
        minValue = 10;
        maxValue = 1000;
      } else if (property === 'height') {
        minValue = 10;
        maxValue = 3000;
        
        // 상부 프레임 높이는 10mm~500mm 범위로 특별히 제한
        if (selectedFrame === 'top') {
          minValue = 10;
          maxValue = 500;
          const clampedValue = Math.max(minValue, Math.min(maxValue, numValue));
          
          console.log(`[RightSidebar] 상부 프레임 높이 변경: ${clampedValue}mm (범위: 10mm~500mm)`);
          
          // 값이 범위를 벗어나면 알림
          if (numValue !== clampedValue) {
            alert(`상부 프레임 높이는 ${minValue}mm~${maxValue}mm 범위로 제한됩니다.`);
          }
          
          onUpdateProperty(selectedFrame, property, clampedValue);
          return; // 이미 처리했으므로 함수 종료
        }
      }
      
      // 범위 내 값으로 조정
      const clampedValue = Math.max(minValue, Math.min(maxValue, numValue));
      
      // 속성 업데이트
      onUpdateProperty(selectedFrame, property, clampedValue);
    }
  };
  
  return (
    <div className="mb-4">
      {/* 서라운드/노서라운드 토글 버튼 */}
      <div className="mb-3">
        <div className="border border-emerald-500 rounded-md overflow-hidden flex w-full">
          <button
            className={cn(
              "flex-1 py-2 px-1 text-xs font-medium transition-colors",
              frameMode === 'surround' ? 'bg-emerald-500 text-white' : 'bg-white text-emerald-500'
            )}
            onClick={() => handleFrameModeChange('surround')}
          >
            서라운드
          </button>
          <button
            className={cn(
              "flex-1 py-2 px-1 text-xs font-medium transition-colors",
              frameMode === 'nosurround' ? 'bg-emerald-500 text-white' : 'bg-white text-emerald-500'
            )}
            onClick={() => handleFrameModeChange('nosurround')}
          >
            노서라운드
          </button>
        </div>
      </div>

      {/* 서라운드 모드에서 표시되는 내용 */}
      {frameMode === 'surround' && (
        <>
          {/* 좌측/우측/상부 프레임 선택 */}
          <div className="border border-emerald-500 rounded-md overflow-hidden flex w-full mb-3">
            <button
              className={cn(
                "flex-1 py-2 px-1 text-xs font-medium transition-colors",
                selectedFrame === 'left' ? 'bg-emerald-500 text-white' : 'bg-white text-emerald-500'
              )}
              onClick={() => onSelectFrame('left')}
            >
              좌측
            </button>
            <button
              className={cn(
                "flex-1 py-2 px-1 text-xs font-medium transition-colors",
                selectedFrame === 'right' ? 'bg-emerald-500 text-white' : 'bg-white text-emerald-500'
              )}
              onClick={() => onSelectFrame('right')}
            >
              우측
            </button>
            <button
              className={cn(
                "flex-1 py-2 px-1 text-xs font-medium transition-colors",
                selectedFrame === 'top' ? 'bg-emerald-500 text-white' : 'bg-white text-emerald-500'
              )}
              onClick={() => onSelectFrame('top')}
            >
              상부
            </button>
          </div>

          {/* 선택된 프레임의 속성 */}
          <div className="bg-gray-50 p-2 rounded-md border border-gray-100">
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="w-24 text-xs text-gray-600">
                  {selectedFrame === 'left' ? '좌측 프레임 폭X' : 
                   selectedFrame === 'right' ? '우측 프레임 폭X' : 
                   '상부 프레임 폭Y'}
                </div>
                <div className="flex-1 flex items-center">
                  <input
                    type="number"
                    value={frameData.width || 0}
                    onChange={(e) => handleNumericInput('width', e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-[2px] text-sm text-gray-700 text-right px-2 py-1 outline-none"
                    min="10"
                    max="5000"
                  />
                  <span className="text-xs text-gray-500 ml-1">mm</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* 노서라운드 모드에서 표시되는 내용 */}
      {frameMode === 'nosurround' && (
        <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
          <div className="mb-3">
            <div className="flex items-center my-3">
              <div className="w-14 text-sm text-gray-600">설치갭</div>
              <div className="flex-1">
                <div className="border border-emerald-500 rounded-md overflow-hidden flex">
                  <button
                    className={cn(
                      "flex-1 py-1.5 px-2 text-xs font-medium transition-colors",
                      edgeThickness === '2mm' ? 'bg-emerald-500 text-white' : 'bg-white text-emerald-500'
                    )}
                    onClick={() => handleEdgeThicknessChange('2mm')}
                  >
                    2mm
                  </button>
                  <button
                    className={cn(
                      "flex-1 py-1.5 px-2 text-xs font-medium transition-colors",
                      edgeThickness === '3mm' ? 'bg-emerald-500 text-white' : 'bg-white text-emerald-500'
                    )}
                    onClick={() => handleEdgeThicknessChange('3mm')}
                  >
                    3mm
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-2 text-xs">
            <div className="p-2 rounded-sm bg-amber-50 text-amber-600 whitespace-nowrap overflow-hidden text-ellipsis">
              노서라운드는 도어 주변에 프레임이 없는 형태입니다.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 받침대 토글 컴포넌트
const BaseToggle = ({ hasBase, onChange }) => {
  const handleToggleClick = (value) => {
    console.log('[BaseToggle] 토글 버튼 클릭:', value, '현재 값:', hasBase);
    onChange(value);
  };

  return (
    <div className="mb-6">
      <div className="flex items-center mb-3">
        <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></div>
        <h3 className="text-sm font-medium text-[#00C092]">받침대</h3>
      </div>

      <div className="border border-emerald-500 rounded-md overflow-hidden flex">
        <button
          className={cn(
            "flex-1 py-2 px-3 text-center text-sm font-medium transition-colors",
            hasBase === "yes"
              ? "bg-emerald-500 text-white"
              : "bg-white text-emerald-500"
          )}
          onClick={() => handleToggleClick("yes")}
        >
          있음
        </button>
        <button
          className={cn(
            "flex-1 py-2 px-3 text-center text-sm font-medium transition-colors",
            hasBase === "no"
              ? "bg-emerald-500 text-white"
              : "bg-white text-emerald-500"
          )}
          onClick={() => handleToggleClick("no")}
        >
          없음
        </button>
      </div>
    </div>
  );
};

// 받침대 설정 컴포넌트
const BaseSettings = ({ hasBase, baseData, onChange }) => {
  return (
    <div className="mb-6">
      <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          {hasBase === 'yes' ? '받침대 설정' : '배치 높이 설정'}
        </h4>
        
        <div className="space-y-3">
          {hasBase === 'yes' ? (
            // 받침대가 있을 때 설정
            <>
              <DimensionInput
                label="높이"
                value={baseData.height || 80}
                onChange={(value) => onChange('height', value)}
                min={10}
                max={300}
              />
              <DimensionInput
                label="깊이"
                value={baseData.depth || 580}
                onChange={(value) => onChange('depth', value)}
                min={300}
                max={1000}
              />
            </>
          ) : (
            // 받침대가 없을 때 배치 높이 설정
            <DimensionInput
              label="배치 높이"
              value={baseData.raiseHeight || 0}
              onChange={(value) => onChange('raiseHeight', value)}
              min={0}
              max={1000}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// 단내림 토글 컴포넌트
const AirConditionerToggle = ({ hasAC, onChange }) => {
  return (
    <div className="mb-6">
      <div className="flex items-center mb-3">
        <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></div>
        <h3 className="text-sm font-medium text-[#00C092]">단내림</h3>
      </div>

      <div className="border border-emerald-500 rounded-md overflow-hidden flex">
        <button
          className={cn(
            "flex-1 py-2 px-3 text-center text-sm font-medium transition-colors",
            hasAC === "yes"
              ? "bg-emerald-500 text-white"
              : "bg-white text-emerald-500"
          )}
          onClick={() => onChange("yes")}
        >
          있음
        </button>
        <button
          className={cn(
            "flex-1 py-2 px-3 text-center text-sm font-medium transition-colors",
            hasAC === "no"
              ? "bg-emerald-500 text-white"
              : "bg-white text-emerald-500"
          )}
          onClick={() => onChange("no")}
        >
          없음
        </button>
      </div>
    </div>
  );
};

// 단내림 설정 컴포넌트
const AirConditionerSettings = ({ acUnit, onChange }) => {
  // 높이 값 유효성 확인
  const validHeight = acUnit?.height && acUnit.height <= 1000 && acUnit.height >= 50 
    ? acUnit.height 
    : DEFAULT_AC_UNIT_HEIGHT; // 기본값 사용
  
  console.log('[AirConditionerSettings] 받은 데이터:', acUnit, '사용할 높이 값:', validHeight);
  
  // 위치 변경 특수 처리 핸들러
  const handlePositionChange = (position) => {
    console.log('[AirConditionerSettings] 위치 변경:', position, '현재 높이:', acUnit.height);
    // 현재 높이와 깊이 값을 유지하면서 위치만 변경
    onChange('position', position, { preserveHeight: true });
  };
  
  return (
    <div className="mb-6">
      <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
        <h4 className="text-sm font-medium text-gray-700 mb-3"></h4>
        
        <div className="space-y-3">
          <div className="flex items-center my-3">
            <div className="w-14 text-sm text-gray-600">위치</div>
            <div className="flex-1">
              <div className="border border-emerald-500 rounded-md overflow-hidden flex">
                <button
                  className={cn(
                    "flex-1 py-1.5 px-2 text-xs font-medium transition-colors",
                    acUnit.position === "left"
                      ? "bg-emerald-500 text-white"
                      : "bg-white text-emerald-500"
                  )}
                  onClick={() => handlePositionChange("left")}
                >
                  좌측
                </button>
                <button
                  className={cn(
                    "flex-1 py-1.5 px-2 text-xs font-medium transition-colors",
                    acUnit.position === "right"
                      ? "bg-emerald-500 text-white"
                      : "bg-white text-emerald-500"
                  )}
                  onClick={() => handlePositionChange("right")}
                >
                  우측
                </button>
              </div>
            </div>
          </div>
          
          <DimensionInput
            label="폭(X축)"
            value={acUnit.width || DEFAULT_AC_UNIT_WIDTH}
            onChange={(value) => onChange('width', value)}
            min={300}
            max={5000}
          />
          
          {/* 높이(Y축) 입력 필드 - 사용자 입력 가능, 3D 뷰어에 즉시 반영 */}
          <DimensionInput
            label="높이(Y축)"
            value={validHeight}
            onChange={(value) => onChange('height', value)}
            min={50}
            max={1000}
          />
          
          {/* 깊이(Z축) 부분 제거 */}
          
          {/* 단내림 특성 설명 */}
          <div className="mt-2 text-xs">
            <div className="p-2 rounded-sm bg-amber-50 text-amber-600">
              단내림은 공간의 일부로, 공간 구조물과 동일한 재질 및 속성을 공유합니다.
              깊이(Z축)는 공간 깊이와 동일하게 설정됩니다.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 바닥 마감재 토글 컴포넌트
const FloorFinishToggle = ({ hasFloorFinish, onChange }) => {
  const handleToggleClick = (value) => {
    console.log('[FloorFinishToggle] 토글 버튼 클릭:', value, '현재 값:', hasFloorFinish);
    onChange(value);
  };

  return (
    <div className="mb-6">
      <div className="flex items-center mb-3">
        <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></div>
        <h3 className="text-sm font-medium text-[#00C092]">바닥 마감재</h3>
      </div>

      <div className="border border-emerald-500 rounded-md overflow-hidden flex">
        <button
          className={cn(
            "flex-1 py-2 px-3 text-center text-sm font-medium transition-colors",
            hasFloorFinish === "yes"
              ? "bg-emerald-500 text-white"
              : "bg-white text-emerald-500"
          )}
          onClick={() => handleToggleClick("yes")}
        >
          있음
        </button>
        <button
          className={cn(
            "flex-1 py-2 px-3 text-center text-sm font-medium transition-colors",
            hasFloorFinish === "no"
              ? "bg-emerald-500 text-white"
              : "bg-white text-emerald-500"
          )}
          onClick={() => handleToggleClick("no")}
        >
          없음
        </button>
      </div>
    </div>
  );
};

// 바닥 마감재 설정 컴포넌트
const FloorFinishSettings = ({ thickness, onChange }) => {
  return (
    <div className="mb-6">
      <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
        <h4 className="text-sm font-medium text-gray-700 mb-3">바닥 마감재 설정</h4>
        
        <div className="space-y-3">
          <DimensionInput
            label="높이"
            value={thickness || 20}
            onChange={(value) => onChange(value)}
            min={5}
            max={100}
          />
        </div>
      </div>
    </div>
  );
};

// 섹션 헤더 컴포넌트 추가
const SectionHeader = ({ title, isOpen, onToggle }) => {
  return (
    <div className="flex items-center justify-between mb-3 cursor-pointer" onClick={onToggle}>
      <div className="flex items-center">
        <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></div>
        <h3 className="text-sm font-medium text-[#00C092]">{title}</h3>
      </div>
      <div className="text-gray-500">
        {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
      </div>
    </div>
  );
};

// 오른쪽 사이드바 컴포넌트
export const RightSidebar = ({
  dimensions,
  handleDimensionChange,
  modulesGap,
  handleModuleGapChange,
  handleSpecialPropertyChange,
  spaceType = "built-in",
  handleSpaceTypeChange,
  wallPosition = "left", // 외부에서 전달받은 벽 위치 상태
  handleWallPositionChange = () => {} // 외부에서 전달받은 벽 위치 변경 핸들러
}) => {
  // EditorContext 가져오기
  const editorContext = useEditor();
  
  // 에디터 컨텍스트의 정보 활용
  const contextFrameProperties = editorContext?.frameProperties || {};
  
  // 내부 로컬 상태 초기화 관리를 위한 ref
  const isInternalUpdate = useRef(false);
  const hasSyncedInitialData = useRef(false);
  const hasInitialSyncRef = useRef(false); // hasInitialSyncRef 추가
  
  // 활성 탭 상태 추가
  const [activeTab, setActiveTab] = useState("배치 속성");
  
  // 너비와 높이 상태 추가
  const [width, setWidth] = useState(dimensions?.width || 4800);
  const [height, setHeight] = useState(dimensions?.height || 2400);
  
  // 로컬 상태 정의 - EditorContext 데이터를 초기값으로 사용
  const [sectionsState, setSectionsState] = useState({
    installType: true,
    spaceSettings: true,
    layout: true,
    airConditioner: true, // 단내림 섹션 기본 펼침 상태로 설정
    floorFinish: true,
    base: true,
    dimensions: true,
    space: true,
    frame: false,
    door: false,
    module: false
  });
  
  // 로컬 상태: 설치 타입 - props에서 초기값 가져오기 (스탭 2,3에서 선택한 값 우선)
  const [localSpaceType, setLocalSpaceType] = useState(
    spaceType || editorContext?.installationType || "built-in"
  );
  
  // 로컬 상태: 벽 위치 - props에서 초기값 가져오기 (스탭 2,3에서 선택한 값 우선)
  const [localWallPosition, setLocalWallPosition] = useState(
    wallPosition || editorContext?.wallPosition || "left"
  );

  // 로컬 상태: 도어 개수 - props에서 초기값 가져오기 (스탭 2,3에서 선택한 값 우선)
  const [doorCount, setDoorCount] = useState(
    modulesGap?.doorCount || editorContext?.doorCount || 8
  );
  
  // 단내림 좌/우 영역 도어 관련 상태 추가
  const [activeLayoutArea, setActiveLayoutArea] = useState("left");
  const [leftDoorCount, setLeftDoorCount] = useState(
    modulesGap?.leftDoorCount || editorContext?.frameProperties?.leftDoorCount || 4
  );
  const [rightDoorCount, setRightDoorCount] = useState(
    modulesGap?.rightDoorCount || editorContext?.frameProperties?.rightDoorCount || 4
  );
  
  // 로컬 상태: 선택된 프레임
  const [selectedFrame, setSelectedFrame] = useState("none");
  
  // 로컬 상태: 프레임 속성 - EditorContext에서 초기값 가져오기
  const [frameProperties, setFrameProperties] = useState({
    ...defaultFrameProperties,
    ...(contextFrameProperties || {})
  });
  
  // getFrameProperties 함수 추가 - 현재 프레임 속성 반환
  const getFrameProperties = () => {
    return frameProperties;
  };
  
  // 로컬 상태: 받침대 유무 - EditorContext에서 초기값 가져오기
  const [localBaseStatus, setLocalBaseStatus] = useState(
    contextFrameProperties?.hasBase || "yes"
  );
  
  // 로컬 상태: 받침대 높이 - EditorContext에서 초기값 가져오기
  const [localBaseHeight, setLocalBaseHeight] = useState(
    contextFrameProperties?.baseHeight || 80
  );
  
  // 로컬 상태: 받침대 깊이 - EditorContext에서 초기값 가져오기
  const [localBaseDepth, setLocalBaseDepth] = useState(
    contextFrameProperties?.baseDepth || 580
  );
  
  // 로컬 상태: 단내림 유무 - EditorContext에서 초기값 가져오기
  const [localAcStatus, setLocalAcStatus] = useState(
    modulesGap?.hasAirConditioner || contextFrameProperties?.hasAirConditioner || "no"
  );
  
  // 로컬 상태: 단내림 설정 - EditorContext에서 초기값 가져오기
  const [localAcUnit, setLocalAcUnit] = useState(
    modulesGap?.acUnit || contextFrameProperties?.acUnit || null
  );
  
  // 로컬 상태: 바닥 마감재 유무 - EditorContext에서 초기값 가져오기
  const [localFloorFinishStatus, setLocalFloorFinishStatus] = useState(
    contextFrameProperties?.hasFloorFinish || "no"
  );
  
  // 로컬 상태: 바닥 마감재 두께 - EditorContext에서 초기값 가져오기
  const [localFloorThickness, setLocalFloorThickness] = useState(
    contextFrameProperties?.floorThickness || 20
  );
  
  // 로컬 상태: 프레임 모드 - EditorContext에서 초기값 가져오기
  const [frameMode, setFrameMode] = useState(
    contextFrameProperties?.frameMode || "surround"
  );
  
  // 로컬 상태: 엣지 두께 - EditorContext에서 초기값 가져오기
  const [edgeThickness, setEdgeThickness] = useState(
    contextFrameProperties?.edgeThickness || "2mm"
  );

  // Step2/3에서 가져온 값을 EditorContext에 초기 동기화 - 컴포넌트 마운트 시 한 번만 실행
  useEffect(() => {
    // 이미 동기화가 완료되었거나 editorContext가 없으면 리턴
    if (!editorContext || hasInitialSyncRef.current) return;
    
    console.log('[RightSidebar] Step2/3에서 가져온 값을 EditorContext에 초기 동기화');
    
    // 내부 업데이트 플래그 설정
    isInternalUpdate.current = true;
    
    // 1. Step2/3에서 가져온 값을 EditorContext에 설정
    if (spaceType && spaceType !== editorContext.installationType) {
      console.log('[RightSidebar] 설치 타입 초기 설정:', spaceType);
      editorContext.setInstallationType(spaceType);
    }
    
    if (wallPosition && wallPosition !== editorContext.wallPosition) {
      console.log('[RightSidebar] 벽 위치 초기 설정:', wallPosition);
      editorContext.setWallPosition(wallPosition);
    }
    
    if (dimensions?.width && dimensions.width !== editorContext.roomDimensions?.width) {
      console.log('[RightSidebar] 너비 초기 설정:', dimensions.width);
      editorContext.updateRoomDimensions('width', dimensions.width);
    }
    
    if (dimensions?.height && dimensions.height !== editorContext.roomDimensions?.height) {
      console.log('[RightSidebar] 높이 초기 설정:', dimensions.height);
      editorContext.updateRoomDimensions('height', dimensions.height);
    }
    
    if (modulesGap?.doorCount && modulesGap.doorCount !== editorContext.doorCount) {
      console.log('[RightSidebar] 도어 개수 초기 설정:', modulesGap.doorCount);
      editorContext.setDoorCount(modulesGap.doorCount);
    }
    
    // 단내림 설정 추가 - modulesGap에서 가져오기
    if (modulesGap?.hasAirConditioner) {
      console.log('[RightSidebar] 단내림 상태 초기 설정:', modulesGap.hasAirConditioner);
      editorContext.updateFrameProperty('hasAirConditioner', modulesGap.hasAirConditioner);
      
      // 단내림 있음이면 단내림 설정도 업데이트
      if (modulesGap.hasAirConditioner === 'yes' && modulesGap.acUnit) {
        console.log('[RightSidebar] 단내림 상세 설정 초기화:', modulesGap.acUnit);
        editorContext.updateFrameProperty('acUnit', modulesGap.acUnit);
        setLocalAcUnit(modulesGap.acUnit);
      }
    }
    
    // 2. 로컬 상태도 업데이트
    setLocalSpaceType(spaceType || editorContext.installationType || "built-in");
    setLocalWallPosition(wallPosition || editorContext.wallPosition || "left");
    setWidth(dimensions?.width || editorContext.roomDimensions?.width || 4800);
    setHeight(dimensions?.height || editorContext.roomDimensions?.height || 2400);
    setDoorCount(modulesGap?.doorCount || editorContext.doorCount || 8);
    
    // 초기 동기화 완료 표시
    hasInitialSyncRef.current = true;
    
    // 내부 업데이트 플래그 초기화
    setTimeout(() => {
      isInternalUpdate.current = false;
      console.log('[RightSidebar] Step2/3 초기 동기화 완료');
    }, 100);
    
  }, [editorContext, spaceType, wallPosition, dimensions, modulesGap]);

  // EditorContext에서 데이터가 변경될 때 로컬 상태 동기화 (Step2/3 초기화 완료 이후)
  useEffect(() => {
    // 이미 초기 데이터 동기화를 완료했거나 editorContext가 없으면 리턴
    if (hasSyncedInitialData.current || !editorContext || !hasInitialSyncRef.current) return;
    
    console.log('[RightSidebar] EditorContext에서 초기 데이터 동기화 시작');
    
    // 내부 업데이트 플래그 설정
    isInternalUpdate.current = true;
    
    // EditorContext의 프레임 속성 가져오기
    const contextProps = editorContext.frameProperties || {};
    
    // 프레임 속성 업데이트
    setFrameProperties(prevProps => ({
      ...prevProps,
      ...(contextProps || {})
    }));
    
    // 받침대 관련 상태 업데이트
    setLocalBaseStatus(contextProps.hasBase || "yes");
    setLocalBaseHeight(contextProps.baseHeight || 80);
    setLocalBaseDepth(contextProps.baseDepth || 580);
    
    // 단내림 관련 상태 업데이트
    setLocalAcStatus(contextProps.hasAirConditioner || "no");
    
    // 단내림 설정 초기화 (높이/깊이 값이 올바른지 확인)
    if (contextProps.acUnit) {
      const defaultAcUnit = { width: 900, height: 200, depth: 200, position: 'left' };
      const height = contextProps.acUnit.height > 1000 ? 200 : (contextProps.acUnit.height || 200);
      const depth = contextProps.acUnit.depth > 1000 ? 200 : (contextProps.acUnit.depth || 200);
      const width = contextProps.acUnit.width || 900;
      const position = contextProps.acUnit.position || 'left';
      
      setLocalAcUnit({ width, height, depth, position });
    } else {
      setLocalAcUnit(null);
    }
    
    // 바닥 마감재 관련 상태 업데이트
    setLocalFloorFinishStatus(contextProps.hasFloorFinish || "no");
    setLocalFloorThickness(contextProps.floorThickness || 20);
    
    // 프레임 모드 및 엣지 두께 업데이트
    setFrameMode(contextProps.frameMode || "surround");
    setEdgeThickness(contextProps.edgeThickness || "2mm");
    
    // 초기 데이터 동기화 완료 표시
    hasSyncedInitialData.current = true;
    
    // 내부 업데이트 플래그 초기화
    setTimeout(() => {
      isInternalUpdate.current = false;
      console.log('[RightSidebar] 추가 속성 초기 데이터 동기화 완료');
    }, 100);
    
  }, [editorContext, hasInitialSyncRef.current]);

  // 컴포넌트 마운트 시 EditorContext와 로컬 상태를 동기화 - 우선순위 설정
  useEffect(() => {
    if (!editorContext) return;
    
    console.log('[RightSidebar] 컴포넌트 마운트 시 상태 동기화');
    
    // 이미 초기화 되었다면 추가 작업 방지
    if (hasInitialSyncRef.current) return;
    
    // 내부 업데이트 플래그 설정
    isInternalUpdate.current = true;
    
    try {
      // 1. Step2/3에서 가져온 값이 있으면 우선 적용 (props에 값이 있으면 우선)
      // 설치 타입
      if (spaceType) {
        console.log('[RightSidebar] 외부 props 설치 타입 적용:', spaceType);
        setLocalSpaceType(spaceType);
        if (editorContext.setInstallationType) {
          editorContext.setInstallationType(spaceType);
        }
      }
      
      // 벽 위치
      if (wallPosition) {
        console.log('[RightSidebar] 외부 props 벽 위치 적용:', wallPosition);
        setLocalWallPosition(wallPosition);
        if (editorContext.setWallPosition) {
          editorContext.setWallPosition(wallPosition);
        }
      }
      
      // 치수
      if (dimensions) {
        if (dimensions.width) {
          console.log('[RightSidebar] 외부 props 너비 적용:', dimensions.width);
          setWidth(dimensions.width);
          if (editorContext.updateRoomDimensions) {
            editorContext.updateRoomDimensions('width', dimensions.width);
          }
        }
        
        if (dimensions.height) {
          console.log('[RightSidebar] 외부 props 높이 적용:', dimensions.height);
          setHeight(dimensions.height);
          if (editorContext.updateRoomDimensions) {
            editorContext.updateRoomDimensions('height', dimensions.height);
          }
        }
      }
      
      // 도어 개수
      if (modulesGap?.doorCount) {
        console.log('[RightSidebar] 외부 props 도어 개수 적용:', modulesGap.doorCount);
        setDoorCount(modulesGap.doorCount);
        if (editorContext.setDoorCount) {
          editorContext.setDoorCount(modulesGap.doorCount);
        }
      }
      
      // 단내림 설정
      if (modulesGap?.hasAirConditioner) {
        console.log('[RightSidebar] 외부 props 단내림 상태 적용:', modulesGap.hasAirConditioner);
        setLocalAcStatus(modulesGap.hasAirConditioner);
        
        // EditorContext에도 적용
        if (editorContext.updateFrameProperty) {
          editorContext.updateFrameProperty('hasAirConditioner', modulesGap.hasAirConditioner);
          
          // 단내림 있음인 경우 단내림 속성도 설정
          if (modulesGap.hasAirConditioner === 'yes' && modulesGap.acUnit) {
            console.log('[RightSidebar] 외부 props 단내림 상세 설정 적용:', modulesGap.acUnit);
            setLocalAcUnit(modulesGap.acUnit);
            editorContext.updateFrameProperty('acUnit', modulesGap.acUnit);
          }
        }
      }
      
      // 2. 외부 props에 없는 값은 EditorContext에서 가져와 적용
      if (!spaceType && editorContext.installationType) {
        setLocalSpaceType(editorContext.installationType);
      }
      
      if (!wallPosition && editorContext.wallPosition) {
        setLocalWallPosition(editorContext.wallPosition);
      }
      
      if (!dimensions?.width && editorContext.roomDimensions?.width) {
        setWidth(editorContext.roomDimensions.width);
      }
      
      if (!dimensions?.height && editorContext.roomDimensions?.height) {
        setHeight(editorContext.roomDimensions.height);
      }
      
      if (!modulesGap?.doorCount && editorContext.doorCount) {
        setDoorCount(editorContext.doorCount);
      }
      
      // 단내림 설정 (외부 props에 없는 경우)
      if (!modulesGap?.hasAirConditioner && editorContext.frameProperties?.hasAirConditioner) {
        setLocalAcStatus(editorContext.frameProperties.hasAirConditioner);
        
        if (editorContext.frameProperties.hasAirConditioner === 'yes' && editorContext.frameProperties.acUnit) {
          setLocalAcUnit(editorContext.frameProperties.acUnit);
        }
      }
      
      // 3. 프레임 속성 업데이트
      if (editorContext.frameProperties) {
        updateFramePropertiesFromContext();
      }
      
      // 초기 동기화 완료 표시
      hasInitialSyncRef.current = true;
      console.log('[RightSidebar] 컴포넌트 마운트 초기화 완료');
    } catch (error) {
      console.error('[RightSidebar] 초기 상태 동기화 오류:', error);
    }
    
    // 내부 업데이트 플래그 해제
    setTimeout(() => {
      isInternalUpdate.current = false;
    }, 200);
  }, []);
  
  // 프레임 속성 컨텍스트에서 로컬 상태로 업데이트하는 헬퍼 함수
  const updateFramePropertiesFromContext = () => {
    if (!editorContext?.frameProperties) return;
    
    const frameProps = editorContext.frameProperties;
    
    // 프레임 속성 업데이트
    setFrameProperties(prevProps => ({
      ...prevProps,
      ...(frameProps || {})
    }));
    
    // 바닥 마감재
    if (frameProps.hasFloorFinish !== undefined) {
      setLocalFloorFinishStatus(frameProps.hasFloorFinish);
    }
    
    if (frameProps.floorThickness !== undefined) {
      setLocalFloorThickness(frameProps.floorThickness);
    }
    
    // 받침대
    if (frameProps.hasBase !== undefined) {
      setLocalBaseStatus(frameProps.hasBase);
    }
    
    if (frameProps.baseHeight !== undefined) {
      setLocalBaseHeight(frameProps.baseHeight);
    }
    
    if (frameProps.baseDepth !== undefined) {
      setLocalBaseDepth(frameProps.baseDepth);
    }
    
    // 단내림
    if (frameProps.hasAirConditioner !== undefined) {
      setLocalAcStatus(frameProps.hasAirConditioner);
    }
    
    if (frameProps.acUnit) {
      setLocalAcUnit(frameProps.acUnit);
    }
    
    // 프레임 모드
    if (frameProps.frameMode !== undefined) {
      setFrameMode(frameProps.frameMode);
    }
    
    // 엣지 두께
    if (frameProps.edgeThickness !== undefined) {
      setEdgeThickness(frameProps.edgeThickness);
    }
    
    console.log('[RightSidebar] 프레임 속성 로컬 상태 업데이트 완료');
  };

  // 설치 타입과 프레임 모드가 변경될 때 EditorContext 업데이트
  useEffect(() => {
    if (!editorContext || !hasInitialSyncRef.current || isInternalUpdate.current) return;
    
    // 내부 업데이트 플래그 설정
    isInternalUpdate.current = true;
    
    // 설치 타입 동기화
    if (editorContext.installationType !== localSpaceType) {
      console.log('[RightSidebar] 설치 타입 EditorContext 동기화:', localSpaceType);
      editorContext.setInstallationType(localSpaceType);
    }
    
    // 벽 위치 동기화
    if (editorContext.wallPosition !== localWallPosition) {
      console.log('[RightSidebar] 벽 위치 EditorContext 동기화:', localWallPosition);
      editorContext.setWallPosition(localWallPosition);
    }
    
    // 프레임 모드 동기화
    if (editorContext.frameProperties?.frameMode !== frameMode) {
      console.log('[RightSidebar] 프레임 모드 EditorContext 동기화:', frameMode);
      editorContext.updateFrameProperty('frameMode', frameMode);
    }
    
    // 내부 업데이트 플래그 해제
    setTimeout(() => {
      isInternalUpdate.current = false;
    }, 100);
  }, [localSpaceType, localWallPosition, frameMode, editorContext]);

  // 섹션 토글 핸들러
  const toggleSection = (section) => {
    // 섹션 토글 상태 업데이트
    setSectionsState(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
    
    // 단내림 상태 확인 및 동기화
    if (editorContext && editorContext.frameProperties?.hasAirConditioner) {
      const contextAcStatus = editorContext.frameProperties.hasAirConditioner;
      console.log('[RightSidebar] 섹션 전환 - 컨텍스트 단내림 상태:', contextAcStatus, '로컬 상태:', localAcStatus);
      
      // 로컬 상태와 컨텍스트 상태가 다르면 동기화
      if (contextAcStatus !== localAcStatus) {
        console.log('[RightSidebar] 단내림 상태 강제 동기화 실행:', contextAcStatus);
        setLocalAcStatus(contextAcStatus);
      }
    }
  };

  // 설치 타입 변경 핸들러
  const updateSpaceType = (type) => {
    // 현재 값과 같다면 아무 작업도 하지 않음
    if (type === localSpaceType) return;
    
    console.log('[RightSidebar] 설치 타입 변경:', type);
    
    // 단내림 상태 및 설정 백업
    const currentAcStatus = localAcStatus;
    const currentAcUnit = {...localAcUnit};
    const currentLeftDoors = leftDoorCount;
    const currentRightDoors = rightDoorCount;
    
    // 세션스토리지에 단내림 설정 저장 (타입 변경 시에도 유지하기 위함)
    const AC_STORAGE_KEY = 'wardrobe_airConditioner_settings';
    if (currentAcStatus === 'yes' && currentAcUnit) {
      try {
        const acSettings = {
          status: currentAcStatus,
          unit: currentAcUnit,
          leftDoorCount: currentLeftDoors,
          rightDoorCount: currentRightDoors
        };
        sessionStorage.setItem(AC_STORAGE_KEY, JSON.stringify(acSettings));
        console.log('[RightSidebar] 단내림 설정 세션스토리지에 저장:', acSettings);
      } catch (err) {
        console.error('[RightSidebar] 단내림 설정 저장 오류:', err);
      }
    }
    
    console.log('[RightSidebar] 설치 타입 변경 전 단내림 상태 백업:', currentAcStatus, currentAcUnit);
    
    // 로컬 상태값 업데이트
    setLocalSpaceType(type);
    
    // 외부 핸들러도 호출
    handleSpaceTypeChange(type);
    
    // EditorContext 업데이트
    if (editorContext && editorContext.setInstallationType) {
      editorContext.setInstallationType(type);
      
      // 설치 타입 변경 후 필요한 계산 수행
      if (editorContext.calculateBaseWidth) {
        const newBaseWidth = editorContext.calculateBaseWidth();
        console.log('[RightSidebar] 설치 타입 변경 후 새 받침대 폭:', newBaseWidth, 'mm');
      }
      
      // 단내림 상태 유지 - 설치 타입 변경 후에도 이전 단내림 설정 복원
      if (currentAcStatus === 'yes' && currentAcUnit) {
        console.log('[RightSidebar] 설치 타입 변경 후 단내림 상태 복원');
        
        // 약간 지연시켜 설치 타입 변경이 완료된 후 단내림 상태 복원
        setTimeout(() => {
          // 로컬 상태 복원
          setLocalAcStatus(currentAcStatus);
          setLocalAcUnit(currentAcUnit);
          setLeftDoorCount(currentLeftDoors);
          setRightDoorCount(currentRightDoors);
          
          // 단내림 상태 복원
          editorContext.updateFrameProperty('hasAirConditioner', currentAcStatus);
          editorContext.updateFrameProperty('acUnit', currentAcUnit);
          editorContext.updateFrameProperty('leftDoorCount', currentLeftDoors);
          editorContext.updateFrameProperty('rightDoorCount', currentRightDoors);
          
          // 단내림 섹션 펼치기
          setSectionsState(prev => ({
            ...prev,
            airConditioner: true
          }));
          
          console.log('[RightSidebar] 단내림 상태 복원 완료:', currentAcStatus, currentAcUnit);
        }, 100);
      }
      
      // 뷰어 업데이트 요청
      setTimeout(() => {
        if (editorContext.updateViewers) {
          editorContext.updateViewers();
        }
      }, 200);
    }
  };

  // 도어 개수 변경 핸들러 - 단내림 영역 고려
  const updateDoorCount = (value) => {
    console.log('RightSidebar: 도어 개수 변경 시작 -', value, '개');
    
    // 입력값 유효성 검사 - 숫자가 아니면 처리하지 않음
    const doorCount = parseInt(value, 10);
    if (isNaN(doorCount)) {
      console.warn('RightSidebar: 유효하지 않은 도어 개수:', value);
      return;
    }
    
    // 단내림이 있는 경우 좌/우 영역에 따라 다르게 처리
    if (localAcStatus === 'yes') {
      // 선택된 영역의 도어 개수만 업데이트
      if (activeLayoutArea === "left") {
        setLeftDoorCount(doorCount);
        
        // EditorContext와 외부 컴포넌트에 좌우 도어 개수 전달
        const totalDoorCount = doorCount + rightDoorCount;
        handleAcDoorCountChange(doorCount, rightDoorCount);
        
        // 도어 개수 변경 후 다른 처리 (프레임 속성 업데이트 등)
        updateFramesAfterDoorCountChange(totalDoorCount);
      } else {
        setRightDoorCount(doorCount);
        
        // EditorContext와 외부 컴포넌트에 좌우 도어 개수 전달
        const totalDoorCount = leftDoorCount + doorCount;
        handleAcDoorCountChange(leftDoorCount, doorCount);
        
        // 도어 개수 변경 후 다른 처리 (프레임 속성 업데이트 등)
        updateFramesAfterDoorCountChange(totalDoorCount);
      }
    } else {
      // 단내림이 없는 경우 원래 로직대로 처리
      // 내경 계산
      let innerWidth;
      
      if (localSpaceType === "built-in") {
        innerWidth = dimensions?.width - 100; // 빌트인: 전체 폭 - (좌우 프레임 폭 각 50mm)
      } else if (localSpaceType === "semi-standing") {
        innerWidth = dimensions?.width - 70; // 세미스탠딩: 전체 폭 - (한쪽 프레임 50mm + 엔드판넬 20mm)
      } else {
        innerWidth = dimensions?.width - 40; // 프리스탠딩: 전체 폭 - (좌,우 엔드판넬 각 20mm)
      }
      
      // 슬롯 너비 제한 값 (mm)
      const MIN_SLOT_WIDTH = 300;
      const MAX_SLOT_WIDTH = 600;
      
      // 최대/최소 슬롯 개수 계산
      const maxPossibleSlots = Math.floor(innerWidth / MIN_SLOT_WIDTH);
      const minRequiredSlots = Math.ceil(innerWidth / MAX_SLOT_WIDTH);
      
      // 도어 개수가 범위를 벗어나면 조정
      let adjustedDoorCount = doorCount;
      if (doorCount < minRequiredSlots) {
        console.log(`도어 개수가 최소 제한보다 작음, ${minRequiredSlots}개로 조정됨`);
        adjustedDoorCount = minRequiredSlots;
      } else if (doorCount > maxPossibleSlots) {
        console.log(`도어 개수가 최대 제한보다 큼, ${maxPossibleSlots}개로 조정됨`);
        adjustedDoorCount = maxPossibleSlots;
      }
      
      // 먼저 도어 개수 업데이트
      handleModuleGapChange('doorCount', adjustedDoorCount);
      
      // EditorContext의 doorCount 업데이트
      if (editorContext && typeof editorContext.setDoorCount === 'function') {
        console.log('RightSidebar: EditorContext doorCount 업데이트 -', adjustedDoorCount, '개');
        editorContext.setDoorCount(adjustedDoorCount);
      } else if (setDoorCount) {
        console.log('RightSidebar: EditorContext doorCount 업데이트 -', adjustedDoorCount, '개');
        setDoorCount(adjustedDoorCount);
      } else {
        console.warn('RightSidebar: EditorContext setDoorCount 함수가 없습니다!');
      }
      
      // 상부 프레임과 받침대 프레임의 폭 계산
      const topFrameWidth = calculateTopFrameWidth(dimensions?.width || 4700);
      const bottomFrameWidth = calculateBottomFrameWidth(dimensions?.width || 4700);
      
      // 프레임 속성 업데이트
      const frameProps = getFrameProperties();
      const updatedTopProps = { ...frameProps.top, width: topFrameWidth };
      const updatedBottomProps = { ...frameProps.bottom, width: bottomFrameWidth };
      
      // 상부 프레임과 받침대 업데이트
      handleModuleGapChange('top', updatedTopProps);
      handleModuleGapChange('bottom', updatedBottomProps);
      
      console.log(`RightSidebar: 도어 개수 변경 완료 - ${adjustedDoorCount}개, 상부 프레임 폭: ${topFrameWidth}mm, 받침대 폭: ${bottomFrameWidth}mm`);
    }
  };
  
  // 단내림이 있을 때 좌우 도어 개수 변경 핸들러
  const handleAcDoorCountChange = (leftCount, rightCount) => {
    // 총 도어 개수 계산
    const totalCount = leftCount + rightCount;
    console.log(`[RightSidebar] 단내림 영역 도어 개수 변경: 좌측=${leftCount}, 우측=${rightCount}, 총=${totalCount}`);
    
    // 기존 EditorContext 업데이트 로직
    if (editorContext && typeof editorContext.setDoorCount === 'function') {
      editorContext.setDoorCount(totalCount);
      
      // 단내림 좌/우 도어 개수도 별도 저장
      editorContext.updateFrameProperty('leftDoorCount', leftCount);
      editorContext.updateFrameProperty('rightDoorCount', rightCount);
    }
    
    // 외부 컴포넌트에 도어 개수 변경 전달
    handleModuleGapChange('doorCount', totalCount);
    handleModuleGapChange('leftDoorCount', leftCount);
    handleModuleGapChange('rightDoorCount', rightCount);
    
    // 로컬 상태 업데이트
    setDoorCount(totalCount);
    setLeftDoorCount(leftCount);
    setRightDoorCount(rightCount);
  };
  
  // 도어 개수 변경 후 프레임 속성 업데이트 공통 로직
  const updateFramesAfterDoorCountChange = (totalDoorCount) => {
    // 상부 프레임과 받침대 프레임의 폭 계산
    const topFrameWidth = calculateTopFrameWidth(dimensions?.width || 4700);
    const bottomFrameWidth = calculateBottomFrameWidth(dimensions?.width || 4700);
    
    // 프레임 속성 업데이트
    const frameProps = getFrameProperties();
    const updatedTopProps = { ...frameProps.top, width: topFrameWidth };
    const updatedBottomProps = { ...frameProps.bottom, width: bottomFrameWidth };
    
    // 상부 프레임과 받침대 업데이트
    handleModuleGapChange('top', updatedTopProps);
    handleModuleGapChange('bottom', updatedBottomProps);
    
    console.log(`[RightSidebar] 도어 개수 변경 후 프레임 업데이트: 총=${totalDoorCount}개, 상부 프레임 폭: ${topFrameWidth}mm, 받침대 폭: ${bottomFrameWidth}mm`);
    
    // 뷰어 업데이트
    if (editorContext && editorContext.updateViewers) {
      editorContext.updateViewers();
    }
  };
  
  // 단내림 레이아웃 영역 변경 핸들러 (좌/우)
  const handleLayoutAreaChange = (area) => {
    console.log(`[RightSidebar] 단내림 레이아웃 영역 변경: ${area}`);
    
    // 로컬 상태 업데이트
    setActiveLayoutArea(area);
    
    // EditorContext 업데이트
    if (editorContext && editorContext.setActiveLayoutArea) {
      editorContext.setActiveLayoutArea(area);
      
      // 뷰어 업데이트 요청
      if (editorContext.updateViewers) {
        editorContext.updateViewers();
      }
    }
  };

  // 설치 타입과 프레임 모드가 변경될 때 EditorContext 업데이트
  useEffect(() => {
    if (!editorContext || !hasInitialSyncRef.current || isInternalUpdate.current) return;
    
    // 내부 업데이트 플래그 설정
    isInternalUpdate.current = true;
    
    // 설치 타입 동기화
    if (editorContext.installationType !== localSpaceType) {
      console.log('[RightSidebar] 설치 타입 EditorContext 동기화:', localSpaceType);
      editorContext.setInstallationType(localSpaceType);
    }
    
    // 벽 위치 동기화
    if (editorContext.wallPosition !== localWallPosition) {
      console.log('[RightSidebar] 벽 위치 EditorContext 동기화:', localWallPosition);
      editorContext.setWallPosition(localWallPosition);
    }
    
    // 프레임 모드 동기화
    if (editorContext.frameProperties?.frameMode !== frameMode) {
      console.log('[RightSidebar] 프레임 모드 EditorContext 동기화:', frameMode);
      editorContext.updateFrameProperty('frameMode', frameMode);
    }
    
    // 내부 업데이트 플래그 해제
    setTimeout(() => {
      isInternalUpdate.current = false;
    }, 100);
  }, [localSpaceType, localWallPosition, frameMode, editorContext]);


  // 상부 프레임 폭 계산 함수
  function calculateTopFrameWidth(spaceWidth) {
    if (localSpaceType === "built-in") {
      return spaceWidth - 100; // 빌트인: 전체 폭 - (좌우 프레임 폭 각 50mm)
    } else if (localSpaceType === "semi-standing") {
      if (wallPosition === "left") {
        return spaceWidth - 70; // 좌측벽: 전체 폭 - (좌 프레임 50mm + 우측 엔드판넬 20mm)
      } else {
        return spaceWidth - 70; // 우측벽: 전체 폭 - (우 프레임 50mm + 좌측 엔드판넬 20mm)
      }
    } else {
      return spaceWidth - 40; // 프리스탠딩: 전체 폭 - (좌,우 엔드판넬 각 20mm)
    }
  }

  // 받침대 폭 계산 함수
  function calculateBottomFrameWidth(spaceWidth) {
    if (localSpaceType === "built-in") {
      return spaceWidth - 100; // 빌트인: 전체 폭 - (좌우 프레임 폭 각 50mm)
    } else if (localSpaceType === "semi-standing") {
      if (wallPosition === "left") {
        return spaceWidth - 70; // 좌측벽: 전체 폭 - (좌 프레임 50mm + 엔드판넬 20mm)
      } else {
        return spaceWidth - 70; // 우측벽: 전체 폭 - (우 프레임 50mm + 엔드판넬 20mm)
      }
    } else {
      return spaceWidth - 40; // 프리스탠딩: 전체 폭 - (좌,우 엔드판넬 각 20mm)
    }
  }

  // 공간 설정이 변경될 때 모든 프레임 속성을 업데이트하는 함수
  const updateAllFramesOnSpaceChange = (property, value) => {
    // 공간 치수 변경 적용
    handleDimensionChange(property, value);
    
    // 공간 속성 변경에 따른 프레임 속성 업데이트
    if (property === 'height') {
      // 높이(height) 변경 시 left와 right 프레임의 height 업데이트
      const frameProps = getFrameProperties();
      const updatedLeftProps = { ...frameProps.left, height: value };
      const updatedRightProps = { ...frameProps.right, height: value };
      handleModuleGapChange('left', updatedLeftProps);
      handleModuleGapChange('right', updatedRightProps);
    } 
    else if (property === 'width') {
      // 폭(width) 변경 시 상부 프레임과 하부 프레임의 width 업데이트
      const frameProps = getFrameProperties();
      
      // 상부 프레임과 받침대 프레임의 폭 계산
      const topFrameWidth = calculateTopFrameWidth(value);
      const bottomFrameWidth = calculateBottomFrameWidth(value);
      
      const updatedTopProps = { ...frameProps.top, width: topFrameWidth };
      const updatedBottomProps = { ...frameProps.bottom, width: bottomFrameWidth };
      
      // 상부 프레임과 받침대 업데이트
      handleModuleGapChange('top', updatedTopProps);
      handleModuleGapChange('bottom', updatedBottomProps);
      
      console.log('상부 프레임 폭 업데이트:', topFrameWidth);
      
      // 폭 변경 시 도어 개수 자동 업데이트 (최소 슬롯 개수로 조정)
      updateDoorCountBasedOnWidth(value);
    }
  };
  
  // 공간 너비에 따라 도어 개수를 적정 범위로 업데이트하는 함수
  const updateDoorCountBasedOnWidth = (width) => {
    // 내경 계산 (설치 타입에 따라 다르게 계산)
    let innerWidth;
    
    if (localSpaceType === "built-in") {
      innerWidth = width - 100; // 빌트인: 전체 폭 - (좌우 프레임 폭 각 50mm)
    } else if (localSpaceType === "semi-standing") {
      innerWidth = width - 70; // 세미스탠딩: 전체 폭 - (한쪽 프레임 50mm + 엔드판넬 20mm)
    } else {
      innerWidth = width - 40; // 프리스탠딩: 전체 폭 - (좌,우 엔드판넬 각 20mm)
    }
    
    // 슬롯 너비 제한 값 (mm)
    const MIN_SLOT_WIDTH = 300;
    const MAX_SLOT_WIDTH = 600;
    
    // 최대 슬롯 개수: 내경 너비를 최소 슬롯 너비로 나눈 값 (내림)
    const maxPossibleSlots = Math.floor(innerWidth / MIN_SLOT_WIDTH);
    
    // 최소 슬롯 개수: 내경 너비를 최대 슬롯 너비로 나눈 값 (올림)
    const minRequiredSlots = Math.ceil(innerWidth / MAX_SLOT_WIDTH);
    
    console.log(`도어 개수 제한 계산: ${minRequiredSlots}개 ~ ${maxPossibleSlots}개 (내경 ${innerWidth}mm 기준)`);
    
    // 현재 설정된 도어 개수 가져오기
    const currentDoorCount = modulesGap?.doorCount || doorCount || 8;
    
    // 도어 개수가 범위를 벗어나면 자동 조정 (최소 슬롯 개수로 조정)
    if (currentDoorCount < minRequiredSlots || currentDoorCount > maxPossibleSlots) {
      console.log(`[RightSidebar] 도어 개수 자동 조정: ${currentDoorCount}개 → ${minRequiredSlots}개 (최소 기준)`);
      
      // 지연 없이 즉시 업데이트 - 깜빡임 해결
      handleModuleGapChange('doorCount', Math.max(1, minRequiredSlots)); // 최소 1개
      
      // EditorContext의 doorCount 직접 업데이트
      if (editorContext && typeof editorContext.setDoorCount === 'function') {
        editorContext.setDoorCount(Math.max(1, minRequiredSlots));
      }
    }
  };

  // 설치 타입이나 벽 위치가 변경될 때 모든 프레임 속성을 업데이트
  useEffect(() => {
    if (!dimensions?.width) return; // 치수 정보가 없으면 실행하지 않음
    
    console.log('설치 타입 또는 벽 위치 변경: 프레임 속성 업데이트');
    
    // 프레임 속성 가져오기
    const frameProps = getFrameProperties();
    
    // 상부 프레임과 받침대 프레임의 폭 계산
    const topFrameWidth = calculateTopFrameWidth(dimensions.width);
    const bottomFrameWidth = calculateBottomFrameWidth(dimensions.width);
    
    console.log('계산된 상부 프레임 폭:', topFrameWidth);
    
    // 새 프레임 속성 계산
    const newLeftProps = {
      ...frameProps.left,
      width: localSpaceType === "built-in" ? 50 : 
             localSpaceType === "semi-standing" && wallPosition === "left" ? 50 : 20,
      depth: 20
    };
    
    const newRightProps = {
      ...frameProps.right,
      width: localSpaceType === "built-in" ? 50 : 
             localSpaceType === "semi-standing" && wallPosition === "right" ? 50 : 20,
      depth: 20
    };
    
    const newTopProps = { 
      ...frameProps.top, 
      width: topFrameWidth, 
      depth: 20 
    };
    
    const newBottomProps = { 
      ...frameProps.bottom, 
      width: bottomFrameWidth 
    };
    
    // 엔드판넬 속성 업데이트
    const newEndPanelLeftProps = {
      ...frameProps.endPanelLeft,
      height: dimensions.height || 2400,
      visible: localSpaceType === "semi-standing" && wallPosition === "right" || 
               localSpaceType === "free-standing"
    };
    
    const newEndPanelRightProps = {
      ...frameProps.endPanelRight,
      height: dimensions.height || 2400,
      visible: localSpaceType === "semi-standing" && wallPosition === "left" || 
               localSpaceType === "free-standing"
    };
    
    // 모든 프레임 속성 업데이트
    handleModuleGapChange('left', newLeftProps);
    handleModuleGapChange('right', newRightProps);
    handleModuleGapChange('top', newTopProps);
    handleModuleGapChange('bottom', newBottomProps);
    handleModuleGapChange('endPanelLeft', newEndPanelLeftProps);
    handleModuleGapChange('endPanelRight', newEndPanelRightProps);
    
    // 설치 타입이나 벽 위치가 변경되면 도어 개수도 자동 업데이트
    updateDoorCountBasedOnWidth(dimensions.width);
  }, [localSpaceType, wallPosition, dimensions?.width, dimensions?.height]);

  // 프레임 속성 업데이트 핸들러
  const handleFramePropertyChange = (frame, property, value) => {
    // 어떤 프레임인지에 따라 처리
    if (frame === 'space') {
      // 공간 치수 변경에 따른 모든 프레임 업데이트
      updateAllFramesOnSpaceChange(property, value);
    } else if (frame === 'frameMode' || frame === 'edgeThickness') {
      // 프레임 모드 및 엣지 두께 처리
      console.log(`[RightSidebar] ${frame} 변경: ${value}`);
      
      // EditorContext와 동기화
      if (editorContext && editorContext.updateFrameProperty) {
        editorContext.updateFrameProperty(frame, value);
      }
    } else {
      // 일반 프레임 속성 업데이트
      const frameProps = getFrameProperties();
      const updatedProps = { ...frameProps[frame], [property]: value };
      handleModuleGapChange(frame, updatedProps);
      
      // EditorContext와 동기화 - 프레임 속성을 EditorContext에도 반영
      if (editorContext && editorContext.updateFrameProperty) {
        console.log(`[RightSidebar] EditorContext 프레임 속성 동기화: ${frame}.${property} = ${value}`);
        
        // 프레임 타입에 따라 EditorContext 속성 이름 매핑
        if (frame === 'left') {
          editorContext.updateFrameProperty('leftFrameWidth', updatedProps.width);
        } else if (frame === 'right') {
          editorContext.updateFrameProperty('rightFrameWidth', updatedProps.width);
        } else if (frame === 'top') {
          editorContext.updateFrameProperty('topFrameHeight', updatedProps.height);
        } else if (frame === 'bottom') {
          // 받침대 관련 속성 처리
          if (property === 'height') {
            editorContext.updateFrameProperty('baseHeight', value);
            console.log(`[RightSidebar] 받침대 높이 업데이트: ${value}mm`);
          } else if (property === 'depth') {
            editorContext.updateFrameProperty('baseDepth', value);
            console.log(`[RightSidebar] 받침대 깊이 업데이트: ${value}mm`);
          } else if (property === 'width') {
            // 받침대 너비는 전체 구성에 영향을 미치므로 로그만 남김
            console.log(`[RightSidebar] 받침대 너비 변경: ${value}mm (내부 계산 값)`);
          }
        }
        
        // 모든 프레임에 공통적인 속성 업데이트
        if (property === 'depth' && (frame === 'left' || frame === 'right' || frame === 'top')) {
          editorContext.updateFrameProperty('frameThickness', value);
        }
        
        // 업데이트 후 뷰어 강제 업데이트 (editorContext의 updateViewers 사용)
        if (editorContext.updateViewers) {
          setTimeout(() => {
            editorContext.updateViewers();
          }, 50);
        }
      }
    }
  };

  // 단내림 설정 변경 핸들러
  const handleAirConditionerToggle = (value) => {
    console.log('[RightSidebar] handleAirConditionerToggle - 단내림 상태 변경:', value, '현재 상태:', localAcStatus);
    
    // 로컬 상태와 에디터 컨텍스트 동기화 전 내부 업데이트 플래그 설정
    isInternalUpdate.current = true;
    
    // 단내림 위치와 크기 기본값 - 설치 타입에 따라 기본 위치 결정
    const defaultPosition = 'left'; // 항상 좌측을 기본값으로 설정
    
    // 로컬 상태 업데이트
    setLocalAcStatus(value);
    
    // 옵션 상태에 따라 단내림 설정 관리
    let acUnitData = null;
    
    if (value === 'no') {
      // 단내림 없음 설정 시 단내림 정보 NULL 처리
      setLocalAcUnit(null);
    } else if (value === 'yes') {
      // 스텝2,3에서 가져온 값이 있으면 우선 사용, 없으면 기본 설정 적용
      // 가능한 한 이전 설정을 보존
      if (localAcUnit) {
        // 기존 데이터가 있으면 높이/너비 값 검증 후 사용
        const validatedAcUnit = {
          ...localAcUnit,
          width: localAcUnit.width > 0 ? localAcUnit.width : DEFAULT_AC_UNIT_WIDTH,
          height: (localAcUnit.height > 50 && localAcUnit.height < 1000) ? localAcUnit.height : DEFAULT_AC_UNIT_HEIGHT,
          position: localAcUnit.position || 'left',
          present: true
        };
        acUnitData = validatedAcUnit;
      } else if (editorContext?.frameProperties?.acUnit) {
        // EditorContext에 설정이 있으면 가져와서 검증 후 사용
        const contextAcUnit = editorContext.frameProperties.acUnit;
        acUnitData = {
          width: contextAcUnit.width > 0 ? contextAcUnit.width : DEFAULT_AC_UNIT_WIDTH,
          height: (contextAcUnit.height > 50 && contextAcUnit.height < 1000) ? contextAcUnit.height : DEFAULT_AC_UNIT_HEIGHT,
          position: contextAcUnit.position || 'left',
          depth: dimensions?.depth || 580,
          present: true
        };
      } else {
        // 기존 설정이 없으면 기본값 사용
        acUnitData = {
          width: DEFAULT_AC_UNIT_WIDTH,
          height: DEFAULT_AC_UNIT_HEIGHT,
          depth: dimensions?.depth || 580,
          position: defaultPosition,
          present: true
        };
      }
      
      console.log('[RightSidebar] 단내림 설정 데이터:', acUnitData);
      setLocalAcUnit(acUnitData);
      
      // 단내림 있음일 때 레이아웃 섹션도 펼치기
      setSectionsState(prev => ({
        ...prev,
        airConditioner: true,
        layout: true // 레이아웃 섹션도 함께 펼치기
      }));
      
      // 좌/우 도어 개수를 적절히 초기화
      const totalDoors = modulesGap?.doorCount || doorCount || 8;
      const halfCount = Math.floor(totalDoors / 2);
      setLeftDoorCount(Math.max(1, halfCount));
      setRightDoorCount(Math.max(1, totalDoors - halfCount));
      
      // 단내림 활성화 시 좌측 영역을 기본 선택
      setActiveLayoutArea("left");
    }
    
    // 1. 먼저 EditorContext 업데이트 (직접 업데이트가 더 안정적)
    if (editorContext) {
      console.log('[RightSidebar] EditorContext 업데이트 시작 - 단내림 상태:', value);
      
      // 단내림 상태 변경
      editorContext.updateFrameProperty('hasAirConditioner', value);
      
      // 단내림이 있을 경우 단내림 속성도 업데이트
      if (value === 'yes') {
        const acSettings = acUnitData || {
          width: DEFAULT_AC_UNIT_WIDTH,
          height: DEFAULT_AC_UNIT_HEIGHT,
          depth: dimensions?.depth || 580,
          position: defaultPosition,
          present: true
        };
        
        console.log('[RightSidebar] 단내림 설정 업데이트:', acSettings);
        
        // 단내림 상세 속성 업데이트
        editorContext.updateFrameProperty('acUnit', acSettings);
        
        // 즉시 뷰어 업데이트 (0ms 지연으로 변경)
        if (editorContext.updateViewers) {
          console.log('[RightSidebar] 단내림 활성화 후 즉시 뷰어 갱신');
          editorContext.updateViewers();
        }
      } else {
        // 단내림 없음 설정 시에도 acUnit 객체는 null로 업데이트하지 않고 
        // 속성을 유지하지만 present 값을 false로 설정
        const currentAcUnit = editorContext.frameProperties?.acUnit || {
          width: DEFAULT_AC_UNIT_WIDTH,
          height: DEFAULT_AC_UNIT_HEIGHT,
          position: 'left'
        };
        
        const updatedAcUnit = { ...currentAcUnit, present: false };
        editorContext.updateFrameProperty('acUnit', updatedAcUnit);
        
        // 즉시 뷰어 업데이트 (0ms 지연으로 변경)
        if (editorContext.updateViewers) {
          console.log('[RightSidebar] 단내림 비활성화 후 즉시 뷰어 갱신');
          editorContext.updateViewers();
        }
      }
    }
    
    // 2. handleSpecialPropertyChange 함수를 통해 Editor로도 전달 (호환성)
    if (handleSpecialPropertyChange) {
      console.log('[RightSidebar] 단내림 상태 변경 - Editor로 전달:', value);
      
      // 단내림 상태 업데이트
      handleSpecialPropertyChange('hasAirConditioner', value);
      
      // 단내림 "있음"인 경우 acUnit 정보도 함께 업데이트
      if (value === 'yes') {
        // 위치 값을 명시적으로 지정하여 기본 단내림 설정이 항상 표시되도록 함
        const updatedAcUnit = {
          ...(acUnitData || {
            width: DEFAULT_AC_UNIT_WIDTH,
            height: DEFAULT_AC_UNIT_HEIGHT,
            depth: dimensions?.depth || 580,
            position: defaultPosition
          }),
          present: true,
          _forceUpdate: true  // 강제 업데이트 플래그 추가
        };
        
        console.log('[RightSidebar] 단내림 설정 전달 - acUnit:', updatedAcUnit);
        handleSpecialPropertyChange('acUnit', updatedAcUnit);
      } else {
        // 단내림 없음 설정 시에도 acUnit 객체는 유지하되 present: false로 전달
        const currentAcUnit = editorContext?.frameProperties?.acUnit || {
          width: DEFAULT_AC_UNIT_WIDTH,
          height: DEFAULT_AC_UNIT_HEIGHT,
          position: 'left'
        };
        
        const updatedAcUnit = { ...currentAcUnit, present: false };
        handleSpecialPropertyChange('acUnit', updatedAcUnit);
      }
    }
    
    // 내부 업데이트 완료 후 플래그 초기화
    setTimeout(() => {
      isInternalUpdate.current = false;
      console.log('[RightSidebar] 내부 업데이트 플래그 해제됨');
      
      // 단내림 활성화 후 약간의 지연을 두고 다시 한번 뷰어 업데이트
      if (value === 'yes' && editorContext && editorContext.updateViewers) {
        console.log('[RightSidebar] 단내림 활성화 후 추가 뷰어 갱신');
        editorContext.updateViewers();
      }
    }, 100);
  };

  // 단내림 속성 변경 핸들러
  const handleAirConditionerPropertyChange = (property, value, options = {}) => {
    console.log('[RightSidebar] 단내림 속성 변경 요청:', property, value, options);
    
    // 현재 상태 복사 (초깃값 사용)
    const currentAcUnit = { ...(getFrameProperties()?.acUnit || { 
      width: DEFAULT_AC_UNIT_WIDTH, 
      height: DEFAULT_AC_UNIT_HEIGHT, 
      depth: dimensions?.depth || 580, 
      position: 'left' 
    }) };
    
    // 단내림 위치, 크기 변경 처리
    if (property === 'position' || property === 'width') {
      // property에 따라 값 업데이트
      const updatedAcUnit = {
        ...currentAcUnit,
        [property]: value,
        // 높이는 고정값 사용하지 않고 현재 값 유지
        height: currentAcUnit.height || DEFAULT_AC_UNIT_HEIGHT, // 기본값 사용
        // 깊이는 공간의 깊이와 동일하게 설정
        depth: dimensions?.depth || 580,
        _timestamp: Date.now(), // 업데이트 시간 기록
        _userAction: true       // 사용자 직접 조작 플래그
      };
      
      // 로컬 상태 업데이트
      setLocalAcUnit(updatedAcUnit);
      
      // 1. handleSpecialPropertyChange 함수 사용 (Editor.jsx와 연결)
      if (handleSpecialPropertyChange) {
        console.log('[RightSidebar] handleSpecialPropertyChange 호출 - acUnit 업데이트:', updatedAcUnit);
        handleSpecialPropertyChange('acUnit', updatedAcUnit);
      }
      
      // 2. 호환성을 위해 EditorContext도 업데이트
      setTimeout(() => {
        if (editorContext && editorContext.updateFrameProperties) {
          const updatedProps = {
            hasAirConditioner: localAcStatus,
            acUnit: updatedAcUnit
          };
          
          editorContext.updateFrameProperties(updatedProps);
          console.log('[RightSidebar] updateFrameProperties 호출 완료 - 옵션:', options);
          
          // 명시적으로 단내림 상태도 yes로 설정 (위치 변경 후 단내림이 비활성화되는 버그 방지)
          if (editorContext.frameProperties?.hasAirConditioner !== 'yes') {
            editorContext.updateFrameProperty('hasAirConditioner', 'yes');
          }
          
          // 뷰어 업데이트 
          if (editorContext.updateViewers) {
            editorContext.updateViewers();
          }
          
          // 내부 업데이트 완료 후 플래그 초기화
          setTimeout(() => {
            isInternalUpdate.current = false;
            console.log('[RightSidebar] 내부 업데이트 플래그 해제됨');
          }, 100);
        }
      }, 0);
    } else if (property === 'height') {
      // 내부 업데이트 플래그 설정
      isInternalUpdate.current = true;
      
      // 현재 도어 개수 저장 (상태 복원을 위해)
      const currentDoorCount = doorCount || editorContext?.doorCount;
      
      console.log('[RightSidebar] 단내림 높이 변경 시작:', value);
      
      // 로컬 상태 업데이트
      setLocalAcUnit(prev => {
        // 이전 상태가 없으면 기본값으로 초기화
        const prevUnit = prev || { 
          width: DEFAULT_AC_UNIT_WIDTH, // X축 (폭)
          height: DEFAULT_AC_UNIT_HEIGHT, // Y축 (높이)
          depth: dimensions?.depth || 580, // Z축 (깊이) - 공간의 깊이와 동일
          position: 'left' 
        };
        
        // 업데이트된 객체 생성
        const updated = {
          ...prevUnit,
          height: value,
          // 깊이는 공간의 깊이와 동일하게 설정
          depth: dimensions?.depth || 580
        };
        
        console.log('[RightSidebar] 단내림 높이 업데이트:', {
          prevHeight: prevUnit.height,
          newHeight: updated.height,
          depth: updated.depth
        });
        
        return updated;
      });
      
      if (editorContext && editorContext.updateFrameProperty) {
        // 현재 에어컨 단내림 속성 복사 (null 체크 추가)
        const currentAcUnit = { ...(getFrameProperties()?.acUnit || { 
          width: DEFAULT_AC_UNIT_WIDTH, 
          height: DEFAULT_AC_UNIT_HEIGHT, 
          depth: dimensions?.depth || 580, 
          position: 'left' 
        }) };
        
        // 기본 업데이트는 현재 값 유지
        const updatedAcUnit = {
          ...currentAcUnit,
          height: value,
          // 깊이는 공간의 깊이와 동일하게 설정
          depth: dimensions?.depth || 580
        };
        
        console.log('[RightSidebar] 단내림 높이 변경:', value);
        console.log('[RightSidebar] 업데이트된 단내림 설정:', updatedAcUnit);
        
        // EditorContext에 업데이트된 acUnit 전체를 전달
        editorContext.updateFrameProperty('acUnit', updatedAcUnit);
        
        // 단내림 상태도 업데이트 (만약 'no'로 초기화되었다면 다시 'yes'로 설정)
        if (editorContext.frameProperties.hasAirConditioner !== 'yes') {
          console.log('[RightSidebar] 단내림 상태 강제 복원 (yes)');
          editorContext.updateFrameProperty('hasAirConditioner', 'yes');
        }
        
        // 도어 개수도 유지하기 위해 재설정
        if (editorContext.setDoorCount && currentDoorCount) {
          editorContext.setDoorCount(currentDoorCount);
        }
        
        // 중요: handleSpecialPropertyChange 함수를 통해서도 직접 업데이트
        if (handleSpecialPropertyChange) {
          console.log('[RightSidebar] 단내림 높이 변경 - Editor.jsx에 직접 전달:', value);
          handleSpecialPropertyChange('acUnit', updatedAcUnit);
        }
        
        // 속성 변경 후 뷰어 강제 업데이트 (약간의 지연 추가)
        setTimeout(() => {
          if (editorContext.updateViewers) {
            console.log('[RightSidebar] 단내림 속성 변경 후 뷰어 업데이트 요청');
            editorContext.updateViewers();
          }
          
          // 내부 업데이트 플래그 리셋
          isInternalUpdate.current = false;
        }, 100);
      }
    }
  };

  // 바닥 마감재 토글 핸들러
  const handleFloorFinishToggle = (value) => {
    console.log('[RightSidebar] 바닥 마감재 상태 변경:', value);
    
    // 로컬 상태와 에디터 컨텍스트 동기화 전 내부 업데이트 플래그 설정
    isInternalUpdate.current = true;
    
    // 로컬 상태 먼저 업데이트
    setLocalFloorFinishStatus(value);
    
    // 옵션이 "없음"인 경우 두께를 0으로 설정
    if (value === 'no') {
      setLocalFloorThickness(0);
    } else if (value === 'yes' && (!localFloorThickness || localFloorThickness === 0)) {
      // "있음"이고 두께가 없거나 0인 경우 기본값 20mm로 설정
      setLocalFloorThickness(20);
    }
    
    // 에디터 컨텍스트에 즉시 업데이트
    if (editorContext && editorContext.updateFrameProperties) {
      const updatedProps = {
        hasFloorFinish: value,
        floorThickness: value === 'yes' ? (localFloorThickness || 20) : 0
      };
      
      editorContext.updateFrameProperties(updatedProps);
      console.log('[RightSidebar] updateFrameProperties 호출 완료 - 바닥 마감재 상태:', value);
      
      // 뷰어 즉시 업데이트 요청
      if (editorContext.updateViewers) {
        editorContext.updateViewers();
      }
      
      // 내부 업데이트 완료 후 플래그 초기화
      setTimeout(() => {
        isInternalUpdate.current = false;
        console.log('[RightSidebar] 내부 업데이트 플래그 해제됨');
      }, 100);
    } else {
      // editorContext가 없는 경우 내부 업데이트 플래그 초기화
      isInternalUpdate.current = false;
    }
  };

  // 바닥 마감재 두께 변경 핸들러
  const handleFloorThicknessChange = (value) => {
    if (editorContext && editorContext.updateFrameProperty) {
      console.log('[RightSidebar] 바닥 마감재 두께 변경:', value, 'mm');
      updateFrameProperty('floorThickness', value);
    }
  };

  // 받침대 토글 핸들러
  const handleBaseToggle = (value) => {
    // 변경 전 값 로깅
    console.log('[RightSidebar] 받침대 상태 변경 전:', getFrameProperties()?.hasBase);
    
    // 로컬 상태 업데이트
    setLocalBaseStatus(value);
    
    // EditorContext에 받침대 상태 업데이트
    if (editorContext && editorContext.updateFrameProperty) {
      console.log('[RightSidebar] 받침대 상태 변경:', value);
      updateFrameProperty('hasBase', value);
      
      // 뷰어 즉시 업데이트 요청
      if (editorContext.updateViewers) {
        editorContext.updateViewers();
      }
      
      // 현재 상태 확인을 위한 디버깅 로그
      setTimeout(() => {
        console.log('[RightSidebar] 받침대 상태 변경 후:', editorContext.frameProperties.hasBase);
      }, 100);
    } else {
      console.error('[RightSidebar] editorContext 또는 updateFrameProperty 함수가 없습니다.');
    }
  };

  // 받침대 설정 변경 핸들러
  const handleBaseSettingChange = (property, value) => {
    if (editorContext && editorContext.updateFrameProperty) {
      // 속성에 따라 다른 프레임 속성 업데이트
      if (property === 'height') {
        console.log('[RightSidebar] 받침대 높이 변경:', value, 'mm');
        updateFrameProperty('baseHeight', value);
      } else if (property === 'depth') {
        console.log('[RightSidebar] 받침대 깊이 변경:', value, 'mm');
        updateFrameProperty('baseDepth', value);
      } else if (property === 'raiseHeight') {
        console.log('[RightSidebar] 배치 높이 변경:', value, 'mm');
        updateFrameProperty('raiseHeight', value);
      }
    }
  };

  // 에디터 컨텍스트 옵션 동기화 시작
  useEffect(() => {
    if (!editorContext) return;

    console.log('[RightSidebar] 에디터 컨텍스트 옵션 동기화 시작');
    console.log('[RightSidebar] modulesGap 상태:', modulesGap);
    console.log('[RightSidebar] editorContext.frameProperties:', editorContext.frameProperties);

    // 단내림 상태 우선순위 확인 로그
    if (modulesGap?.hasAirConditioner) {
      console.log('[RightSidebar] modulesGap에서 가져온 단내림 상태:', modulesGap.hasAirConditioner);
    } else if (editorContext.frameProperties?.hasAirConditioner) {
      console.log('[RightSidebar] editorContext에서 가져온 단내림 상태:', editorContext.frameProperties.hasAirConditioner);
    }

    // Step2/3 우선 적용
    if (dimensions?.width) setWidth(dimensions.width);
    if (dimensions?.height) setHeight(dimensions.height);
    if (modulesGap?.doorCount) setDoorCount(modulesGap.doorCount);
    if (spaceType) setLocalSpaceType(spaceType);
    if (wallPosition) setLocalWallPosition(wallPosition);
    
    // 단내림 설정 명시적 적용 (Step2/3에서 온 값 우선)
    if (modulesGap?.hasAirConditioner) {
      console.log('[RightSidebar] modulesGap에서 단내림 상태 적용:', modulesGap.hasAirConditioner);
      setLocalAcStatus(modulesGap.hasAirConditioner);
      
      // 단내림 있음이면 단내림 설정도 적용하고 단내림 섹션 펼치기
      if (modulesGap.hasAirConditioner === 'yes' && modulesGap.acUnit) {
        console.log('[RightSidebar] modulesGap에서 단내림 설정 적용:', modulesGap.acUnit);
        setLocalAcUnit(modulesGap.acUnit);
        
        // 단내림 섹션 펼치기
        setSectionsState(prev => ({
          ...prev,
          airConditioner: true
        }));
        
        // EditorContext 업데이트
        if (editorContext.updateFrameProperty) {
          console.log('[RightSidebar] EditorContext에 단내림 상태 및 설정 적용');
          editorContext.updateFrameProperty('hasAirConditioner', 'yes');
          editorContext.updateFrameProperty('acUnit', modulesGap.acUnit);
        }
      }
    }

    // Step2/3 외에는 기존 context에서 동기화
    if (editorContext.frameProperties) {
      const props = editorContext.frameProperties;

      if (!modulesGap?.hasAirConditioner && props.hasAirConditioner !== undefined) {
        console.log('[RightSidebar] editorContext에서 단내림 상태 적용:', props.hasAirConditioner);
        setLocalAcStatus(props.hasAirConditioner);
        
        // 단내림 있음이면 단내림 섹션 펼치기
        if (props.hasAirConditioner === 'yes') {
          setSectionsState(prev => ({
            ...prev,
            airConditioner: true
          }));
        }
      }
      
      if (!modulesGap?.acUnit && props.acUnit) {
        console.log('[RightSidebar] editorContext에서 단내림 설정 적용:', props.acUnit);
        setLocalAcUnit(props.acUnit);
      }
      
      if (props.hasBase) setLocalBaseStatus(props.hasBase);
      if (props.baseHeight) setLocalBaseHeight(props.baseHeight);
      if (props.baseDepth) setLocalBaseDepth(props.baseDepth);
      if (props.floorThickness) setLocalFloorThickness(props.floorThickness);
    }

    hasInitialSyncRef.current = true;
    console.log('[RightSidebar] 에디터 컨텍스트 옵션 동기화 완료');
  }, []);

  // 넓이 변경 핸들러
  const handleWidthChange = (value) => {
    console.log('RightSidebar: 너비 변경:', value, 'mm');
    
    // 로컬 상태 업데이트
    setWidth(value);
    
    // handleDimensionChange 호출
    handleDimensionChange('width', value);
    
    // EditorContext에 너비 변경 전달
    if (editorContext && editorContext.updateRoomDimensions) {
      editorContext.updateRoomDimensions('width', value);
      
      // 너비 변경 후 관련 속성들 모두 업데이트
      const frameProps = getFrameProperties();
      
      // 너비에 따른 상부 및 하부 프레임 폭 계산
      const topFrameWidth = calculateTopFrameWidth(value);
      const bottomFrameWidth = calculateBottomFrameWidth(value);
      
      // 업데이트된 속성들 생성
      const updatedTopProps = { ...frameProps.top, width: topFrameWidth };
      const updatedBottomProps = { ...frameProps.bottom, width: bottomFrameWidth };
      
      // 프레임 속성 업데이트
      handleModuleGapChange('top', updatedTopProps);
      handleModuleGapChange('bottom', updatedBottomProps);
      
      // 너비 변경에 따른 도어 개수 자동 조정 (최소 제한)
      updateDoorCountBasedOnWidth(value);
      
      // 뷰어 업데이트
      if (editorContext.updateViewers) {
        editorContext.updateViewers();
      }
    }
  };

  const handleHeightChange = (value) => {
    console.log('RightSidebar: 높이 변경:', value, 'mm');
    
    // 로컬 상태 업데이트
    setHeight(value);
    
    // 외부 핸들러 호출
    handleDimensionChange('height', value);
    
    // EditorContext 업데이트
    if (editorContext && editorContext.updateRoomDimensions) {
      editorContext.updateRoomDimensions('height', value);
      
      // 높이 변경에 따른 좌우 프레임 높이 업데이트
      const frameProps = getFrameProperties();
      const updatedLeftProps = { ...frameProps.left, height: value };
      const updatedRightProps = { ...frameProps.right, height: value };
      
      // 프레임 속성 업데이트
      handleModuleGapChange('left', updatedLeftProps);
      handleModuleGapChange('right', updatedRightProps);
      
      // 뷰어 업데이트
      if (editorContext.updateViewers) {
        editorContext.updateViewers();
      }
    }
  };

  // 도어 개수 변경 핸들러
  const handleDoorCountChange = (count) => {
    console.log('[RightSidebar] 도어 개수 변경 처리 시작:', count);
    setDoorCount(count);
    
    // 기존 로직 호출
    handleModuleGapChange('doorCount', count);
    
    // EditorContext 업데이트
    if (editorContext && editorContext.setDoorCount) {
      console.log('[RightSidebar] 도어 개수 변경:', count);
      
      editorContext.setDoorCount(count);
      
      // 값 변경 후 뷰어 업데이트
      if (editorContext.updateViewers) {
        editorContext.updateViewers();
      }
    }
  };

  // 컴포넌트 마운트 시 초기 동기화
  useEffect(() => {
    if (!editorContext) return;
    
    console.log('[RightSidebar] 초기 상태 동기화 시작');
    
    // 각 상태 별 초기값 적용
    try {
      // 설치 타입
      if (editorContext.installationType && editorContext.installationType !== localSpaceType) {
        console.log('[RightSidebar] installationType 초기화:', editorContext.installationType);
        setLocalSpaceType(editorContext.installationType);
      }
      
      // 넓이 및 높이
      if (dimensions) {
        if (dimensions.width && dimensions.width !== width) {
          console.log('[RightSidebar] width 초기화:', dimensions.width);
          setWidth(dimensions.width);
        }
        if (dimensions.height && dimensions.height !== height) {
          console.log('[RightSidebar] height 초기화:', dimensions.height);
          setHeight(dimensions.height);
        }
      }
      
      // 도어 개수
      if (editorContext.doorCount && editorContext.doorCount !== doorCount) {
        console.log('[RightSidebar] doorCount 초기화:', editorContext.doorCount);
        setDoorCount(editorContext.doorCount);
      }
      
      // 프레임 속성
      if (editorContext.frameProperties) {
        const frameProps = editorContext.frameProperties;
        
        // 바닥 마감재
        if (frameProps.hasFloorFinish) {
          setLocalFloorFinishStatus(frameProps.hasFloorFinish);
          if (frameProps.floorThickness) {
            setLocalFloorThickness(frameProps.floorThickness);
          }
        }
        
        // 받침대
        if (frameProps.hasBase) {
          setLocalBaseStatus(frameProps.hasBase);
          if (frameProps.baseHeight) {
            setLocalBaseHeight(frameProps.baseHeight);
          }
          if (frameProps.baseDepth) {
            setLocalBaseDepth(frameProps.baseDepth);
          }
        }
        
        // 단내림
        if (frameProps.hasAirConditioner) {
          setLocalAcStatus(frameProps.hasAirConditioner);
          if (frameProps.acUnit) {
            setLocalAcUnit(frameProps.acUnit);
          }
        }
      }
      
      // 초기 동기화 완료 플래그 설정
      hasInitialSyncRef.current = true;
      
      console.log('[RightSidebar] 초기 상태 동기화 완료');
    } catch (error) {
      console.error('[RightSidebar] 초기 상태 동기화 오류:', error);
    }
  }, []); // 컴포넌트 마운트 시 1회만 실행

  // EditorContext의 단내림 상태가 변경될 때마다 로컬 상태 동기화
  useEffect(() => {
    if (editorContext && editorContext.frameProperties) {
      // hasAirConditioner 상태 동기화 - spaceType 변경에 의한 경우 덮어쓰지 않음
      const contextAcStatus = editorContext.frameProperties.hasAirConditioner;
      if (!isInternalUpdate.current && contextAcStatus !== undefined && contextAcStatus !== localAcStatus) {
        setLocalAcStatus(contextAcStatus);
      }
      // acUnit 설정 동기화 - 기존 로직 유지
      if (editorContext.frameProperties.acUnit) {
        const localAcUnitStr = JSON.stringify(localAcUnit || {});
        const contextAcUnitStr = JSON.stringify(editorContext.frameProperties.acUnit);
        if (contextAcUnitStr !== localAcUnitStr) {
          setLocalAcUnit(editorContext.frameProperties.acUnit);
        }
      }
    }
  }, [editorContext?.frameProperties]);

  // 벽위치 업데이트 함수 추가 - updateWallPosition이 정의되어 있지 않아 추가
  const updateWallPosition = (position) => {
    console.log('[RightSidebar] 벽 위치 변경:', position);
    
    // 로컬 상태 업데이트
    setLocalWallPosition(position);
    
    // 외부 핸들러 호출
    handleWallPositionChange(position);
    
    // EditorContext 업데이트
    if (editorContext && editorContext.setWallPosition) {
      editorContext.setWallPosition(position);
      
      // 뷰어 업데이트 요청
      if (editorContext.updateViewers) {
        setTimeout(() => {
          editorContext.updateViewers();
        }, 100);
      }
    }
  };

  // 단내림 기본 설정 상수 추가
  const DEFAULT_AC_UNIT = { width: DEFAULT_AC_UNIT_WIDTH, height: 200, depth: 200, position: 'left' };

  // 단내림 속성 수정 함수
  const handleAcUnitChange = (property, value, options = {}) => {
    console.log('[RightSidebar] handleAcUnitChange - 속성 변경:', property, value, '옵션:', options);
    
    // 내부 업데이트 플래그 설정
    isInternalUpdate.current = true;
    
    // 위치 변경 시 preserveHeight 옵션이 있으면 height/depth 동기화 하지 않음
    const shouldSyncHeightAndDepth = !options.preserveHeight;
    
    // 현재 단내림 설정 복사하여 수정 (null인 경우 기본값 사용)
    const prevAcUnit = localAcUnit || DEFAULT_AC_UNIT;
    const updatedAcUnit = {
      ...prevAcUnit,
      [property]: value
    };
    
    // height 또는 depth가 변경될 때만 동기화 처리
    if (property === 'height' && shouldSyncHeightAndDepth) {
      updatedAcUnit.depth = value;
    } else if (property === 'depth' && shouldSyncHeightAndDepth) {
      updatedAcUnit.height = value;
    }
    
    console.log('[RightSidebar] 단내림 업데이트 상세:', {
      prevHeight: prevAcUnit.height,
      newHeight: updatedAcUnit.height,
      property,
      preserveHeight: options.preserveHeight
    });
    
    // 로컬 상태 업데이트
    setLocalAcUnit(updatedAcUnit);
    
    // 1. handleSpecialPropertyChange 함수 사용 (Editor.jsx와 연결)
    if (handleSpecialPropertyChange) {
      console.log('[RightSidebar] handleSpecialPropertyChange 호출 - acUnit 업데이트:', updatedAcUnit);
      handleSpecialPropertyChange('acUnit', updatedAcUnit);
    }
    
    // 2. 호환성을 위해 EditorContext도 업데이트
    setTimeout(() => {
      if (editorContext && editorContext.updateFrameProperties) {
        const updatedProps = {
          hasAirConditioner: localAcStatus,
          acUnit: updatedAcUnit
        };
        
        editorContext.updateFrameProperties(updatedProps);
        console.log('[RightSidebar] updateFrameProperties 호출 완료 - 옵션:', options);
        
        // 명시적으로 단내림 상태도 yes로 설정 (위치 변경 후 단내림이 비활성화되는 버그 방지)
        if (editorContext.frameProperties?.hasAirConditioner !== 'yes') {
          editorContext.updateFrameProperty('hasAirConditioner', 'yes');
        }
        
        // 뷰어 업데이트 
        if (editorContext.updateViewers) {
          editorContext.updateViewers();
        }
        
        // 내부 업데이트 완료 후 플래그 초기화
        setTimeout(() => {
          isInternalUpdate.current = false;
          console.log('[RightSidebar] 내부 업데이트 플래그 해제됨');
        }, 100);
      }
    }, 0);
  };

  // 단내림 상태 전용 동기화 useEffect 추가
  useEffect(() => {
    if (!editorContext || isInternalUpdate.current) return;
    
    // hasAirConditioner 상태 동기화
    const hasAC = editorContext.frameProperties?.hasAirConditioner;
    if (hasAC !== undefined && hasAC !== localAcStatus) {
      console.log('[RightSidebar] 단내림 상태 자동 동기화:', hasAC);
      setLocalAcStatus(hasAC);
      
      // 단내림 상태가 변경되면 도어 개수도 적절히 초기화
      if (hasAC === 'yes') {
        // 단내림이 활성화되면 좌/우 도어 개수를 총 도어 개수를 반으로 나눠 초기화
        const totalDoors = modulesGap?.doorCount || doorCount || 8;
        const halfCount = Math.floor(totalDoors / 2);
        setLeftDoorCount(Math.max(1, halfCount));
        setRightDoorCount(Math.max(1, totalDoors - halfCount));
        
        // 단내림 활성화 시 좌측 영역을 기본 선택
        setActiveLayoutArea("left");
      }
    }
    
    // acUnit 객체 동기화 - 위치 변경 시 높이 유지를 위한 특별 처리
    if (hasAC === 'yes' && editorContext.frameProperties?.acUnit) {
      const contextAcUnit = editorContext.frameProperties.acUnit;
      const prevAcUnit = localAcUnit || { width: DEFAULT_AC_UNIT_WIDTH, height: 200, depth: 200, position: 'left' };
      
      // 위치 변경 감지 (위치만 변경되고 다른 값은 동일한 경우)
      const onlyPositionChanged = 
        contextAcUnit.position !== prevAcUnit.position && 
        contextAcUnit.width === prevAcUnit.width;
        
      console.log('[RightSidebar] 단내림 동기화 체크:', {
        onlyPositionChanged,
        prevPosition: prevAcUnit.position,
        newPosition: contextAcUnit.position,
        prevHeight: prevAcUnit.height,
        contextHeight: contextAcUnit.height
      });
      
      // 최종 높이와 깊이 결정 (위치만 변경된 경우 이전 값 유지)
      let finalHeight, finalDepth;
      
      if (onlyPositionChanged) {
        // 위치만 변경된 경우 이전 높이/깊이 유지 (기존 값이 범위 내인 경우)
        const isValidHeight = prevAcUnit.height <= 1000 && prevAcUnit.height >= 50;
        finalHeight = isValidHeight ? prevAcUnit.height : 200;
        finalDepth = isValidHeight ? prevAcUnit.depth : 200;
      } else {
        // 위치 외 다른 변경이 있는 경우 컨텍스트 값 사용 (범위 확인)
        finalHeight = contextAcUnit.height > 1000 ? 200 : (contextAcUnit.height || 200);
        finalDepth = contextAcUnit.depth > 1000 ? 200 : (contextAcUnit.depth || 200);
      }
      
      // 최종 단내림 속성 생성
      const sanitizedAcUnit = {
        ...contextAcUnit,
        height: finalHeight,
        depth: finalDepth,
        width: contextAcUnit.width || DEFAULT_AC_UNIT_WIDTH,
        position: contextAcUnit.position || 'left'
      };
      
      console.log('[RightSidebar] 단내림 최종 동기화 결정:', {
        finalHeight,
        finalDepth,
        onlyPositionChanged
      });
      
      // 로컬 상태와 컨텍스트 상태가 다를 경우에만 업데이트
      if (JSON.stringify(sanitizedAcUnit) !== JSON.stringify(localAcUnit)) {
        console.log('[RightSidebar] 단내림 설정 자동 동기화:', sanitizedAcUnit);
        setLocalAcUnit(sanitizedAcUnit);
      }
    }
  }, [editorContext?.frameProperties?.hasAirConditioner, editorContext?.frameProperties?.acUnit]);

  // 전역 상태 보존을 위한 수정 부분

  // 기존 코드를 찾아 useEffect 훅을 수정합니다.
  // 문제가 발생하는 곳은 다른 메뉴로 이동할 때 상태가 초기화되는 부분입니다.

  // EditorContext에서 상태를 저장하고 로드하는 로직을 강화합니다.
  useEffect(() => {
    // 에디터 컨텍스트가 변경될 때 실행됨 (초기 로드 또는 컨텍스트 업데이트)
    if (editorContext && !isInternalUpdate.current) {
      updateFramePropertiesFromContext();
    }
  }, [editorContext]);

  // 단내림 설정을 영구 저장하기 위한 수정
  // 기존 updateFramePropertiesFromContext 함수 수정


  return (
    <div className="w-80 bg-white overflow-hidden flex flex-col h-full border-l border-gray-200">
      {/* 상단 탭 메뉴 - 좌측바 스타일로 변경 */}
      <div className="border-b border-gray-200 w-full">
        <div className="flex px-3 py-2 justify-center">
          <div className="border border-emerald-500 rounded-md overflow-hidden flex w-full">
            <button
              className={cn(
                "flex-1 px-4 py-2 text-sm font-medium",
                activeTab === "배치 속성"
                  ? "bg-emerald-500 text-white"
                  : "bg-white text-emerald-500"
              )}
              onClick={() => setActiveTab("배치 속성")}
            >
              배치 속성
            </button>
            <button
              className={cn(
                "flex-1 px-4 py-2 text-sm font-medium",
                activeTab === "모듈 속성"
                  ? "bg-emerald-500 text-white"
                  : "bg-white text-emerald-500"
              )}
              onClick={() => setActiveTab("모듈 속성")}
            >
              모듈 속성
            </button>
          </div>
        </div>
      </div>

      {/* 본문 */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* 배치 속성 탭 내용 */}
        {activeTab === "배치 속성" && (
          <>
            {/* 설치 타입 */}
            <div className="mb-6">
              <SectionHeader 
                title="설치 타입" 
                isOpen={sectionsState.installType} 
                onToggle={() => toggleSection('installType')} 
              />
              
              {sectionsState.installType && (
                <>
                  <div className="border border-emerald-500 rounded-md overflow-hidden flex w-full mb-3">
                    <button
                      className={cn(
                        "flex-1 py-2 px-3 text-center text-sm font-medium transition-colors",
                        localSpaceType === "built-in"
                          ? "bg-emerald-500 text-white"
                          : "bg-white text-emerald-500"
                      )}
                      onClick={() => updateSpaceType("built-in")}
                    >
                      빌트인
                    </button>
                    <button
                      className={cn(
                        "flex-1 py-2 px-3 text-center text-sm font-medium transition-colors",
                        localSpaceType === "semi-standing"
                          ? "bg-emerald-500 text-white"
                          : "bg-white text-emerald-500"
                      )}
                      onClick={() => updateSpaceType("semi-standing")}
                    >
                      세미스탠딩
                    </button>
                    <button
                      className={cn(
                        "flex-1 py-2 px-3 text-center text-sm font-medium transition-colors",
                        localSpaceType === "free-standing"
                          ? "bg-emerald-500 text-white"
                          : "bg-white text-emerald-500"
                      )}
                      onClick={() => updateSpaceType("free-standing")}
                    >
                      프리스탠딩
                    </button>
                  </div>
                  
                  {/* 세미스탠딩 모드일 때만 벽 위치 토글 표시 */}
                  {localSpaceType === "semi-standing" && (
                    <div className="flex items-center my-3">
                      <div className="w-14 text-sm text-gray-600">벽 위치</div>
                      <div className="flex-1">
                        <div className="border border-emerald-500 rounded-md overflow-hidden flex">
                          <button
                            className={cn(
                              "flex-1 py-1.5 px-2 text-xs font-medium transition-colors",
                              wallPosition === "left" ? "bg-emerald-500 text-white" : "bg-white text-emerald-500"
                            )}
                            onClick={() => updateWallPosition("left")}
                          >
                            왼쪽
                          </button>
                          <button
                            className={cn(
                              "flex-1 py-1.5 px-2 text-xs font-medium transition-colors",
                              wallPosition === "right" ? "bg-emerald-500 text-white" : "bg-white text-emerald-500"
                            )}
                            onClick={() => updateWallPosition("right")}
                          >
                            오른쪽
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            <hr className="border-gray-200 my-4" />

            {/* 공간 설정 */}
            <div className="mb-6">
              <SectionHeader 
                title="공간 설정" 
                isOpen={sectionsState.spaceSettings} 
                onToggle={() => toggleSection('spaceSettings')} 
              />

              {sectionsState.spaceSettings && (
                <>
                  <DimensionInput
                    label="폭"
                    value={dimensions?.width || 4700}
                    onChange={(value) => handleFramePropertyChange('space', 'width', value)}
                    min={400}
                    max={10000}
                  />
                  
                  <DimensionInput
                    label="높이"
                    value={dimensions?.height || 2400}
                    onChange={(value) => handleFramePropertyChange('space', 'height', value)}
                    min={400}
                    max={10000}
                  />
                </>
              )}
            </div>
            <hr className="border-gray-200 my-4" />

            {/* 단내림 토글 */}
            {console.log('[RightSidebar] 렌더링 시 단내림 상태:', getFrameProperties()?.hasAirConditioner, '로컬 상태:', localAcStatus, '섹션 상태:', sectionsState.airConditioner)}
            <div className="mb-6">
              <SectionHeader 
                title="단내림" 
                isOpen={sectionsState.airConditioner} 
                onToggle={() => toggleSection('airConditioner')} 
              />

              {sectionsState.airConditioner && (
                <>
                  <div className="border border-emerald-500 rounded-md overflow-hidden flex">
                    {console.log('[RightSidebar] 단내림 버튼 렌더링 - 현재 상태:', localAcStatus)}
                    <button
                      className={cn(
                        "flex-1 py-2 px-3 text-center text-sm font-medium transition-colors",
                        localAcStatus === "yes"
                          ? "bg-emerald-500 text-white"
                          : "bg-white text-emerald-500"
                      )}
                      onClick={() => handleAirConditionerToggle("yes")}
                    >
                      있음
                    </button>
                    <button
                      className={cn(
                        "flex-1 py-2 px-3 text-center text-sm font-medium transition-colors",
                        localAcStatus === "no"
                          ? "bg-emerald-500 text-white"
                          : "bg-white text-emerald-500"
                      )}
                      onClick={() => handleAirConditionerToggle("no")}
                    >
                      없음
                    </button>
                  </div>
                  
                  {/* 단내림 있음일 때만 상세 설정 표시 - 조건 수정 */}
                  {localAcStatus === 'yes' && (
                    <AirConditionerSettings 
                      acUnit={localAcUnit || { width: DEFAULT_AC_UNIT_WIDTH, height: 200, position: 'left' }} 
                      onChange={handleAirConditionerPropertyChange} 
                    />
                  )}
                </>
              )}
            </div>
            <hr className="border-gray-200 my-4" />

            {/* 레이아웃 (위치 이동) */}
            <div className="mb-6">
              <SectionHeader 
                title="레이아웃" 
                isOpen={sectionsState.layout} 
                onToggle={() => toggleSection('layout')} 
              />

              {sectionsState.layout && (
                <>
                  {/* 단내림이 있을 때만 좌/우 영역 선택 탭 표시 */}
                  {localAcStatus === 'yes' && (
                    <div className="mb-3">
                      <div className="text-xs text-gray-600 mb-2">단내림 {localAcUnit?.position === 'left' ? '우측' : '좌측'} 도어 개수</div>
                      <div className="border border-emerald-500 rounded-md overflow-hidden flex w-full">
                        <button
                          className={cn(
                            "flex-1 py-2 px-1 text-xs font-medium transition-colors",
                            activeLayoutArea === "left" ? "bg-emerald-500 text-white" : "bg-white text-emerald-500"
                          )}
                          onClick={() => handleLayoutAreaChange("left")}
                        >
                          좌측
                        </button>
                        <button
                          className={cn(
                            "flex-1 py-2 px-1 text-xs font-medium transition-colors",
                            activeLayoutArea === "right" ? "bg-emerald-500 text-white" : "bg-white text-emerald-500"
                          )}
                          onClick={() => handleLayoutAreaChange("right")}
                        >
                          우측
                        </button>
                      </div>
                    </div>
                  )}

                  <DoorCountInput
                    label="도어 개수"
                    value={localAcStatus === 'yes' 
                      ? (activeLayoutArea === "left" ? leftDoorCount : rightDoorCount)
                      : (modulesGap?.doorCount || doorCount || 8)
                    }
                    onChange={updateDoorCount}
                    spaceWidth={localAcStatus === 'yes'
                      ? (activeLayoutArea === "left"
                          ? ((dimensions?.width || 4700) - (localAcUnit?.width || DEFAULT_AC_UNIT_WIDTH)) / 2
                          : ((dimensions?.width || 4700) - (localAcUnit?.width || DEFAULT_AC_UNIT_WIDTH)) / 2)
                      : dimensions?.width || 4700
                    }
                    spaceType={localSpaceType}
                  />
                </>
              )}
            </div>
            <hr className="border-gray-200 my-4" />

            {/* 바닥 마감재 토글 */}
            {console.log('[RightSidebar] 렌더링 시 바닥 마감재 상태:', getFrameProperties()?.hasFloorFinish)}
            <div className="mb-6">
              <SectionHeader 
                title="바닥 마감재" 
                isOpen={sectionsState.floorFinish} 
                onToggle={() => toggleSection('floorFinish')} 
              />

              {sectionsState.floorFinish && (
                <>
                  <div className="border border-emerald-500 rounded-md overflow-hidden flex">
                    <button
                      className={cn(
                        "flex-1 py-2 px-3 text-center text-sm font-medium transition-colors",
                        localFloorFinishStatus === "yes"
                          ? "bg-emerald-500 text-white"
                          : "bg-white text-emerald-500"
                      )}
                      onClick={() => handleFloorFinishToggle("yes")}
                    >
                      있음
                    </button>
                    <button
                      className={cn(
                        "flex-1 py-2 px-3 text-center text-sm font-medium transition-colors",
                        localFloorFinishStatus === "no"
                          ? "bg-emerald-500 text-white"
                          : "bg-white text-emerald-500"
                      )}
                      onClick={() => handleFloorFinishToggle("no")}
                    >
                      없음
                    </button>
                  </div>
                  
                  {/* 바닥 마감재 있음일 때만 상세 설정 표시 */}
                  {localFloorFinishStatus === 'yes' && (
                    <FloorFinishSettings 
                      thickness={localFloorThickness || 20} 
                      onChange={handleFloorThicknessChange} 
                    />
                  )}
                </>
              )}
            </div>
            <hr className="border-gray-200 my-4" />

            {/* 프레임 속성 설정 */}
            <div className="mb-6">
              <SectionHeader 
                title="프레임 속성" 
                isOpen={sectionsState.frameProperties} 
                onToggle={() => toggleSection('frameProperties')} 
              />

              {sectionsState.frameProperties && (
                <FramePropertyInputImproved
                  frameType="frame"
                  selectedFrame={selectedFrame}
                  onSelectFrame={(frame) => {
                    setSelectedFrame(frame);
                  }}
                  frameProperties={getFrameProperties()}
                  onUpdateProperty={handleFramePropertyChange}
                />
              )}
            </div>
            <hr className="border-gray-200 my-4" />

            {/* 받침대 토글 */}
            {console.log('[RightSidebar] 렌더링 시 받침대 상태:', getFrameProperties()?.hasBase)}
            <div className="mb-6">
              <SectionHeader 
                title="받침대" 
                isOpen={sectionsState.base} 
                onToggle={() => toggleSection('base')} 
              />

              {sectionsState.base && (
                <>
                  <div className="border border-emerald-500 rounded-md overflow-hidden flex">
                    <button
                      className={cn(
                        "flex-1 py-2 px-3 text-center text-sm font-medium transition-colors",
                        localBaseStatus === "yes"
                          ? "bg-emerald-500 text-white"
                          : "bg-white text-emerald-500"
                      )}
                      onClick={() => handleBaseToggle("yes")}
                    >
                      있음
                    </button>
                    <button
                      className={cn(
                        "flex-1 py-2 px-3 text-center text-sm font-medium transition-colors",
                        localBaseStatus === "no"
                          ? "bg-emerald-500 text-white"
                          : "bg-white text-emerald-500"
                      )}
                      onClick={() => handleBaseToggle("no")}
                    >
                      없음
                    </button>
                  </div>
                  
                  {/* 받침대 설정 표시 */}
                  <BaseSettings 
                    hasBase={localBaseStatus || 'yes'}
                    baseData={{
                      height: localBaseHeight || 80,
                      depth: localBaseDepth || 580,
                      raiseHeight: getFrameProperties()?.raiseHeight || 0
                    }}
                    onChange={handleBaseSettingChange}
                  />
                </>
              )}
            </div>
          </>
        )}

        {/* 모듈 속성 탭 내용 */}
        {activeTab === "모듈 속성" && (
          <div className="mb-6">
            <div className="flex items-center mb-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></div>
              <h3 className="text-sm font-medium text-[#00C092]">모듈 속성</h3>
            </div>
            <div className="text-sm text-gray-500 mt-2">
              선택된 모듈이 없습니다.
            </div>
          </div>
        )}
      </div>

      {/* 하단 버튼 */}
      <div className="p-5 border-t border-gray-200">
        <div className="mt-auto pt-5">
          <button className="w-full py-2.5 rounded-md bg-emerald-500 text-white font-medium">
            완료
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import ModuleRenderer from './ModuleRenderer';
import ModuleSlots from './ModuleSlots';
import ModuleItem from './modules/ModuleItem';
import ModuleEditorCanvas from './modules/ModuleEditorCanvas';
import { SAMPLE_MODULES } from './modules/ModuleTypes';
import { calculateSlotIndex, calculateSlotPosition, generateModuleId } from './modules/ModuleUtils';
import initialModulesData from './modules/initialModules.json';
import { useDispatch } from 'react-redux';
import { updatePlacementInfo } from '../actions/placementInfoActions';

// 디버깅 정보를 표시하는 컴포넌트
const DebugInfo = ({ data }) => {
  return (
    <div style={{ 
      position: 'absolute', 
      top: '50px', 
      right: '10px', 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: '10px',
      zIndex: 2000,
      maxWidth: '300px',
      maxHeight: '300px',
      overflow: 'auto',
      fontSize: '12px',
      fontFamily: 'monospace'
    }}>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

// 외부 섬네일 통합 기능
const ExternalThumbnail = ({ position, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [eventCount, setEventCount] = useState(0);
  
  const handleClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log(`외부 섬네일 클릭됨 (${position})`);
    setEventCount(prev => prev + 1);
    onClick(position);
  }, [position, onClick]);

  const positionToClass = {
    'top-left': 'external-thumbnail-1',
    'top-center': 'external-thumbnail-2',
    'top-right': 'external-thumbnail-3',
    'middle-left': 'external-thumbnail-4',
    'middle-center': 'external-thumbnail-5',
    'middle-right': 'external-thumbnail-6',
    'bottom-left': 'external-thumbnail-7',
    'bottom-center': 'external-thumbnail-8',
    'bottom-right': 'external-thumbnail-9',
  };

  return (
    <div
      id={positionToClass[position]}
      className="external-thumbnail"
      onClick={handleClick}
      onMouseEnter={() => {
        setIsHovered(true);
        console.log(`마우스 오버: ${position}`);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        console.log(`마우스 아웃: ${position}`);
      }}
      style={{
        position: 'fixed', // absolute 대신 fixed로 변경
        width: '80px',
        height: '120px',
        border: isHovered ? '3px solid #ff0000' : '2px solid #00ff00', // 테두리 색상 변경 (디버깅용)
        cursor: 'pointer',
        zIndex: 2000, // z-index 증가
        boxSizing: 'border-box',
        transition: 'border 0.2s ease',
        background: isHovered ? 'rgba(255, 0, 0, 0.3)' : 'rgba(0, 255, 0, 0.1)', // 배경색 추가 (디버깅용)
        // 위치는 CSS로 오버레이
      }}
    >
      {/* 클릭 및 호버 상태 표시 오버레이 */}
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        fontSize: '10px',
        color: isHovered ? '#ffffff' : '#00ff00',
        fontWeight: 'bold'
      }}>
        {position}<br/>
        {eventCount > 0 && `클릭: ${eventCount}`}
      </div>
    </div>
  );
};

// 모듈 편집기 메인 컴포넌트
const ModuleEditor = ({ 
  initialModules = [], 
  onSave,
  doorCount = 8,
  dimensions = { width: 4800, height: 2300, depth: 600 }
}) => {
  // 모듈 상태 관리
  const [availableModules, setAvailableModules] = useState(() => {
    // initialModulesData가 유효하고 modules 배열이 있으면 사용, 아니면 SAMPLE_MODULES 사용
    if (initialModulesData && Array.isArray(initialModulesData.modules) && initialModulesData.modules.length > 0) {
      console.log('[ModuleEditor] 초기 모듈 데이터 로드:', initialModulesData.modules.length, '개 모듈');
      return initialModulesData.modules;
    } else {
      console.log('[ModuleEditor] 샘플 모듈 데이터 사용:', SAMPLE_MODULES.length, '개 모듈');
      return SAMPLE_MODULES;
    }
  });
  
  const [placedModules, setPlacedModules] = useState(initialModules);
  const [hoveredSlot, setHoveredSlot] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null); // 선택된 모듈
  const [ghostModule, setGhostModule] = useState(null); // 고스트 모듈 (미리보기)
  const [debugData, setDebugData] = useState({ thumbnailsActive: false, events: [] });
  
  // 치수 표시 토글 상태 추가
  const [showDimensions, setShowDimensions] = useState(true);
  
  // 드래그 앤 드롭 상태 관리 간소화
  const [isDragging, setIsDragging] = useState(false);
  const [currentDragModule, setCurrentDragModule] = useState(null);
  const [dropTargetSlot, setDropTargetSlot] = useState(null);
  const canvasContainerRef = useRef(null);
  
  // 외부 섬네일 위치 매핑
  const externalThumbnailPositions = useMemo(() => [
    'top-left', 'top-center', 'top-right',
    'middle-left', 'middle-center', 'middle-right',
    'bottom-left', 'bottom-center', 'bottom-right'
  ], []);

  // 외부 섬네일 위치별 모듈 매핑
  const positionToModule = useCallback((position) => {
    // 위치에 따라 특정 모듈 ID 반환
    switch(position) {
      case 'top-left': 
        return 'shelf-module1'; // 첫번째 행, 첫번째 열 - 오픈 선반
      case 'top-center': 
        return 'shelf-module1'; // 첫번째 행, 두번째 열 - 선반
      case 'top-right': 
        return 'shelf-module1'; // 첫번째 행, 세번째 열 - 선반
      case 'middle-left': 
        return 'cabinet-module1'; // 두번째 행, 첫번째 열 - 캐비넷
      case 'middle-center': 
        return 'shelf-module1'; // 두번째 행, 두번째 열 - 선반
      case 'middle-right': 
        return 'cabinet-module1'; // 두번째 행, 세번째 열 - 캐비넷
      case 'bottom-left': 
        return 'cabinet-module1'; // 세번째 행, 첫번째 열 - 캐비넷
      case 'bottom-center': 
        return 'shelf-model1'; // 세번째 행, 두번째 열 - 선반
      case 'bottom-right': 
        return 'cabinet-module1'; // 세번째 행, 세번째 열 - 캐비넷
      default:
        return 'cabinet-module1';
    }
  }, []);
  
  // 슬롯 상태 계산 (비어있는지, 모듈이 있는지, 호버 중인지 등)
  const slotStatuses = useMemo(() => {
    const statuses = Array(doorCount).fill('empty');
    
    // 모듈이 배치된 슬롯 표시
    placedModules.forEach(module => {
      const slotIndex = calculateSlotIndex(module.position.x, dimensions.width, doorCount);
      if (slotIndex >= 0 && slotIndex < doorCount) {
        statuses[slotIndex] = 'occupied';
      }
    });
    
    // 호버/선택/드래그 대상 슬롯 표시
    if (hoveredSlot !== null) {
      statuses[hoveredSlot] = statuses[hoveredSlot] === 'occupied' ? 'occupied' : 'hover';
    }
    
    if (selectedSlot !== null) {
      statuses[selectedSlot] = 'selected';
    }
    
    // 드래그 중인 대상 슬롯 하이라이트
    if (dropTargetSlot !== null) {
      statuses[dropTargetSlot] = statuses[dropTargetSlot] === 'occupied' ? 'occupied' : 'highlight';
    }
    
    return statuses;
  }, [placedModules, doorCount, hoveredSlot, selectedSlot, dropTargetSlot, dimensions.width]);
  
  // 단순화된 드래그 시작 핸들러
  const handleDragStart = useCallback((e, module) => {
    // e.preventDefault()를 제거하여 기본 드래그 앤 드롭이 작동하도록 함
    console.log('드래그 시작:', module.name);
    setIsDragging(true);
    setCurrentDragModule(module);
    
    // 드래그 중인 모듈을 고스트로 표시
    setGhostModule({
      ...module,
      id: generateModuleId(module.id),
      position: { x: 0, y: 0, z: 0 }
    });
    
    // 글로벌 이벤트 리스너 추가
    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
  }, []);
  
  // 드래그 중 이벤트 핸들러
  const handleDragMove = useCallback((e) => {
    if (!isDragging || !currentDragModule) return;
    
    // 캔버스 컨테이너의 위치와 크기 가져오기
    if (!canvasContainerRef.current) return;
    
    const rect = canvasContainerRef.current.getBoundingClientRect();
    
    // 마우스 위치를 캔버스 내 상대 좌표로 변환
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    // 유효 범위 내인지 확인 (0.0~1.0)
    if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
      // x 좌표를 슬롯 인덱스로 변환 (정수로 반올림)
      const newSlotIndex = Math.floor(x * doorCount);
      
      // 이전과 다른 슬롯으로 변경되었을 때만 상태 업데이트
      if (newSlotIndex !== dropTargetSlot) {
        console.log(`드래그 중: 슬롯 ${newSlotIndex + 1} 위에 있음 (x: ${x.toFixed(2)}, y: ${y.toFixed(2)})`);
        setDropTargetSlot(newSlotIndex);
        
        // 고스트 모듈 위치 업데이트 (슬롯 중앙에 위치)
        const xPosition = calculateSlotPosition(newSlotIndex, dimensions.width, doorCount);
        
        const newGhostModule = {
          ...currentDragModule,
          position: { x: xPosition, y: 0, z: 0 }
        };
        
        setGhostModule(newGhostModule);
      }
    } else {
      // 캔버스 밖으로 나갔을 때
      if (dropTargetSlot !== null) {
        console.log('드래그 중: 캔버스 밖으로 나감');
        setDropTargetSlot(null);
        setGhostModule(null);
      }
    }
  }, [isDragging, currentDragModule, dropTargetSlot, doorCount, dimensions.width]);

  // 드래그 종료 이벤트 핸들러
  const handleDragEnd = useCallback(() => {
    // 글로벌 이벤트 리스너 제거
    window.removeEventListener('mousemove', handleDragMove);
    window.removeEventListener('mouseup', handleDragEnd);
    
    console.log('드래그 종료:', {
      dropTargetSlot,
      currentDragModule: currentDragModule?.name,
      isValidSlot: dropTargetSlot !== null
    });
    
    // 유효한 슬롯에 모듈 배치
    if (dropTargetSlot !== null && currentDragModule) {
      const xPosition = calculateSlotPosition(dropTargetSlot, dimensions.width, doorCount);
      
      // 새 모듈 생성
      const newModule = {
        ...currentDragModule,
        id: generateModuleId(currentDragModule.id),
        position: { x: xPosition, y: 0, z: 0 }
      };
      
      // 모듈 배치
      setPlacedModules(prev => [...prev, newModule]);
      console.log(`모듈 "${currentDragModule.name}"을 슬롯 ${dropTargetSlot + 1}에 배치했습니다.`, newModule);
    } else {
      console.log('모듈 배치 취소: 유효한 대상 슬롯 없음');
    }
    
    // 상태 초기화
    setIsDragging(false);
    setCurrentDragModule(null);
    setDropTargetSlot(null);
    setGhostModule(null);
  }, [dropTargetSlot, currentDragModule, dimensions.width, doorCount]);
  
  // 슬롯 호버 핸들러
  const handleSlotHover = useCallback((slotIndex, isHovering) => {
    setHoveredSlot(isHovering ? slotIndex : null);
    
    // 선택된 모듈이 있고 호버링 중이면 고스트 모듈 업데이트
    if (selectedModule && isHovering) {
      const xPosition = calculateSlotPosition(slotIndex, dimensions.width, doorCount);
      
      setGhostModule({
        ...selectedModule,
        position: {
          x: xPosition,
          y: 0,
          z: 0
        }
      });
    } else if (!isHovering && !isDragging) {
      // 호버링이 끝나고 드래그 중이 아니면 고스트 모듈 제거
      setGhostModule(null);
    }
  }, [selectedModule, doorCount, dimensions.width, isDragging]);
  
  // 슬롯 클릭 핸들러
  const handleSlotClick = useCallback((slotIndex) => {
    console.log(`슬롯 ${slotIndex + 1} 클릭됨`);
    setSelectedSlot(slotIndex);
    
    // 선택된 모듈이 있으면 해당 슬롯에 배치
    if (selectedModule) {
      const xPosition = calculateSlotPosition(slotIndex, dimensions.width, doorCount);
      
      const newModule = {
        ...selectedModule,
        id: generateModuleId(selectedModule.id),
        position: {
          x: xPosition,
          y: 0,
          z: 0
        }
      };
      
      setPlacedModules(prev => [...prev, newModule]);
      console.log(`모듈 "${selectedModule.name}"을 슬롯 ${slotIndex + 1}에 배치했습니다.`, newModule);
      
      // 배치 후 선택 상태 초기화
      setSelectedModule(null);
      setGhostModule(null);
    }
  }, [selectedModule, doorCount, dimensions.width]);
  
  // 모듈 선택 핸들러
  const handleModuleSelect = useCallback((module) => {
    // 같은 모듈을 다시 클릭하면 선택 해제
    if (selectedModule && selectedModule.id === module.id) {
      setSelectedModule(null);
      setGhostModule(null);
    } else {
      setSelectedModule(module);
      console.log('모듈 선택됨:', module.name);
    }
  }, [selectedModule]);
  
  // 외부 섬네일 클릭 핸들러
  const handleExternalThumbnailClick = useCallback((position) => {
    console.log('외부 섬네일 핸들러 호출됨:', position);
    
    // 위치에 해당하는 모듈 ID 가져오기
    const moduleId = positionToModule(position);
    
    // 디버깅 정보 업데이트
    setDebugData(prev => ({
      ...prev,
      events: [...prev.events.slice(-9), {
        type: 'click',
        position,
        moduleId,
        time: new Date().toLocaleTimeString()
      }]
    }));
    
    // 해당 모듈 찾기
    const module = availableModules.find(m => m.id === moduleId);
    if (!module) {
      console.error(`모듈을 찾을 수 없음: ${moduleId}`);
      return;
    }
    
    console.log(`모듈 찾음: ${module.name}`);
    
    // 첫 번째 비어있는 슬롯 찾기
    let targetSlot = null;
    for (let i = 0; i < slotStatuses.length; i++) {
      if (slotStatuses[i] === 'empty') {
        targetSlot = i;
        break;
      }
    }
    
    // 비어있는 슬롯이 없으면 첫 번째 슬롯 사용
    if (targetSlot === null) {
      targetSlot = 0;
    }
    
    // 모듈 배치
    const xPosition = calculateSlotPosition(targetSlot, dimensions.width, doorCount);
    
    const newModule = {
      ...module,
      id: generateModuleId(module.id),
      position: { x: xPosition, y: 0, z: 0 }
    };
    
    console.log(`모듈 "${module.name}"을 슬롯 ${targetSlot + 1}에 배치합니다.`, newModule);
    setPlacedModules(prev => [...prev, newModule]);
  }, [availableModules, positionToModule, slotStatuses, dimensions.width, doorCount]);
  
  // 키보드 이벤트 리스너 업데이트
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' && selectedSlot !== null) {
        // 선택된 슬롯의 모듈 제거
        const xPosition = calculateSlotPosition(selectedSlot, dimensions.width, doorCount);
        setPlacedModules(prev => 
          prev.filter(module => 
            Math.abs(module.position.x - xPosition) > 5
          )
        );
        setSelectedSlot(null);
      } else if (e.key === 'Escape') {
        // ESC 키를 누르면 모든 상태 초기화
        setSelectedModule(null);
        setGhostModule(null);
        setIsDragging(false);
        setCurrentDragModule(null);
        setDropTargetSlot(null);
        
        // 글로벌 이벤트 리스너 제거
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
      } else if (e.key === 'F2') {
        // F2 키를 누르면 디버깅 모드 토글
        setDebugData(prev => ({
          ...prev,
          thumbnailsActive: !prev.thumbnailsActive
        }));
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [handleDragMove, handleDragEnd, selectedSlot, doorCount, dimensions.width]);
  
  // 모든 모듈 제거 함수
  const handleClearAllModules = () => {
    setPlacedModules([]);
    setSelectedSlot(null);
  };

  // 외부 섬네일 클릭 위치를 설정하기 위한 CSS 삽입
  useEffect(() => {
    // 스크립트에서 동적으로 CSS 규칙 추가
    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = `
      .external-thumbnail-1 { top: 285px; left: 90px; }
      .external-thumbnail-2 { top: 285px; left: 169px; }
      .external-thumbnail-3 { top: 285px; left: 249px; }
      .external-thumbnail-4 { top: 410px; left: 90px; }
      .external-thumbnail-5 { top: 410px; left: 169px; }
      .external-thumbnail-6 { top: 410px; left: 249px; }
      .external-thumbnail-7 { top: 535px; left: 90px; }
      .external-thumbnail-8 { top: 535px; left: 169px; }
      .external-thumbnail-9 { top: 535px; left: 249px; }
    `;
    document.head.appendChild(style);
    
    // 디버깅 정보 초기화
    setDebugData({
      thumbnailsActive: true,
      events: [{ type: 'init', message: '섬네일 오버레이 초기화됨', time: new Date().toLocaleTimeString() }]
    });

    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  // 커서 스타일 직접 적용
  useEffect(() => {
    // 페이지의 모든 이미지에 커서 스타일 적용
    const applyPointerCursor = () => {
      // 모든 이미지 요소에 커서 포인터 적용
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        img.style.cursor = 'pointer';
      });

      // 특정 컨테이너에 커서 포인터 적용
      const containers = document.querySelectorAll('.relative.bg-gray-50, [style*="paddingBottom"]');
      containers.forEach(container => {
        container.style.cursor = 'pointer';
      });
      
      // 섬네일 영역 내 모든 요소에 적용
      const thumbnailContainers = document.querySelectorAll('.grid.grid-cols-3.gap-3 > div');
      thumbnailContainers.forEach(container => {
        container.style.cursor = 'pointer';
        // 하위 요소에도 커서 포인터 적용
        const children = container.querySelectorAll('*');
        children.forEach(child => {
          child.style.cursor = 'pointer';
        });
      });
    };

    // 초기 실행
    applyPointerCursor();
    
    // 500ms마다 실행하여 동적으로 추가되는 요소에도 적용
    const interval = setInterval(applyPointerCursor, 500);
    
    return () => clearInterval(interval);
  }, []);
  
  const dispatch = useDispatch();

  const handleSampleModule = () => {
    const newPlacementInfo = {
      modules: [
        {
          id: `sample_${Date.now()}`,
          name: '샘플 서랍장',
          type: 'drawer',
          dimensions: { width: 600, height: 300, depth: 580 },
          position: { x: 0, y: 0, z: 0 },
          options: { drawerCount: 3 }
        }
      ]
    };
    dispatch(updatePlacementInfo(newPlacementInfo));
  };

  // 컴포넌트 초기화 시 콘솔 로그 추가
  useEffect(() => {
    console.log('[ModuleEditor] 컴포넌트 마운트됨');
    console.log('[ModuleEditor] 초기 크기:', dimensions);
    console.log('[ModuleEditor] 슬롯 개수:', doorCount);
    console.log('[ModuleEditor] 사용 가능한 모듈:', availableModules.length);
    
    if (availableModules.length === 0) {
      console.warn('[ModuleEditor] 경고: 사용 가능한 모듈이 없습니다!');
      // 필요한 경우 샘플 모듈 데이터로 강제 초기화
      setAvailableModules(SAMPLE_MODULES);
    }
    
    return () => {
      console.log('[ModuleEditor] 컴포넌트 언마운트됨');
    };
  }, []);
  
  // 모듈 배치 정보가 변경될 때마다 업데이트 및 저장
  useEffect(() => {
    if (placedModules.length > 0) {
      // 배치 정보 데이터 구조 생성
      const placementInfo = {
        modules: placedModules.map(module => ({
          ...module,
          // 필요한 경우 추가 메타데이터 설정
          slotIndex: calculateSlotIndex(module.position.x, dimensions.width, doorCount)
        }))
      };
      
      // 배치 정보 업데이트 액션 디스패치
      dispatch(updatePlacementInfo(placementInfo));
      
      // 디버깅: 세션 스토리지에도 저장
      try {
        sessionStorage.setItem('furniture_placement', JSON.stringify(placementInfo));
        console.log('모듈 배치 정보가 저장되었습니다.', placementInfo);
      } catch (error) {
        console.error('모듈 배치 정보 저장 실패:', error);
      }
    }
  }, [placedModules, dimensions.width, doorCount, dispatch]);

  // 드래그 오버 이벤트 핸들러 추가
  const handleDragOver = useCallback((e) => {
    e.preventDefault(); // 드롭을 허용하기 위해 필요
    
    if (!canvasContainerRef.current) return;
    
    const rect = canvasContainerRef.current.getBoundingClientRect();
    
    // 마우스 위치를 캔버스 내 상대 좌표로 변환
    const x = (e.clientX - rect.left) / rect.width;
    
    // x 좌표를 슬롯 인덱스로 변환
    const slotIndex = Math.floor(x * doorCount);
    
    // 유효한 슬롯 범위 내인지 확인
    if (slotIndex >= 0 && slotIndex < doorCount) {
      // 이전과 다른 슬롯으로 변경되었을 때만 상태 업데이트
      if (slotIndex !== dropTargetSlot) {
        console.log(`드래그 오버: 슬롯 ${slotIndex + 1}`);
        setDropTargetSlot(slotIndex);
      }
    }
  }, [doorCount, dropTargetSlot]);
  
  // 드롭 이벤트 핸들러 추가
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    
    try {
      // 드래그 데이터 가져오기
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      console.log('드롭 데이터:', data);
      
      // 모듈 찾기
      const module = availableModules.find(m => m.id === data.id);
      
      if (!module) {
        console.error('모듈을 찾을 수 없음:', data.id);
        return;
      }
      
      if (dropTargetSlot !== null) {
        const xPosition = calculateSlotPosition(dropTargetSlot, dimensions.width, doorCount);
        
        // 새 모듈 생성
        const newModule = {
          ...module,
          id: generateModuleId(module.id),
          position: { x: xPosition, y: 0, z: 0 }
        };
        
        // 모듈 배치
        setPlacedModules(prev => [...prev, newModule]);
        console.log(`모듈 "${module.name}"을 슬롯 ${dropTargetSlot + 1}에 배치했습니다.`, newModule);
      }
    } catch (error) {
      console.error('드롭 처리 중 오류 발생:', error);
    } finally {
      // 상태 초기화
      setIsDragging(false);
      setCurrentDragModule(null);
      setDropTargetSlot(null);
      setGhostModule(null);
    }
  }, [availableModules, dropTargetSlot, dimensions.width, doorCount]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      width: '100%', 
      height: '100%',
      position: 'relative' 
    }}>
      {/* 디버깅 정보 */}
      <DebugInfo data={debugData} />
      
      {/* 상단 도구 영역 */}
      <div style={{
        display: 'flex',
        padding: '10px',
        borderBottom: '1px solid #ddd',
        background: '#fff'
      }}>
        <button 
          onClick={handleClearAllModules}
          style={{
            padding: '8px 16px',
            background: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          모든 모듈 제거
        </button>

        {/* 치수 표시 토글 스위치 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginLeft: '20px',
          gap: '8px'
        }}>
          <label style={{ fontSize: '14px', color: '#333' }}>치수 표시:</label>
          <div 
            onClick={() => setShowDimensions(prev => !prev)}
            style={{
              position: 'relative',
              width: '48px',
              height: '24px',
              backgroundColor: showDimensions ? '#10b981' : '#d1d5db',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'background-color 0.3s',
              display: 'flex',
              alignItems: 'center',
              padding: '0 4px'
            }}
          >
            <span style={{ 
              fontSize: '10px', 
              color: 'white',
              position: 'absolute',
              left: '8px',
              opacity: showDimensions ? 1 : 0,
              transition: 'opacity 0.3s'
            }}>
              ON
            </span>
            <span style={{ 
              fontSize: '10px', 
              color: 'white',
              position: 'absolute',
              right: '6px',
              opacity: showDimensions ? 0 : 1,
              transition: 'opacity 0.3s'
            }}>
              OFF
            </span>
            <div style={{
              width: '18px',
              height: '18px',
              backgroundColor: 'white',
              borderRadius: '50%',
              transform: showDimensions ? 'translateX(24px)' : 'translateX(0)',
              transition: 'transform 0.3s'
            }} />
          </div>
        </div>
        
        <div style={{ marginLeft: 'auto', fontSize: '14px', color: '#666' }}>
          {isDragging ? 
            `모듈을 슬롯에 드래그하여 배치하세요 (ESC로 취소)` :
            selectedModule ? 
              `모듈 "${selectedModule.name}" 선택됨 - 배치할 슬롯을 클릭하세요 (ESC로 취소)` : 
              selectedSlot !== null ? 
                `슬롯 ${selectedSlot + 1} 선택됨` : 
                '가구 모듈을 드래그하여 원하는 위치에 배치하세요 (F2 키로 디버깅 전환)'}
        </div>
      </div>
      
      {/* 메인 컨텐츠 영역 */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* 왼쪽 섬네일 영역에 투명 오버레이 */}
        {debugData.thumbnailsActive && externalThumbnailPositions.map((position, index) => (
          <ExternalThumbnail
            key={`external-thumbnail-${index}`}
            position={position}
            onClick={handleExternalThumbnailClick}
          />
        ))}
        
        {/* 모듈 목록 */}
        <div style={{ 
          width: '300px', 
          padding: '15px',
          borderRight: '1px solid #ddd',
          background: '#f9f9f9',
          overflowY: 'auto',
          position: 'relative',
          zIndex: 1
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>가구 모듈</h3>
          {/* 샘플 모듈 배치 버튼 */}
          <button
            onClick={handleSampleModule}
            className="mb-3 w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            샘플 모듈 배치
          </button>
          <div className="overflow-y-auto max-h-[calc(100vh-200px)] p-2">
            {availableModules.map((module) => (
              <ModuleItem
                key={module.id}
                module={module}
                isSelected={selectedModule && selectedModule.id === module.id}
                onClick={handleModuleSelect}
                onDragStart={handleDragStart}
              />
            ))}
          </div>
        </div>
        
        {/* 3D 캔버스 영역 */}
        <div 
          ref={canvasContainerRef}
          style={{ flex: 1, position: 'relative' }}
          className={dropTargetSlot !== null ? 'drop-target-active' : ''}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <ModuleEditorCanvas
            key={placedModules.length}
            dimensions={dimensions}
            doorCount={doorCount}
            placedModules={placedModules}
            ghostModule={ghostModule}
            slotStatuses={slotStatuses}
            onSlotHover={handleSlotHover}
            onSlotClick={handleSlotClick}
            highlightSlot={dropTargetSlot}
            showDimensions={showDimensions}
          >
            <mesh position={[0, 0.5, 0]}>
              <boxGeometry args={[0.6, 0.3, 0.58]} />
              <meshStandardMaterial color="red" />
            </mesh>
          </ModuleEditorCanvas>
        </div>
      </div>

      {/* 배치된 모듈 목록 */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <h4 className="text-sm font-semibold mb-2">배치된 모듈 ({placedModules.length})</h4>
        <div className="flex flex-wrap gap-2">
          {placedModules.map((module, index) => (
            <div 
              key={index}
              className="bg-white rounded border border-gray-200 p-2 text-xs flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300"
            >
              <span className="font-medium">{module.name}</span>
              <span className="text-gray-500 text-xs">
                슬롯 {calculateSlotIndex(module.position.x, dimensions.width, doorCount) + 1}
              </span>
              <button 
                className="text-red-500 hover:text-red-700"
                onClick={() => {
                  setPlacedModules(prev => prev.filter((_, i) => i !== index));
                }}
              >
                ×
              </button>
            </div>
          ))}
          {placedModules.length === 0 && (
            <span className="text-gray-400 text-sm">아직 배치된 모듈이 없습니다</span>
          )}
        </div>
      </div>
    </div>
  );
};

ModuleEditor.propTypes = {
  initialModules: PropTypes.array,
  onSave: PropTypes.func,
  doorCount: PropTypes.number,
  dimensions: PropTypes.shape({
    width: PropTypes.number,
    height: PropTypes.number,
    depth: PropTypes.number
  })
};

export default ModuleEditor; 
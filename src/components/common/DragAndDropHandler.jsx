import React, { useState, useEffect, useRef } from 'react';

/**
 * 드래그 앤 드롭 기능을 관리하는 컴포넌트
 * 1. 섬네일 클릭 시 선택 상태 변경 (연두색 테두리)
 * 2. 드래그 시 고스트 모듈을 마우스와 함께 이동
 * 3. 슬롯 위에 드래그 시 배치 미리보기 표시 (파란색)
 * 4. 슬롯 클릭 시 모듈 배치 완료
 * 5. 배치된 모듈을 드래그하여 다른 슬롯으로 이동 가능
 */
const DragAndDropHandler = () => {
  // 선택된 모듈 상태
  const [selectedModule, setSelectedModule] = useState(null);
  // 드래그 상태
  const [isDragging, setIsDragging] = useState(false);
  // 고스트 모듈 위치
  const [ghostPosition, setGhostPosition] = useState({ x: 0, y: 0 });
  // 고스트 모듈 크기
  const [ghostSize, setGhostSize] = useState({ width: 0, height: 0 });
  // 현재 호버 중인 슬롯
  const [hoveredSlot, setHoveredSlot] = useState(null);
  // 배치된 모듈 정보 저장
  const [placedModules, setPlacedModules] = useState({});
  // 현재 드래그 중인 배치된 모듈의 원래 슬롯 인덱스
  const [dragSourceSlot, setDragSourceSlot] = useState(null);
  
  // 고스트 모듈 요소 참조
  const ghostRef = useRef(null);
  
  // 컴포넌트 마운트 시 초기화 및 이벤트 리스너 등록
  useEffect(() => {
    // 초기화
    console.log('DragAndDropHandler 초기화...');
    
    // 모듈 섬네일 요소 선택 (서버 측에서 생성된 요소 대응)
    const setupThumbnails = () => {
      // 모듈 이미지를 담은 thumbnail 컨테이너에 클래스 추가
      const thumbnailContainers = document.querySelectorAll('.grid.grid-cols-3.gap-3 > div > div');
      
      console.log(`섬네일 요소 ${thumbnailContainers.length}개 발견`);
      
      thumbnailContainers.forEach((container, index) => {
        // 이미 설정된 썸네일은 건너뛰기
        if (container.classList.contains('module-thumbnail-setup')) return;
        
        container.classList.add('module-thumbnail');
        container.classList.add('module-thumbnail-setup');
        
        // 모듈 ID와 타입 데이터 속성 추가
        const moduleId = container.getAttribute('data-id') || 
                         container.getAttribute('id') || 
                         `module-${index}`;
        
        const moduleType = container.getAttribute('data-type') || 'default';
        
        // 데이터 속성 설정
        container.setAttribute('data-module-id', moduleId);
        container.setAttribute('data-module-type', moduleType);
        
        // 클릭 및 드래그 이벤트 추가
        container.addEventListener('click', handleThumbnailClick);
        container.addEventListener('mousedown', handleThumbnailMouseDown);
        
        console.log(`섬네일 설정 완료: ${moduleId}`);
      });
    };
    
    // 초기 설정
    setupThumbnails();
    
    // 주기적으로 새로운 섬네일 확인 (동적으로 추가될 수 있음)
    const thumbnailCheckInterval = setInterval(setupThumbnails, 1000);
    
    // 슬롯 요소 이벤트 처리
    const setupSlots = () => {
      // ThreeJS 모듈 슬롯과 상호작용하기 위한 DOM 요소 생성
      const slotContainer = document.createElement('div');
      slotContainer.className = 'module-slots-container';
      slotContainer.style.position = 'absolute';
      slotContainer.style.top = '0';
      slotContainer.style.left = '0';
      slotContainer.style.width = '100%';
      slotContainer.style.height = '100%';
      slotContainer.style.pointerEvents = 'none';
      
      // ThreeJS 캔버스 위에 배치
      const canvasContainer = document.querySelector('.relative.w-full.h-full');
      if (canvasContainer && !document.querySelector('.module-slots-container')) {
        canvasContainer.appendChild(slotContainer);
        console.log('슬롯 컨테이너 추가됨');
      }
    };
    
    setupSlots();
    
    // 사용자 정의 이벤트 리스너 추가
    document.addEventListener('slot-clicked', handleSlotClickedEvent);
    document.addEventListener('slot-hovered', handleSlotHoveredEvent);
    document.addEventListener('module-placed', handleModulePlaced);
    
    // 마우스 이동 이벤트 (드래그 중)
    document.addEventListener('mousemove', handleMouseMove);
    // 마우스 업 이벤트 (드래그 종료)
    document.addEventListener('mouseup', handleMouseUp);
    
    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      clearInterval(thumbnailCheckInterval);
      
      const thumbnails = document.querySelectorAll('.module-thumbnail');
      thumbnails.forEach(thumbnail => {
        thumbnail.removeEventListener('click', handleThumbnailClick);
        thumbnail.removeEventListener('mousedown', handleThumbnailMouseDown);
      });
      
      document.removeEventListener('slot-clicked', handleSlotClickedEvent);
      document.removeEventListener('slot-hovered', handleSlotHoveredEvent);
      document.removeEventListener('module-placed', handleModulePlaced);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // 고스트 모듈 제거
      removeGhostModule();
    };
  }, []);
  
  // 모듈이 슬롯에 배치되었을 때 이벤트 처리
  const handleModulePlaced = (e) => {
    const { moduleId, slotId, slotIndex, moduleType, imageUrl } = e.detail;
    
    // 배치된 모듈 정보 저장
    setPlacedModules(prev => ({
      ...prev,
      [slotIndex]: {
        moduleId,
        slotId,
        moduleType,
        imageUrl
      }
    }));
    
    console.log(`모듈 배치 정보 저장: 슬롯 ${slotIndex}에 모듈 ${moduleId} 배치됨`);
  };
  
  // 배치된 모듈 드래그 시작 처리
  const handlePlacedModuleDragStart = (slotIndex, moduleInfo) => {
    // 드래그 중인 모듈의 원래 슬롯 기억
    setDragSourceSlot(slotIndex);
    
    // 선택된 모듈 설정
    setSelectedModule({
      id: moduleInfo.moduleId,
      type: moduleInfo.moduleType,
      imageUrl: moduleInfo.imageUrl,
      isPlaced: true,
      originalSlot: slotIndex
    });
    
    // 고스트 모듈 크기 설정 (기본 크기)
    setGhostSize({
      width: 100,
      height: 200
    });
    
    // 드래그 시작
    setIsDragging(true);
    
    console.log(`배치된 모듈 드래그 시작: 슬롯 ${slotIndex}의 모듈 ${moduleInfo.moduleId}`);
  };
  
  // ThreeJS에서 발생한 슬롯 클릭 이벤트 처리
  const handleSlotClickedEvent = (e) => {
    const { slotId, slotIndex } = e.detail;
    console.log(`슬롯 클릭 이벤트 수신: ${slotId}, 인덱스: ${slotIndex}`);
    
    // 이미 배치된 모듈이 있는 슬롯이면 드래그 시작
    if (placedModules[slotIndex]) {
      handlePlacedModuleDragStart(slotIndex, placedModules[slotIndex]);
      return;
    }
    
    // 선택된 모듈이 있을 경우 배치
    if (selectedModule) {
      placeModuleInSlot(slotId, slotIndex);
    }
  };
  
  // ThreeJS에서 발생한 슬롯 호버 이벤트 처리
  const handleSlotHoveredEvent = (e) => {
    const { slotId, slotIndex, isHovered } = e.detail;
    
    if (isHovered) {
      console.log(`슬롯 호버 이벤트 수신: ${slotId}, 인덱스: ${slotIndex}`);
      setHoveredSlot({ id: slotId, index: slotIndex });
      
      if (isDragging && selectedModule) {
        showPlacementPreview(slotId);
      }
    } else {
      setHoveredSlot(null);
      hidePlacementPreview();
    }
  };
  
  // 섬네일 클릭 핸들러
  const handleThumbnailClick = (e) => {
    const thumbnail = e.currentTarget;
    
    // 이미 선택된 섬네일 클릭 시 선택 해제
    if (thumbnail.classList.contains('selected')) {
      thumbnail.classList.remove('selected');
      setSelectedModule(null);
      
      // 모듈 선택 해제 이벤트 발생
      const event = new CustomEvent('thumbnail-selected', {
        detail: {
          moduleId: null
        }
      });
      document.dispatchEvent(event);
      
      return;
    }
    
    // 기존 선택 섬네일 선택 해제
    document.querySelectorAll('.module-thumbnail.selected').forEach(el => {
      el.classList.remove('selected');
    });
    
    // 현재 섬네일 선택
    thumbnail.classList.add('selected');
    
    // 모듈 ID 가져오기
    const moduleId = thumbnail.getAttribute('data-module-id') || 'unknown';
    const moduleType = thumbnail.getAttribute('data-module-type') || 'unknown';
    const imageUrl = thumbnail.querySelector('img')?.src || '';
    
    // 선택된 모듈 정보 저장
    setSelectedModule({
      id: moduleId,
      type: moduleType,
      imageUrl: imageUrl,
      width: thumbnail.offsetWidth,
      height: thumbnail.offsetHeight,
      isPlaced: false
    });
    
    // 고스트 모듈 크기 설정
    setGhostSize({
      width: thumbnail.offsetWidth,
      height: thumbnail.offsetHeight
    });
    
    // 모듈 선택 이벤트 발생
    const event = new CustomEvent('thumbnail-selected', {
      detail: {
        moduleId: moduleId,
        moduleType: moduleType,
        imageUrl: imageUrl
      }
    });
    document.dispatchEvent(event);
    
    console.log(`섬네일 선택됨: ${moduleId}`);
  };
  
  // 마우스 다운 핸들러 (드래그 시작)
  const handleThumbnailMouseDown = (e) => {
    const thumbnail = e.currentTarget;
    
    // 선택되지 않은 섬네일이면 선택
    if (!thumbnail.classList.contains('selected')) {
      handleThumbnailClick(e);
    }
    
    // 드래그 시작
    setIsDragging(true);
    
    // 초기 고스트 위치 설정
    setGhostPosition({
      x: e.clientX,
      y: e.clientY
    });
    
    // 고스트 모듈 생성
    setTimeout(() => {
      createGhostModule();
    }, 0);
    
    console.log('드래그 시작됨');
  };
  
  // 마우스 이동 핸들러 (드래그 중)
  const handleMouseMove = (e) => {
    if (!isDragging || !selectedModule) return;
    
    // 고스트 모듈 위치 업데이트
    setGhostPosition({
      x: e.clientX,
      y: e.clientY
    });
    
    // 고스트 모듈 요소가 있으면 위치 업데이트
    if (ghostRef.current) {
      ghostRef.current.style.left = `${e.clientX - ghostSize.width / 2}px`;
      ghostRef.current.style.top = `${e.clientY - ghostSize.height / 2}px`;
    }
  };
  
  // 마우스 업 핸들러 (드래그 종료)
  const handleMouseUp = (e) => {
    if (!isDragging) return;
    
    // 드래그 종료
    setIsDragging(false);
    
    // 현재 호버 중인 슬롯이 있으면 모듈 배치 또는 이동
    if (hoveredSlot) {
      // 드래그 중인 모듈이 이미 배치된 모듈인 경우
      if (selectedModule && selectedModule.isPlaced) {
        // 같은 슬롯으로 드롭한 경우는 무시
        if (selectedModule.originalSlot === hoveredSlot.index) {
          console.log('같은 슬롯으로 드롭함 - 무시');
        } else {
          // 모듈 이동
          moveModule(selectedModule.originalSlot, hoveredSlot.id, hoveredSlot.index);
        }
      } else {
        // 새 모듈 배치
        placeModuleInSlot(hoveredSlot.id, hoveredSlot.index);
      }
    }
    
    // 고스트 모듈 제거
    removeGhostModule();
    
    // 드래그 소스 슬롯 초기화
    setDragSourceSlot(null);
    
    console.log('드래그 종료됨');
  };
  
  // 모듈 이동 처리
  const moveModule = (sourceSlotIndex, targetSlotId, targetSlotIndex) => {
    // 원본 슬롯의 모듈 정보 가져오기
    const moduleInfo = placedModules[sourceSlotIndex];
    if (!moduleInfo) {
      console.error(`소스 슬롯 ${sourceSlotIndex}에 배치된 모듈이 없습니다`);
      return;
    }
    
    console.log(`모듈 이동: 슬롯 ${sourceSlotIndex} -> 슬롯 ${targetSlotIndex}`);
    
    // 원래 슬롯에서 모듈 제거
    const updatedModules = { ...placedModules };
    delete updatedModules[sourceSlotIndex];
    
    // 새 슬롯에 모듈 추가
    updatedModules[targetSlotIndex] = {
      ...moduleInfo,
      slotId: targetSlotId,
      slotIndex: targetSlotIndex
    };
    
    // 상태 업데이트
    setPlacedModules(updatedModules);
    
    // 원래 슬롯 상태 업데이트 (빈 슬롯으로)
    updateSlotStatus(sourceSlotIndex, 'empty');
    
    // 새 슬롯 상태 업데이트 (채워진 슬롯으로)
    updateSlotStatus(targetSlotIndex, 'occupied');
    
    // 모듈 이동 이벤트 발생
    const event = new CustomEvent('module-moved', {
      detail: {
        moduleId: moduleInfo.moduleId,
        fromSlotIndex: sourceSlotIndex,
        toSlotId: targetSlotId,
        toSlotIndex: targetSlotIndex,
        moduleType: moduleInfo.moduleType,
        imageUrl: moduleInfo.imageUrl
      }
    });
    document.dispatchEvent(event);
    
    // 선택 상태 초기화
    setSelectedModule(null);
    setHoveredSlot(null);
    hidePlacementPreview();
  };
  
  // 고스트 모듈 생성
  const createGhostModule = () => {
    if (!selectedModule) return;
    
    // 기존 고스트 모듈 제거
    removeGhostModule();
    
    // 새 고스트 모듈 생성
    const ghost = document.createElement('div');
    ghost.className = 'ghost-module';
    ghost.style.width = `${ghostSize.width}px`;
    ghost.style.height = `${ghostSize.height}px`;
    ghost.style.left = `${ghostPosition.x - ghostSize.width / 2}px`;
    ghost.style.top = `${ghostPosition.y - ghostSize.height / 2}px`;
    
    // 이미지가 있으면 추가
    if (selectedModule.imageUrl) {
      const img = document.createElement('img');
      img.src = selectedModule.imageUrl;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'contain';
      img.style.opacity = '0.8';
      ghost.appendChild(img);
    }
    
    // 문서에 추가
    document.body.appendChild(ghost);
    ghostRef.current = ghost;
    
    console.log('고스트 모듈 생성됨');
  };
  
  // 고스트 모듈 제거
  const removeGhostModule = () => {
    if (ghostRef.current && ghostRef.current.parentNode) {
      ghostRef.current.parentNode.removeChild(ghostRef.current);
      ghostRef.current = null;
    }
  };
  
  // 배치 미리보기 표시
  const showPlacementPreview = (slotId) => {
    // 기존 미리보기 제거
    hidePlacementPreview();
    
    // 슬롯 요소 찾기
    const slotRect = document.querySelector(`#${slotId}`)?.getBoundingClientRect() || 
                    { left: 0, top: 0, width: 100, height: 100 };
    
    // 미리보기 생성
    const preview = document.createElement('div');
    preview.className = 'slot-highlight';
    preview.id = 'module-placement-preview';
    preview.style.position = 'fixed';
    preview.style.left = `${slotRect.left}px`;
    preview.style.top = `${slotRect.top}px`;
    preview.style.width = `${slotRect.width}px`;
    preview.style.height = `${slotRect.height}px`;
    preview.style.backgroundColor = 'rgba(33, 150, 243, 0.3)';
    preview.style.border = '2px solid #2196f3';
    preview.style.zIndex = '1000';
    preview.style.pointerEvents = 'none';
    
    // 문서에 추가
    document.body.appendChild(preview);
    
    console.log(`슬롯 ${slotId}에 미리보기 표시됨`);
  };
  
  // 배치 미리보기 제거
  const hidePlacementPreview = () => {
    const preview = document.getElementById('module-placement-preview');
    if (preview && preview.parentNode) {
      preview.parentNode.removeChild(preview);
    }
  };
  
  // 모듈을 슬롯에 배치
  const placeModuleInSlot = (slotId, slotIndex) => {
    if (!selectedModule) return;
    
    console.log(`모듈 배치: 모듈 ${selectedModule.id}를 슬롯 ${slotId}에 배치`);
    
    // 모듈 배치 이벤트 발생
    const event = new CustomEvent('module-placed', {
      detail: {
        moduleId: selectedModule.id,
        slotId: slotId,
        slotIndex: slotIndex,
        moduleType: selectedModule.type,
        imageUrl: selectedModule.imageUrl
      }
    });
    document.dispatchEvent(event);
    
    // 슬롯 상태 업데이트 (ThreeJS와 연동)
    updateSlotStatus(slotIndex, 'occupied');
    
    // 썸네일 선택 해제
    document.querySelectorAll('.module-thumbnail.selected').forEach(el => {
      el.classList.remove('selected');
    });
    
    // 상태 초기화
    setSelectedModule(null);
    setHoveredSlot(null);
    hidePlacementPreview();
  };
  
  // 슬롯 상태 업데이트 (ThreeJS 상태 변경을 위한 이벤트 발생)
  const updateSlotStatus = (slotIndex, status) => {
    const event = new CustomEvent('update-slot-status', {
      detail: {
        slotIndex,
        status
      }
    });
    document.dispatchEvent(event);
  };
  
  // 렌더링 없음 (로직만 포함한 컴포넌트)
  return null;
};

export default DragAndDropHandler; 
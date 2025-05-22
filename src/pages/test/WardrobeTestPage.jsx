import React, { useEffect } from 'react';
import RoomViewer3D from '../../components/common/RoomViewer3D';

/**
 * 워드로브 구성 테스트 페이지
 * 
 * 이 페이지는 RoomViewer3D 컴포넌트와 DragAndDropHandler 통합 테스트를 위한 페이지입니다.
 * DragAndDropHandler는 RoomViewer3D 내부에서 자동으로 로드됩니다.
 */
const WardrobeTestPage = () => {
  // 기본 공간 정보 설정
  const spaceInfo = {
    width: 4800,    // 너비 (mm)
    height: 2400,   // 높이 (mm)
    depth: 580,     // 깊이 (mm)
    spaceType: 'built-in',  // 공간 유형
    wallPosition: 'left'    // 벽 위치
  };
  
  // 테스트용 더미 모듈 데이터
  const testModules = [
    { id: 'drawer-module-1', type: 'drawer-module', name: '서랍장 모듈', height: 400, color: '#4caf50' },
    { id: 'shelf-module-1', type: 'shelf-module', name: '선반 모듈', height: 25, color: '#2196f3' },
    { id: 'hanging-module-1', type: 'hanging-module', name: '행거 모듈', height: 50, color: '#ff9800' },
    { id: 'cabinet-module-1', type: 'cabinet-module', name: '캐비넷 모듈', height: 600, color: '#9c27b0' }
  ];
  
  // 슬롯 클릭 이벤트 핸들러
  const handleSlotClick = (slotIndex, moduleId) => {
    console.log(`슬롯 ${slotIndex}에 모듈 ${moduleId || '없음'} 클릭됨`);
  };
  
  // 슬롯 호버 이벤트 핸들러
  const handleSlotHover = (slotIndex) => {
    if (slotIndex !== null) {
      console.log(`슬롯 ${slotIndex} 호버 중`);
    }
  };
  
  // 썸네일 클릭 이벤트 핸들러 추가
  const handleThumbnailClick = (moduleId, moduleType) => {
    console.log(`모듈 선택: ${moduleId}(${moduleType})`);
    
    // 기존 이벤트 발생 코드 (DragAndDropHandler 연결)
    const event = new CustomEvent('thumbnail-selected', {
      detail: {
        moduleId: moduleId,
        moduleType: moduleType
      }
    });
    document.dispatchEvent(event);
  };
  
  // 더미 모듈 썸네일 생성 함수
  const createDummyThumbnails = () => {
    // 기존 더미 썸네일 컨테이너가 있으면 제거
    const existingContainer = document.querySelector('.dummy-thumbnails');
    if (existingContainer) {
      existingContainer.remove();
    }
    
    // 새로운 더미 썸네일 컨테이너 생성
    const container = document.createElement('div');
    container.className = 'dummy-thumbnails';
    container.style.position = 'absolute';
    container.style.top = '20px';
    container.style.left = '20px';
    container.style.zIndex = '1000';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '10px';
    container.style.padding = '15px';
    container.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    container.style.borderRadius = '8px';
    container.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
    
    // 제목 추가
    const title = document.createElement('h3');
    title.textContent = '모듈 썸네일';
    title.style.margin = '0 0 10px 0';
    title.style.fontSize = '16px';
    container.appendChild(title);
    
    // 각 모듈별 썸네일 생성
    testModules.forEach(module => {
      const thumbnail = document.createElement('div');
      thumbnail.className = 'module-thumbnail';
      thumbnail.setAttribute('data-module-id', module.id);
      thumbnail.setAttribute('data-module-type', module.type);
      thumbnail.style.padding = '10px';
      thumbnail.style.border = '2px solid #e0e0e0';
      thumbnail.style.borderRadius = '4px';
      thumbnail.style.backgroundColor = '#f5f5f5';
      thumbnail.style.cursor = 'pointer';
      thumbnail.style.transition = 'all 0.2s ease';
      
      // 모듈 이름 표시
      const nameElem = document.createElement('div');
      nameElem.textContent = module.name;
      nameElem.style.fontSize = '14px';
      thumbnail.appendChild(nameElem);
      
      // 치수 표시 추가
      const dimensionElem = document.createElement('div');
      dimensionElem.textContent = `높이: ${module.height}mm`;
      dimensionElem.style.fontSize = '12px';
      dimensionElem.style.color = '#666';
      thumbnail.appendChild(dimensionElem);
      
      // 더미 이미지 추가 (높이를 상대적으로 표현)
      const dummyImg = document.createElement('div');
      dummyImg.style.width = '100px';
      // 높이를 모듈 높이에 비례하게 설정 (최소 20px, 최대 100px)
      const heightScale = Math.min(Math.max(module.height / 10, 20), 100);
      dummyImg.style.height = `${heightScale}px`;
      dummyImg.style.backgroundColor = module.color || '#e0e0e0';
      dummyImg.style.marginTop = '5px';
      dummyImg.style.borderRadius = '4px';
      
      // 패널 표현 (외곽선)
      dummyImg.style.border = '2px solid rgba(0, 0, 0, 0.2)';
      dummyImg.style.boxSizing = 'border-box';
      
      thumbnail.appendChild(dummyImg);
      
      // 클릭 이벤트 추가
      thumbnail.addEventListener('click', () => {
        // 다른 모든 썸네일의 selected 클래스 제거
        document.querySelectorAll('.module-thumbnail').forEach(thumb => {
          thumb.classList.remove('selected');
        });
        
        // 현재 썸네일에 selected 클래스 추가
        thumbnail.classList.add('selected');
        
        // 이벤트 핸들러 호출
        handleThumbnailClick(module.id, module.type);
      });
      
      container.appendChild(thumbnail);
    });
    
    // 설명 추가
    const description = document.createElement('p');
    description.textContent = '썸네일을 클릭하고 슬롯에 드래그하여 배치하세요';
    description.style.margin = '10px 0 0 0';
    description.style.fontSize = '12px';
    description.style.color = '#666';
    container.appendChild(description);
    
    // 문서에 컨테이너 추가
    document.body.appendChild(container);
  };
  
  useEffect(() => {
    // 컴포넌트 마운트 후 더미 썸네일 생성
    setTimeout(createDummyThumbnails, 1000);
    
    // 컴포넌트 언마운트 시 정리
    return () => {
      const container = document.querySelector('.dummy-thumbnails');
      if (container) {
        container.remove();
      }
    };
  }, []);
  
  return (
    <div className="wardrobe-test-page">
      <div className="room-viewer-container">
        <RoomViewer3D
          spaceInfo={spaceInfo}
          showModuleSlots={true}
          doorCount={8}
          onSlotClick={handleSlotClick}
          onSlotHover={handleSlotHover}
        />
      </div>
      <div className="wardrobe-instructions">
        <h3>워드로브 구성 테스트</h3>
        <p>왼쪽 썸네일을 클릭하고 슬롯에 드래그하여 배치하세요.</p>
        <p>바닥판 위에 정확히 배치됩니다.</p>
      </div>
    </div>
  );
};

export default WardrobeTestPage; 
# Maatkastenonline 드래그 앤 드롭 시스템 구현 가이드

## 기술 스택
- **프론트엔드**: React, TypeScript, Tailwind CSS
- **상태 관리**: Zustand
- **3D 렌더링**: Three.js

## 핵심 구현 방법

### 1. 드래그 앤 드롭 상태 관리 (Zustand)

```typescript
// useDnDStore.ts
import { create } from 'zustand';

export const PANEL_THICKNESS = 18; // 패널 두께 상수

interface DnDState {
  isDragging: boolean;
  draggingItem: DraggingItem | null;
  activeSlotId: string | null;
  placedItems: PlacedItem[];
  
  // 액션 메서드들
  setIsDragging: (isDragging: boolean) => void;
  setDraggingItem: (item: DraggingItem | null) => void;
  setActiveSlotId: (slotId: string | null) => void;
  addPlacedItem: (item: PlacedItem) => void;
  removePlacedItem: (id: string) => void;
  // ...기타 필요한 메서드들
}

export const useDnDStore = create<DnDState>((set) => ({
  // 초기 상태
  isDragging: false,
  draggingItem: null,
  activeSlotId: null,
  placedItems: [],
  
  // 상태 업데이트 메서드
  setIsDragging: (isDragging) => set({ isDragging }),
  setDraggingItem: (draggingItem) => set({ draggingItem }),
  setActiveSlotId: (activeSlotId) => set({ activeSlotId }),
  
  // 아이템 배치 관련 메서드
  addPlacedItem: (item) => set((state) => {
    // 이미 해당 슬롯에 아이템이 있으면 제거 후 추가
    const filteredItems = state.placedItems.filter(
      existingItem => existingItem.slotId !== item.slotId
    );
    return { placedItems: [...filteredItems, item] };
  }),
  // ...기타 메서드 구현
}));
```

### 2. 드래그 가능한 모듈 컴포넌트

```typescript
// DraggableItem.tsx
const DraggableItem: React.FC<DraggableItemProps> = ({
  id, image, name, type, width, height, depth
}) => {
  const { setDraggingItem, setIsDragging } = useDnDStore();
  
  // 드래그 시작 핸들러
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // 전역 상태 업데이트
    setIsDragging(true);
    setDraggingItem({
      id, type, width, height, depth, image, name,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX, 
      currentY: e.clientY
    });
    
    // 마우스 이벤트 리스너 등록
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  // 마우스 이동 핸들러
  const handleMouseMove = (e: MouseEvent) => {
    // useDnDStore의 setDraggingItem 사용해 currentX, currentY 업데이트
    setDraggingItem((prev) => {
      if (!prev) return prev;
      return { ...prev, currentX: e.clientX, currentY: e.clientY };
    });
  };
  
  // 드래그 종료 핸들러
  const handleMouseUp = () => {
    // 이벤트 리스너 제거 및 상태 초기화
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  
  return (
    <div 
      className="cursor-grab" 
      onMouseDown={handleMouseDown}
    >
      <img src={image} alt={name} draggable={false} />
      <div>{name}</div>
      <div>{width}x{height}x{depth}mm</div>
    </div>
  );
};
```

### 3. 드롭 슬롯 컴포넌트

```typescript
// DropSlot.tsx
const DropSlot: React.FC<DropSlotProps> = ({
  id, x, y, width, height, depth
}) => {
  const { 
    isDragging, draggingItem, activeSlotId, 
    addPlacedItem, setActiveSlotId, setIsDragging, setDraggingItem 
  } = useDnDStore();
  
  // 슬롯 내부 유효 공간 계산 (패널 두께 고려)
  const innerWidth = width - PANEL_THICKNESS * 2;
  const innerHeight = height - PANEL_THICKNESS * 2;
  
  // 현재 슬롯이 활성화 상태인지 확인
  const isActive = activeSlotId === id;
  
  // 슬롯 위에 마우스가 있는지 감지
  useEffect(() => {
    if (!isDragging || !draggingItem) return;
    
    // 마우스 이동 감지 핸들러
    const handleMouseMove = (e: MouseEvent) => {
      const slotRect = slotRef.current?.getBoundingClientRect();
      if (!slotRect) return;
      
      // 슬롯 위에 마우스가 있는지 확인
      if (
        e.clientX >= slotRect.left && e.clientX <= slotRect.right &&
        e.clientY >= slotRect.top && e.clientY <= slotRect.bottom
      ) {
        // 활성 슬롯 설정
        setActiveSlotId(id);
      } else if (activeSlotId === id) {
        // 슬롯 밖으로 나갔을 때 비활성화
        setActiveSlotId(null);
      }
    };
    
    // 마우스 업 이벤트 핸들러 (드롭 처리)
    const handleMouseUp = (e: MouseEvent) => {
      if (!isDragging || !draggingItem || activeSlotId !== id) return;
      
      // 모듈 크기 계산 및 조정
      const scale = calculateItemScale(
        draggingItem.width, draggingItem.height, draggingItem.depth,
        width, height, depth
      );
      
      // 아이템 배치
      addPlacedItem({
        ...draggingItem,
        slotId: id,
        position: { x: x + width/2, y: y + height/2, z: 0 },
        scale,
        timestamp: Date.now()
      });
      
      // 드래그 상태 초기화
      setIsDragging(false);
      setDraggingItem(null);
      setActiveSlotId(null);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, draggingItem, activeSlotId /* 기타 의존성 */]);
  
  return (
    <div 
      ref={slotRef}
      className={`absolute ${isActive ? 'border-blue-500' : 'border-gray-300'}`}
      style={{ 
        left: `${x}px`, 
        top: `${y}px`, 
        width: `${width}px`, 
        height: `${height}px` 
      }}
    >
      {/* 슬롯 내부 */}
      <div 
        className={`
          ${isActive ? 'bg-blue-100' : 'bg-white'}
          ${isOccupied ? 'bg-green-50' : ''}
        `}
        style={{
          left: `${PANEL_THICKNESS}px`,
          top: `${PANEL_THICKNESS}px`,
          width: `${innerWidth}px`,
          height: `${innerHeight}px`
        }}
      >
        {/* 배치된 아이템 보여주기 */}
        {isOccupied && <PlacedItemRenderer item={placedItem} />}
        
        {/* 드래그 중인 아이템 미리보기 (고스트 이미지) */}
        {isActive && isDragging && renderPreview()}
      </div>
    </div>
  );
};
```

### 4. 자동 크기 조정 유틸리티

```typescript
// scaleModuleToSlot.ts

// 패널 두께를 고려한 내부 유효 공간 계산
export function calculateInnerDimensions(width, height, depth, panelThickness) {
  return {
    width: Math.max(0, width - panelThickness * 2),
    height: Math.max(0, height - panelThickness * 2),
    depth: Math.max(0, depth - panelThickness * 2)
  };
}

// 아이템이 슬롯에 맞게 스케일링
export function scaleModuleToFit(slot, module) {
  // 내부 유효 공간 계산
  const innerDim = calculateInnerDimensions(
    slot.width, slot.height, slot.depth, slot.panelThickness
  );
  
  // 각 축별 스케일 계산
  const scaleX = innerDim.width / module.width;
  const scaleY = innerDim.height / module.height;
  const scaleZ = innerDim.depth / module.depth;
  
  // 가장 작은 스케일로 통일 (비율 유지)
  const minScale = Math.min(scaleX, scaleY, scaleZ, 1); // 1 이상 스케일링 방지
  
  return {
    width: module.width * minScale,
    height: module.height * minScale,
    depth: module.depth * minScale
  };
}
```

### 5. 3D 미리보기 렌더링 (Three.js)

```typescript
// SlotCanvas.tsx
import * as THREE from 'three';
import { useEffect, useRef } from 'react';
import { useDnDStore } from './useDnDStore';

const SlotCanvas: React.FC<SlotCanvasProps> = ({ 
  slotId, width, height, depth 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { placedItems } = useDnDStore();
  
  // 해당 슬롯의 배치된 아이템 찾기
  const placedItem = placedItems.find(item => item.slotId === slotId);
  
  useEffect(() => {
    if (!canvasRef.current || !placedItem) return;
    
    // Three.js 초기화
    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current, 
      antialias: true 
    });
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    
    // 조명 설정
    const light = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(light);
    
    // 모듈 3D 모델 로딩 및 렌더링
    const geometry = new THREE.BoxGeometry(
      placedItem.scale.x, 
      placedItem.scale.y, 
      placedItem.scale.z
    );
    const material = new THREE.MeshStandardMaterial({ 
      color: placedItem.color || 0xf0f0f0 
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    
    // 카메라 위치 설정
    camera.position.z = 5;
    
    // 애니메이션 루프
    const animate = () => {
      requestAnimationFrame(animate);
      mesh.rotation.y += 0.01;
      renderer.render(scene, camera);
    };
    
    animate();
    
    // 클린업
    return () => {
      scene.remove(mesh);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [placedItem, width, height, depth]);
  
  return <canvas ref={canvasRef} width={width} height={height} />;
};
```

### 6. 통합 페이지 컴포넌트

```typescript
// ModuleCatalogPage.tsx
const ModuleCatalogPage: React.FC = () => {
  return (
    <div className="h-screen flex flex-col">
      {/* 헤더 */}
      <header className="p-4 border-b border-gray-200">
        <h1>가구 모듈 배치 시스템</h1>
      </header>
      
      {/* 메인 콘텐츠 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 왼쪽 사이드바 - 모듈 선택기 */}
        <ModuleSelector />
        
        {/* 오른쪽 콘텐츠 - 캐비닛 슬롯 뷰어 */}
        <CabinetSlotView className="flex-1" />
      </div>
    </div>
  );
};
```

## 핵심 구현 포인트

1. **이벤트 핸들링**
   - `onMouseDown`: 드래그 시작 시 상태 업데이트 및 이벤트 리스너 등록
   - `document.addEventListener('mousemove')`: 드래그 중 위치 추적
   - `document.addEventListener('mouseup')`: 드래그 종료 및 아이템 배치

2. **반응형 UI 구현**
   - 슬롯 위에 마우스가 있을 때 시각적 피드백 (색상 변경)
   - 드래그 중인 아이템의 고스트 이미지 표시
   - 슬롯에 아이템 배치 시 애니메이션

3. **스케일링 알고리즘**
   - 패널 두께(18mm)를 고려한 내부 유효 공간 계산
   - 가구 모듈이 슬롯 내부에 맞게 자동 크기 조정
   - 비율 유지를 위한 가장 작은 스케일링 비율 적용

4. **데이터 구조 설계**
   - `DraggingItem`: 드래그 중인 아이템 데이터
   - `PlacedItem`: 배치된 아이템의 위치, 크기, 회전 정보
   - `Slot`: 슬롯의 위치, 크기, 허용 타입 정보

5. **최적화 기법**
   - 불필요한 렌더링 방지를 위한 메모이제이션
   - 드래그 성능 향상을 위한 requestAnimationFrame 활용
   - 3D 렌더링 성능 최적화

이 구현 방식은 maatkastenonline.be 사이트와 유사한 사용자 경험을 제공하면서, React와 Three.js의 장점을 활용한 효율적인 방식입니다.
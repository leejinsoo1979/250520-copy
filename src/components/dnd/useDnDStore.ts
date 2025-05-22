import { create } from 'zustand';

// 패널 두께 상수 정의 (18mm)
export const PANEL_THICKNESS = 18;

// 내부 유효 공간 계산 함수
export const calculateInnerDimensions = (
  width: number,
  height: number,
  depth: number
) => {
  return {
    width: width - (PANEL_THICKNESS * 2),
    height: height - (PANEL_THICKNESS * 2),
    depth: depth - PANEL_THICKNESS,
  };
};

// 위치 타입 정의
interface Position {
  x: number;
  y: number;
  z: number;
}

// 드래그 아이템 타입 정의
interface DraggingItem {
  id: string;
  type: string;
  width: number;
  height: number;
  image: string;
  name: string;
  color?: string;
  startX?: number;
  startY?: number;
  currentX?: number;
  currentY?: number;
}

// 배치된 아이템 타입 정의
interface PlacedItem extends DraggingItem {
  position: Position;
}

// 스토어 상태 타입 정의
interface DnDState {
  isDragging: boolean;
  draggingItem: DraggingItem | null;
  placedItems: PlacedItem[];
  setIsDragging: (isDragging: boolean) => void;
  setDraggingItem: (item: DraggingItem | null) => void;
  addPlacedItem: (item: PlacedItem) => void;
  removePlacedItem: (id: string) => void;
  updatePlacedItem: (id: string, updates: Partial<PlacedItem>) => void;
  reset: () => void;
}

// 초기 상태
const initialState = {
  isDragging: false,
  draggingItem: null,
  placedItems: [],
};

// Zustand 스토어 생성
export const useDnDStore = create<DnDState>()((set) => ({
  ...initialState,

  // 드래그 상태 설정
  setIsDragging: (isDragging: boolean) => 
    set({ isDragging }),

  // 드래그 중인 아이템 설정
  setDraggingItem: (draggingItem: DraggingItem | null) => 
    set({ draggingItem }),

  // 배치된 아이템 추가
  addPlacedItem: (item: PlacedItem) => 
    set((state) => ({ 
      placedItems: [...state.placedItems, item] 
    })),

  // 배치된 아이템 제거
  removePlacedItem: (id: string) => 
    set((state) => ({ 
      placedItems: state.placedItems.filter(item => item.id !== id) 
    })),

  // 배치된 아이템 업데이트
  updatePlacedItem: (id: string, updates: Partial<PlacedItem>) => 
    set((state) => ({ 
      placedItems: state.placedItems.map(item => 
        item.id === id ? { ...item, ...updates } : item
      ) 
    })),

  // 상태 초기화
  reset: () => set(initialState),
})); 
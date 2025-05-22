import React, { useState, useEffect } from 'react';
import { useDnDStore } from './dnd/useDnDStore';
import DropSlot from './dnd/DropSlot';
import SlotCanvas from './dnd/SlotCanvas';

// 캐비닛 슬롯 설정 타입
interface CabinetSlot {
  id: string;
  row: number;
  col: number;
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  allowedTypes?: string[];
}

// 캐비닛 뷰어 컴포넌트 프롭스
interface CabinetSlotViewProps {
  className?: string;
}

const CabinetSlotView: React.FC<CabinetSlotViewProps> = ({ className }) => {
  const { isDragging, draggingItem, placedItems } = useDnDStore();
  const [slots, setSlots] = useState<CabinetSlot[]>([]);
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  
  // 슬롯 초기화
  useEffect(() => {
    // 벽면 슬롯 설정 (예: 3x3 그리드)
    const wallSlots: CabinetSlot[] = [];
    const slotWidth = 600;  // 슬롯 너비 (mm)
    const slotHeight = 700; // 슬롯 높이 (mm)
    const slotDepth = 600;  // 슬롯 깊이 (mm)
    const padding = 20;     // 슬롯 간 간격 (px)
    
    // 벽면 그리드 생성 (3x3)
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        wallSlots.push({
          id: `slot-${row}-${col}`,
          row,
          col,
          x: (slotWidth / 5 + padding) * col + 50,
          y: (slotHeight / 5 + padding) * row + 50,
          width: slotWidth,
          height: slotHeight,
          depth: slotDepth,
          allowedTypes: ['cabinet', 'shelf', 'drawer', 'door']
        });
      }
    }
    
    setSlots(wallSlots);
  }, []);
  
  // 활성 슬롯 업데이트
  useEffect(() => {
    if (!isDragging || !draggingItem) {
      setActiveSlot(null);
      return;
    }
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingItem?.currentX || !draggingItem?.currentY) return;
      
      // 마우스 포인터 위치의 슬롯 확인
      for (const slot of slots) {
        const slotRect = {
          left: slot.x,
          right: slot.x + slot.width / 5,
          top: slot.y,
          bottom: slot.y + slot.height / 5
        };
        
        if (
          draggingItem.currentX >= slotRect.left &&
          draggingItem.currentX <= slotRect.right &&
          draggingItem.currentY >= slotRect.top &&
          draggingItem.currentY <= slotRect.bottom
        ) {
          setActiveSlot(slot.id);
          return;
        }
      }
      
      setActiveSlot(null);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isDragging, draggingItem, slots]);
  
  return (
    <div className={`relative flex flex-col h-full ${className || ''}`}>
      {/* 2D 캐비닛 슬롯 (드롭 영역) */}
      <div className="relative flex-1 border border-gray-300 bg-gray-100 overflow-auto">
        {slots.map((slot) => (
          <DropSlot
            key={slot.id}
            id={slot.id}
            x={slot.x}
            y={slot.y}
            width={slot.width / 5}
            height={slot.height / 5}
            depth={slot.depth}
            allowedTypes={slot.allowedTypes}
          />
        ))}
        
        {/* 드래그 중인 아이템 미리보기 */}
        {isDragging && draggingItem && draggingItem.currentX && draggingItem.currentY && (
          <div
            className="pointer-events-none fixed z-50 opacity-70"
            style={{
              left: draggingItem.currentX - 50,
              top: draggingItem.currentY - 50,
              width: '100px',
              height: '100px',
            }}
          >
            <img
              src={draggingItem.image}
              alt={draggingItem.name}
              className="h-full w-full object-contain"
            />
          </div>
        )}
      </div>
      
      {/* 3D 미리보기 영역 */}
      <div className="h-64 bg-gray-50 border-t border-gray-300 p-2">
        <h3 className="text-sm font-medium text-gray-700 mb-2">3D 미리보기</h3>
        <div className="grid grid-cols-3 gap-2 h-[calc(100%-2rem)]">
          {slots.filter(slot => 
            placedItems.some(item => item.slotId === slot.id)
          ).map((slot) => (
            <div key={slot.id} className="border border-gray-300 rounded-md overflow-hidden">
              <SlotCanvas
                slotId={slot.id}
                width={slot.width}
                height={slot.height}
                depth={slot.depth}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CabinetSlotView; 
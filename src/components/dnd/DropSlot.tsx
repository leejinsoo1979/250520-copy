import React, { useRef, useEffect } from 'react';
import { useDnDStore } from './useDnDStore';

interface DropSlotProps {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  allowedTypes?: string[];
  className?: string;
}

const DropSlot: React.FC<DropSlotProps> = ({
  id,
  x,
  y,
  width,
  height,
  allowedTypes = [],
  className = '',
}) => {
  const { 
    isDragging, 
    draggingItem, 
    activeSlotId,
    placedItems, 
    addPlacedItem, 
    setActiveSlotId,
    setIsDragging, 
    setDraggingItem 
  } = useDnDStore();
  
  const slotRef = useRef<HTMLDivElement>(null);
  
  // 이미 배치된 아이템이 있는지 확인
  const placedItem = placedItems.find(item => item.slotId === id);
  const isOccupied = Boolean(placedItem);
  
  // 현재 슬롯이 활성화되어 있는지 (드래그 중인 아이템이 위에 있는지) 확인
  const isActive = activeSlotId === id;
  
  // 슬롯 위에 마우스가 있는지 감지
  useEffect(() => {
    if (!isDragging || !draggingItem) return;
    
    const checkIfMouseIsOverSlot = (e: MouseEvent) => {
      if (!slotRef.current) return;
      
      const rect = slotRef.current.getBoundingClientRect();
      
      // 마우스가 슬롯 위에 있는지 확인
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        // 타입 체크
        if (allowedTypes.length === 0 || allowedTypes.includes(draggingItem.type)) {
          setActiveSlotId(id);
        }
      } else if (activeSlotId === id) {
        setActiveSlotId(null);
      }
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      if (!isDragging || !draggingItem || activeSlotId !== id) return;
      
      // 아이템이 이 슬롯에 배치됨
      addPlacedItem({
        ...draggingItem,
        slotId: id,
        position: { x, y, z: 0 },
        timestamp: Date.now(),
        scale: {
          x: width / draggingItem.width,
          y: height / draggingItem.height,
          z: 1,
        }
      });
      
      // 드래그 상태 초기화
      setIsDragging(false);
      setDraggingItem(null);
      setActiveSlotId(null);
    };
    
    document.addEventListener('mousemove', checkIfMouseIsOverSlot);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', checkIfMouseIsOverSlot);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    id, 
    isDragging, 
    draggingItem, 
    activeSlotId, 
    allowedTypes, 
    addPlacedItem, 
    setActiveSlotId, 
    setIsDragging, 
    setDraggingItem,
    x,
    y,
    width,
    height
  ]);
  
  // 드래그 중이고 현재 슬롯이 활성화되어 있을 때 보여줄 미리보기
  const renderPreview = () => {
    if (!isDragging || !draggingItem || activeSlotId !== id) return null;
    
    // 슬롯에 맞게 스케일 조정
    const scaleX = width / draggingItem.width;
    const scaleY = height / draggingItem.height;
    
    return (
      <div className="absolute inset-0 flex items-center justify-center opacity-70">
        <img 
          src={draggingItem.image}
          alt={draggingItem.name}
          className="h-full w-full object-contain"
          style={{ 
            transform: `scale(${Math.min(scaleX, scaleY)})`,
            maxWidth: '100%',
            maxHeight: '100%'
          }}
        />
      </div>
    );
  };
  
  return (
    <div
      ref={slotRef}
      className={`absolute border-2 transition-all duration-200 ${
        isOccupied 
          ? 'border-green-500 bg-green-50'
          : isActive
            ? 'border-blue-500 bg-blue-50' 
            : isDragging 
              ? 'border-dashed border-gray-400 bg-gray-50' 
              : 'border-gray-300 bg-gray-50'
      } ${className}`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`
      }}
    >
      {/* 배치된 아이템 보여주기 */}
      {isOccupied && placedItem && (
        <div className="absolute inset-0 flex items-center justify-center">
          <img 
            src={placedItem.image}
            alt={placedItem.name}
            className="h-full w-full object-contain"
          />
        </div>
      )}
      
      {/* 드래그 중인 아이템 미리보기 */}
      {renderPreview()}
      
      {/* 슬롯 ID */}
      <div className="absolute bottom-1 right-1 text-xs text-gray-500">
        {id}
      </div>
    </div>
  );
};

export default DropSlot; 
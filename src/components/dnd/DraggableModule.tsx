import React, { useRef, useState } from 'react';
import { useDnDStore } from './useDnDStore';

interface DraggableModuleProps {
  id: string;
  image: string;
  name: string;
  type: string;
  width: number;
  height: number;
  depth: number;
  color?: string;
  className?: string;
}

const DraggableModule: React.FC<DraggableModuleProps> = ({
  id,
  image,
  name,
  type,
  width,
  height,
  depth,
  color = '#F0F0F0',
  className = '',
}) => {
  const { setDraggingItem, setIsDragging } = useDnDStore();
  const [isSelected, setIsSelected] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);

  // 드래그 시작 핸들러
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    
    setIsSelected(true);
    setIsDragging(true);
    setDraggingItem({
      id,
      type,
      width,
      height,
      depth,
      image,
      name,
      color,
      startX: e.clientX,
      startY: e.clientY,
    });

    // 드래그 중 효과를 위한 클래스 추가
    if (itemRef.current) {
      itemRef.current.classList.add('dragging');
    }

    // 마우스 이동 및 마우스 업 이벤트 리스너 등록
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // 드래그 중 핸들러
  const handleMouseMove = (e: MouseEvent) => {
    if (!isSelected) return;
    
    // 마우스 위치 업데이트
    setDraggingItem({
      id,
      type,
      width,
      height,
      depth,
      image,
      name,
      color,
      currentX: e.clientX,
      currentY: e.clientY,
    });
  };

  // 드래그 종료 핸들러
  const handleMouseUp = (e: MouseEvent) => {
    setIsSelected(false);
    setIsDragging(false);
    
    // 드래그 중 효과를 위한 클래스 제거
    if (itemRef.current) {
      itemRef.current.classList.remove('dragging');
    }

    // 이벤트 리스너 제거
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      ref={itemRef}
      className={`relative cursor-grab select-none rounded-md transition-all duration-200 ${
        isSelected ? 'selected-module scale-105 shadow-lg' : ''
      } ${className}`}
      onMouseDown={handleMouseDown}
    >
      <div className="w-full overflow-hidden rounded-md border border-gray-200 bg-white p-2">
        <div 
          className="relative aspect-square w-full overflow-hidden rounded-md" 
          style={{ backgroundColor: color }}
        >
          <img
            src={image}
            alt={name}
            className="h-full w-full object-contain"
            draggable={false}
          />
        </div>
        <div className="mt-2 text-center text-sm font-medium text-gray-700">
          {name}
        </div>
        <div className="mt-1 flex flex-col text-center text-xs text-gray-500">
          <span>{type}</span>
          <span>{width}x{height}x{depth}mm</span>
        </div>
      </div>
      {isSelected && (
        <div className="absolute -inset-1 rounded-lg border-2 border-blue-500"></div>
      )}
    </div>
  );
};

export default DraggableModule; 
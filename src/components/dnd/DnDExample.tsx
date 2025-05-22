import React from 'react';
import DraggableModule from './DraggableModule';
import DropSlot from './DropSlot';
import SlotCanvas from './SlotCanvas';
import { useDnDStore } from './useDnDStore';

// 가구 모듈 데이터 가져오기
import furnitureModules from '../../data/furnitureModules.json';

const DnDExample: React.FC = () => {
  // 슬롯 설정
  const slots = [
    { id: 'slot-1', x: 50, y: 50, width: 400, height: 400, depth: 300 },
    { id: 'slot-2', x: 500, y: 50, width: 200, height: 400, depth: 300 },
    { id: 'slot-3', x: 50, y: 500, width: 650, height: 200, depth: 300 },
  ];

  // useDnDStore에서 드래그 관련 상태 및 함수 가져오기
  const { isDragging, draggingItem } = useDnDStore();

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-6 text-2xl font-bold">가구 모듈 배치 시스템</h1>
      
      {/* 가구 모듈 목록 */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">가구 모듈</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {furnitureModules.map((module: any) => (
            <DraggableModule
              key={module.id}
              id={module.id}
              image={module.image}
              name={module.name}
              type={module.type}
              width={module.width}
              height={module.height}
              depth={module.depth}
              color={module.color}
              className="h-full"
            />
          ))}
        </div>
      </div>
      
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
      
      {/* 드롭 영역 - 2D 슬롯 */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">2D 드롭 영역</h2>
        <div className="relative h-[800px] w-full border border-gray-300 bg-gray-100">
          {slots.map((slot) => (
            <DropSlot
              key={slot.id}
              id={slot.id}
              x={slot.x}
              y={slot.y}
              width={slot.width}
              height={slot.height}
              depth={slot.depth}
            />
          ))}
        </div>
      </div>
      
      {/* 3D 캔버스 영역 */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">3D 미리보기</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {slots.map((slot) => (
            <div key={slot.id} className="border border-gray-300 rounded-md">
              <h3 className="bg-gray-200 p-2 text-center font-semibold">
                {slot.id} ({slot.width}x{slot.height}x{slot.depth}mm)
              </h3>
              <div className="h-[300px]">
                <SlotCanvas
                  slotId={slot.id}
                  width={slot.width}
                  height={slot.height}
                  depth={slot.depth}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DnDExample; 
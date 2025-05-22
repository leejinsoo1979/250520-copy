import React from 'react';
import { PANEL_THICKNESS } from '../dnd/useDnDStore';

interface ModulePlaceholderProps {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isActive?: boolean;
  isOccupied?: boolean;
  onClick?: () => void;
}

const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({
  id,
  x,
  y,
  width,
  height,
  isActive = false,
  isOccupied = false,
  onClick
}) => {
  // 내부 유효 공간 계산 (패널 두께 고려)
  const innerWidth = width - PANEL_THICKNESS * 2;
  const innerHeight = height - PANEL_THICKNESS * 2;
  
  return (
    <div
      className={`absolute transition-all duration-150 ${isActive ? 'z-10' : 'z-0'}`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
        position: 'absolute',
        cursor: isOccupied ? 'default' : 'pointer',
      }}
      onClick={!isOccupied ? onClick : undefined}
    >
      {/* 패널 프레임 */}
      <div 
        className={`absolute inset-0 ${
          isActive 
            ? 'bg-blue-800 border-blue-900' 
            : 'bg-amber-800 border-amber-900'
        } transition-colors duration-200`}
      >
        {/* 슬롯 ID */}
        <div className="absolute bottom-1 right-1 text-xs text-white">
          {id}
        </div>
      </div>
      
      {/* 내부 공간 */}
      <div
        className={`absolute transition-all duration-200 ${
          isOccupied 
            ? 'bg-green-50'
            : isActive
              ? 'bg-blue-200' // 파란색으로 변경 (더 진한 색상)
              : 'bg-amber-50' // 기본 색상
        }`}
        style={{
          left: `${PANEL_THICKNESS}px`,
          top: `${PANEL_THICKNESS}px`,
          width: `${innerWidth}px`,
          height: `${innerHeight}px`,
        }}
      >
        {/* 패널 두께 시각화 (점선) */}
        {!isOccupied && (
          <>
            <div className="absolute top-0 left-0 w-full border-b border-dashed border-amber-800 opacity-30" />
            <div className="absolute top-0 left-0 h-full border-r border-dashed border-amber-800 opacity-30" />
            <div className="absolute bottom-0 left-0 w-full border-t border-dashed border-amber-800 opacity-30" />
            <div className="absolute top-0 right-0 h-full border-l border-dashed border-amber-800 opacity-30" />
          </>
        )}
        
        {/* 플레이스홀더 내용 - 비어있을 때만 표시 */}
        {!isOccupied && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-500 text-sm">
              <div>여기에 모듈 배치</div>
              <div className="text-xs mt-1">{width}x{height}mm</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModulePlaceholder;
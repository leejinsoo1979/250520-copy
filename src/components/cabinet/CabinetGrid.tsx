import React, { useState, useEffect } from 'react';
import { useDnDStore } from '../dnd/useDnDStore';
import { MODULE_TEMPLATES, ModuleTemplate } from '../../data/moduleTemplates';
import ModuleRenderer from './ModuleRenderer';
import ModulePlaceholder from './ModulePlaceholder';

interface GridCell {
  id: string;
  row: number;
  col: number;
  x: number;
  y: number;
  width: number;
  height: number;
  occupied: boolean;
  moduleId?: string;
}

interface CabinetGridProps {
  rows?: number;
  cols?: number;
  cellWidth?: number;
  cellHeight?: number;
  padding?: number;
  className?: string;
}

const CabinetGrid: React.FC<CabinetGridProps> = ({
  rows = 3,
  cols = 3,
  cellWidth = 600,
  cellHeight = 700,
  padding = 10,
  className = '',
}) => {
  // 그리드 셀 상태
  const [grid, setGrid] = useState<GridCell[]>([]);
  
  // useDnDStore에서 필요한 상태와 메서드
  const { 
    isDragging, 
    draggingItem, 
    activeSlotId, 
    placedItems, 
    addPlacedItem 
  } = useDnDStore();
  
  // 그리드 초기화
  useEffect(() => {
    const newGrid: GridCell[] = [];
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cellId = `cell-${row}-${col}`;
        const x = col * (cellWidth + padding);
        const y = row * (cellHeight + padding);
        
        newGrid.push({
          id: cellId,
          row,
          col,
          x,
          y,
          width: cellWidth,
          height: cellHeight,
          occupied: false
        });
      }
    }
    
    setGrid(newGrid);
  }, [rows, cols, cellWidth, cellHeight, padding]);
  
  // 배치된 아이템 그리드 업데이트
  useEffect(() => {
    if (placedItems.length === 0) return;
    
    // 배치된 아이템을 기준으로 그리드 점유 상태 업데이트
    const newGrid = grid.map(cell => {
      const isOccupied = placedItems.some(item => item.slotId === cell.id);
      const moduleId = isOccupied 
        ? placedItems.find(item => item.slotId === cell.id)?.id 
        : undefined;
      
      return {
        ...cell,
        occupied: isOccupied,
        moduleId
      };
    });
    
    setGrid(newGrid);
  }, [placedItems, grid]);
  
  // 셀에 모듈 배치 처리
  const handleCellClick = (cellId: string) => {
    // 드래그 중인 아이템이 없거나 셀이 이미 점유된 경우 무시
    if (!isDragging || !draggingItem) return;
    const targetCell = grid.find(cell => cell.id === cellId);
    if (!targetCell || targetCell.occupied) return;
    
    // 모듈 템플릿 찾기
    const moduleTemplate = MODULE_TEMPLATES.find(
      template => template.type === draggingItem.type
    );
    
    if (moduleTemplate) {
      // 배치 아이템 생성하고 추가
      addPlacedItem({
        ...draggingItem,
        slotId: cellId,
        position: {
          x: targetCell.x + targetCell.width / 2,
          y: targetCell.y + targetCell.height / 2,
          z: 0
        },
        scale: {
          x: 1,
          y: 1,
          z: 1
        },
        timestamp: Date.now()
      });
    }
  };
  
  // 모듈 렌더링
  const renderModules = () => {
    return placedItems.map(item => {
      const cell = grid.find(c => c.id === item.slotId);
      if (!cell) return null;
      
      // 모듈 템플릿 찾기
      const moduleTemplate = MODULE_TEMPLATES.find(
        template => template.type === item.type
      );
      
      if (!moduleTemplate) return null;
      
      return (
        <ModuleRenderer
          key={item.id}
          module={moduleTemplate}
          x={cell.x}
          y={cell.y}
          scale={item.scale}
        />
      );
    });
  };
  
  return (
    <div 
      className={`relative border border-gray-300 bg-gray-100 ${className}`}
      style={{ 
        width: cols * cellWidth + (cols - 1) * padding + 100,
        height: rows * cellHeight + (rows - 1) * padding + 100,
        overflow: 'auto'
      }}
    >
      {/* 그리드 셀 */}
      {grid.map(cell => (
        <ModulePlaceholder
          key={cell.id}
          id={cell.id}
          x={cell.x}
          y={cell.y}
          width={cell.width}
          height={cell.height}
          isActive={activeSlotId === cell.id}
          isOccupied={cell.occupied}
          onClick={() => handleCellClick(cell.id)}
        />
      ))}
      
      {/* 배치된 모듈 */}
      {renderModules()}
      
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
  );
};

export default CabinetGrid;
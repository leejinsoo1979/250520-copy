import React, { useState } from 'react';
import { useDnDStore } from '../dnd/useDnDStore';
import { MODULE_TEMPLATES, ModuleTemplate } from '../../data/moduleTemplates';

// 모듈 카테고리 타입 정의
type ModuleCategory = 'all' | 'lower' | 'upper' | 'corner' | 'shelves';

// 카테고리 목록
const MODULE_CATEGORIES: { id: ModuleCategory, name: string }[] = [
  { id: 'all', name: '전체 모듈' },
  { id: 'lower', name: '하부 모듈' },
  { id: 'upper', name: '상부 모듈' },
  { id: 'corner', name: '코너 모듈' },
  { id: 'shelves', name: '선반 모듈' }
];

const ModuleSelector: React.FC = () => {
  const { setDraggingItem, setIsDragging } = useDnDStore();
  const [activeCategory, setActiveCategory] = useState<ModuleCategory>('all');
  
  // 카테고리에 따른 모듈 목록 필터링
  const getFilteredModules = () => {
    if (activeCategory === 'all') {
      return MODULE_TEMPLATES;
    }
    
    // 카테고리로 필터링
    const categoryMap: Record<ModuleCategory, string[]> = {
      all: [],
      lower: ['lowerModule'],
      upper: ['upperModule'],
      corner: ['cornerModule'],
      shelves: ['shelfModule']
    };
    
    const moduleTypes = categoryMap[activeCategory] || [];
    return MODULE_TEMPLATES.filter(module => moduleTypes.includes(module.type));
  };
  
  // 모듈 드래그 시작 핸들러
  const handleModuleDragStart = (module: ModuleTemplate, e: React.MouseEvent) => {
    e.preventDefault();
    
    console.log('드래그 시작:', module);
    
    setIsDragging(true);
    setDraggingItem({
      id: module.id,
      type: module.type,
      width: module.width,
      height: module.height,
      depth: module.depth,
      image: module.thumbnail,
      name: module.name,
      color: '#F0F0F0',
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      panelThickness: 18 // 기본 패널 두께
    });
    
    // 마우스 이벤트 리스너 등록
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  // 마우스 이동 핸들러
  const handleMouseMove = (e: MouseEvent) => {
    // 드래그 중인 아이템 위치 업데이트
    setDraggingItem((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        currentX: e.clientX,
        currentY: e.clientY
      };
    });
  };
  
  // 드래그 종료 핸들러
  const handleMouseUp = () => {
    // 이벤트 리스너 제거
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  
  return (
    <div className="h-full w-64 bg-white border-r border-gray-200 overflow-auto flex flex-col">
      {/* 카테고리 선택 탭 */}
      <div className="flex border-b border-gray-200">
        {MODULE_CATEGORIES.map((category) => (
          <button
            key={category.id}
            className={`flex-1 py-2 text-xs font-medium ${
              activeCategory === category.id
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveCategory(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>
      
      {/* 모듈 목록 */}
      <div className="p-4 flex-1 overflow-auto">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          {MODULE_CATEGORIES.find(cat => cat.id === activeCategory)?.name || '모듈 목록'}
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          {getFilteredModules().map((module) => (
            <div
              key={module.id}
              className="cursor-grab border border-gray-200 rounded-md p-2 hover:shadow-md transition-shadow"
              onMouseDown={(e) => handleModuleDragStart(module, e)}
            >
              <div className="aspect-square bg-gray-50 rounded-md overflow-hidden mb-2">
                <img
                  src={module.thumbnail}
                  alt={module.name}
                  className="w-full h-full object-contain"
                  draggable={false}
                />
              </div>
              <div className="text-xs text-center text-gray-700 truncate font-medium">
                {module.name}
              </div>
              <div className="text-xs text-center text-gray-500">
                {module.width}x{module.height}x{module.depth}mm
              </div>
              <div className="text-xs text-center text-blue-500 mt-1">
                패널 두께: 18mm
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 하단 정보 */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500">
          <div>패널 두께: 18mm</div>
          <div>모든 모듈은 드래그하여 배치할 수 있습니다.</div>
        </div>
      </div>
    </div>
  );
};

export default ModuleSelector;
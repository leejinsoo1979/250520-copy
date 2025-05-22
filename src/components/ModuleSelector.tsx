import React, { useState } from 'react';
import { useDnDStore } from './dnd/useDnDStore';

// 모듈 카테고리 타입 정의
type ModuleCategory = 'single' | 'double' | 'corner' | 'shelves';

// 사이드바에 표시할 모듈 카테고리
const MODULE_CATEGORIES: { id: ModuleCategory, name: string }[] = [
  { id: 'single', name: '싱글 모듈' },
  { id: 'double', name: '더블 모듈' },
  { id: 'corner', name: '코너 모듈' },
  { id: 'shelves', name: '선반 모듈' }
];

// 싱글 모듈 목록 (실제로는 API나 JSON에서 가져옴)
const SINGLE_MODULES = [
  {
    id: 'D1HH',
    name: '싱글 도어 하이 하이트',
    thumbnail: '/assets/modules/thumbnails/single/D1HH.png',
    category: 'single',
    width: 600,
    height: 2086,
    depth: 600,
    panelThickness: 18
  }
];

// 가구 모듈 선택 컴포넌트
const ModuleSelector: React.FC = () => {
  const { setDraggingItem, setIsDragging } = useDnDStore();
  const [activeCategory, setActiveCategory] = useState<ModuleCategory>('single');
  
  // 카테고리에 따른 모듈 목록 가져오기
  const getModulesByCategory = (category: ModuleCategory) => {
    switch (category) {
      case 'single':
        return SINGLE_MODULES;
      case 'double':
      case 'corner':
      case 'shelves':
      default:
        return [];
    }
  };
  
  // 모듈 드래그 시작 핸들러
  const handleModuleDragStart = (module: any, e: React.MouseEvent) => {
    e.preventDefault();
    
    setIsDragging(true);
    setDraggingItem({
      id: module.id,
      type: 'cabinet',
      width: module.width,
      height: module.height,
      depth: module.depth,
      image: module.thumbnail,
      name: module.name,
      color: '#F0F0F0',
      startX: e.clientX,
      startY: e.clientY,
      panelThickness: module.panelThickness
    });
    
    // 마우스 이동 및 마우스 업 이벤트 리스너 등록
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  // 드래그 중 핸들러
  const handleMouseMove = (e: MouseEvent) => {
    // useDnDStore의 setDraggingItem 함수 사용
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
    setIsDragging(false);
    
    // 이벤트 리스너 제거
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  
  return (
    <div className="h-full w-64 bg-white border-r border-gray-200 overflow-auto">
      {/* 카테고리 선택 탭 */}
      <div className="flex border-b border-gray-200">
        {MODULE_CATEGORIES.map((category) => (
          <button
            key={category.id}
            className={`flex-1 py-2 text-sm font-medium ${
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
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          {MODULE_CATEGORIES.find(cat => cat.id === activeCategory)?.name || '모듈 목록'}
        </h3>
        
        <div className="grid grid-cols-2 gap-2">
          {getModulesByCategory(activeCategory).map((module) => (
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
              <div className="text-xs text-center text-gray-700 truncate">
                {module.name}
              </div>
              <div className="text-xs text-center text-gray-500">
                {module.width}x{module.height}x{module.depth}mm
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModuleSelector; 
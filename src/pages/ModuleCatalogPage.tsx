import React from 'react';
import ModuleSelector from '../components/ModuleSelector';
import CabinetSlotView from '../components/CabinetSlotView';

const ModuleCatalogPage: React.FC = () => {
  return (
    <div className="h-screen flex flex-col">
      {/* 상단 헤더 */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800">가구 모듈 배치 시스템</h1>
          <div className="flex space-x-4">
            <button className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
              저장하기
            </button>
            <button className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">
              초기화
            </button>
          </div>
        </div>
      </header>
      
      {/* 메인 콘텐츠 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 왼쪽 사이드바 - 모듈 선택기 */}
        <ModuleSelector />
        
        {/* 오른쪽 콘텐츠 - 캐비닛 슬롯 뷰어 */}
        <CabinetSlotView className="flex-1" />
      </div>
      
      {/* 하단 푸터 */}
      <footer className="bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            패널 두께: 18mm | 기본 슬롯 크기: 600x700x600mm
          </div>
          <div>
            <button className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
              결과 내보내기
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ModuleCatalogPage; 
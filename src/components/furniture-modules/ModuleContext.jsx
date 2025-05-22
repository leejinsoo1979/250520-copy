import React, { createContext, useState, useContext, useEffect } from 'react';
import initialModulesData from './initialModules.json';

// 모듈 컨텍스트 생성
const ModuleContext = createContext();

// 모듈 상태 관리 Provider
export const ModuleProvider = ({ children }) => {
  const [modules, setModules] = useState([]);
  const [placedModules, setPlacedModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [doorCount, setDoorCount] = useState(8);
  const [spaceWidth, setSpaceWidth] = useState(4800);
  
  // 초기 데이터 로드
  useEffect(() => {
    setModules(initialModulesData.modules || []);
  }, []);
  
  // 모듈 추가 함수
  const addModule = (moduleData) => {
    setModules((prev) => [...prev, moduleData]);
  };
  
  // 모듈 배치 함수
  const placeModule = (moduleData, slotIndex) => {
    const slotWidth = spaceWidth / doorCount;
    const startX = -spaceWidth / 2 + slotWidth / 2;
    const xPosition = startX + (slotIndex * slotWidth);
    
    const newModule = {
      ...moduleData,
      position: {
        x: xPosition,
        y: 0,
        z: 0
      }
    };
    
    setPlacedModules((prev) => [...prev, newModule]);
  };
  
  // 배치된 모듈 제거 함수
  const removeModule = (moduleId) => {
    setPlacedModules((prev) => prev.filter((m) => m.id !== moduleId));
  };
  
  // 선택된 슬롯의 모듈 제거 함수
  const removeModuleBySlot = (slotIndex) => {
    const slotWidth = spaceWidth / doorCount;
    const startX = -spaceWidth / 2 + slotWidth / 2;
    const xPosition = startX + (slotIndex * slotWidth);
    
    setPlacedModules((prev) => 
      prev.filter((m) => Math.abs(m.position.x - xPosition) > 5)
    );
  };
  
  // 공간 너비 변경 시 도어 개수 업데이트
  useEffect(() => {
    // 도어 하나당 약 600mm로 가정
    const calcDoorCount = Math.max(1, Math.round(spaceWidth / 600));
    setDoorCount(calcDoorCount);
  }, [spaceWidth]);
  
  // Context 값 정의
  const value = {
    modules,
    placedModules,
    setPlacedModules,
    addModule,
    placeModule,
    removeModule,
    removeModuleBySlot,
    selectedModule,
    setSelectedModule,
    doorCount,
    setDoorCount,
    spaceWidth,
    setSpaceWidth
  };
  
  return (
    <ModuleContext.Provider value={value}>
      {children}
    </ModuleContext.Provider>
  );
};

// 모듈 컨텍스트 사용 Hook
export const useModules = () => {
  const context = useContext(ModuleContext);
  if (!context) {
    throw new Error('useModules must be used within a ModuleProvider');
  }
  return context;
};

export default ModuleContext; 
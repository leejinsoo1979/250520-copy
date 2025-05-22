/**
 * 모듈 변환 유틸리티
 * 3D 모듈 데이터를 2D 렌더링이 가능한 형식으로 변환하거나 그 반대 작업을 수행
 */

/**
 * 3D 모듈 데이터를 2D 렌더링 가능한 형식으로 변환
 * @param {Object} data - 모듈 데이터
 * @returns {Array} - 2D 모듈 배열
 */
export const convertTo2DModules = (data) => {
  if (!data || !data.modules) {
    console.log('[moduleConverter] 유효한 데이터가 없음:', data);
    return [];
  }

  try {
    // 3D 모듈 데이터를 2D 형식으로 변환
    return data.modules.map((module) => ({
      id: module.id,
      type: module.type || 'standard',
      width: module.width || 600,
      height: module.height || 720,
      depth: module.depth || 550,
      x: module.position?.x || 0,
      y: module.position?.y || 0,
      color: module.color || '#FFFFFF',
      slotId: module.slotId,
      // 추가 속성 복사
      ...module
    }));
  } catch (error) {
    console.error('[moduleConverter] 변환 오류:', error);
    return [];
  }
};

/**
 * 2D 모듈 데이터를 3D 렌더링 가능한 형식으로 변환
 * @param {Array} modules - 2D 모듈 배열
 * @returns {Array} - 3D 모듈 배열
 */
export const convertTo3DModules = (modules) => {
  if (!modules || !Array.isArray(modules)) {
    console.log('[moduleConverter] 유효한 모듈 배열이 없음:', modules);
    return [];
  }

  try {
    // 2D 모듈 데이터를 3D 형식으로 변환
    return modules.map((module) => ({
      id: module.id,
      type: module.type || 'standard',
      width: module.width || 600,
      height: module.height || 720, 
      depth: module.depth || 550,
      position: {
        x: module.x || 0,
        y: module.y || 0,
        z: 0
      },
      rotation: {
        x: 0,
        y: 0,
        z: 0
      },
      color: module.color || '#FFFFFF',
      slotId: module.slotId,
      // 추가 속성 복사
      ...module
    }));
  } catch (error) {
    console.error('[moduleConverter] 변환 오류:', error);
    return [];
  }
};

/**
 * 모듈 배열에서 특정 슬롯에 배치된 모듈 찾기
 * @param {Array} modules - 모듈 배열
 * @param {string} slotId - 찾을 슬롯 ID
 * @returns {Object|null} - 찾은 모듈 또는 null
 */
export const findModuleBySlotId = (modules, slotId) => {
  if (!modules || !Array.isArray(modules) || !slotId) {
    return null;
  }
  
  return modules.find(module => module.slotId === slotId) || null;
};

/**
 * 모듈 데이터를 2D 뷰에서 사용할 형식으로 변환하는 유틸리티 함수
 */

/**
 * 3D 모듈 데이터를 2D 뷰에서 사용할 형식으로 변환
 * @param {Object[]} modules - 3D 모듈 데이터 배열
 * @returns {Object[]} 변환된 2D 모듈 데이터 배열
 */
export const convertTo2DModulesForView = (modules) => {
  if (!modules || !Array.isArray(modules.modules)) {
    return [];
  }
  
  return modules.modules.map(module => ({
    id: module.id,
    width: module.dimensions.width,
    height: module.dimensions.height,
    depth: module.dimensions.depth,
    position: {
      x: module.position.x,
      y: module.position.y,
      z: module.position.z
    },
    type: module.type || 'standard',
    color: module.color || '#FFFFFF',
    materials: module.materials || {},
    metadata: module.metadata || {}
  }));
};

/**
 * 2D 모듈 데이터를 3D 뷰에서 사용할 형식으로 변환
 * @param {Object[]} modules2D - 2D 모듈 데이터 배열
 * @returns {Object} 변환된 3D 모듈 데이터
 */
export const convertTo3DModulesForView = (modules2D) => {
  if (!modules2D || !Array.isArray(modules2D)) {
    return { modules: [] };
  }
  
  const modules = modules2D.map(module => ({
    id: module.id,
    dimensions: {
      width: module.width,
      height: module.height,
      depth: module.depth
    },
    position: {
      x: module.position.x,
      y: module.position.y,
      z: module.position.z || 0
    },
    type: module.type || 'standard',
    color: module.color || '#FFFFFF',
    materials: module.materials || {},
    metadata: module.metadata || {}
  }));
  
  return { modules };
};

/**
 * 모듈 데이터를 슬롯 배치에 맞게 변환
 * @param {Object[]} modules - 모듈 데이터 배열
 * @param {Object[]} slots - 슬롯 정보 배열
 * @returns {Object[]} 슬롯 위치에 배치된 모듈 데이터
 */
export const arrangeModulesInSlots = (modules, slots) => {
  if (!modules || !slots) {
    return [];
  }
  
  // 각 슬롯에 배치된 모듈을 추적
  const slotModules = {};
  
  // 모듈을 슬롯 ID로 그룹화
  modules.forEach(module => {
    if (module.slotId) {
      if (!slotModules[module.slotId]) {
        slotModules[module.slotId] = [];
      }
      slotModules[module.slotId].push(module);
    }
  });
  
  // 각 슬롯 내에서 모듈 위치 조정
  const result = [];
  
  slots.forEach(slot => {
    const modulesInSlot = slotModules[slot.id] || [];
    
    modulesInSlot.forEach((module, index) => {
      // 슬롯 내에서의 상대적 위치 계산
      const adjustedModule = {
        ...module,
        position: {
          x: slot.position.x + (index * 10), // 슬롯 내에서 약간의 오프셋 추가
          y: slot.position.y,
          z: module.position.z || 0
        }
      };
      
      result.push(adjustedModule);
    });
  });
  
  return result;
};

export default {
  convertTo2DModules,
  convertTo3DModules,
  findModuleBySlotId,
  convertTo2DModulesForView,
  convertTo3DModulesForView,
  arrangeModulesInSlots
}; 
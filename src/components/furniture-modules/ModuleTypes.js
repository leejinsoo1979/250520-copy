// 가구 모듈 타입 정의
export const MODULE_TYPES = {
  DRAWER: 'drawer',
  SHELF: 'shelf',
  HANGING: 'hanging',
  DOOR: 'door',
  ACCESSORY: 'accessory',
  CABINET: 'cabinet'
};

// 기본 모듈 데이터 구조
export const createModuleData = (id, type, name, width, height, depth, options = {}) => ({
  id,
  type,
  name,
  dimensions: {
    width, // 모듈 너비 (mm)
    height, // 모듈 높이 (mm)
    depth // 모듈 깊이 (mm)
  },
  options,
  position: {
    x: 0, // 모듈의 시작 X 위치 (mm)
    y: 0, // 모듈의 시작 Y 위치 (mm)
    z: 0  // 모듈의 시작 Z 위치 (mm)
  }
});

// 샘플 모듈 데이터 (기본값으로 사용될 수 있음)
export const SAMPLE_MODULES = [
  createModuleData('drawer-1', MODULE_TYPES.DRAWER, '서랍장 (소형)', 600, 150, 550, { drawerCount: 1 }),
  createModuleData('drawer-2', MODULE_TYPES.DRAWER, '서랍장 (중형)', 600, 300, 550, { drawerCount: 2 }),
  createModuleData('drawer-3', MODULE_TYPES.DRAWER, '서랍장 (대형)', 600, 450, 550, { drawerCount: 3 }),
  createModuleData('shelf-1', MODULE_TYPES.SHELF, '선반 (고정형)', 600, 25, 550, { fixed: true }),
  createModuleData('shelf-2', MODULE_TYPES.SHELF, '선반 (조절형)', 600, 25, 550, { fixed: false }),
  createModuleData('hanging-rod', MODULE_TYPES.HANGING, '행거바', 600, 30, 550, { rodDiameter: 25 }),
  createModuleData('door-hinge', MODULE_TYPES.DOOR, '여닫이 도어', 600, 2100, 19, { type: 'hinge' }),
  createModuleData('door-sliding', MODULE_TYPES.DOOR, '슬라이딩 도어', 600, 2100, 19, { type: 'sliding' }),
  createModuleData('cabinet-base', MODULE_TYPES.CABINET, '캐비넷 - 기본형', 600, 2100, 580, { 
    hasTop: true, 
    hasBottom: true, 
    hasLeft: true, 
    hasRight: true,
    hasBack: true,
    panelThickness: 18,
    modules: [
      {
        id: 'lower',
        type: 'lower',
        position: 'base',
        dimensions: { width: 600, height: 636, depth: 580 }
      },
      {
        id: 'upper',
        type: 'upper',
        position: 'top',
        dimensions: { width: 600, height: 1450, depth: 580 }
      }
    ]
  })
]; 
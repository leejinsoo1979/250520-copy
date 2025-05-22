// 모듈 타입 정의
export const MODULE_TYPES = {
  DRAWER: 'drawer',
  SHELF: 'shelf',
  HANGING: 'hanging',
  DOOR: 'door',
  ACCESSORY: 'accessory',
  CABINET: 'cabinet'
};

// 샘플 모듈 데이터
export const SAMPLE_MODULES = [
  {
    id: 'drawer-module-sample',
    name: '서랍장',
    type: MODULE_TYPES.DRAWER,
    dimensions: { width: 600, height: 800, depth: 580 },
    options: { drawerCount: 4 },
    color: '#F5F5F5',
    image: 'images/wardrobe-drawer.svg'
  },
  {
    id: 'shelf-module-sample',
    name: '오픈 선반',
    type: MODULE_TYPES.SHELF,
    dimensions: { width: 600, height: 800, depth: 580 },
    options: { fixed: true },
    color: '#EEEEEE',
    image: 'images/wardrobe-shelf.svg'
  },
  {
    id: 'hanging-module-sample',
    name: '행거 섹션',
    type: MODULE_TYPES.HANGING,
    dimensions: { width: 1200, height: 800, depth: 580 },
    options: { rodDiameter: 25 },
    color: '#F0F0F0',
    image: 'images/wardrobe-hanging.svg'
  },
  {
    id: 'cabinet-module-sample',
    name: '캐비넷',
    type: MODULE_TYPES.CABINET,
    dimensions: { width: 600, height: 1200, depth: 580 },
    options: { hasTop: true, hasBottom: true, hasLeft: true, hasRight: true, hasBack: true },
    color: '#FFFFFF',
    image: 'images/wardrobe-cabinet.svg'
  }
]; 
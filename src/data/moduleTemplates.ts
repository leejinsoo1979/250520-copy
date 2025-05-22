// 18mm 판재를 사용한 가구 모듈 템플릿 정의
import { v4 as uuidv4 } from 'uuid';

// 패널 타입 정의
export type PanelType = 
  | 'bottomPanel' // 하부판넬
  | 'topPanel'    // 상부판넬 
  | 'leftPanel'   // 좌측판넬
  | 'rightPanel'  // 우측판넬
  | 'backPanel'   // 후면판넬
  | 'shelfPanel'  // 선반판넬
  | 'doorPanel';  // 도어판넬

// 패널 위치 정의
export type PanelPosition = 'left' | 'right' | 'top' | 'bottom' | 'back' | 'shelf' | 'door';

// 패널 인터페이스
export interface Panel {
  id: string;
  type: PanelType;
  position: PanelPosition;
  width: number;
  height: number;
  depth: number;
  x: number;
  y: number;
  z: number;
  color?: string;
  thickness: number;
}

// 모듈 인터페이스
export interface ModuleTemplate {
  id: string;
  name: string;
  type: string;
  width: number;
  height: number;
  depth: number;
  thumbnail: string;
  panels: Panel[];
}

// 패널 팩토리 함수 - 패널 생성 헬퍼
export const createPanel = (
  type: PanelType,
  position: PanelPosition,
  width: number,
  height: number,
  depth: number,
  x: number,
  y: number,
  z: number,
  thickness: number = 18,
  color: string = '#8B4513'
): Panel => ({
  id: uuidv4(),
  type,
  position,
  width,
  height,
  depth,
  x,
  y,
  z,
  thickness,
  color
});

// 이미지에 표시된 모듈 템플릿 생성 (하부모듈 618mm 높이)
export const createLowerModuleTemplate = (): ModuleTemplate => {
  const moduleWidth = 600;
  const moduleHeight = 618;
  const moduleDepth = 600;
  const thickness = 18;
  
  const panels: Panel[] = [
    // 좌측 판넬
    createPanel(
      'leftPanel',
      'left',
      moduleDepth,
      moduleHeight,
      thickness,
      0,
      0,
      0,
      thickness
    ),
    
    // 우측 판넬
    createPanel(
      'rightPanel',
      'right',
      moduleDepth,
      moduleHeight,
      thickness,
      moduleWidth - thickness,
      0,
      0,
      thickness
    ),
    
    // 상부 판넬
    createPanel(
      'topPanel',
      'top',
      moduleWidth,
      thickness,
      moduleDepth,
      0,
      moduleHeight - thickness,
      0,
      thickness
    ),
    
    // 하부 판넬
    createPanel(
      'bottomPanel',
      'bottom',
      moduleWidth,
      thickness,
      moduleDepth,
      0,
      0,
      0,
      thickness
    ),
    
    // 후면 판넬
    createPanel(
      'backPanel',
      'back',
      moduleWidth,
      moduleHeight,
      thickness / 2, // 후면은 얇게
      0,
      0,
      moduleDepth - thickness / 2,
      thickness / 2
    )
  ];
  
  return {
    id: uuidv4(),
    name: '하부 모듈',
    type: 'lowerModule',
    width: moduleWidth,
    height: moduleHeight,
    depth: moduleDepth,
    thumbnail: '/module-image/single/D1L.png',
    panels
  };
};

// 상부 모듈 템플릿 생성 (높이 1450mm)
export const createUpperModuleTemplate = (): ModuleTemplate => {
  const moduleWidth = 600;
  const moduleHeight = 1450;
  const moduleDepth = 600;
  const thickness = 18;
  
  const panels: Panel[] = [
    // 좌측 판넬
    createPanel(
      'leftPanel',
      'left',
      moduleDepth,
      moduleHeight,
      thickness,
      0,
      0,
      0,
      thickness
    ),
    
    // 우측 판넬
    createPanel(
      'rightPanel',
      'right',
      moduleDepth,
      moduleHeight,
      thickness,
      moduleWidth - thickness,
      0,
      0,
      thickness
    ),
    
    // 상부 판넬
    createPanel(
      'topPanel',
      'top',
      moduleWidth,
      thickness,
      moduleDepth,
      0,
      moduleHeight - thickness,
      0,
      thickness
    ),
    
    // 하부 판넬
    createPanel(
      'bottomPanel',
      'bottom',
      moduleWidth,
      thickness,
      moduleDepth,
      0,
      0,
      0,
      thickness
    ),
    
    // 후면 판넬
    createPanel(
      'backPanel',
      'back',
      moduleWidth,
      moduleHeight,
      thickness / 2, // 후면은 얇게
      0,
      0,
      moduleDepth - thickness / 2,
      thickness / 2
    ),
    
    // 선반 (중간 위치)
    createPanel(
      'shelfPanel',
      'shelf',
      moduleWidth - thickness * 2,
      thickness,
      moduleDepth - thickness,
      thickness,
      moduleHeight / 2,
      thickness,
      thickness
    )
  ];
  
  return {
    id: uuidv4(),
    name: '상부 모듈',
    type: 'upperModule',
    width: moduleWidth,
    height: moduleHeight,
    depth: moduleDepth,
    thumbnail: '/module-image/single/D1HH.png',
    panels
  };
};

// 이미지에 있는 모든 모듈 템플릿
export const MODULE_TEMPLATES: ModuleTemplate[] = [
  createLowerModuleTemplate(),
  createUpperModuleTemplate(),
];

// 모듈 ID로 템플릿 찾기
export const getModuleTemplateById = (id: string): ModuleTemplate | undefined => {
  return MODULE_TEMPLATES.find(template => template.id === id);
};

// 모듈 타입으로 템플릿 찾기
export const getModuleTemplateByType = (type: string): ModuleTemplate | undefined => {
  return MODULE_TEMPLATES.find(template => template.type === type);
};
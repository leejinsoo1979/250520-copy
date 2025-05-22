import * as THREE from 'three';
import { PANEL_THICKNESS } from '../components/dnd/useDnDStore';

// JSON 캐비닛 타입 정의
export interface CabinetModule {
  id: string;
  type: string;
  position: string;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  panelThickness: number;
  panels: {
    hasTop: boolean;
    hasBottom: boolean;
    hasLeft: boolean;
    hasRight: boolean;
    hasBack: boolean;
  };
  material: string;
  shelves: {
    count: number;
    distribution: string;
    positions: number[];
  };
  fixedDepth?: boolean;
  fixedWidth?: boolean;
  createTimestamp?: number;
}

export interface CabinetData {
  name: string;
  type: string;
  modules: CabinetModule[];
}

// 재질 맵핑
const MATERIALS = {
  melamine_white: { color: '#FFFFFF', roughness: 0.3, metalness: 0.1 },
  melamine_black: { color: '#222222', roughness: 0.3, metalness: 0.1 },
  melamine_oak: { color: '#D4B27A', roughness: 0.4, metalness: 0.05 },
  melamine_walnut: { color: '#5D4037', roughness: 0.4, metalness: 0.05 },
  melamine_gray: { color: '#9E9E9E', roughness: 0.3, metalness: 0.1 },
};

// mm를 미터 단위로 변환 (Three.js에서 사용)
const mmToMeter = (mm: number): number => mm / 1000;

// 패널 생성 함수
const createPanel = (
  width: number,
  height: number,
  depth: number,
  position: [number, number, number],
  rotation: [number, number, number] = [0, 0, 0],
  material: string = 'melamine_white'
): THREE.Mesh => {
  // mm를 미터로 변환
  const w = mmToMeter(width);
  const h = mmToMeter(height);
  const d = mmToMeter(depth);
  
  // 위치도 미터로 변환
  const pos: [number, number, number] = [
    mmToMeter(position[0]), 
    mmToMeter(position[1]), 
    mmToMeter(position[2])
  ];
  
  // 재질 설정
  const materialProps = MATERIALS[material as keyof typeof MATERIALS] || MATERIALS.melamine_white;
  const panelMaterial = new THREE.MeshStandardMaterial({
    color: materialProps.color,
    roughness: materialProps.roughness,
    metalness: materialProps.metalness,
    side: THREE.DoubleSide
  });
  
  // 패널 메쉬 생성
  const geometry = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geometry, panelMaterial);
  
  // 위치 및 회전 설정
  mesh.position.set(pos[0], pos[1], pos[2]);
  mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
  
  return mesh;
};

// 모듈 내부 유효 공간 계산
export const calculateInnerDimensions = (cabinetModule: CabinetModule) => {
  const { width, height, depth } = cabinetModule.dimensions;
  const thickness = cabinetModule.panelThickness || PANEL_THICKNESS;
  const { hasLeft, hasRight, hasTop, hasBottom } = cabinetModule.panels;
  
  // 패널이 있는 경우에만 두께를 고려하여 내부 크기 계산
  const innerWidth = width - (hasLeft ? thickness : 0) - (hasRight ? thickness : 0);
  const innerHeight = height - (hasTop ? thickness : 0) - (hasBottom ? thickness : 0);
  const innerDepth = depth - (cabinetModule.panels.hasBack ? thickness : 0);
  
  return { innerWidth, innerHeight, innerDepth };
};

// 모듈 캐비닛을 슬롯 크기에 맞게 스케일링
export const scaleModuleToSlot = (
  cabinetModule: CabinetModule,
  slotWidth: number,
  slotHeight: number,
  slotDepth: number
) => {
  // 패널 두께 고려
  const thickness = cabinetModule.panelThickness || PANEL_THICKNESS;
  
  // 슬롯 내부 유효 공간 계산
  const slotInnerWidth = Math.max(0, slotWidth - thickness * 2);
  const slotInnerHeight = Math.max(0, slotHeight - thickness * 2);
  const slotInnerDepth = Math.max(0, slotDepth - thickness);
  
  // 캐비닛 내부 유효 공간 계산
  const { innerWidth, innerHeight, innerDepth } = calculateInnerDimensions(cabinetModule);
  
  // 스케일 비율 계산 (가로, 세로, 깊이 중 가장 작은 비율로 통일)
  const widthRatio = slotInnerWidth / innerWidth;
  const heightRatio = slotInnerHeight / innerHeight;
  const depthRatio = slotInnerDepth / innerDepth;
  
  // 고정 크기 옵션 고려
  const ratios = [];
  if (!cabinetModule.fixedWidth) ratios.push(widthRatio);
  if (!cabinetModule.fixedDepth) ratios.push(depthRatio);
  ratios.push(heightRatio); // 높이는 항상 조정 가능
  
  // 모든 비율 중 가장 작은 값으로 스케일링
  const scaleRatio = Math.min(...ratios);
  
  // 스케일링된 치수 계산
  const scaledWidth = cabinetModule.fixedWidth ? cabinetModule.dimensions.width : Math.min(cabinetModule.dimensions.width * scaleRatio, slotWidth);
  const scaledHeight = cabinetModule.dimensions.height * scaleRatio;
  const scaledDepth = cabinetModule.fixedDepth ? cabinetModule.dimensions.depth : Math.min(cabinetModule.dimensions.depth * scaleRatio, slotDepth);
  
  return {
    ...cabinetModule,
    dimensions: {
      width: scaledWidth,
      height: scaledHeight,
      depth: scaledDepth
    },
    scale: {
      x: scaleRatio,
      y: scaleRatio,
      z: scaleRatio
    }
  };
};

// 선반 위치 계산
const calculateShelfPositions = (cabinetModule: CabinetModule) => {
  const { innerHeight } = calculateInnerDimensions(cabinetModule);
  const { count, distribution, positions } = cabinetModule.shelves;
  
  // 이미 위치가 지정되어 있으면 그대로 사용
  if (positions && positions.length > 0 && positions.length === count) {
    return positions;
  }
  
  // 선반 개수에 따른 위치 계산
  const calculatedPositions: number[] = [];
  
  if (count > 0) {
    if (distribution === 'equal') {
      // 균등 분배
      const gap = innerHeight / (count + 1);
      for (let i = 1; i <= count; i++) {
        calculatedPositions.push(-innerHeight / 2 + gap * i);
      }
    } else {
      // 기본 위치 (아래에서부터 균등 간격)
      const gap = innerHeight / (count + 1);
      for (let i = 1; i <= count; i++) {
        calculatedPositions.push(-innerHeight / 2 + gap * i);
      }
    }
  }
  
  return calculatedPositions;
};

// JSON 데이터로부터 Three.js 캐비닛 모델 생성
export const createCabinetFromJSON = (
  cabinetData: CabinetData,
  slotWidth: number,
  slotHeight: number,
  slotDepth: number
): THREE.Group => {
  const group = new THREE.Group();
  group.name = cabinetData.name || 'Cabinet';
  
  // 각 모듈 처리
  cabinetData.modules.forEach((moduleData, index) => {
    // 슬롯 크기에 맞게 모듈 스케일링
    const scaledModule = scaleModuleToSlot(moduleData, slotWidth, slotHeight, slotDepth);
    const moduleGroup = createModuleGroup(scaledModule);
    
    // 모듈 위치 설정 (하단부터 쌓는 방식)
    let yOffset = 0;
    if (index > 0) {
      for (let i = 0; i < index; i++) {
        yOffset += cabinetData.modules[i].dimensions.height;
      }
      // 기존 모듈 높이의 절반과 현재 모듈 높이의 절반을 고려하여 위치 조정
      yOffset -= (slotHeight / 2);
    }
    
    // 모듈 그룹에 Y 오프셋 적용
    moduleGroup.position.y = mmToMeter(yOffset);
    
    group.add(moduleGroup);
  });
  
  return group;
};

// 단일 모듈 그룹 생성
const createModuleGroup = (moduleData: CabinetModule): THREE.Group => {
  const { width, height, depth } = moduleData.dimensions;
  const thickness = moduleData.panelThickness || PANEL_THICKNESS;
  const moduleGroup = new THREE.Group();
  moduleGroup.name = `Module_${moduleData.id}`;
  
  // 패널 생성 여부 확인
  const { hasTop, hasBottom, hasLeft, hasRight, hasBack } = moduleData.panels;
  
  // 내부 크기 계산
  const innerDimensions = calculateInnerDimensions(moduleData);
  
  // 1. 상판 패널
  if (hasTop) {
    const topPanel = createPanel(
      width,
      thickness,
      depth,
      [0, height / 2 - thickness / 2, 0],
      [0, 0, 0],
      moduleData.material
    );
    topPanel.name = 'TopPanel';
    moduleGroup.add(topPanel);
  }
  
  // 2. 하판 패널
  if (hasBottom) {
    const bottomPanel = createPanel(
      width,
      thickness,
      depth,
      [0, -height / 2 + thickness / 2, 0],
      [0, 0, 0],
      moduleData.material
    );
    bottomPanel.name = 'BottomPanel';
    moduleGroup.add(bottomPanel);
  }
  
  // 3. 좌측 패널
  if (hasLeft) {
    const leftPanel = createPanel(
      thickness,
      height,
      depth,
      [-width / 2 + thickness / 2, 0, 0],
      [0, 0, 0],
      moduleData.material
    );
    leftPanel.name = 'LeftPanel';
    moduleGroup.add(leftPanel);
  }
  
  // 4. 우측 패널
  if (hasRight) {
    const rightPanel = createPanel(
      thickness,
      height,
      depth,
      [width / 2 - thickness / 2, 0, 0],
      [0, 0, 0],
      moduleData.material
    );
    rightPanel.name = 'RightPanel';
    moduleGroup.add(rightPanel);
  }
  
  // 5. 후면 패널
  if (hasBack) {
    const backPanel = createPanel(
      width,
      height,
      thickness,
      [0, 0, -depth / 2 + thickness / 2],
      [0, 0, 0],
      moduleData.material
    );
    backPanel.name = 'BackPanel';
    moduleGroup.add(backPanel);
  }
  
  // 6. 선반 추가
  if (moduleData.shelves && moduleData.shelves.count > 0) {
    const shelfPositions = calculateShelfPositions(moduleData);
    
    shelfPositions.forEach((yPos, idx) => {
      const shelf = createPanel(
        innerDimensions.innerWidth,
        thickness,
        innerDimensions.innerDepth,
        [0, yPos, 0],
        [0, 0, 0],
        moduleData.material
      );
      shelf.name = `Shelf_${idx + 1}`;
      moduleGroup.add(shelf);
    });
  }
  
  return moduleGroup;
};

// 메인 인터페이스 - 슬롯에 맞게 캐비닛 배치하기
export const fitCabinetToSlot = (
  cabinetData: CabinetData,
  slotWidth: number,
  slotHeight: number, 
  slotDepth: number
): THREE.Group => {
  // 캐비닛 전체 크기 계산
  let totalHeight = 0;
  cabinetData.modules.forEach(module => {
    totalHeight += module.dimensions.height;
  });
  
  // 슬롯 높이와 캐비닛 전체 높이 비교하여 스케일 조정
  const scaleRatio = slotHeight / totalHeight;
  
  // 모듈별로 높이 스케일 적용
  const scaledCabinetData: CabinetData = {
    ...cabinetData,
    modules: cabinetData.modules.map(module => ({
      ...module,
      dimensions: {
        ...module.dimensions,
        height: module.dimensions.height * scaleRatio
      }
    }))
  };
  
  // 스케일링된 데이터로 캐비닛 모델 생성
  return createCabinetFromJSON(scaledCabinetData, slotWidth, slotHeight, slotDepth);
};

export default {
  createCabinetFromJSON,
  fitCabinetToSlot,
  scaleModuleToSlot,
  calculateInnerDimensions
}; 
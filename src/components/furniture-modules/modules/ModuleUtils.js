/**
 * 모듈 유틸리티 함수 모음
 */

// 슬롯 인덱스 계산
export const calculateSlotIndex = (xPosition, totalWidth, slotCount) => {
  // mm 단위 xPosition을 m 단위로 변환
  const xInM = xPosition / 1000;
  
  // 총 너비를 m 단위로 변환
  const totalWidthM = totalWidth / 1000;
  
  // 슬롯 너비 계산 (m 단위)
  const slotWidthM = totalWidthM / slotCount;
  
  // 중앙점 기준 조정 (총 너비의 절반을 왼쪽으로 이동)
  const adjustedX = xInM + (totalWidthM / 2);
  
  // 인덱스 계산
  const index = Math.floor(adjustedX / slotWidthM);
  
  // 유효 범위 내로 제한 (0 ~ slotCount-1)
  return Math.max(0, Math.min(index, slotCount - 1));
};

// 슬롯 위치 계산
export const calculateSlotPosition = (slotIndex, totalWidth, slotCount) => {
  // 총 너비를 m 단위로 변환
  const totalWidthM = totalWidth / 1000;
  
  // 슬롯 너비 계산 (m 단위)
  const slotWidthM = totalWidthM / slotCount;
  
  // 슬롯 중앙 위치 계산 (중앙점 기준)
  const xInM = (slotIndex * slotWidthM) + (slotWidthM / 2) - (totalWidthM / 2);
  
  // mm 단위로 반환
  return xInM * 1000;
};

// 드래그 앤 드롭으로 캔버스 영역 내에 모듈 배치가 가능한지 확인
export const isValidDropTarget = (canvasBounds, mouseX, mouseY) => {
  if (!canvasBounds) return false;
  
  return (
    mouseX >= canvasBounds.left &&
    mouseX <= canvasBounds.right &&
    mouseY >= canvasBounds.top &&
    mouseY <= canvasBounds.bottom
  );
};

// 모듈 ID 생성 - 고유한 ID 생성
export const generateModuleId = (prefix = 'module') => {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
};

// 모듈 배치가 유효한지 확인 (충돌 검사)
export const isValidPlacement = (newModule, placedModules, slotIndex, totalWidth, slotCount) => {
  // 새 모듈의 x 위치
  const newModuleX = calculateSlotPosition(slotIndex, totalWidth, slotCount);
  const newModuleWidth = newModule.dimensions.width;
  
  // 기존 모듈과의 충돌 검사
  for (const module of placedModules) {
    const moduleX = module.position.x;
    const moduleWidth = module.dimensions.width;
    
    // 좌우 충돌 검사
    const leftEdge1 = newModuleX - (newModuleWidth / 2);
    const rightEdge1 = newModuleX + (newModuleWidth / 2);
    const leftEdge2 = moduleX - (moduleWidth / 2);
    const rightEdge2 = moduleX + (moduleWidth / 2);
    
    // 충돌 조건: 두 모듈의 오른쪽 경계가 왼쪽 경계보다 크고, 왼쪽 경계가 오른쪽 경계보다 작은 경우
    if (rightEdge1 > leftEdge2 && leftEdge1 < rightEdge2) {
      return false; // 충돌 발생
    }
  }
  
  return true; // 충돌 없음
}; 
/**
 * 가구 모듈을 슬롯 내부 공간에 맞게 스케일링하는 유틸리티 함수
 */

/**
 * 모듈 타입 정의 - 모듈의 물리적 크기 정보
 */
export type Module = {
  width: number;
  height: number;
  depth: number;
};

/**
 * 슬롯 타입 정의 - 슬롯의 크기 및 패널 두께 정보
 */
export type Slot = {
  width: number;
  height: number;
  depth: number;
  panelThickness: number;
};

/**
 * 모듈을 슬롯 내부 공간에 맞게 스케일링하는 함수
 * @param slot 가구 슬롯 정보 (전체 크기와 패널 두께)
 * @param module 모듈 정보 (물리적 크기)
 * @returns 슬롯 내부 공간에 맞게 스케일링된 모듈 크기
 */
export function scaleModuleToFit(slot: Slot, module: Module): Module {
  const innerW = slot.width - slot.panelThickness * 2;
  const innerH = slot.height - slot.panelThickness * 2;
  const innerD = slot.depth - slot.panelThickness * 2;

  const ratio = Math.min(
    innerW / module.width,
    innerH / module.height,
    innerD / module.depth,
    1 // scale down only
  );

  return {
    width: module.width * ratio,
    height: module.height * ratio,
    depth: module.depth * ratio
  };
}

/**
 * 모듈이 슬롯에 맞는지 확인하는 함수
 * @param slot 가구 슬롯 정보
 * @param module 모듈 정보
 * @returns 모듈이 슬롯에 맞는지 여부 (true/false)
 */
export function moduleFitsInSlot(slot: Slot, module: Module): boolean {
  const innerW = slot.width - slot.panelThickness * 2;
  const innerH = slot.height - slot.panelThickness * 2;
  const innerD = slot.depth - slot.panelThickness * 2;
  
  return (
    module.width <= innerW &&
    module.height <= innerH &&
    module.depth <= innerD
  );
}

/**
 * 슬롯의 내부 유효 공간 크기를 계산하는 함수
 * @param slot 가구 슬롯 정보
 * @returns 내부 유효 공간 크기
 */
export function getInnerSlotDimensions(slot: Slot): Module {
  return {
    width: Math.max(0, slot.width - slot.panelThickness * 2),
    height: Math.max(0, slot.height - slot.panelThickness * 2),
    depth: Math.max(0, slot.depth - slot.panelThickness * 2)
  };
} 
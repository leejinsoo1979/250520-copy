/**
 * RoomViewer3D 컴포넌트의 위치 및 치수 계산을 위한 유틸리티 함수
 * 
 * 이 파일은 모든 3D 요소(프레임, 벽, 천장, 바닥, 단내림 등)의
 * 위치와 치수를 계산하는 중앙 집중식 함수들을 포함합니다.
 */

/**
 * 모든 계산에 사용되는 공통 매개변수
 * @typedef {Object} Dimensions
 * @property {number} widthM - 전체 공간 너비 (미터)
 * @property {number} heightM - 전체 공간 높이 (미터)
 * @property {number} depthM - 전체 공간 깊이 (미터)
 * @property {number} leftFrameWidth - 좌측 프레임 너비 (미터)
 * @property {number} rightFrameWidth - 우측 프레임 너비 (미터)
 * @property {number} topFrameHeight - 상부 프레임 높이 (미터)
 * @property {number} frameThickness - 프레임 두께 (미터)
 * @property {number} baseHeightM - 받침대 높이 (미터)
 * @property {number} baseDepthM - 받침대 깊이 (미터)
 * @property {number} endPanelThickness - 엔드패널 두께 (미터)
 * @property {number} floorThicknessM - 바닥 마감재 두께 (미터)
 * @property {number} raiseHeightM - 띄움 높이 (미터)
 */

/**
 * @typedef {Object} Options
 * @property {string} spaceType - 공간 유형 ('built-in', 'semi-standing', 'free-standing')
 * @property {string} wallPosition - 벽 위치 ('left', 'right', null)
 * @property {boolean} hasAirConditioner - 단내림 유무
 * @property {Object} acUnit - 단내림 정보
 * @property {string} acUnit.position - 단내림 위치 ('left', 'right')
 * @property {number} acUnit.width - 단내림 너비 (mm)
 * @property {number} acUnit.depth - 단내림 깊이 (mm)
 * @property {boolean} hasFloorFinish - 바닥 마감재 유무
 * @property {string} placementType - 배치 타입 ('floor', 'raised')
 */

/**
 * @typedef {Object} ThreeVector3
 * @property {number} x - X 좌표
 * @property {number} y - Y 좌표
 * @property {number} z - Z 좌표
 */

/**
 * @typedef {Object} ElementProps
 * @property {ThreeVector3} position - 요소의 위치
 * @property {[number, number, number]} size - 요소의 크기 [x, y, z]
 */

/**
 * mm 단위를 m 단위로 변환
 * @param {number} mm - 밀리미터 값
 * @returns {number} - 미터 값
 */
export function mmToM(mm) {
  return mm / 1000;
}

/**
 * 단내림 내벽 위치 계산
 * @param {Dimensions} dimensions - 공간 치수 정보
 * @param {Options} options - 계산 옵션
 * @returns {number} - 내벽의 X 좌표 위치
 */
export function calculateAcSoffitInnerWall(dimensions, options) {
  const { widthM } = dimensions;
  const { hasAirConditioner, acUnit } = options;
  
  if (!hasAirConditioner || !acUnit) return 0;

  // 10mm 오프셋 (세로 프레임과 겹치지 않도록)
  const offset = 0.01;
  
  if (acUnit.position === 'left') {
    return -widthM/2 + mmToM(acUnit.width) + offset; // 좌측 단내림: 내벽이 우측으로 10mm 이동
  } else {
    return widthM/2 - mmToM(acUnit.width) - offset; // 우측 단내림: 내벽이 좌측으로 10mm 이동
  }
}

/**
 * 분절 시 사용되는 마감 패널 중심 위치 계산
 * @param {Dimensions} dimensions - 공간 치수 정보
 * @param {Options} options - 계산 옵션
 * @returns {number} - 마감 패널의 X 좌표 위치
 */
export function calculateEndPanelCenter(dimensions, options) {
  const { endPanelThickness } = dimensions;
  const { hasAirConditioner, acUnit } = options;
  
  if (!hasAirConditioner || !acUnit) return 0;
  
  // 내벽 위치 계산 (오프셋 포함)
  const innerWallX = calculateAcSoffitInnerWall(dimensions, options);
  
  if (acUnit.position === 'left') {
    // 좌측 단내림: 내벽 위치에 엔드패널 두께의 절반을 더함
    return innerWallX + endPanelThickness/2;
  } else {
    // 우측 단내림: 내벽 위치에서 엔드패널 두께의 절반을 뺌
    return innerWallX - endPanelThickness/2;
  }
}

/**
 * 단내림 상부 프레임 계산
 * @param {Dimensions} dimensions - 공간 치수 정보
 * @param {Options} options - 계산 옵션
 * @returns {ElementProps} - 단내림 상부 프레임 위치 및 크기
 */
export function calculateAcTopFrame(dimensions, options) {
  const { widthM, topFrameHeight, leftFrameWidth, rightFrameWidth, frameThickness, baseDepthM } = dimensions;
  const { hasAirConditioner, acUnit, spaceType, wallPosition } = options;
  
  if (!hasAirConditioner || !acUnit) {
    return { position: [0, 0, 0], size: [0, 0, 0] };
  }
  
  // 단내림 쪽 상부 프레임의 위치 계산
  const acSideFrameY = widthM / 2 - mmToM(acUnit.depth) - topFrameHeight / 2; // 단내림 하단에 맞춤
  let acSideFrameX = 0;
  let acSideFrameWidth = mmToM(acUnit.width);
  
  // 단내림 위치에 따른 X 위치 및 너비 조정
  if (acUnit.position === 'left') {
    // 좌측 단내림: 10mm 오프셋 적용
    acSideFrameX = -widthM/2 + mmToM(acUnit.width)/2 - 0.01; // 좌측 단내림 중앙에서 좌측으로 10mm 이동
    // 너비 계산: 단내림 너비 - 좌측 프레임 너비
    acSideFrameWidth = mmToM(acUnit.width) - leftFrameWidth;
  } else {
    // 우측 단내림: 10mm 오프셋 적용
    acSideFrameX = widthM/2 - mmToM(acUnit.width)/2 - 0.01; // 우측 단내림 중앙에서 좌측으로 10mm 이동
    // 너비 계산: 단내림 너비 - 우측 프레임 너비
    acSideFrameWidth = mmToM(acUnit.width) - rightFrameWidth;
  }
  
  // Z 위치: 받침대 앞면과 일치하도록 설정
  const positionZ = -widthM / 2 + baseDepthM - frameThickness/2;
  
  return {
    position: [acSideFrameX, acSideFrameY, positionZ],
    size: [acSideFrameWidth, topFrameHeight, frameThickness]
  };
}

/**
 * 단내림이 없는 쪽 상부 프레임 계산
 * @param {Dimensions} dimensions - 공간 치수 정보
 * @param {Options} options - 계산 옵션
 * @returns {ElementProps} - 상부 프레임 위치 및 크기
 */
export function calculateMainTopFrame(dimensions, options) {
  const { widthM, heightM, topFrameHeight, leftFrameWidth, rightFrameWidth, endPanelThickness, frameThickness, baseDepthM } = dimensions;
  const { hasAirConditioner, acUnit, spaceType, wallPosition } = options;
  
  // 상부 프레임 - 분할된 하나의 세그먼트 (단내림 기둥 우측 또는 좌측)
  let topSegmentWidth = 0;
  let topSegmentCenterX = 0;
  
  if (hasAirConditioner && acUnit) {
    // 단내림이 있는 경우
    const acWidthM = mmToM(acUnit.width);
    
    if (acUnit.position === 'left') {
      if (spaceType === 'built-in') {
        topSegmentWidth = widthM - acWidthM - endPanelThickness - rightFrameWidth;
        topSegmentCenterX = -widthM/2 + acWidthM + topSegmentWidth/2;
      } else if (spaceType === 'semi-standing' && wallPosition === 'left') {
        topSegmentWidth = widthM - acWidthM - endPanelThickness;
        topSegmentCenterX = -widthM/2 + acWidthM + topSegmentWidth/2;
      } else if (spaceType === 'semi-standing' && wallPosition === 'right') {
        topSegmentWidth = widthM - acWidthM - rightFrameWidth;
        topSegmentCenterX = -widthM/2 + acWidthM + topSegmentWidth/2;
      } else if (spaceType === 'free-standing') {
        topSegmentWidth = widthM - acWidthM - endPanelThickness * 2;
        topSegmentCenterX = -widthM/2 + acWidthM + topSegmentWidth/2;
      }
    } else { // 우측 단내림
      if (spaceType === 'built-in') {
        topSegmentWidth = widthM - acWidthM - endPanelThickness - leftFrameWidth;
        topSegmentCenterX = -widthM/2 + leftFrameWidth + topSegmentWidth/2;
      } else if (spaceType === 'semi-standing' && wallPosition === 'left') {
        topSegmentWidth = widthM - acWidthM - leftFrameWidth;
        topSegmentCenterX = -widthM/2 + leftFrameWidth + topSegmentWidth/2;
      } else if (spaceType === 'semi-standing' && wallPosition === 'right') {
        topSegmentWidth = widthM - acWidthM - endPanelThickness;
        topSegmentCenterX = -widthM/2 + endPanelThickness + topSegmentWidth/2;
      } else if (spaceType === 'free-standing') {
        topSegmentWidth = widthM - acWidthM - endPanelThickness * 2;
        topSegmentCenterX = -widthM/2 + endPanelThickness + topSegmentWidth/2;
      }
    }
  } else {
    // 단내림이 없는 경우
    if (spaceType === 'built-in') {
      topSegmentWidth = widthM - leftFrameWidth - rightFrameWidth;
      topSegmentCenterX = 0; // 중앙 정렬
    } else if (spaceType === 'semi-standing') {
      if (wallPosition === 'left') {
        topSegmentWidth = widthM - leftFrameWidth - endPanelThickness;
        topSegmentCenterX = (-widthM/2 + leftFrameWidth + widthM/2 - endPanelThickness) / 2;
      } else {
        topSegmentWidth = widthM - rightFrameWidth - endPanelThickness;
        topSegmentCenterX = (-widthM/2 + endPanelThickness + widthM/2 - rightFrameWidth) / 2;
      }
    } else if (spaceType === 'free-standing') {
      topSegmentWidth = widthM - endPanelThickness * 2;
      topSegmentCenterX = 0; // 중앙 정렬
    }
  }
  
  // Z 위치: 받침대 앞면과 일치하도록 설정
  const positionZ = -widthM / 2 + baseDepthM - frameThickness/2;
  
  return {
    position: [topSegmentCenterX, heightM / 2 - topFrameHeight / 2, positionZ],
    size: [topSegmentWidth, topFrameHeight, frameThickness]
  };
}

/**
 * 단내림 하부 받침대 계산 (단내림 쪽)
 * @param {Dimensions} dimensions - 공간 치수 정보
 * @param {Options} options - 계산 옵션
 * @returns {ElementProps} - 받침대 위치 및 크기
 */
export function calculateAcBase(dimensions, options) {
  const { widthM, heightM, baseHeightM, baseDepthM, leftFrameWidth, rightFrameWidth } = dimensions;
  const { hasAirConditioner, acUnit, hasFloorFinish, floorThicknessM, placementType, raiseHeightM } = options;
  
  if (!hasAirConditioner || !acUnit) {
    return { position: [0, 0, 0], size: [0, 0, 0] };
  }
  
  // 상부 프레임 계산 결과 가져오기 (위치와 너비 일치를 위해)
  const acTopFrame = calculateAcTopFrame(dimensions, options);
  
  // Y 위치 계산: 바닥에서 올라옴
  const baseY = -heightM/2 + (baseHeightM/2) + (hasFloorFinish ? floorThicknessM : 0) + (placementType === 'raised' ? raiseHeightM : 0);
  
  // 위치: 상부 프레임의 X 위치와 동일, 너비도 동일
  return {
    position: [acTopFrame.position[0], baseY, -widthM/2 + baseDepthM/2],
    size: [acTopFrame.size[0], baseHeightM, baseDepthM]
  };
}

/**
 * 일반 영역 하부 받침대 계산 (단내림이 없는 영역)
 * @param {Dimensions} dimensions - 공간 치수 정보
 * @param {Options} options - 계산 옵션
 * @returns {ElementProps} - 받침대 위치 및 크기
 */
export function calculateMainBase(dimensions, options) {
  const { widthM, heightM, baseHeightM, baseDepthM } = dimensions;
  const { hasFloorFinish, floorThicknessM, placementType, raiseHeightM } = options;
  
  // 상부 프레임 계산 결과 가져오기 (위치와 너비 일치를 위해)
  const mainTopFrame = calculateMainTopFrame(dimensions, options);
  
  // Y 위치 계산: 바닥에서 올라옴
  const baseY = -heightM/2 + (baseHeightM/2) + (hasFloorFinish ? floorThicknessM : 0) + (placementType === 'raised' ? raiseHeightM : 0);
  
  // 위치: 상부 프레임의 X 위치와 정확히 동일, 너비도 동일
  return {
    position: [mainTopFrame.position[0], baseY, -widthM/2 + baseDepthM/2],
    size: [mainTopFrame.size[0], baseHeightM, baseDepthM]
  };
}

/**
 * 좌측 세로 프레임 계산
 * @param {Dimensions} dimensions - 공간 치수 정보
 * @param {Options} options - 계산 옵션
 * @returns {ElementProps} - 프레임 위치 및 크기
 */
export function calculateLeftFrame(dimensions, options) {
  const { widthM, heightM, leftFrameWidth, endPanelThickness, frameThickness, baseDepthM } = dimensions;
  const { spaceType, wallPosition, hasAirConditioner, acUnit, hasFloorFinish, floorThicknessM, placementType, raiseHeightM } = options;
  
  // 세로 프레임 높이 및 Y 위치 계산
  const isLeftAC = hasAirConditioner && acUnit && acUnit.position === 'left';
  const frameHeight = isLeftAC
    ? heightM - mmToM(acUnit.depth) - (hasFloorFinish ? floorThicknessM : 0) - (placementType === 'raised' ? raiseHeightM : 0)
    : heightM - (hasFloorFinish ? floorThicknessM : 0) - (placementType === 'raised' ? raiseHeightM : 0);
  
  const frameY = -heightM/2 + frameHeight/2 + (hasFloorFinish ? floorThicknessM : 0) + (placementType === 'raised' ? raiseHeightM : 0);
  
  // X 위치 및 너비 계산
  let frameX;
  let width;
  
  if (spaceType === 'free-standing' || (spaceType === 'semi-standing' && wallPosition === 'right')) {
    // 프리스탠딩이나 우측벽 세미스탠딩인 경우 좌측에 엔드패널
    frameX = -widthM/2 + endPanelThickness/2;
    width = endPanelThickness;
  } else {
    // 빌트인이나 좌측벽 세미스탠딩인 경우 좌측에 프레임
    frameX = -widthM/2 + leftFrameWidth/2;
    width = leftFrameWidth;
  }
  
  // Z 위치: 받침대 앞면과 일치하도록 설정
  const positionZ = -widthM/2 + baseDepthM - frameThickness/2;
  
  return {
    position: [frameX, frameY, positionZ],
    size: [width, frameHeight, frameThickness]
  };
}

/**
 * 우측 세로 프레임 계산
 * @param {Dimensions} dimensions - 공간 치수 정보
 * @param {Options} options - 계산 옵션
 * @returns {ElementProps} - 프레임 위치 및 크기
 */
export function calculateRightFrame(dimensions, options) {
  const { widthM, heightM, rightFrameWidth, endPanelThickness, frameThickness, baseDepthM } = dimensions;
  const { spaceType, wallPosition, hasAirConditioner, acUnit, hasFloorFinish, floorThicknessM, placementType, raiseHeightM } = options;
  
  // 세로 프레임 높이 및 Y 위치 계산
  const isRightAC = hasAirConditioner && acUnit && acUnit.position === 'right';
  const frameHeight = isRightAC
    ? heightM - mmToM(acUnit.depth) - (hasFloorFinish ? floorThicknessM : 0) - (placementType === 'raised' ? raiseHeightM : 0)
    : heightM - (hasFloorFinish ? floorThicknessM : 0) - (placementType === 'raised' ? raiseHeightM : 0);
  
  const frameY = -heightM/2 + frameHeight/2 + (hasFloorFinish ? floorThicknessM : 0) + (placementType === 'raised' ? raiseHeightM : 0);
  
  // X 위치 및 너비 계산
  let frameX;
  let width;
  
  if (spaceType === 'free-standing' || (spaceType === 'semi-standing' && wallPosition === 'left')) {
    // 프리스탠딩이나 좌측벽 세미스탠딩인 경우 우측에 엔드패널
    frameX = widthM/2 - endPanelThickness/2;
    width = endPanelThickness;
  } else {
    // 빌트인이나 우측벽 세미스탠딩인 경우 우측에 프레임
    frameX = widthM/2 - rightFrameWidth/2;
    width = rightFrameWidth;
  }
  
  // Z 위치: 받침대 앞면과 일치하도록 설정
  const positionZ = -widthM/2 + baseDepthM - frameThickness/2;
  
  return {
    position: [frameX, frameY, positionZ],
    size: [width, frameHeight, frameThickness]
  };
}

/**
 * 받침대 너비 계산 (mm 단위)
 * @param {Dimensions} dimensions - 공간 치수 정보
 * @param {Options} options - 계산 옵션
 * @returns {number} - 받침대 너비 (mm)
 */
export function calculateBaseWidth(dimensions, options) {
  const { widthM, leftFrameWidth, rightFrameWidth, endPanelThickness } = dimensions;
  const { spaceType, wallPosition } = options;
  
  if (spaceType === 'free-standing') {
    return Math.round((widthM - endPanelThickness * 2) * 1000);
  } else if (spaceType === 'semi-standing') {
    // 세미스탠딩: 벽쪽 프레임과 반대쪽 엔드판넬 고려
    if (wallPosition === 'left') {
      return Math.round((widthM - leftFrameWidth - endPanelThickness) * 1000);
    } else { // wallPosition === 'right'
      return Math.round((widthM - rightFrameWidth - endPanelThickness) * 1000);
    }
  } else {
    // 빌트인: 양쪽 프레임을 뺀 값
    return Math.round((widthM - leftFrameWidth - rightFrameWidth) * 1000);
  }
} 
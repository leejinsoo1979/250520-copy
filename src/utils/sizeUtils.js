/**
 * 크기 및 단위 변환 관련 유틸리티 함수
 */

/**
 * 밀리미터(mm)를 픽셀(px)로 변환
 * @param {number} mm - 밀리미터 값
 * @param {number} scale - 변환 스케일 (기본값: 0.15)
 * @returns {number} 변환된 픽셀 값
 */
const mmToPx = (mm, scale = 0.15) => {
  return mm * scale;
};

/**
 * 픽셀(px)을 밀리미터(mm)로 변환
 * @param {number} px - 픽셀 값
 * @param {number} scale - 변환 스케일 (기본값: 0.15)
 * @returns {number} 변환된 밀리미터 값
 */
const pxToMm = (px, scale = 0.15) => {
  return px / scale;
};

/**
 * 치수에 표시할 텍스트 포맷팅
 * @param {number} size - 크기 값 (mm)
 * @param {boolean} withUnit - 단위 표시 여부 (기본값: true)
 * @returns {string} 포맷팅된 텍스트
 */
const formatDimension = (size, withUnit = true) => {
  const formattedSize = Math.round(size);
  return withUnit ? `${formattedSize}mm` : `${formattedSize}`;
};

/**
 * 주어진 값을 지정된 그리드 크기에 맞게 반올림
 * @param {number} value - 원래 값
 * @param {number} gridSize - 그리드 크기 (기본값: 50mm)
 * @returns {number} 그리드에 맞게 조정된 값
 */
const snapToGrid = (value, gridSize = 50) => {
  return Math.round(value / gridSize) * gridSize;
};

/**
 * 비율을 유지하면서 치수 조정
 * @param {Object} dimensions - 원래 치수 (width, height, depth)
 * @param {number} containerWidth - 컨테이너 너비
 * @param {number} containerHeight - 컨테이너 높이
 * @param {number} padding - 여백 (기본값: 20)
 * @returns {Object} 조정된 치수
 */
const getScaledDimensions = (dimensions, containerWidth, containerHeight, padding = 20) => {
  const availableWidth = containerWidth - (padding * 2);
  const availableHeight = containerHeight - (padding * 2);
  
  const widthRatio = availableWidth / dimensions.width;
  const heightRatio = availableHeight / dimensions.height;
  
  // 더 작은 비율 사용 (컨테이너에 맞추기 위함)
  const scale = Math.min(widthRatio, heightRatio);
  
  return {
    width: dimensions.width * scale,
    height: dimensions.height * scale,
    depth: dimensions.depth * scale
  };
};

/**
 * 크기가 유효한지 확인
 * @param {number} size - 확인할 크기 값
 * @param {number} min - 최소 허용 크기
 * @param {number} max - 최대 허용 크기
 * @returns {boolean} 크기가 유효한지 여부
 */
const isValidSize = (size, min, max) => {
  return size >= min && size <= max;
};

export default {
  mmToPx,
  pxToMm,
  formatDimension,
  snapToGrid,
  getScaledDimensions,
  isValidSize
}; 
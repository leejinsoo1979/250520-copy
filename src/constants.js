/**
 * 애플리케이션 전체에서 사용되는 상수값 정의
 */

const CONSTANTS = {
  // 가구 모듈 관련 상수
  MODULE_THICKNESS: 18,  // 기본 판재 두께 (mm)
  MIN_MODULE_WIDTH: 200, // 최소 모듈 폭 (mm)
  MAX_MODULE_WIDTH: 1200, // 최대 모듈 폭 (mm)
  MIN_MODULE_HEIGHT: 200, // 최소 모듈 높이 (mm)
  MAX_MODULE_HEIGHT: 2400, // 최대 모듈 높이 (mm)
  MIN_MODULE_DEPTH: 200, // 최소 모듈 깊이 (mm)
  MAX_MODULE_DEPTH: 800, // 최대 모듈 깊이 (mm)

  // 그리드/슬롯 관련 상수
  GRID_SIZE: 50, // 그리드 크기 (px)
  SLOT_PADDING: 10, // 슬롯 내부 여백 (px)
  
  // 시각적 표현 관련 상수
  HIGHLIGHT_COLOR: '#4a90e2', // 선택 요소 강조 색상
  WARNING_COLOR: '#e53935', // 경고 색상
  SUCCESS_COLOR: '#43a047', // 성공 색상
  
  // 스케일 관련 상수
  scale: 0.15, // mm를 px로 변환하는 스케일 (1mm = 0.15px)
  
  // 가용 사이즈 목록 (모듈 생성시 선택 가능한 옵션들)
  AVAILABLE_SIZES: {
    WIDTH: [300, 400, 450, 500, 550, 600, 800, 900, 1000, 1200],
    HEIGHT: [300, 400, 500, 600, 720, 800, 900, 1000, 1200, 1600, 1800, 2000, 2200],
    DEPTH: [300, 400, 450, 500, 550, 600]
  },
  
  // 크기 관련 상수
  PANEL_THICKNESS: 18, // 패널 두께 (mm)
  DEFAULT_CABINET_HEIGHT: 720, // 기본 캐비닛 높이 (mm)
  DEFAULT_CABINET_WIDTH: 600, // 기본 캐비닛 너비 (mm)
  DEFAULT_CABINET_DEPTH: 550, // 기본 캐비닛 깊이 (mm)
  
  // 색상 관련 상수
  DEFAULT_FRAME_COLOR: "#F8F8F8", // 기본 프레임 색상
  DEFAULT_MODULE_COLOR: "#FFFFFF", // 기본 모듈 색상
  
  // 여백 관련 상수
  DEFAULT_GAP: 2, // 기본 요소 간 여백 (mm)
  
  // 3D 렌더링 관련 상수
  DEFAULT_CAMERA_POSITION: { x: 0, y: 1.5, z: 3 }, // 기본 카메라 위치
  DEFAULT_LIGHT_INTENSITY: 0.8, // 기본 조명 강도
  
  // 기타 상수
  MIN_SLOT_WIDTH: 300, // 최소 슬롯 너비 (mm)
  MAX_SLOT_WIDTH: 600 // 최대 슬롯 너비 (mm)
};

export default CONSTANTS; 
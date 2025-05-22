import React, { Suspense, useEffect, useRef, useState, forwardRef, useMemo, useCallback, useImperativeHandle } from 'react';
import PropTypes from 'prop-types';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, OrthographicCamera, OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { ErrorBoundary } from 'react-error-boundary';
import styles from './styles.module.css';
import ModuleSlots from '../../furniture-modules/ModuleSlots';
import { useSpring, a } from '@react-spring/three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { useEditor } from '@context/EditorContext';

// --- Mesh Overlap Prevention Utilities ---
const existingBoxes = []; // 모든 생성된 메쉬의 경계박스 저장용

function isOverlapping(newMesh) {
  const newBox = new THREE.Box3().setFromObject(newMesh);
  return existingBoxes.some(existingBox => newBox.intersectsBox(existingBox));
}

function createSafeMesh(scene, geometryArgs, material, position) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(...geometryArgs),
    material
  );
  mesh.position.set(...position);

  if (!isOverlapping(mesh)) {
    scene.add(mesh);
    const newBox = new THREE.Box3().setFromObject(mesh);
    existingBoxes.push(newBox);
  } else {
    console.warn('⚠️ 충돌 발생: 생성 스킵됨', position);
  }
  return mesh;
}
// Helper function to check if WebGL is supported
function checkWebGLSupport() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && 
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
}

function logInfo(message) {
  console.log(`[RoomViewer3D] ${message}`);
}

// Gradient vertex shader (for wall gradients)
const gradientVertexShader = `
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Wall gradient fragment shader - 안쪽에서 바깥쪽으로 그라데이션
const wallFragmentShader = `
  uniform vec3 baseColor;
  uniform float opacity;
  uniform float direction;
  varying vec2 vUv;
  
  void main() {
    float gradientFactor;
    
    // 좌우 그라데이션 (direction > 0.5 && direction < 1.5)
    if (direction > 0.5 && direction < 1.5) {
      // 좌측에서 우측으로 그라데이션 (왼쪽이 어둡고 오른쪽이 밝음)
      gradientFactor = vUv.x;
    } else if (direction > 1.5) {
      // 위아래 그라데이션 (위가 어둡고 아래가 밝음)
      gradientFactor = vUv.y;
    } else {
      // 우측에서 좌측으로 그라데이션 (오른쪽이 어둡고 왼쪽이 밝음)
      gradientFactor = 1.0 - vUv.x;
    }
    
    // 그라데이션 부드럽게 조정 - 빌트인과 동일한 효과
    gradientFactor = pow(gradientFactor, 1.5);
    
    // 어두운 내부, 밝은 외부
    vec3 innerColor = vec3(0.784, 0.784, 0.784);  // 중간 회색 #c8c8c8
    vec3 outerColor = vec3(1.0, 1.0, 1.0);     // 흰색 #ffffff
    vec3 finalColor = mix(innerColor, outerColor, gradientFactor);
    
    gl_FragColor = vec4(finalColor, opacity);
  }
`;

// Floor/ceiling gradient fragment shader - 안쪽이 어둡고 바깥쪽이 밝은 그라데이션
const floorCeilingFragmentShader = `
  uniform vec3 baseColor;
  uniform float opacity;
  uniform bool isFloor;
  varying vec2 vUv;
  
  void main() {
    // 그라데이션 방향 결정
    float gradientFactor;
    
    // 바닥과 천장의 그라데이션 방향을 다르게 적용
    if (isFloor) {
      // 바닥: 앞(1.0)이 밝고 뒤(0.0)가 어두움 - 완전히 반대 방향으로 변경
      gradientFactor = 1.0 - vUv.y;
    } else {
      // 천장: 앞(1.0)이 밝고 뒤(0.0)가 어두움 - 기존 방향 유지
      gradientFactor = vUv.y;
    }
    
    // 그라데이션 부드럽게 조정 - 벽과 동일한 효과
    gradientFactor = pow(gradientFactor, 1.5);
    
    // 좌우 벽면과 동일한 색상 사용 (실제 벽 컬러값 사용)
    vec3 innerColor = vec3(0.784, 0.784, 0.784);  // 중간 회색 #c8c8c8 (좌측 벽과 동일)
    vec3 outerColor = vec3(1.0, 1.0, 1.0);     // 흰색 #ffffff (우측 벽과 동일)
    vec3 finalColor = mix(innerColor, outerColor, gradientFactor);
    
    gl_FragColor = vec4(finalColor, opacity);
  }
`;

// Room component renders the 3D room with walls, floor, and ceiling
const Room = forwardRef(({ 
  spaceInfo, 
  viewMode = 'normal', 
  placementInfo, 
  wallOpacity = 0.8, 
  outlineMode = false, 
  showFrame = true, 
  frameData = { color: "#555555", thickness: 20 },
  frameColor = "#555555",
  showModuleSlots = false,
  doorCount = 8,
  slotStatuses = [],
  onSlotHover,
  onSlotClick,
  showDimensionLines = false,
  showDimensions = true,   // 치수 표시 여부 (길이 수치)
  showGuides = true,        // 가이드 표시 여부 (점선 및 슬롯)
  frameProperties = null    // 새로 추가: 상위 컴포넌트에서 전달받은 프레임 속성
}, ref) => {
  // EditorContext에서 frameProperties 가져오기
  const editorContext = useEditor();
  const contextFrameProperties = editorContext ? editorContext.frameProperties : null;
  const calculateBaseWidth = editorContext ? editorContext.calculateBaseWidth : null;
  const editorInstallationType = editorContext ? editorContext.installationType : null;
  const editorWallPosition = editorContext ? editorContext.wallPosition : null;
  
  // 디버깅: EditorContext 콘솔에 출력
  console.log('[Room] EditorContext 확인:', { 
    존재여부: !!editorContext,
    frameProperties: contextFrameProperties,
    calculateBaseWidth: !!calculateBaseWidth,
    installationType: editorInstallationType,
    wallPosition: editorWallPosition
  });
  
  // calculateBaseWidth 함수가 있으면 테스트로 호출해보기
  let calculatedBaseWidthValue = null;
  if (calculateBaseWidth) {
    calculatedBaseWidthValue = calculateBaseWidth();
    console.log('[Room] calculateBaseWidth 테스트 호출 결과:', calculatedBaseWidthValue, 'mm');
  }
  
  // props로 전달된 frameProperties가 있으면 우선 사용하고, 없으면 컨텍스트에서 가져옴
  const finalFrameProperties = frameProperties || contextFrameProperties;
  
  // Room 컴포넌트에서 showGuides 디버깅 로그 추가
  console.log('[Room] Props received:', { showDimensionLines, showDimensions, showGuides, showModuleSlots });
  
  console.log('[Room] Props received:', { spaceInfo, viewMode, placementInfo, showFrame, wallOpacity, showDimensionLines, showDimensions, showGuides });
  console.log('[Room] EditorContext:', { frameProperties: finalFrameProperties, calculateBaseWidth });

  // --- Frame width state (for dynamic adjustment) ---
  // EditorContext에서 값을 가져오거나 기본값 사용
  const [leftFrameWidth, setLeftFrameWidth] = useState(
    finalFrameProperties ? finalFrameProperties.leftFrameWidth / 1000 : 0.05
  ); // 50mm
  const [rightFrameWidth, setRightFrameWidth] = useState(
    finalFrameProperties ? finalFrameProperties.rightFrameWidth / 1000 : 0.05
  ); // 50mm
  
  // 상부 프레임 높이 (topFrameHeight) - 최소 10mm, 최대 500mm (이전 이름: topFrameWidth)
  const [topFrameHeight, setTopFrameHeight] = useState(
    finalFrameProperties ? Math.min(Math.max(finalFrameProperties.topFrameHeight / 1000, 0.01), 0.5) : 0.05
  ); // 기본 50mm, 범위 10mm~500mm
  
  const [frameThickness, setFrameThickness] = useState(
    finalFrameProperties ? finalFrameProperties.frameThickness / 1000 : 0.02
  ); // 20mm
  const [baseDepth, setBaseDepth] = useState(
    finalFrameProperties ? finalFrameProperties.baseDepth / 1000 : 0.58
  ); // 580mm
  const [endPanelThickness, setEndPanelThickness] = useState(
    finalFrameProperties ? finalFrameProperties.endPanelThickness / 1000 : 0.02
  ); // 20mm
  
  // 상부 프레임 높이 상태값을 확인하는 로그 추가
  console.log('[Room] 상부 프레임 높이 (topFrameHeight):', topFrameHeight * 1000, 'mm (범위: 10mm~500mm)');
  
  // 외부에서 컴포넌트 메서드 접근 허용
  useImperativeHandle(ref, () => ({
    updateFrameDimensions: (newFrameProperties) => {
      console.log('[Room] Manual update frame dimensions:', newFrameProperties);
      if (newFrameProperties) {
        setLeftFrameWidth(newFrameProperties.leftFrameWidth / 1000);
        setRightFrameWidth(newFrameProperties.rightFrameWidth / 1000);
        // 상부 프레임 높이는 10mm~500mm 범위로 제한
        const newTopFrameHeight = Math.min(Math.max(newFrameProperties.topFrameHeight / 1000, 0.01), 0.5);
        setTopFrameHeight(newTopFrameHeight);
        console.log('[Room] 상부 프레임 높이 업데이트:', newTopFrameHeight * 1000, 'mm');
        setFrameThickness(newFrameProperties.frameThickness / 1000);
        setBaseDepth(newFrameProperties.baseDepth / 1000);
        setEndPanelThickness(newFrameProperties.endPanelThickness / 1000);
      }
    }
  }));
  
  // frameProperties가 변경될 때마다 상태 업데이트 - 즉시 값 반영을 위해 업데이트
  useEffect(() => {
    if (finalFrameProperties) {
      console.log('[Room] Updating frame dimensions from props change:', finalFrameProperties);
      console.log('[Room] Previous values:', { 
        leftFrameWidth: leftFrameWidth * 1000,
        rightFrameWidth: rightFrameWidth * 1000,
        topFrameHeight: topFrameHeight * 1000,
        frameThickness: frameThickness * 1000,
        baseDepth: baseDepth * 1000,
        endPanelThickness: endPanelThickness * 1000
      });
      
      // 항상 모든 값을 동기화(값이 같더라도 강제로 업데이트)
      setLeftFrameWidth(finalFrameProperties.leftFrameWidth / 1000);
      setRightFrameWidth(finalFrameProperties.rightFrameWidth / 1000);
      
      // 상부 프레임 높이는 10mm~500mm 범위로 제한
      const newTopFrameHeight = Math.min(Math.max(finalFrameProperties.topFrameHeight / 1000, 0.01), 0.5);
      setTopFrameHeight(newTopFrameHeight);
      console.log('[Room] 상부 프레임 높이 업데이트:', newTopFrameHeight * 1000, 'mm');
      
      setFrameThickness(finalFrameProperties.frameThickness / 1000);
      setBaseDepth(finalFrameProperties.baseDepth / 1000);
      setEndPanelThickness(finalFrameProperties.endPanelThickness / 1000);
    }
  }, [finalFrameProperties]); // 의존성 배열에는 finalFrameProperties만 포함
  
  // meshRefs 초기화
  const meshRefs = useRef({});
  
  // outlineMode 강제로 false로 설정
  const _outlineMode = false;  // 항상 false로 설정하여 2D 모드와 충돌 방지
  
  // 안전하게 값 추출하기 위한 기본값 설정
  const {
    width = 4200,
    depth = 2400,
    height = 2400,
    spaceType: originalSpaceType = 'built-in',
    wallPosition: originalWallPosition = 'left',
    hasAirConditioner: spaceInfoHasAC = false,
    acUnit: spaceInfoAcUnit = { position: 'left', width: 850, depth: 200, height: 200 },
    hasFloorFinish: rawHasFloorFinish = false,
    floorFinishType = 'wood',
    floorThickness = 0
  } = spaceInfo || {};

  // Convert string values ('yes'/'no') to boolean
  const hasFloorFinish = rawHasFloorFinish === true || rawHasFloorFinish === 'yes';
  
  // placementInfo에서 에어컨 단내림 정보도 확인
  const placementInfoHasAC = placementInfo?.hasAirConditioner || false;
  const placementInfoAcUnit = placementInfo?.acUnit || null;
  
  // 최종 단내림 정보 결정 (placementInfo 우선, 없으면 spaceInfo)
  // 문자열('yes')과 불리언(true) 모두 처리되도록 수정
  const hasAirConditioner = 
    placementInfoHasAC === true || placementInfoHasAC === 'yes' || 
    spaceInfoHasAC === true || spaceInfoHasAC === 'yes';
  
  const acUnit = placementInfoAcUnit || spaceInfoAcUnit;
  
  // acUnit의 present 속성 설정 확인
  if (acUnit) {
    // present 속성이 명시적으로 있는 경우 그대로 사용, 없거나 undefined인 경우 hasAirConditioner로 설정
    acUnit.present = acUnit.present !== undefined ? acUnit.present : hasAirConditioner;
  }
  
  // 단내림 깊이(depth)는 항상 공간 깊이와 일치 - 3D 공간 구조물 표시용
  // 단내림 높이(height)는 사용자 설정 값 그대로 유지 - 2D 에디터 표시용
  if (acUnit) {
    // 실제 공간 깊이 가져오기 (mm 단위)
    const actualSpaceDepth = spaceInfo?.dimensions?.depth || placementInfo?.dimensions?.depth || 600;
    
    // 깊이는 항상 공간 깊이로 설정 (z축)
    acUnit.depth = actualSpaceDepth;
    
    // 높이 값이 없으면 기본값 설정 (y축)
    if (!acUnit.height) {
      acUnit.height = 200;
    }
    
    // 강제 업데이트 플래그가 있으면 콘솔에 로그
    if (acUnit._forceUpdate || acUnit.timestamp || acUnit.uniqueId) {
      console.log('[Room] 단내림 강제 업데이트 감지:', { 
        forceUpdate: acUnit._forceUpdate, 
        timestamp: acUnit.timestamp,
        height: acUnit.height
      });
    }
    
    console.log('[Room] 단내림 깊이와 높이 설정:', { 
      depth: acUnit.depth, 
      height: acUnit.height,
      spaceDepth: actualSpaceDepth
    });
  }
  
  console.log('[Room] 단내림 정보:', { 
    hasAirConditioner, 
    acUnit, 
    fromPlacement: !!placementInfoAcUnit,
    rawValue: {
      placementAC: placementInfoHasAC,
      spaceInfoAC: spaceInfoHasAC
    }
  });
  
  // spaceType 및 wallPosition 로직 개선 - 항상 벽이 보이도록 수정
  const spaceType = placementInfo?.type || spaceInfo?.spaceType || 'built-in';
  // 스탠딩이 아닌 경우에는 항상 벽 위치 값 사용
  const wallPosition = spaceType === 'standing' ? null : (placementInfo?.wallPosition || spaceInfo?.wallPosition || 'left');
  
  console.log('[Room] Space type:', spaceType, 'Wall position:', wallPosition, 'Show frame:', showFrame);
  
  // placementInfo의 값들을 우선적으로 사용
  const spaceTypeFromPlacement = placementInfo?.type || originalSpaceType;
  const wallPositionFromPlacement = placementInfo?.wallPosition || originalWallPosition;
  
  console.log('[Room] Using spaceType:', spaceTypeFromPlacement, 'wallPosition:', wallPositionFromPlacement, 
              'from placement info:', !!placementInfo?.type, !!placementInfo?.wallPosition);
  console.log('[Room] Full placement info:', placementInfo);

  // Three.js에서 사용하기 위해 mm에서 m로 변환
  const widthM = width / 1000;
  const depthM = depth / 1000;
  const heightM = height / 1000;
  const floorThicknessM = floorThickness / 1000;
  
  // 받침대 정보 추출
  const baseHeight = placementInfo?.baseHeight || 0;
  const baseHeightM = baseHeight / 1000;
  const placementBaseDepth = placementInfo?.baseDepth || 580;
  const placementBaseDepthM = placementBaseDepth / 1000;
  const hasBase = placementInfo?.baseHeight > 0;
  
  // 배치 타입 정보 추출
  const placementType = placementInfo?.placementType || 'floor';
  const raiseHeight = placementInfo?.raiseHeight || 0;
  const raiseHeightM = raiseHeight / 1000;
  
  // 에어컨 단내림 수직 프레임 폭 (AC 프레임 폭)
  const acFrameWidth = 0.05; // 50mm
  
  // 벽이 트여있는 쪽 프레임 정보 추출 (semi-standing 모드에서만 사용)
  const openFrameWidth = placementInfo?.openFrameWidth ? placementInfo.openFrameWidth / 1000 : endPanelThickness; 
  const endPanelDepth = baseDepth; // End panel depth (같은 값 사용)
  const openFrameDepth = placementInfo?.openFrameDepth ? placementInfo.openFrameDepth / 1000 : baseDepth;
  
  // 실제 사용할 좌우 프레임 너비 계산
  let effectiveLeftFrameWidth = leftFrameWidth;
  let effectiveRightFrameWidth = rightFrameWidth;
  
  // 총 너비에서 좌우 프레임 폭을 뺀 내부 너비 계산
  const innerWidth = widthM - effectiveLeftFrameWidth - effectiveRightFrameWidth;

  // Debug ref for top frame mesh
  const topFrameMeshRef = useRef(null);
  useEffect(() => {
    if (topFrameMeshRef.current) {
      const pos = topFrameMeshRef.current.position;
      console.log('[DEBUG] 실제 렌더 위치:', {
        x: pos.x.toFixed(4),
        y: pos.y.toFixed(4),
        z: pos.z.toFixed(4),
      });
    }
  }, []);
  // --- Frame size calculations based on selected mode ---
  const vertFrameHeightNoAC = heightM - floorThicknessM - (placementType === 'raised' ? raiseHeightM : 0);
  // 단내림이 있을 때 수직 프레임 높이 계산 - 높이(height) 값을 사용
  const vertFrameHeightWithAC = hasAirConditioner && acUnit ? 
    (heightM - (acUnit.height || 200)/1000 - floorThicknessM - (placementType === 'raised' ? raiseHeightM : 0)) : 
    vertFrameHeightNoAC; // 단내림 없으면 기본 높이 사용
    
  // 단내림 높이 사용 로그 추가
  if (hasAirConditioner && acUnit) {
    console.log('[Room] 단내림 있음: 수직 프레임 높이 계산에 height 사용', { 
      '단내림 높이(mm)': acUnit.height || 200,
      '변환된 높이(m)': (acUnit.height || 200)/1000,
      '최종 수직 프레임 높이(m)': vertFrameHeightWithAC
    });
  }

  // 상부 프레임 너비 계산 (topFrameWidth)
  let topFrameWidth;
  if (hasAirConditioner && acUnit) {
    const acWidthM = (acUnit.width || 850) / 1000; // 기본값 850mm 사용
    
    if (spaceType === 'free-standing') {
      // Free-standing + AC: subtract AC width and two end panels
      topFrameWidth = widthM - acWidthM - endPanelThickness * 2;
    } else if (spaceType === 'semi-standing') {
      // Semi-standing + AC: 세미스탠딩 모드에서는 벽쪽 프레임과 반대쪽 엔드판넬 고려
      if (wallPosition === 'left') {
        topFrameWidth = widthM - acWidthM - leftFrameWidth - endPanelThickness;
      } else { // wallPosition === 'right'
        topFrameWidth = widthM - acWidthM - rightFrameWidth - endPanelThickness;
      }
    } else {
      // Built-in or other with AC: subtract AC width and both wall frames
      topFrameWidth = widthM - acWidthM - leftFrameWidth - rightFrameWidth;
    }
  } else if (spaceType === 'free-standing') {
    // Free-standing without AC: subtract two end panels
    topFrameWidth = widthM - endPanelThickness * 2;
  } else if (spaceType === 'semi-standing') {
    // Semi-standing without AC: 벽쪽 프레임과 반대쪽 엔드판넬 고려
    if (wallPosition === 'left') {
      topFrameWidth = widthM - leftFrameWidth - endPanelThickness;
    } else { // wallPosition === 'right'
      topFrameWidth = widthM - rightFrameWidth - endPanelThickness;
    }
  } else {
    // Built-in or other without AC: subtract both wall frames
    topFrameWidth = widthM - leftFrameWidth - rightFrameWidth;
  }

  let baseWidthCalc;
  // placementInfo와 spaceInfo의 관련 값 확인
  console.log('[Room] 받침대 계산 관련 정보:', {
    'placementInfo': {
      type: placementInfo?.type,
      wallPosition: placementInfo?.wallPosition
    },
    'spaceInfo': {
      spaceType: spaceInfo?.spaceType,
      wallPosition: spaceInfo?.wallPosition
    },
    'spaceType': spaceType,
    'wallPosition': wallPosition,
    'editorContext': {
      installationType: editorInstallationType,
      wallPosition: editorWallPosition,
      calculatedBaseWidthValue: calculatedBaseWidthValue
    }
  });
  
  if (calculatedBaseWidthValue !== null) {
    // 이미 계산된 값이 있으면 m 단위로 변환하여 사용
    baseWidthCalc = calculatedBaseWidthValue / 1000;
    console.log('[Room] Base width from calculatedBaseWidthValue:', calculatedBaseWidthValue, 'mm =>', baseWidthCalc, 'm');
  } else if (calculateBaseWidth && editorContext) {
    // EditorContext의 calculateBaseWidth 함수 사용 (mm 단위를 m로 변환)
    const calculatedWidth = calculateBaseWidth();
    baseWidthCalc = calculatedWidth / 1000;
    console.log('[Room] Base width from EditorContext 계산:', calculatedWidth, 'mm =>', baseWidthCalc, 'm');
  } else {
    // 기존 계산 로직을 대체로 사용 (fallback)
    if (spaceType === 'free-standing') {
      baseWidthCalc = widthM - endPanelThickness * 2;
    } else if (spaceType === 'semi-standing') {
      // 세미스탠딩: 벽쪽 프레임과 반대쪽 엔드판넬 고려 (상부 프레임과 동일한 로직)
      if (wallPosition === 'left') {
        baseWidthCalc = widthM - leftFrameWidth - endPanelThickness;
      } else { // wallPosition === 'right'
        baseWidthCalc = widthM - rightFrameWidth - endPanelThickness;
      }
    } else {
      // 빌트인: 양쪽 프레임을 뺀 값
      baseWidthCalc = widthM - leftFrameWidth - rightFrameWidth;
    }
    console.log('[Room] Base width fallback 계산:', Math.round(baseWidthCalc * 1000), 'mm');
  }
  
  // 프레임 위치 계산 - 프레임 위치가 정확히 맞닿도록 계산
  const leftFramePosition = -widthM / 2 + effectiveLeftFrameWidth / 2;
  const rightFramePosition = widthM / 2 - effectiveRightFrameWidth / 2;
  // 상단 프레임 위치: 천장 바로 아래에 맞닿도록 수정 (프레임 중앙이 천장 표면에 위치)
  
  // 세미스탠딩 모드일 때 상부프레임 위치 조정
  let topFrameCenterX = 0;
  if (spaceType === 'semi-standing') {
    if (wallPosition === 'left') {
      // 좌측 벽이 있을 때: 좌측 프레임과 우측 엔드판넬 사이의 중앙으로 위치
      topFrameCenterX = (-widthM / 2 + leftFrameWidth + widthM / 2 - endPanelThickness) / 2;
    } else if (wallPosition === 'right') {
      // 우측 벽이 있을 때: 좌측 엔드판넬과 우측 프레임 사이의 중앙으로 위치
      topFrameCenterX = (-widthM / 2 + endPanelThickness + widthM / 2 - rightFrameWidth) / 2;
    }
  }
  
  // 상부 프레임의 Y 위치 계산: 천장에 붙어 있고 아래로만 늘어나도록
  // 천장 위치 (heightM / 2)에서 상부 프레임 높이의 절반을 내려온 위치에 중심이 오도록 설정
  const topFramePosition = [
    topFrameCenterX, 
    heightM / 2 - topFrameHeight / 2, // 천장에 붙어서 아래로 늘어나도록
    -depthM / 2 + baseDepth // 깊이 방향 일관성을 위해 baseDepth 사용
  ];
  
  // 세미스탠딩 모드일 때 받침대 위치 조정
  let baseCenterX = 0;
  if (spaceType === 'semi-standing') {
    if (wallPosition === 'left') {
      // 좌측 벽이 있을 때: 좌측 프레임과 우측 엔드판넬 사이의 중앙으로 위치
      baseCenterX = (-widthM / 2 + leftFrameWidth + widthM / 2 - endPanelThickness) / 2;
    } else if (wallPosition === 'right') {
      // 우측 벽이 있을 때: 좌측 엔드판넬과 우측 프레임 사이의 중앙으로 위치
      baseCenterX = (-widthM / 2 + endPanelThickness + widthM / 2 - rightFrameWidth) / 2;
    }
  }
  
  // 받침대 위치 - z축 위치를 뒷벽에 딱 붙도록 수정
  const basePosition = [
    baseCenterX, 
    -heightM / 2 + (baseHeightM / 2) + floorThicknessM + (placementType === 'raised' ? raiseHeightM : 0), 
    -depthM / 2 + baseDepth / 2 // 뒷벽에 딱 붙어서 baseDepth만큼만 앞으로 나오도록 수정
  ];
  
  // 프레임 색상 설정 - 동적으로 포커스 프레임 강조
  const getFrameColor = (frameName) => {
    const focused = placementInfo?.focusedFrame;
    if (focused === frameName) {
      return "#00C092"; // 강조 색상
    }
    
    // 프레임 색상 우선순위:
    // 1. frameData?.color가 있으면 사용
    // 2. frameColor prop이 있으면 사용
    // 3. 기본 색상 사용 (모드별 기본값)
    
    // frameData에서 색상 가져오기
    let colorFromData = frameData && frameData.color ? frameData.color : null;
    
    // frameColor prop 확인
    let colorFromProp = frameColor || null;
    
    // 기본 색상 - 모드별 다른 기본값 제공
    const defaultColor = spaceType === 'free-standing' ? "#F8F8F8" : "#555555";
    
    // 최종 사용할 색상 결정 (우선순위에 따라)
    let color = colorFromData || colorFromProp || defaultColor;
    
    console.log(`[getFrameColor] ${frameName} - 색상 결정: frameData=${colorFromData}, frameColor=${colorFromProp}, 기본값=${defaultColor}, 최종=${color}, 모드=${spaceType}`);
    
    // 색상 강화 처리 - 더 선명하게 표시
    try {
      if (color) {
        // 색상 코드가 올바른 형식인지 확인 (#으로 시작하는 HEX 색상)
        if (color.startsWith('#') && (color.length === 7 || color.length === 4)) {
          const r = parseInt(color.substring(1, 3), 16);
          const g = parseInt(color.substring(3, 5), 16);
          const b = parseInt(color.substring(5, 7), 16);
          
          const enhancedR = Math.min(255, Math.round(r * 1.1));
          const enhancedG = Math.min(255, Math.round(g * 1.1));
          const enhancedB = Math.min(255, Math.round(b * 1.1));
          
          color = '#' + 
            enhancedR.toString(16).padStart(2, '0') + 
            enhancedG.toString(16).padStart(2, '0') + 
            enhancedB.toString(16).padStart(2, '0');
        }
      }
    } catch (e) {
      console.warn('색상 변환 오류, 원본 색상 사용:', color);
    }
    
    return color;
  };
  
  // 프레임 투명도 설정
  const getFrameOpacity = (frameName) => {
    // 항상 불투명하게 설정
    return 1.0;
  };
  
  console.log('[Room] Dimensions in meters:', { widthM, depthM, heightM });
  
  // 약간 작게 만들어 테두리 방지
  const adjustSize = 0.0001; // 0.1mm 줄이기

  // 2D 모드일 때 사용할 테두리 선 재질 제거 (3D 모드만 사용)

  // 뒷벽 - 투명 처리
  const backWallMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#FFFFFF',
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      roughness: 0.5,
      metalness: 0.1,
      depthWrite: false
    });
  }, []);
  
  // 좌측벽 - 그라데이션 적용 (및 투명도 적용)
  const leftWallMaterial = useMemo(() => {
    // 빌트인 모드이거나 세미스탠딩 모드에서 벽이 있는 경우 불투명도를 0.3으로 설정
    const isBuildInWall = spaceType === 'built-in' || 
                          (spaceType === 'semi-standing' && wallPosition === 'left');
    
    const opacityValue = isBuildInWall ? 0.3 : 
      (typeof wallOpacity === 'object' && wallOpacity !== null && 'left' in wallOpacity 
        ? wallOpacity.left 
        : typeof wallOpacity === 'number' ? wallOpacity : 0.3);
    
    return new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color('#f8f8f8') }, // 더 밝은 색상으로 변경
        direction: { value: 0.0 },
        opacity: { value: opacityValue }
      },
      vertexShader: gradientVertexShader,
      fragmentShader: wallFragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      wireframe: false  // 항상 false로 설정
    });
  }, [wallOpacity, spaceType, wallPosition]);
  
  // 우측벽 - 그라데이션 적용 (및 투명도 적용)
  const rightWallMaterial = useMemo(() => {
    // 빌트인 모드이거나 세미스탠딩 모드에서 벽이 있는 경우 불투명도를 0.3으로 설정
    const isBuildInWall = spaceType === 'built-in' || 
                          (spaceType === 'semi-standing' && wallPosition === 'right');
    
    const opacityValue = isBuildInWall ? 0.3 : 
      (typeof wallOpacity === 'object' && wallOpacity !== null && 'right' in wallOpacity 
        ? wallOpacity.right 
        : typeof wallOpacity === 'number' ? wallOpacity : 0.3);
    
    return new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color('#f0f0f0') }, // 더 밝은 색상으로 변경
        direction: { value: 1.0 },
        opacity: { value: opacityValue }
      },
      vertexShader: gradientVertexShader,
      fragmentShader: wallFragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      wireframe: false  // 항상 false로 설정
    });
  }, [wallOpacity, spaceType, wallPosition]);
  
  // 바닥 - 그라데이션 적용
  const floorMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        baseColor: { value: new THREE.Color(hasFloorFinish ? '#E9E9E9' : '#F8F8F8') },
        opacity: { value: 1.0 },
        isFloor: { value: true }  // 바닥임을 쉐이더에 알림
      },
      vertexShader: gradientVertexShader,
      fragmentShader: floorCeilingFragmentShader,
      transparent: false,
      depthWrite: true,
      depthTest: true,
      side: THREE.DoubleSide,
      wireframe: false
    });
  }, [hasFloorFinish]);
  
  // 바닥 마감재(마루) - 그린 컬러 및 흰색 아웃라인(와이어프레임)
  // 기존 material 대신 아래에서 group으로 직접 마감재를 렌더링하므로 별도 material 생성 불필요
  
  // 천장 - 그라데이션 적용
  const ceilingMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color('#ffffff') },
        opacity: { value: 1.0 },  // 2D 모드일 때 반투명하게
        isFloor: { value: false }  // 천장임을 쉐이더에 알림
      },
      vertexShader: gradientVertexShader,
      fragmentShader: floorCeilingFragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      wireframe: false  // 항상 false로 설정
    });
  }, []);
  
  // 에어컨 단내림 색상 - 각 면별 그라데이션 적용
  // 윗면 재질
  const acUnitTopMaterial = useMemo(() => {
    const acPosition = hasAirConditioner && acUnit ? acUnit.position : 'left';
    return new THREE.ShaderMaterial({
      vertexShader: gradientVertexShader,
      fragmentShader: wallFragmentShader,
      uniforms: {
        baseColor: { value: new THREE.Color('#ffffff') },
        opacity: { value: 1.0 },
        direction: { value: acPosition === 'left' ? 1.0 : 0.0 }
      },
      transparent: false,
      side: THREE.DoubleSide,
      depthWrite: true,
      depthTest: true,
      wireframe: false // 항상 false로 설정
    });
  }, [hasAirConditioner, acUnit]);
  
  // 바닥면 재질 - 안쪽 어둡고 바깥쪽 흰색 그라데이션
  const acUnitBottomMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: gradientVertexShader,
      fragmentShader: wallFragmentShader,
      uniforms: {
        baseColor: { value: new THREE.Color('#ffffff') },
        opacity: { value: 1.0 },
        direction: { value: 2.0 } // 위아래 방향 그라데이션
      },
      transparent: false,
      side: THREE.DoubleSide,
      depthWrite: true,
      depthTest: true,
      wireframe: false // 항상 false로 설정
    });
  }, []);
  
  // 앞면 재질 - 완전한 순수 흰색
  const acUnitFrontMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: '#ffffff', // 순수 흰색
      side: THREE.DoubleSide,
      wireframe: false // 항상 false로 설정
    });
  }, []);
  
  // 뒷면 재질 - 그라데이션
  const acUnitBackMaterial = useMemo(() => {
    const acPosition = hasAirConditioner && acUnit ? acUnit.position : 'left';
    return new THREE.ShaderMaterial({
      vertexShader: gradientVertexShader,
      fragmentShader: wallFragmentShader,
      uniforms: {
        baseColor: { value: new THREE.Color('#ffffff') },
        opacity: { value: 1.0 },
        direction: { value: acPosition === 'left' ? 0.0 : 1.0 } // 좌우 방향
      },
      transparent: false,
      side: THREE.DoubleSide,
      depthWrite: true,
      depthTest: true,
      wireframe: false // 항상 false로 설정
    });
  }, [hasAirConditioner, acUnit]);
  
  // 좌측면 재질 - 그라데이션 유지 (원본 유지)
  const acUnitLeftMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: gradientVertexShader,
      fragmentShader: wallFragmentShader,
      uniforms: {
        baseColor: { value: new THREE.Color('#ffffff') },
        opacity: { value: 1.0 },
        direction: { value: 0.0 } // 좌측은 방향 유지: 뒷벽(+z)이 흰색, 앞쪽(-z)이 어두움
      },
      transparent: false,
      side: THREE.DoubleSide,
      depthWrite: true,
      depthTest: true,
      wireframe: false // 항상 false로 설정
    });
  }, []); // 의존성 제거
  
  // 우측면 재질 - 그라데이션 방향만 수정
  const acUnitRightMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: gradientVertexShader,
      fragmentShader: wallFragmentShader,
      uniforms: {
        baseColor: { value: new THREE.Color('#ffffff') },
        opacity: { value: 1.0 },
        direction: { value: 1.0 } // 방향 변경: 뒷벽(-z)이 어두운색, 앞쪽(+z)이 흰색
      },
      transparent: false,
      side: THREE.DoubleSide,
      depthWrite: true,
      depthTest: true,
      wireframe: false // 항상 false로 설정
    });
  }, []); // dependency 제거하여 좌측과 별개로 작동하도록 수정

  // 단내림 기둥 내부/외부 벽면용 재질 - 불투명하게 설정하여 카메라 각도에 따른 투명 현상 방지
  const acWallLeftMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: gradientVertexShader,
      fragmentShader: wallFragmentShader,
      uniforms: {
        color: { value: new THREE.Color('#f8f8f8') },
        direction: { value: 0.0 },
        opacity: { value: 1.0 } // 완전 불투명
      },
      transparent: false, // 투명도 비활성화
      depthWrite: true,   // 깊이 버퍼 쓰기 활성화
      side: THREE.DoubleSide,
      wireframe: false
    });
  }, []);
  
  const acWallRightMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: gradientVertexShader,
      fragmentShader: wallFragmentShader,
      uniforms: {
        color: { value: new THREE.Color('#f0f0f0') },
        direction: { value: 1.0 },
        opacity: { value: 1.0 } // 완전 불투명
      },
      transparent: false, // 투명도 비활성화
      depthWrite: true,   // 깊이 버퍼 쓰기 활성화
      side: THREE.DoubleSide,
      wireframe: false
    });
  }, []);

  // Create measurements and dimensions if in top view
  const dimensionMaterial = new THREE.LineBasicMaterial({ color: '#FFFFFF', linewidth: 2 });
  
  // Create wardrobe dimensions based on placement info (for Step 3)
  const calculateWardrobeDimensions = () => {
    if (!placementInfo) return { width: widthM * 0.9, height: heightM * 0.95, depth: depthM * 0.8 };
    
    const { clearance, fit } = placementInfo;
    
    let clearanceMultiplier = 1;
    if (fit === 'tight') clearanceMultiplier = 0.2;
    if (fit === 'normal') clearanceMultiplier = 1;
    if (fit === 'surrounding') clearanceMultiplier = 1.5;
    
    const leftClearanceM = (clearance?.left || 4) * clearanceMultiplier / 1000;
    const rightClearanceM = (clearance?.right || 4) * clearanceMultiplier / 1000;
    const topClearanceM = (clearance?.top || 4) * clearanceMultiplier / 1000;
    // 바닥 여백 무시 (bottom clearance 사용하지 않음)
    
    return {
      width: widthM - leftClearanceM - rightClearanceM,
      height: heightM - topClearanceM - floorThicknessM, // 항상 바닥까지 닿도록 함
      depth: depthM * 0.8
    };
  };
  
  const wardrobeDimensions = calculateWardrobeDimensions();

  const shouldRenderLeftWall = viewMode !== 'topView' && 
    ((spaceType === 'built-in') || (spaceType === 'semi-standing' && wallPosition === 'left'));
  const shouldRenderRightWall = viewMode !== 'topView' && 
    ((spaceType === 'built-in') || (spaceType === 'semi-standing' && wallPosition === 'right'));
  
  console.log('[Room] Wall rendering conditions:', { 
    spaceType, 
    wallPosition, 
    shouldRenderLeftWall, 
    shouldRenderRightWall,
    viewMode,
    originalSpaceType,
    originalWallPosition,
    placementInfo
  });

  // 공간 정보, wallPosition 및 viewMode 로그 추가
  console.log('[Room] Full mount check:', { 
    originalSpaceType, 
    originalWallPosition, 
    spaceType, 
    wallPosition, 
    viewMode, 
    leftWallMaterial, 
    rightWallMaterial
  });

  // --- 프레임 위치/사이즈 계산 공통 함수 ---
  function getFrameMeshProps({
    type, // 'left' | 'right' | 'top'
    widthM,
    heightM,
    depthM,
    leftFrameWidth,
    rightFrameWidth,
    topFrameHeight,
    baseDepth,
    frameThickness = 0.02, // 20mm
    endPanelThickness = 0.02,
    hasFloorFinish = false,
    floorThicknessM = 0,
    placementType = '',
    raiseHeightM = 0,
    spaceType = 'built-in',
    wallPosition = 'left',
    acUnit,
    hasAirConditioner
  }) {
    // 프리스탠딩 모드에서 top 또는 bottom 타입의 엔드패널은 생성하지 않음
    if (spaceType === 'free-standing' && (type === 'top' || type === 'bottom')) {
      return { position: [0, 0, 0], size: [0, 0, 0] }; // 크기를 0으로 설정하여 보이지 않게 함
    }
    
    // 좌/우 프레임 높이 보정 (단내림, 띄움, 마감재)
    let frameHeight = heightM;
    if (hasAirConditioner && acUnit) {
      if (type === 'left' && acUnit.position === 'left') {
        // 단내림 높이(height) 값을 사용하도록 수정 - 이전에는 depth 사용
        frameHeight = heightM - (acUnit.height || 200)/1000 - (hasFloorFinish ? floorThicknessM : 0) - (placementType === 'raised' ? raiseHeightM : 0);
        console.log('[getFrameMeshProps] 좌측 프레임 높이 계산 (단내림 적용):', { 
          단내림높이mm: acUnit.height || 200,
          변환높이m: (acUnit.height || 200)/1000,
          최종프레임높이: frameHeight
        });
      }
      if (type === 'right' && acUnit.position === 'right') {
        // 단내림 높이(height) 값을 사용하도록 수정 - 이전에는 depth 사용
        frameHeight = heightM - (acUnit.height || 200)/1000 - (hasFloorFinish ? floorThicknessM : 0) - (placementType === 'raised' ? raiseHeightM : 0);
        console.log('[getFrameMeshProps] 우측 프레임 높이 계산 (단내림 적용):', { 
          단내림높이mm: acUnit.height || 200,
          변환높이m: (acUnit.height || 200)/1000,
          최종프레임높이: frameHeight
        });
      }
    }
    if (type === 'left') {
      return {
        position: [
          spaceType === 'free-standing' || (spaceType === 'semi-standing' && wallPosition === 'right')
            ? -widthM/2 + endPanelThickness/2
            : -widthM/2 + leftFrameWidth/2,
          -heightM/2 + frameHeight/2 + (hasFloorFinish ? floorThicknessM : 0) + (placementType === 'raised' ? raiseHeightM : 0),
          -depthM/2 + baseDepth/2
        ],
        size: [
          spaceType === 'free-standing' || (spaceType === 'semi-standing' && wallPosition === 'right')
            ? endPanelThickness
            : leftFrameWidth,
          frameHeight,
          baseDepth
        ]
      };
    }
    if (type === 'right') {
      return {
        position: [
          spaceType === 'free-standing' || (spaceType === 'semi-standing' && wallPosition === 'left')
            ? widthM/2 - endPanelThickness/2
            : widthM/2 - rightFrameWidth/2,
          -heightM/2 + frameHeight/2 + (hasFloorFinish ? floorThicknessM : 0) + (placementType === 'raised' ? raiseHeightM : 0),
          -depthM/2 + baseDepth/2
        ],
        size: [
          spaceType === 'free-standing' || (spaceType === 'semi-standing' && wallPosition === 'left')
            ? endPanelThickness
            : rightFrameWidth,
          frameHeight,
          baseDepth
        ]
      };
    }
    if (type === 'top') {
      // 상단 프레임은 좌우 프레임/엔드패널 제외한 내경만큼만
      let topWidth = widthM - leftFrameWidth - rightFrameWidth;
      if (spaceType === 'free-standing') topWidth = widthM - endPanelThickness * 2;
      if (spaceType === 'semi-standing') {
        if (wallPosition === 'left') topWidth = widthM - leftFrameWidth - endPanelThickness;
        else if (wallPosition === 'right') topWidth = widthM - rightFrameWidth - endPanelThickness;
      }
      return {
        position: [0, heightM/2 - topFrameHeight/2, -depthM/2 + baseDepth/2],
        size: [topWidth, topFrameHeight, baseDepth]
      };
    }
    return { position: [0,0,0], size: [1,1,1] };
  }

  return (
    <group ref={ref} position={[0, 0, 0]}>
      {/* 그리드 헬퍼를 제거 */}
      
      {/* 3D 모드에서만 필요한 요소들 */}
      {viewMode !== '2D' && (
        <>
      {/* Floor */}
      <mesh 
        ref={(mesh) => {
          if (mesh && !meshRefs.current.floor) {
            meshRefs.current.floor = mesh;
          }
        }}
        position={[0, -heightM / 2, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow={true}
      >
        <planeGeometry args={[widthM, depthM]} />
        <primitive object={floorMaterial} attach="material" />
      </mesh>
      
      {/* 바닥 마감재 - 마루(hasFloorFinish일 때만 표시) */}
      {hasFloorFinish && (
        <group>
          <mesh
            position={[
              0,
              -heightM / 2 + (floorThicknessM / 2),
              0
            ]}
            receiveShadow={true}
            castShadow={false}
          >
            <boxGeometry
              args={[
                widthM - adjustSize * 2,
                Math.max(floorThicknessM, 0.001),
                depthM - adjustSize * 2
              ]}
            />
            <meshStandardMaterial
              color="#00FF00"
              roughness={0.5}
              metalness={0.05}
              transparent={false}
              opacity={1.0}
            />
          </mesh>
          {/* White wireframe outline for floor finish */}
          <mesh
            position={[
              0,
              -heightM / 2 + (floorThicknessM / 2),
              0
            ]}
          >
            <boxGeometry
              args={[
                widthM - adjustSize * 2,
                Math.max(floorThicknessM, 0.001),
                depthM - adjustSize * 2
              ]}
            />
            <meshBasicMaterial
              color="#FFFFFF"
              wireframe={true}
              transparent={false}
            />
          </mesh>
        </group>
      )}
      
      {/* Ceiling */}
      {viewMode !== 'topView' && (
        <>
          {hasAirConditioner ? (
            <group>
              {/* 단내림 개선: 천장 메쉬가 분절됨 */}
              {/* 메인 천장 (단내림 부분 제외) */}
                    <mesh 
        ref={(mesh) => {
          if (mesh && !meshRefs.current.ceiling) {
            meshRefs.current.ceiling = mesh;
          }
        }}
        position={[
          hasAirConditioner && acUnit ? (
            acUnit.position === 'left'
              ? (acUnit.width || 850)/2000 // 좌측 단내림: 메인 천장 중심점 수정 (단내림 외부 영역 제거)
              : -(acUnit.width || 850)/2000 // 우측 단내림: 메인 천장 중심점 수정
          ) : 0,
          heightM / 2, 
          0
        ]} 
        rotation={[Math.PI/2, 0, 0]}
        receiveShadow={false}
      >
        <planeGeometry args={[widthM - (hasAirConditioner && acUnit ? (acUnit.width || 850)/1000 : 0), depthM - adjustSize]} />
        <primitive object={ceilingMaterial} attach="material" />
      </mesh>

              {/* 단내림 천장 부분 - 아래로 내려온 위치에 정확히 배치 */}
                    <mesh 
        ref={(mesh) => {
          if (mesh && !meshRefs.current.acCeiling) {
            meshRefs.current.acCeiling = mesh;
          }
        }}
        position={[
          hasAirConditioner && acUnit ? (
            acUnit.position === 'left'
              ? -widthM / 2 + (acUnit.width || 850) / 2000 // 좌측 단내림: 왼쪽 모서리에서 단내림 너비의 절반만큼 안쪽으로
              : widthM / 2 - (acUnit.width || 850) / 2000 // 우측 단내림: 오른쪽 모서리에서 단내림 너비의 절반만큼 안쪽으로
          ) : 0,
          heightM / 2 - (hasAirConditioner && acUnit ? (acUnit.height || 200) / 1000 : 0), // 단내림 높이만큼 정확히 아래로 내려옴
          0
        ]} 
        rotation={[Math.PI/2, 0, 0]}
        receiveShadow={false}
      >
        <planeGeometry args={[hasAirConditioner && acUnit ? (acUnit.width || 850) / 1000 : 0.01, depthM - adjustSize]} />
        <primitive object={ceilingMaterial} attach="material" />
      </mesh>
            </group>
          ) : (
            // 단내림 없을 때 일반 천장
            <mesh 
              ref={(mesh) => {
                if (mesh && !meshRefs.current.ceiling) {
                  meshRefs.current.ceiling = mesh;
                }
              }}
              position={[0, heightM / 2, 0]} 
              rotation={[Math.PI/2, 0, 0]}
              receiveShadow={false}
            >
              <planeGeometry args={[widthM - adjustSize, depthM - adjustSize]} />
              <primitive object={ceilingMaterial} attach="material" />
            </mesh>
          )}
        </>
      )}
      
      {/* Back Wall */}
      {viewMode !== 'topView' && (
        <mesh 
          ref={(mesh) => {
            if (mesh && !meshRefs.current.backWall) {
              meshRefs.current.backWall = mesh;
            }
          }}
          position={[0, 0, -depthM / 2]} 
          receiveShadow={true}
        >
          <planeGeometry args={[widthM, heightM]} />
          <primitive object={backWallMaterial} attach="material" />
        </mesh>
      )}
      
      {/* Left Wall - 빌트인 또는 벽 위치가 left일 때 표시 */}
      {viewMode !== 'topView' && (spaceType === 'built-in' || spaceType === 'semi-standing' && wallPosition === 'left') && (
        <>
          {hasAirConditioner && acUnit && acUnit.position === 'left' ? (
            <group>
              {/* 단내림 개선: 벽면이 단내림 높이만큼 분절됨 */}
              {/* 단내림 없는 아래쪽 벽면 부분 */}
              <mesh 
                ref={(mesh) => {
                  if (mesh && !meshRefs.current.leftWallLower) {
                    meshRefs.current.leftWallLower = mesh;
                  }
                }}
                position={[
                  -widthM / 2 + 0.001, // 약간 안쪽으로
                  -heightM/2 + (heightM - (acUnit.height || 200)/1000)/2 + (hasFloorFinish ? floorThicknessM : 0), // 아래쪽 부분 중심
                  0
                ]} 
                rotation={[0, Math.PI / 2, 0]}
                receiveShadow={false}
              >
                <planeGeometry args={[depthM - adjustSize, heightM - (acUnit.height || 200)/1000]} />
                <primitive object={leftWallMaterial} attach="material" />
              </mesh>

              {/* 윗쪽 벽면 부분 - 완전히 안쪽으로 이동 */}
              <mesh 
                ref={(mesh) => {
                  if (mesh && !meshRefs.current.leftWallUpper) {
                    meshRefs.current.leftWallUpper = mesh;
                  }
                }}
                position={[
                  -widthM / 2 + (acUnit.width || 850)/1000 + 0.001, // 단내림 폭만큼 정확히 안쪽으로 이동
                  heightM/2 - (acUnit.height || 200)/2000, // 천장에서 단내림 높이의 절반만큼 아래로 (단위 변환 수정)
                  0
                ]} 
                rotation={[0, Math.PI / 2, 0]}
                receiveShadow={false}
              >
                <planeGeometry args={[depthM - adjustSize, (acUnit.height || 200)/1000]} />
                <primitive object={leftWallMaterial} attach="material" />
              </mesh>
              
              {/* 단내림 측면 벽 - 제거됨 */}
            </group>
          ) : (
            // 단내림 없거나 우측에 있을 때 일반 좌측 벽
            <mesh 
              ref={(mesh) => {
                if (mesh && !meshRefs.current.leftWall) {
                  meshRefs.current.leftWall = mesh;
                }
              }}
              position={[-widthM / 2 + 0.001, 0, 0]} 
              rotation={[0, Math.PI / 2, 0]}
              receiveShadow={false}
            >
              <planeGeometry args={[depthM - adjustSize, heightM - adjustSize]} />
              <primitive object={leftWallMaterial} attach="material" />
            </mesh>
          )}
        </>
      )}
      
      {/* Right Wall - 빌트인 또는 벽 위치가 right일 때 표시 */}
      {viewMode !== 'topView' && (spaceType === 'built-in' || spaceType === 'semi-standing' && wallPosition === 'right') && (
        <>
          {hasAirConditioner && acUnit && acUnit.position === 'right' ? (
            <group>
              {/* 단내림 개선: 벽면이 단내림 높이만큼 분절됨 */}
              {/* 단내림 없는 아래쪽 벽면 부분 */}
              <mesh 
                ref={(mesh) => {
                  if (mesh && !meshRefs.current.rightWallLower) {
                    meshRefs.current.rightWallLower = mesh;
                  }
                }}
                position={[
                  widthM / 2 - 0.001, // 약간 안쪽으로
                  -heightM/2 + (heightM - (acUnit.height || 200)/1000)/2 + (hasFloorFinish ? floorThicknessM : 0), // 아래쪽 부분 중심
                  0
                ]} 
                rotation={[0, -Math.PI / 2, 0]}
                receiveShadow={false}
              >
                <planeGeometry args={[depthM - adjustSize, heightM - (acUnit.height || 200)/1000]} />
                <primitive object={rightWallMaterial} attach="material" />
              </mesh>

              {/* 윗쪽 벽면 부분 - 완전히 안쪽으로 이동 */}
              <mesh 
                ref={(mesh) => {
                  if (mesh && !meshRefs.current.rightWallUpper) {
                    meshRefs.current.rightWallUpper = mesh;
                  }
                }}
                                  position={[
                  widthM / 2 - (acUnit.width || 850)/1000 - 0.001, // 단내림 폭만큼 정확히 안쪽으로 이동
                  heightM/2 - (acUnit.height || 200)/2000, // 천장에서 단내림 높이의 절반만큼 아래로 (단위 변환 수정)
                  0
                ]} 
                rotation={[0, -Math.PI / 2, 0]}
                receiveShadow={false}
              >
                <planeGeometry args={[depthM - adjustSize, (acUnit.height || 200)/1000]} />
                <primitive object={rightWallMaterial} attach="material" />
              </mesh>
              
              {/* 단내림 측면 벽 - 제거됨 */}
            </group>
          ) : (
            // 단내림 없거나 좌측에 있을 때 일반 우측 벽
            <mesh 
              ref={(mesh) => {
                if (mesh && !meshRefs.current.rightWall) {
                  meshRefs.current.rightWall = mesh;
                }
              }}
              position={[widthM / 2 - 0.001, 0, 0]} 
              rotation={[0, -Math.PI / 2, 0]}
              receiveShadow={false}
            >
              <planeGeometry args={[depthM - adjustSize, heightM - adjustSize]} />
              <primitive object={rightWallMaterial} attach="material" />
            </mesh>
          )}
        </>
      )}
      
      {/* 스탠딩/프리스탠딩 모드 - 좌/우 프레임 (정교한 AC/마감재/바닥 보정) */}
      {/* 기존 mesh 생성 부분을 createSafeMesh로 대체 필요 */}
      {viewMode !== 'topView' && (spaceType === 'standing' || spaceType === 'free-standing') && showFrame && (() => {
        const { position, size } = getFrameMeshProps({
          type: 'left', widthM, heightM, depthM, leftFrameWidth, baseDepth, endPanelThickness, hasFloorFinish, floorThicknessM, placementType, raiseHeightM, spaceType, wallPosition, acUnit, hasAirConditioner
        });
        return (
          <mesh position={position} receiveShadow={false} castShadow={false}>
            <boxGeometry args={size} />
            <meshStandardMaterial color={getFrameColor('left')} transparent={false} wireframe={false} roughness={0.9} metalness={0.0} />
          </mesh>
        );
      })()}
      {viewMode !== 'topView' && (spaceType === 'standing' || spaceType === 'free-standing') && showFrame && (() => {
        const { position, size } = getFrameMeshProps({
          type: 'right', widthM, heightM, depthM, rightFrameWidth, baseDepth, endPanelThickness, hasFloorFinish, floorThicknessM, placementType, raiseHeightM, spaceType, wallPosition, acUnit, hasAirConditioner
        });
        return (
          <mesh position={position} receiveShadow={false} castShadow={false}>
            <boxGeometry args={size} />
            <meshStandardMaterial color={getFrameColor('right')} transparent={false} wireframe={false} roughness={0.9} metalness={0.0} />
          </mesh>
        );
      })()}
      {viewMode !== 'topView' && (spaceType === 'standing' || spaceType === 'free-standing') && showFrame && (() => {
        const { position, size } = getFrameMeshProps({
          type: 'top', widthM, heightM, depthM, leftFrameWidth, rightFrameWidth, topFrameHeight, baseDepth, endPanelThickness, spaceType, wallPosition
        });
        return (
          <mesh position={position} receiveShadow={false} castShadow={false}>
            <boxGeometry args={size} />
            <meshStandardMaterial color={getFrameColor('top')} transparent={false} wireframe={false} roughness={0.9} metalness={0.0} />
          </mesh>
        );
      })()}
      
      {/* Wardrobe - in Step 3 (top view) */}
      {viewMode === 'topView' && placementInfo && (
        <mesh 
          ref={(mesh) => {
            if (mesh && !meshRefs.current.wardrobe) {
              meshRefs.current.wardrobe = mesh;
            }
          }}
          position={[0, 0, 0]} 
          receiveShadow
          castShadow
        >
          <boxGeometry args={[wardrobeDimensions.width, 0.05, wardrobeDimensions.depth]} />
              <meshStandardMaterial 
                color={wardrobeDimensions.color}
                transparent 
                opacity={0.9}
                wireframe={false}
              />
        </mesh>
      )}
      
      {/* 받침대 표시 - placementInfo에 baseHeight가 있는 경우에만 표시 */}
      {/* createSafeMesh(scene, [baseWidthCalc, baseHeightM, baseDepthM], material, basePosition) */}
      {viewMode !== 'topView' && placementInfo && hasBase && (
        hasAirConditioner ? (
          // 단내림이 있는 경우 받침대 분할
          <group>
            {/* 단내림 영역의 엔드패널 */}
            <mesh
              ref={(mesh) => {
                if (mesh && !meshRefs.current.acEndPanel) {
                  meshRefs.current.acEndPanel = mesh;
                }
              }}
              position={[
                acUnit.position === 'left' 
                  ? -widthM/2 + acUnit.width/1000 - endPanelThickness/2 // 좌측 단내림: 단내림 우측 끝에서 엔드패널 두께의 절반만큼 왼쪽으로
                  : widthM/2 - acUnit.width/1000 + endPanelThickness/2, // 우측 단내림: 단내림 좌측 끝에서 엔드패널 두께의 절반만큼 오른쪽으로
                0, // Y축 중앙에 배치
                -depthM/2 + baseDepth/2  // 뒷벽에 딱 붙어서 baseDepth만큼만 앞으로 나오도록 수정
              ]}
              receiveShadow={false}
              castShadow={false}
            >
              <boxGeometry 
                args={[
                  endPanelThickness,  // 엔드패널 두께 (기존 엔드패널과 동일)
                  heightM,           // 공간 전체 높이로 수정
                  baseDepth           // 깊이
                ]} 
              />
              <meshStandardMaterial
                color={getFrameColor('endPanel')}  // 프레임 색상 적용
                wireframe={false}
                roughness={0.7}
                metalness={0.1}
                opacity={1.0}
                transparent={false}
              />
            </mesh>
            
            {/* 단내림 영역의 받침대 */}
            <mesh
              ref={(mesh) => {
                if (mesh && !meshRefs.current.acBase) {
                  meshRefs.current.acBase = mesh;
                }
              }}
              position={[
                // 공식 적용: 단내림 중앙정렬
                acUnit.position === 'left'
                  ? -widthM/2 + acUnit.width/1000/2 + (leftFrameWidth/2) + (endPanelThickness/2)
                  : widthM/2 - acUnit.width/1000/2 - (rightFrameWidth/2) - (endPanelThickness/2),
                basePosition[1],
                -depthM/2 + baseDepth/2
              ]}
              receiveShadow={false}
              castShadow={false}
            >
              <boxGeometry 
                args={[
                  // 공식 적용: 단내림 내경 width (엔드판넬 제외)
                  acUnit.position === 'left'
                    ? acUnit.width/1000 - leftFrameWidth
                    : acUnit.width/1000 - rightFrameWidth,
                  baseHeightM,
                  baseDepth
                ]} 
              />
              <meshStandardMaterial
                color={placementInfo?.focusedFrame === 'baseHeight' ? '#00C092' : getFrameColor('base')} 
                transparent={placementInfo?.focusedFrame === 'baseHeight'} 
                opacity={placementInfo?.focusedFrame === 'baseHeight' ? 0.7 : 1.0} 
                wireframe={false}
                roughness={0.5}
                metalness={0.15}
                flatShading={false}
                envMapIntensity={1.0}
              />
            </mesh>
            
            {/* 일반 영역의 받침대 */}
            <mesh
              ref={(mesh) => {
                if (mesh && !meshRefs.current.regularBase) {
                  meshRefs.current.regularBase = mesh;
                }
              }}
              position={[
                acUnit.position === 'left'
                  ? baseCenterX + acUnit.width/2000 // 좌측 단내림: 기존 중앙에서 단내림 폭의 절반만큼 오른쪽으로
                  : baseCenterX - acUnit.width/2000, // 우측 단내림: 기존 중앙에서 단내림 폭의 절반만큼 왼쪽으로
                basePosition[1],
                -depthM/2 + baseDepth/2 // 뒷벽에 딱 붙어서 baseDepth만큼만 앞으로 나오도록 수정
              ]}
              receiveShadow={false}
              castShadow={false}
            >
              <boxGeometry 
                args={[
                  baseWidthCalc - acUnit.width/1000, // 전체 너비에서 단내림 폭 만큼 줄임
                  baseHeightM,
                  baseDepth
                ]} 
              />
              <meshStandardMaterial
                color={placementInfo?.focusedFrame === 'baseHeight' ? '#00C092' : getFrameColor('base')} 
                transparent={placementInfo?.focusedFrame === 'baseHeight'} 
                opacity={placementInfo?.focusedFrame === 'baseHeight' ? 0.7 : 1.0} 
                wireframe={false}
                roughness={0.5}
                metalness={0.15}
                flatShading={false}
                envMapIntensity={1.0}
              />
            </mesh>
          </group>
        ) : (
          // 단내림이 없는 경우 기존 받침대 유지
          <mesh
            ref={(mesh) => {
              if (mesh && !meshRefs.current.base) {
                meshRefs.current.base = mesh;
              }
            }}
            position={[baseCenterX, basePosition[1], -depthM/2 + baseDepth/2]} // z 위치 수정: 뒷벽에 딱 붙도록
            receiveShadow={false}
            castShadow={false}
          >
            <boxGeometry 
              args={[
                baseWidthCalc,
                baseHeightM,
                baseDepth // 깊이를 baseDepth로 설정 (뒷벽에 딱 붙어서 앞으로 baseDepth만큼 나오도록)
              ]} 
            />
            <meshStandardMaterial
              color={placementInfo?.focusedFrame === 'baseHeight' ? '#00C092' : getFrameColor('base')} 
              transparent={placementInfo?.focusedFrame === 'baseHeight'} 
              opacity={placementInfo?.focusedFrame === 'baseHeight' ? 0.7 : 1.0} 
              wireframe={false}
              roughness={0.5}
              metalness={0.15}
              flatShading={false}
              envMapIntensity={1.0}
            />
          </mesh>
        )
      )}
      
      {/* 프리스탠딩 모드일 때 양쪽 엔드패널 추가 */}
      {viewMode !== 'topView' && spaceType === 'free-standing' && showFrame && (
        <>
          {/* 좌측 엔드패널 */}
          <mesh
            key={`leftEndPanel-${frameData?.color || frameColor || 'default'}`}
            ref={(mesh) => {
              if (mesh && !meshRefs.current.leftEndPanel) {
                meshRefs.current.leftEndPanel = mesh;
                console.log('[DEBUG] 좌측 엔드패널 메시 생성:', mesh);
              }
            }}
                          position={[
                -widthM/2 + endPanelThickness/2,
                // 단내림이 좌측에 있을 때 엔드패널 높이 조정 및 위치 변경
                hasAirConditioner && acUnit.position === 'left' 
                  ? -heightM/2 + (heightM - acUnit.height/1000)/2 + (hasFloorFinish ? floorThicknessM : 0) + (placementType === 'raised' ? raiseHeightM : 0)
                  : -heightM/2 + heightM/2 + (hasFloorFinish ? floorThicknessM : 0) + (placementType === 'raised' ? raiseHeightM : 0),
                -depthM/2 + baseDepth/2 // 뒷벽에 딱 붙어서 baseDepth만큼만 앞으로 나오도록 수정
              ]}
            receiveShadow={false}
            castShadow={false}
          >
            <boxGeometry 
              args={[
                endPanelThickness,
                // 단내림이 좌측에 있을 때 엔드패널 높이 감소
                hasAirConditioner && acUnit.position === 'left' 
                  ? heightM - acUnit.height/1000
                  : heightM,
                baseDepth
              ]}
            />
            <meshStandardMaterial
              color={getFrameColor('left')}
              wireframe={false}
              roughness={0.7}
              metalness={0.1}
              opacity={1.0}
              transparent={false}
            />
          </mesh>
          
          {/* 우측 엔드패널 */}
          <mesh
            key={`rightEndPanel-${frameData?.color || frameColor || 'default'}`}
            ref={(mesh) => {
              if (mesh && !meshRefs.current.rightEndPanel) {
                meshRefs.current.rightEndPanel = mesh;
                console.log('[DEBUG] 우측 엔드패널 메시 생성:', mesh);
              }
            }}
                        position={[
                widthM/2 - endPanelThickness/2,
                // 단내림이 우측에 있을 때 엔드패널 높이 조정 및 위치 변경
                hasAirConditioner && acUnit.position === 'right' 
                  ? -heightM/2 + (heightM - acUnit.height/1000)/2 + (hasFloorFinish ? floorThicknessM : 0) + (placementType === 'raised' ? raiseHeightM : 0)
                  : -heightM/2 + heightM/2 + (hasFloorFinish ? floorThicknessM : 0) + (placementType === 'raised' ? raiseHeightM : 0),
                -depthM/2 + baseDepth/2 // 뒷벽에 딱 붙어서 baseDepth만큼만 앞으로 나오도록 수정
              ]}
            receiveShadow={false}
            castShadow={false}
          >
            <boxGeometry 
              args={[
                endPanelThickness,
                // 단내림이 우측에 있을 때 엔드패널 높이 감소
                hasAirConditioner && acUnit.position === 'right' 
                  ? heightM - acUnit.height/1000
                  : heightM,
                baseDepth
              ]}
            />
            <meshStandardMaterial
              color={getFrameColor('right')}
              wireframe={false}
              roughness={0.7}
              metalness={0.1}
              opacity={1.0}
              transparent={false}
            />
          </mesh>
        </>
      )}
      

      
      {/* 띄움 공간 표시 - placementType이 'raised'인 경우에만 표시 */}
      {viewMode !== 'topView' && placementInfo && placementType === 'raised' && raiseHeightM > 0 && (
        <mesh
          ref={(mesh) => {
            if (mesh && !meshRefs.current.raise) {
              meshRefs.current.raise = mesh;
            }
          }}
          position={[0, -heightM/2 + (raiseHeightM/2) + floorThicknessM, -depthM/2 + endPanelDepth / 2]}
          receiveShadow
          castShadow
        >
          <boxGeometry 
            args={[
              innerWidth, // 프레임 내부 너비 (계산된 innerWidth 사용)
              raiseHeightM, // 띄움 높이
              0.05 // 얇은 두께로 표시
            ]} 
          />
          <meshStandardMaterial
            color={getFrameColor('raise')}
            opacity={0.3}
            transparent={true}
            wireframe={false}
          />
        </mesh>
      )}
      
      {/* 프레임 설정 - 좌측, 우측, 상단만 표시 (showFrame이 true일 때만 표시) */}
      {viewMode !== 'topView' && placementInfo && showFrame && (
        <>
              {/* 좌측 프레임 */}
          {(spaceType !== 'semi-standing' || wallPosition !== 'right') && spaceType !== 'free-standing' ? (
                // 에어컨 단내림이 좌측에 있는 경우
                hasAirConditioner && acUnit.position === 'left' ? (
                  (() => {
                    // 좌측 세로 프레임 (에어컨 아래에서 위로) - 프레임 상단이 AC 하단에 맞닿도록 yPos 계산 수정
                    const adjustedHeight = heightM - acUnit.height/1000 - (hasFloorFinish ? floorThicknessM : 0) - (placementType === 'raised' ? raiseHeightM : 0);
                    // Problem 2: yPos = 바닥에서 올라와서, 세로 프레임의 아래가 horizontal frame과 맞닿도록
                    const yPos = -heightM / 2 + (hasFloorFinish ? floorThicknessM : 0) + (placementType === 'raised' ? raiseHeightM : 0) + adjustedHeight / 2;
                    return (
                      <>
                        {/* 1. 좌측 세로 프레임 (에어컨 아래에서 위로) */}
                        <mesh
                          ref={(mesh) => {
                            if (mesh && !meshRefs.current.leftFrame) {
                              meshRefs.current.leftFrame = mesh;
                              // 메시가 마운트될 때 디버깅 로그 추가
                              console.log('[DEBUG] 좌측 프레임 메시 생성:', mesh);
                            }
                          }}
                          position={[
                            leftFramePosition,
                            yPos,
                            -depthM/2 + baseDepth - frameThickness/2  // z축 좌표를 받침대 앞면과 일치하도록 조정
                          ]}
                          receiveShadow={false}
                          castShadow={false}
                        >
                          <boxGeometry 
                            args={[
                              leftFrameWidth, // 좌측 여백에 따른 프레임 폭
                              adjustedHeight, // 에어컨 단내림 높이 및 마감재 높이를 뺀 높이 (bottom anchored)
                              frameThickness  // 20mm 깊이로 수정
                            ]} 
                          />
                          <meshStandardMaterial
                            color={getFrameColor('left')}
                            opacity={getFrameOpacity('left')}
                            transparent={placementInfo && placementInfo.fit === 'tight'}
                            wireframe={false}
                            roughness={1.0}
                            metalness={0.0}
                            flatShading={true}
                          />
                        </mesh>
                        
                        {/* 2. 하단 가로 프레임 (에어컨 아래) - 세로 프레임 옆에 정확히 맞닿도록 위치 계산 */}
                        {(() => {
                          // 1. Compute horizontal frame width (using leftFrameWidth for left side)
                          const horizontalFrameWidthAC = acUnit.width / 1000 - leftFrameWidth;
                          // 2. Updated horizontalFrameX calculation
                          const horizontalFrameX =
                            acUnit.position === 'left'
                              ? leftFramePosition + leftFrameWidth / 2 + horizontalFrameWidthAC / 2
                              : rightFramePosition - (rightFrameWidth / 2 + horizontalFrameWidthAC / 2);
                          // 3. y 위치 - horizontal frame의 top이 AC soffit 하단에 정확히 맞닿도록 업데이트
                          const horizontalFrameY = heightM / 2 - acUnit.height / 1000 - topFrameHeight / 2;
                          // Z 위치: AC soffit under-hanging frame should be 580mm from the back wall
                          return (
                            <mesh
                              ref={(mesh) => {
                                if (mesh && !meshRefs.current.topFrame) {
                                  meshRefs.current.topFrame = mesh;
                                  topFrameMeshRef.current = mesh; // Debug reference
                                }
                              }}
                              position={[
                                horizontalFrameX,
                                horizontalFrameY,
                                -depthM / 2 + baseDepth - frameThickness/2  // z축 좌표를 받침대 앞면과 일치하도록 조정
                              ]}
                              receiveShadow
                              castShadow
                            >
                              <boxGeometry 
                                args={[
                                  horizontalFrameWidthAC,
                                  topFrameHeight,
                                  frameThickness // 20mm 깊이로 수정
                                ]} 
                              />
                              <meshStandardMaterial
                                color={getFrameColor('top')}
                                opacity={1.0}
                                transparent={false}
                                wireframe={false}
                                roughness={0.9}
                                metalness={0.0}
                              />
                            </mesh>
                          );
                        })()}
                      </>
                    );
                  })()
                ) : (
                  // 에어컨 단내림이 없거나 오른쪽에 있는 경우 일반 프레임 (ceiling anchored)
                  (() => {
                    // 좌측 프레임: standing/free-standing과 동일한 공식 사용
                    const isAC = hasAirConditioner;
                    const isLeftAC = isAC && acUnit.position === 'left';
                    const leftFrameHeight = isLeftAC
                      ? heightM - acUnit.height / 1000 - (hasFloorFinish ? floorThicknessM : 0) - (placementType === 'raised' ? raiseHeightM : 0)
                      : heightM - (hasFloorFinish ? floorThicknessM : 0) - (placementType === 'raised' ? raiseHeightM : 0);
                    const leftFrameY = -heightM / 2 + leftFrameHeight / 2 + (hasFloorFinish ? floorThicknessM : 0) + (placementType === 'raised' ? raiseHeightM : 0);
                    const adjustedHeight = leftFrameHeight;
                    const yPos = leftFrameY;
                    return (
                      <mesh
                        ref={(mesh) => {
                          if (mesh && !meshRefs.current.leftFrame) {
                            meshRefs.current.leftFrame = mesh;
                          }
                        }}
                        position={[
                          leftFramePosition,
                          yPos,
                          -depthM/2 + baseDepth - frameThickness/2  // z축 좌표를 받침대 앞면과 일치하도록 조정
                        ]}
                        receiveShadow={false}
                        castShadow={false}
                      >
                        <boxGeometry 
                          args={[
                            leftFrameWidth,
                            adjustedHeight,
                            frameThickness // 20mm 깊이로 수정
                          ]} 
                        />
                        <meshStandardMaterial
                          color={getFrameColor('left')}
                          opacity={getFrameOpacity('left')}
                          transparent={placementInfo && placementInfo.fit === 'tight'}
                          wireframe={false}
                          roughness={1.0}
                          metalness={0.0}
                          flatShading={true}
                        />
                      </mesh>
                    );
                  })()
                )
          ) : (
            // semi-standing + 우측 벽 위치 또는 free-standing일 때 트여있는 좌측 프레임 (bottom anchored)
            (() => {
              // semi-standing + 우측벽: end panel frame 표시, free-standing: 위에서 이미 처리
              const hasAC = hasAirConditioner;
              const isLeftAC = hasAC && acUnit.position === 'left';
              // 단내림이 있는 경우 높이 조정
              const panelHeightNoAC = isLeftAC 
                ? heightM - acUnit.height/1000 - (hasFloorFinish ? floorThicknessM : 0) - (placementType === 'raised' ? raiseHeightM : 0)
                : heightM - (hasFloorFinish ? floorThicknessM : 0) - (placementType === 'raised' ? raiseHeightM : 0);
              
              // 단내림이 있는 경우 Y위치 조정
              const leftFrameY = isLeftAC
                ? -heightM / 2 + (panelHeightNoAC / 2) + (hasFloorFinish ? floorThicknessM : 0) + (placementType === 'raised' ? raiseHeightM : 0)
                : -heightM / 2 + panelHeightNoAC / 2 + (hasFloorFinish ? floorThicknessM : 0) + (placementType === 'raised' ? raiseHeightM : 0);
              
              if (spaceType === 'semi-standing' && wallPosition === 'right') {
                return (
                  <mesh
                    ref={(mesh) => {
                      if (mesh && !meshRefs.current.leftFrame) {
                        meshRefs.current.leftFrame = mesh;
                      }
                    }}
                    position={[
                      -widthM/2 + endPanelThickness/2,
                      leftFrameY,
                      -depthM/2 + endPanelDepth/2
                    ]}
                    receiveShadow
                    castShadow
                  >
                    <boxGeometry 
                      args={[
                        endPanelThickness,
                        panelHeightNoAC,
                        endPanelDepth
                      ]} 
                    />
                    <meshStandardMaterial
                      color={getFrameColor('left')}
                      wireframe={false}
                      roughness={0.7}
                      metalness={0.1}
                      opacity={1.0}
                      transparent={false}
                    />
                  </mesh>
                );
              }
              return null;
            })()
          )}
          
              {/* 우측 프레임 */}
          {(spaceType !== 'semi-standing' || wallPosition !== 'left') && spaceType !== 'free-standing' ? (
                // 에어컨 단내림이 우측에 있는 경우
                hasAirConditioner && acUnit.position === 'right' ? (
                  (() => {
                    // 우측 세로 프레임 (에어컨 아래에서 위로) - 프레임 상단이 AC 하단에 맞닿도록 yPos 계산 수정
                    const adjustedHeight = heightM - acUnit.height/1000 - (hasFloorFinish ? floorThicknessM : 0) - (placementType === 'raised' ? raiseHeightM : 0);
                    // Problem 2: yPos = 바닥에서 올라와서, 세로 프레임의 아래가 horizontal frame과 맞닿도록
                    const yPos = -heightM / 2 + (hasFloorFinish ? floorThicknessM : 0) + (placementType === 'raised' ? raiseHeightM : 0) + adjustedHeight / 2;
                    return (
                      <>
                        {/* 1. 우측 세로 프레임 (에어컨 위치 아래) */}
                        <mesh
                          ref={(mesh) => {
                            if (mesh && !meshRefs.current.rightFrame) {
                              meshRefs.current.rightFrame = mesh;
                            }
                          }}
                          position={[
                            rightFramePosition,
                            yPos,
                            -depthM/2 + baseDepth - frameThickness/2  // z축 좌표를 받침대 앞면과 일치하도록 조정
                          ]}
                          receiveShadow={false}
                          castShadow={true}
                        >
                          <boxGeometry 
                            args={[
                              rightFrameWidth, // 프레임 폭 (50mm)
                              adjustedHeight, // 에어컨 단내림 높이 및 마감재 높이를 뺀 높이 (bottom anchored)
                              frameThickness  // 20mm 깊이로 수정
                            ]} 
                          />
                          <meshStandardMaterial
                            color={getFrameColor('right')}
                            opacity={1.0}
                            transparent={false}
                            wireframe={false}
                            roughness={1.0}
                            metalness={0.0}
                            flatShading={true}
                          />
                        </mesh>
                        
                        {/* 에어컨 하단에 붙는 가로 프레임 - 세로 프레임 옆에 정확히 맞닿도록 위치 계산 */}
                        {(() => {
                          // 1. Compute horizontal frame width (using rightFrameWidth for right side)
                          const horizontalFrameWidthAC = acUnit.width / 1000 - rightFrameWidth;
                          // 2. Replace the existing horizontalFrameX calculation
                          const horizontalFrameX =
                            acUnit.position === 'left'
                              ? leftFramePosition + leftFrameWidth / 2 + horizontalFrameWidthAC / 2
                              : rightFramePosition - (rightFrameWidth / 2 + horizontalFrameWidthAC / 2);
                          // 3. y 위치 - horizontal frame의 top이 AC soffit 하단에 정확히 맞닿도록 업데이트
                          const horizontalFrameY = heightM / 2 - acUnit.height / 1000 - topFrameHeight / 2;
                          // Z 위치: AC soffit under-hanging frame should be 580mm from the back wall
                          return (
                            <mesh
                              ref={(mesh) => {
                                if (mesh && !meshRefs.current.topFrame) {
                                  meshRefs.current.topFrame = mesh;
                                  topFrameMeshRef.current = mesh; // Debug reference
                                }
                              }}
                              position={[
                                horizontalFrameX,
                                horizontalFrameY,
                                -depthM / 2 + baseDepth - frameThickness/2  // z축 좌표를 받침대 앞면과 일치하도록 조정
                              ]}
                              receiveShadow
                              castShadow
                            >
                              <boxGeometry 
                                args={[
                                  horizontalFrameWidthAC,
                                  topFrameHeight,
                                  frameThickness // 20mm 깊이로 수정
                                ]} 
                              />
                              <meshStandardMaterial
                                color={getFrameColor('top')}
                                opacity={1.0}
                                transparent={false}
                                wireframe={false}
                                roughness={0.9}
                                metalness={0.0}
                              />
                            </mesh>
                          );
                        })()}
                      </>
                    );
                  })()
                ) : (
                  // 에어컨 단내림이 없거나 왼쪽에 있는 경우 일반 프레임 (ceiling anchored)
                  (() => {
                    // 우측 프레임: standing/free-standing과 동일한 공식 사용
                    const isAC = hasAirConditioner;
                    const isRightAC = isAC && acUnit.position === 'right';
                    const rightFrameHeight = isRightAC
                      ? heightM - acUnit.height / 1000 - (hasFloorFinish ? floorThicknessM : 0) - (placementType === 'raised' ? raiseHeightM : 0)
                      : heightM - (hasFloorFinish ? floorThicknessM : 0) - (placementType === 'raised' ? raiseHeightM : 0);
                    const rightFrameY = -heightM / 2 + rightFrameHeight / 2 + (hasFloorFinish ? floorThicknessM : 0) + (placementType === 'raised' ? raiseHeightM : 0);
                    const adjustedHeight = rightFrameHeight;
                    const yPos = rightFrameY;
                    return (
                      <mesh
                        ref={(mesh) => {
                          if (mesh && !meshRefs.current.rightFrame) {
                            meshRefs.current.rightFrame = mesh;
                          }
                        }}
                        position={[
                          rightFramePosition,
                          yPos,
                          -depthM/2 + baseDepth - frameThickness/2  // z축 좌표를 받침대 앞면과 일치하도록 조정
                        ]}
                        receiveShadow={false}
                        castShadow={false}
                      >
                        <boxGeometry 
                          args={[
                            rightFrameWidth,
                            adjustedHeight,
                            frameThickness // 20mm 깊이로 수정
                          ]} 
                        />
                        <meshStandardMaterial
                          color={getFrameColor('right')}
                          opacity={1.0}
                          transparent={false}
                          wireframe={false}
                          roughness={1.0}
                          metalness={0.0}
                          flatShading={true}
                        />
                      </mesh>
                    );
                  })()
                )
          ) : (
            // semi-standing + 좌측 벽 위치 또는 free-standing일 때 트여있는 우측 프레임 (bottom anchored)
            (() => {
              // semi-standing + 좌측벽: end panel frame 표시, free-standing: 위에서 이미 처리
              const hasAC = hasAirConditioner;
              const isRightAC = hasAC && acUnit.position === 'right';
              // 단내림이 있는 경우 높이 조정
              const panelHeightNoAC = isRightAC 
                ? heightM - acUnit.height/1000 - (hasFloorFinish ? floorThicknessM : 0) - (placementType === 'raised' ? raiseHeightM : 0)
                : heightM - (hasFloorFinish ? floorThicknessM : 0) - (placementType === 'raised' ? raiseHeightM : 0);
              
              // 단내림이 있는 경우 Y위치 조정
              const rightFrameY = isRightAC
                ? -heightM / 2 + (panelHeightNoAC / 2) + (hasFloorFinish ? floorThicknessM : 0) + (placementType === 'raised' ? raiseHeightM : 0)
                : -heightM / 2 + panelHeightNoAC / 2 + (hasFloorFinish ? floorThicknessM : 0) + (placementType === 'raised' ? raiseHeightM : 0);
              
              if (spaceType === 'semi-standing' && wallPosition === 'left') {
                return (
                  <mesh
                    ref={(mesh) => {
                      if (mesh && !meshRefs.current.rightFrame) {
                        meshRefs.current.rightFrame = mesh;
                      }
                    }}
                    position={[
                      widthM/2 - endPanelThickness/2,
                      rightFrameY,
                      -depthM/2 + endPanelDepth/2
                    ]}
                    receiveShadow
                    castShadow
                  >
                    <boxGeometry 
                      args={[
                        endPanelThickness,
                        panelHeightNoAC,
                        endPanelDepth
                      ]} 
                    />
                    <meshStandardMaterial
                      color={getFrameColor('right')}
                      wireframe={false}
                      roughness={0.7}
                      metalness={0.1}
                      opacity={1.0}
                      transparent={false}
                    />
                  </mesh>
                );
              }
              return null;
            })()
          )}
          
          {/* 상단 프레임 - 좌측과 우측 프레임 사이를 연결 - 항상 표시 */}
          {/* createSafeMesh(scene, geometryArgs, material, position) 사용 예시 */}
          {viewMode !== 'topView' && placementInfo && showFrame && (
            hasAirConditioner ? (
              // 에어컨 단내림이 있는 경우: 공식 적용 (단내림 부분과 단내림 없는 부분 각각 별도 세그먼트 생성)
              <group>
                {/* 단내림이 있는 쪽 상부 프레임 (에어컨 단내림 아래에 배치) */}
                {(() => {
                  // 단내림 쪽 상부 프레임의 위치 계산
                  const acSideFrameY = heightM / 2 - acUnit.height / 1000 - topFrameHeight / 2; // 단내림 하단에 맞춤
                  let acSideFrameX = 0;
                  let acSideFrameWidth = acUnit.width / 1000;
                  
                  // 단내림 위치에 따른 X 위치 조정 (엔드판넬 두께만큼 보정)
                  if (acUnit.position === 'left') {
                    if (spaceType === 'built-in' || (spaceType === 'semi-standing' && wallPosition === 'left')) {
                      acSideFrameX = -widthM / 2 + acUnit.width / 2000 + leftFrameWidth / 2 + endPanelThickness/2;
                      acSideFrameWidth = acUnit.width / 1000 - leftFrameWidth - endPanelThickness;
                    } else {
                      acSideFrameX = -widthM / 2 + acUnit.width / 2000 + endPanelThickness;
                      acSideFrameWidth = acUnit.width / 1000 - endPanelThickness * 2;
                    }
                  } else {
                    if (spaceType === 'built-in' || (spaceType === 'semi-standing' && wallPosition === 'right')) {
                      acSideFrameX = widthM / 2 - acUnit.width / 2000 - rightFrameWidth / 2 - endPanelThickness/2;
                      acSideFrameWidth = acUnit.width / 1000 - rightFrameWidth - endPanelThickness;
                    } else {
                      acSideFrameX = widthM / 2 - acUnit.width / 2000 - endPanelThickness;
                      acSideFrameWidth = acUnit.width / 1000 - endPanelThickness * 2;
                    }
                  }
                  
                  // 단내림 쪽 상부 프레임 렌더링 (단내림 아래에 배치)
                  return (
                    <mesh
                      ref={(mesh) => {
                        if (mesh && !meshRefs.current.acTopFrame) {
                          meshRefs.current.acTopFrame = mesh;
                        }
                      }}
                      position={[
                        acSideFrameX,
                        acSideFrameY,
                        -depthM / 2 + baseDepth - frameThickness/2
                      ]}
                      receiveShadow
                      castShadow
                    >
                      <boxGeometry
                        args={[
                          acSideFrameWidth,
                          topFrameHeight,  // 높이(y): 상부 프레임 높이
                          frameThickness   // 깊이
                        ]} 
                      />
                      <meshStandardMaterial
                        color={getFrameColor('top')}
                        opacity={1.0}
                        transparent={false}
                        wireframe={false}
                        roughness={0.9}
                        metalness={0.0}
                      />
                    </mesh>
                  );
                })()}
                
                {/* 단내림이 없는 쪽 상부 프레임 (천장에 붙어있는 부분) */}
                {(() => {
                  // 상부 프레임 - 분할된 하나의 세그먼트 (AC 기둥 우측 또는 좌측)
                  let topSegmentWidth = 0;
                  let topSegmentCenterX = 0;
                  if (hasAirConditioner && acUnit) {
                    if (acUnit.position === 'left') {
                      if (spaceType === 'built-in') {
                        topSegmentWidth = widthM - acUnit.width/1000 - endPanelThickness - rightFrameWidth;
                        topSegmentCenterX = -widthM/2 + acUnit.width/1000 + topSegmentWidth/2;
                      } else if (spaceType === 'semi-standing' && wallPosition === 'left') {
                        topSegmentWidth = widthM - acUnit.width/1000 - endPanelThickness;
                        topSegmentCenterX = -widthM/2 + acUnit.width/1000 + topSegmentWidth/2;
                      } else if (spaceType === 'semi-standing' && wallPosition === 'right') {
                        topSegmentWidth = widthM - acUnit.width/1000 - rightFrameWidth;
                        topSegmentCenterX = -widthM/2 + acUnit.width/1000 + topSegmentWidth/2;
                      } else if (spaceType === 'free-standing') {
                        topSegmentWidth = widthM - acUnit.width/1000 - endPanelThickness * 2;
                        topSegmentCenterX = -widthM/2 + acUnit.width/1000 + topSegmentWidth/2;
                      }
                    } else {
                      if (spaceType === 'built-in') {
                        topSegmentWidth = widthM - acUnit.width/1000 - endPanelThickness - leftFrameWidth;
                        topSegmentCenterX = -widthM/2 + leftFrameWidth + topSegmentWidth/2;
                      } else if (spaceType === 'semi-standing' && wallPosition === 'left') {
                        topSegmentWidth = widthM - acUnit.width/1000 - leftFrameWidth;
                        topSegmentCenterX = -widthM/2 + leftFrameWidth + topSegmentWidth/2;
                      } else if (spaceType === 'semi-standing' && wallPosition === 'right') {
                        topSegmentWidth = widthM - acUnit.width/1000 - endPanelThickness;
                        topSegmentCenterX = -widthM/2 + endPanelThickness + topSegmentWidth/2;
                      } else if (spaceType === 'free-standing') {
                        topSegmentWidth = widthM - acUnit.width/1000 - endPanelThickness * 2;
                        topSegmentCenterX = -widthM/2 + endPanelThickness + topSegmentWidth/2;
                      }
                    }
                  }
                  
                  // 디버그 로그
                  console.log('[DEBUG] 상부 프레임 위치 및 너비 계산:', {
                    topSegmentCenterX: topSegmentCenterX.toFixed(4),
                    topSegmentWidth: topSegmentWidth.toFixed(4),
                    widthM,
                    acWidth: acUnit.width / 1000,
                    spaceType,
                    wallPosition
                  });
                  
                  return (
                    <mesh
                      ref={(mesh) => {
                        if (mesh && !meshRefs.current.topFrame) {
                          meshRefs.current.topFrame = mesh;
                          topFrameMeshRef.current = mesh; // Debug reference
                        }
                      }}
                      position={[
                        topSegmentCenterX,
                        heightM / 2 - topFrameHeight / 2, // 천장에 딱 붙어서 아래로 늘어나도록
                        -depthM / 2 + baseDepth - frameThickness/2
                      ]}
                      receiveShadow
                      castShadow
                    >
                      <boxGeometry
                        args={[
                          topSegmentWidth, // 너비(x): 계산된 상부 프레임 너비
                          topFrameHeight,  // 높이(y): 상부 프레임 높이
                          frameThickness   // 20mm 깊이로 수정
                        ]} 
                      />
                      <meshStandardMaterial
                        color={getFrameColor('top')}
                        opacity={1.0}
                        transparent={false}
                        wireframe={false}
                        roughness={0.9}
                        metalness={0.0}
                      />
                    </mesh>
                  );
                })()}
              </group>
            ) : (
              // 일반: 좌우 프레임 사이 전체를 하나의 프레임으로
              (() => {
                // 좌우 프레임(엔드판넬 포함) 제외한 전체 너비, 통합 공식 사용
                const topSegmentWidth = topFrameWidth;
                // X 위치는 프레임 사이 정중앙
                let topSegmentCenterX = 0;
                
                // 세미스탠딩 모드일 때 위치 조정
                if (spaceType === 'semi-standing') {
                  if (wallPosition === 'left') {
                    // 좌측 벽이 있을 때: 좌측 프레임과 우측 엔드판넬 사이의 중앙으로 위치
                    topSegmentCenterX = (-widthM / 2 + leftFrameWidth + widthM / 2 - endPanelThickness) / 2;
                  } else if (wallPosition === 'right') {
                    // 우측 벽이 있을 때: 좌측 엔드판넬과 우측 프레임 사이의 중앙으로 위치
                    topSegmentCenterX = (-widthM / 2 + endPanelThickness + widthM / 2 - rightFrameWidth) / 2;
                  }
                }
                
                return (
                  <mesh
                    ref={(mesh) => {
                      if (mesh && !meshRefs.current.topFrame) {
                        meshRefs.current.topFrame = mesh;
                        topFrameMeshRef.current = mesh; // Debug reference
                      }
                    }}
                    position={[topSegmentCenterX, heightM / 2 - topFrameHeight / 2, -depthM / 2 + baseDepth - frameThickness/2]}
                    receiveShadow
                    castShadow
                  >
                    <boxGeometry 
                      args={[
                        topSegmentWidth, // 너비(x): 상부 프레임 너비
                        topFrameHeight,  // 높이(y): 상부 프레임 높이 (이전: topFrameWidth)
                        frameThickness   // 20mm 깊이로 수정
                      ]} 
                    />
                    <meshStandardMaterial
                      color={getFrameColor('top')}
                      opacity={1.0}
                      transparent={false}
                      wireframe={false}
                      roughness={0.9}
                      metalness={0.0}
                    />
                  </mesh>
                );
              })()
            )
          )}
        </>
      )}
      
          {/* Dimension Lines - 공간 치수 표시 */}
          {showDimensionLines && (
            <group>
              {/* 점선 가이드라인 - showGuides가 true일 때만 표시 */}
              {showGuides && (
                <>
                  {/* 수평 치수선 - 바닥 및 천장에 가이드 선 추가 */}
                  <line>
                    <bufferGeometry attach="geometry">
                      <bufferAttribute
                        attachObject={['attributes', 'position']}
                        array={new Float32Array([-widthM/2, -heightM/2, 0, widthM/2, -heightM/2, 0])}
                        count={2}
                        itemSize={3}
                      />
                    </bufferGeometry>
                    <lineBasicMaterial attach="material" color="#FFFFFF" linewidth={2} />
                  </line>
                  
                  {/* 천장 수평 가이드 선 추가 */}
                  <line>
                    <bufferGeometry attach="geometry">
                      <bufferAttribute
                        attachObject={['attributes', 'position']}
                        array={new Float32Array([-widthM/2, heightM/2, 0, widthM/2, heightM/2, 0])}
                        count={2}
                        itemSize={3}
                      />
                    </bufferGeometry>
                    <lineBasicMaterial attach="material" color="#FFFFFF" linewidth={2} />
                  </line>
                  
                  {/* 좌측 수직 가이드 선 */}
                  <line>
                    <bufferGeometry attach="geometry">
                      <bufferAttribute
                        attachObject={['attributes', 'position']}
                        array={new Float32Array([-widthM/2, -heightM/2, 0, -widthM/2, heightM/2, 0])}
                        count={2}
                        itemSize={3}
                      />
                    </bufferGeometry>
                    <lineBasicMaterial attach="material" color="#FFFFFF" linewidth={2} />
                  </line>
                  
                  {/* 우측 수직 가이드 선 */}
                  <line>
                    <bufferGeometry attach="geometry">
                      <bufferAttribute
                        attachObject={['attributes', 'position']}
                        array={new Float32Array([widthM/2, -heightM/2, 0, widthM/2, heightM/2, 0])}
                        count={2}
                        itemSize={3}
                      />
                    </bufferGeometry>
                    <lineBasicMaterial attach="material" color="#FFFFFF" linewidth={2} />
                  </line>
                  
                  {/* 중앙 수직 가이드 선 */}
                  <line>
                    <bufferGeometry attach="geometry">
                      <bufferAttribute
                        attachObject={['attributes', 'position']}
                        array={new Float32Array([0, -heightM/2, 0, 0, heightM/2, 0])}
                        count={2}
                        itemSize={3}
                      />
                    </bufferGeometry>
                    <lineBasicMaterial attach="material" color="#FFFFFF" opacity={0.5} transparent linewidth={1} />
                  </line>
                  
                  {/* 중간 높이 수평 가이드 선 */}
                  <line>
                    <bufferGeometry attach="geometry">
                      <bufferAttribute
                        attachObject={['attributes', 'position']}
                        array={new Float32Array([-widthM/2, 0, 0, widthM/2, 0, 0])}
                        count={2}
                        itemSize={3}
                      />
                    </bufferGeometry>
                    <lineBasicMaterial attach="material" color="#FFFFFF" opacity={0.5} transparent linewidth={1} />
                  </line>
                  
                  {/* 에어컨 공간 표시 - 보다 명확하게 */}
                  {hasAirConditioner && (
                    <line>
                      <bufferGeometry attach="geometry">
                        <bufferAttribute
                          attachObject={['attributes', 'position']}
                          array={new Float32Array([
                            acUnit.position === 'left' ? -widthM/2 : widthM/2 - acUnit.width/1000,
                            heightM/2 - acUnit.height/1000,
                            0,
                            acUnit.position === 'left' ? -widthM/2 + acUnit.width/1000 : widthM/2,
                            heightM/2 - acUnit.height/1000,
                            0
                          ])}
                          count={2}
                          itemSize={3}
                        />
                      </bufferGeometry>
                      <lineBasicMaterial attach="material" color="#00C092" linewidth={2} />
                    </line>
                  )}
                </>
              )}
              
              {/* 치수 텍스트 레이블 - showDimensions가 true일 때만 표시 */}
              {showDimensions && (
                <>
                  {/* 하단 받침대 폭 치수 */}
                  <Html
                    position={[
                      // 세미스탠딩 모드일 때 받침대 중앙에 맞춤
                      (() => {if (hasAirConditioner) {if (acUnit.position === "left") {if (spaceType === "built-in") {return -widthM/2 + acUnit.width/1000 + (widthM - acUnit.width/1000 - rightFrameWidth)/2;} else if (spaceType === "semi-standing") {if (wallPosition === "left") {return -widthM/2 + acUnit.width/1000 + (widthM - acUnit.width/1000 - leftFrameWidth - endPanelThickness)/2;} else {return -widthM/2 + acUnit.width/1000 + (widthM - acUnit.width/1000 - rightFrameWidth - endPanelThickness)/2;}} else {return -widthM/2 + acUnit.width/1000 + (widthM - acUnit.width/1000 - endPanelThickness * 2)/2;}} else {if (spaceType === "built-in") {return -widthM/2 + (widthM - acUnit.width/1000 - leftFrameWidth)/2;} else if (spaceType === "semi-standing") {if (wallPosition === "left") {return -widthM/2 + leftFrameWidth + (widthM - acUnit.width/1000 - leftFrameWidth - endPanelThickness)/2;} else {return -widthM/2 + endPanelThickness + (widthM - acUnit.width/1000 - rightFrameWidth - endPanelThickness)/2;}} else {return -widthM/2 + endPanelThickness + (widthM - acUnit.width/1000 - endPanelThickness * 2)/2;}}} else if (spaceType === "semi-standing") {return topFrameCenterX;} else {return 0;}})(), 
                      -heightM/2 - 0.2, 
                      0
                    ]}
                    style={{
                      color: '#FFFFFF',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      transform: 'translate3d(-50%, -25px, 0)',
                      pointerEvents: 'none',
                      whiteSpace: 'nowrap',
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      textAlign: 'center'
                    }}
                  >
                    {(() => {
                      // 단내림 여부에 따라 다른 하부 내경 표시
                      if (hasAirConditioner && acUnit) {
                        // 일반 영역 하부 내경 (단내림 제외)
                        // 공식: 전체 공간 너비 - 단내림 너비 - 분절 엔드패널(20mm) - 반대쪽 세로 프레임(50mm)
                        const mainBaseWidthMm = width - acUnit.width - 20 - 50;
                        return `일반 하부 내경: ${mainBaseWidthMm}mm`;
                      } else {
                        // 단내림이 없을 때 기존 계산 사용
                        let baseWidthMm;
                        if (calculatedBaseWidthValue !== null) {
                          baseWidthMm = calculatedBaseWidthValue;
                        } else if (calculateBaseWidth && editorContext) {
                          baseWidthMm = calculateBaseWidth();
                        } else {
                          baseWidthMm = Math.round(baseWidthCalc * 1000);
                        }
                        return `하부 내경: ${baseWidthMm}mm`;
                      }
                    })()}
                  </Html>

                  {/* 단내림 영역의 하부 내경 치수 - 단내림이 있을 때만 표시 */}
                  {hasAirConditioner && acUnit && (
                    <Html
                      position={[
                        // 단내림 중앙에 정확히 배치
                        acUnit.position === 'left' 
                          ? -widthM/2 + acUnit.width/2000 // 좌측 단내림 중앙
                          : widthM/2 - acUnit.width/2000, // 우측 단내림 중앙
                        -heightM/2 - 0.2, // 하부에 표시
                        0
                      ]}
                      style={{
                        color: '#FFFFFF',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        transform: 'translate3d(-50%, -25px, 0)',
                        pointerEvents: 'none',
                        whiteSpace: 'nowrap',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        textAlign: 'center'
                      }}
                    >
                      {(() => {
                        // 단내림 하부 내경 계산 (mm 단위로 변환)
                        // 공식: 단내림 너비 - 단내림 쪽 세로 프레임(50mm)
                        let acInnerWidthMm = 0;
                        
                        if (acUnit.position === 'left') {
                          // 좌측 단내림
                          acInnerWidthMm = acUnit.width - 50; // 좌측 프레임 50mm 제외
                        } else {
                          // 우측 단내림
                          acInnerWidthMm = acUnit.width - 50; // 우측 프레임 50mm 제외
                        }
                        
                        return `단내림 내경: ${acInnerWidthMm}mm`;
                      })()}
                    </Html>
                  )}

                                      {/* 상단 프레임 폭 치수 */}
                  <Html
                    position={[
                      // 분절된 상부 프레임 중앙에 맞춤
                      (() => {
                        if (hasAirConditioner) {
                          // 단내림이 있을 때: 단내림이 없는 쪽 프레임 중앙에 위치
                          if (acUnit.position === 'left') {
                            // 좌측 단내림: 우측 프레임 영역 중앙
                            if (spaceType === 'built-in') {
                              return -widthM/2 + acUnit.width/1000 + (widthM - acUnit.width/1000 - rightFrameWidth)/2;
                            } else if (spaceType === 'semi-standing') {
                              if (wallPosition === 'left') {
                                return -widthM/2 + acUnit.width/1000 + (widthM - acUnit.width/1000 - leftFrameWidth - endPanelThickness)/2;
                              } else { // wallPosition === 'right'
                                return -widthM/2 + acUnit.width/1000 + (widthM - acUnit.width/1000 - rightFrameWidth - endPanelThickness)/2;
                              }
                            } else { // free-standing
                              return -widthM/2 + acUnit.width/1000 + (widthM - acUnit.width/1000 - endPanelThickness * 2)/2;
                            }
                          } else { // 우측 단내림
                            // 좌측 프레임 영역 중앙
                            if (spaceType === 'built-in') {
                              return -widthM/2 + (widthM - acUnit.width/1000 - leftFrameWidth)/2;
                            } else if (spaceType === 'semi-standing') {
                              if (wallPosition === 'left') {
                                return -widthM/2 + leftFrameWidth + (widthM - acUnit.width/1000 - leftFrameWidth - endPanelThickness)/2;
                              } else { // wallPosition === 'right'
                                return -widthM/2 + endPanelThickness + (widthM - acUnit.width/1000 - rightFrameWidth - endPanelThickness)/2;
                              }
                            } else { // free-standing
                              return -widthM/2 + endPanelThickness + (widthM - acUnit.width/1000 - endPanelThickness * 2)/2;
                            }
                          }
                        } else if (spaceType === 'semi-standing') {
                          // 단내림 없는 세미스탠딩: topFrameCenterX 사용
                          return topFrameCenterX;
                        } else {
                          // 단내림 없는 다른 모드: 중앙
                          return 0;
                        }
                      })(),
                      heightM/2 + 0.25, 
                      0
                    ]}
                    style={{
                      color: '#FFFFFF',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      transform: 'translate3d(-50%, 0, 0)',
                      pointerEvents: 'none',
                      whiteSpace: 'nowrap',
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      textAlign: 'center'
                    }}
                  >
                    {(() => {
                      // 상부 프레임 폭 계산 (mm 단위로 변환)
                      let mainTopFrameWidthMm;
                      
                      // 단내림이 없는 쪽 상부 프레임 계산
                      if (hasAirConditioner) {
                        // 단내림이 있는 경우
                        // 전체 너비에서 좌측 프레임(또는 엔드패널), 우측 프레임(또는 엔드패널), 단내림 상부 프레임 폭을 뺀 값
                        let sideFrameWidthLeft = 0;
                        let sideFrameWidthRight = 0;
                        let acSideFrameWidth = 0;
                        
                        // 좌우측 프레임 또는 엔드패널 폭 결정
                        if (spaceType === 'free-standing') {
                          sideFrameWidthLeft = endPanelThickness * 1000;
                          sideFrameWidthRight = endPanelThickness * 1000;
                        } else if (spaceType === 'semi-standing') {
                          if (wallPosition === 'left') {
                            sideFrameWidthLeft = leftFrameWidth * 1000;
                            sideFrameWidthRight = endPanelThickness * 1000;
                          } else { // wallPosition === 'right'
                            sideFrameWidthLeft = endPanelThickness * 1000;
                            sideFrameWidthRight = rightFrameWidth * 1000;
                          }
                        } else { // built-in
                          sideFrameWidthLeft = leftFrameWidth * 1000;
                          sideFrameWidthRight = rightFrameWidth * 1000;
                        }
                        
                        // 단내림 상부 프레임 폭 계산
                        if (acUnit.position === 'left') {
                          if (spaceType === 'built-in' || (spaceType === 'semi-standing' && wallPosition === 'left')) {
                            acSideFrameWidth = acUnit.width - sideFrameWidthLeft;
                          } else {
                            acSideFrameWidth = acUnit.width - sideFrameWidthLeft;
                          }
                        } else { // 우측 단내림
                          if (spaceType === 'built-in' || (spaceType === 'semi-standing' && wallPosition === 'right')) {
                            acSideFrameWidth = acUnit.width - sideFrameWidthRight;
                          } else {
                            acSideFrameWidth = acUnit.width - sideFrameWidthRight;
                          }
                        }
                        
                        // 공식 수정: 상부 내경 = 공간폭 - 단내림폭 - 분절 엔드패널(20mm) - 반대쪽 세로 프레임(50mm)
                        if (acUnit.position === 'left') {
                          // 좌측 단내림: 전체 너비 - 단내림 너비 - 분절 엔드패널(20mm) - 우측 프레임(50mm)
                          mainTopFrameWidthMm = width - acUnit.width - 20 - 50;
                        } else {
                          // 우측 단내림: 전체 너비 - 단내림 너비 - 분절 엔드패널(20mm) - 좌측 프레임(50mm)
                          mainTopFrameWidthMm = width - acUnit.width - 20 - 50;
                        }
                      } else {
                        // 단내림이 없는 경우 기존 계산 사용
                        mainTopFrameWidthMm = Math.round(topFrameWidth * 1000);
                      }
                      
                      return `상부 내경: ${mainTopFrameWidthMm}mm`;
                    })()}
                  </Html>

                  {/* 좌측 프레임/엔드패널 높이 */}
                  <Html
                    position={[-widthM/2 - 0.52, 0, 0]}
                    style={{
                      color: '#FFFFFF',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      transform: 'translate3d(0, 0, 0)',
                      pointerEvents: 'none',
                      whiteSpace: 'nowrap',
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      textAlign: 'center'
                    }}
                  >
                    {(() => {
                      // 좌측 프레임 또는 엔드패널 높이 계산
                      let leftFrameHeightMm;
                      
                      if (spaceType === 'free-standing' || (spaceType === 'semi-standing' && wallPosition === 'right')) {
                        // 엔드패널인 경우
                        const isLeftAC = hasAirConditioner && acUnit.position === 'left';
                        leftFrameHeightMm = Math.round((isLeftAC ? (heightM - acUnit.height/1000) : heightM) * 1000);
                        return `좌측: ${leftFrameHeightMm}mm`;
                      } else {
                        // 프레임인 경우
                        const isLeftAC = hasAirConditioner && acUnit.position === 'left';
                        leftFrameHeightMm = Math.round((isLeftAC ? (heightM - acUnit.height/1000) : heightM) * 1000);
                        return `좌측: ${leftFrameHeightMm}mm`;
                      }
                    })()}
                  </Html>

                  {/* 우측 프레임/엔드패널 높이 */}
                  <Html
                    position={[widthM/2, 0, 0]}
                    style={{
                      color: '#FFFFFF',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      transform: 'translate3d(0, 0, 0)',
                      pointerEvents: 'none',
                      whiteSpace: 'nowrap',
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      textAlign: 'center',
                      zIndex: 100
                    }}
                  >
                    {(() => {
                      // 우측 프레임 또는 엔드패널 높이 계산
                      let rightFrameHeightMm;
                      
                      if (spaceType === 'free-standing' || (spaceType === 'semi-standing' && wallPosition === 'left')) {
                        // 엔드패널인 경우
                        const isRightAC = hasAirConditioner && acUnit.position === 'right';
                        rightFrameHeightMm = Math.round((isRightAC ? (heightM - acUnit.height/1000) : heightM) * 1000);
                        return `우측: ${rightFrameHeightMm}mm`;
                      } else {
                        // 프레임인 경우
                        const isRightAC = hasAirConditioner && acUnit.position === 'right';
                        rightFrameHeightMm = Math.round((isRightAC ? (heightM - acUnit.height/1000) : heightM) * 1000);
                        return `우측: ${rightFrameHeightMm}mm`;
                      }
                    })()}
                  </Html>
                  
                  {/* 단내림 부분의 프레임 폭 치수 */}
                  {hasAirConditioner && (
                    <Html
                      position={[
                        // 단내림 중앙에 정확히 배치
                        acUnit.position === 'left' 
                          ? -widthM/2 + acUnit.width/2000 // 좌측 단내림 중앙
                          : widthM/2 - acUnit.width/2000, // 우측 단내림 중앙
                        heightM/2 + 0.25, // 상부 프레임 폭과 동일한 y좌표
                        0
                      ]}
                      style={{
                        color: '#FFFFFF',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        transform: 'translate3d(-50%, 0, 0)',
                        pointerEvents: 'none',
                        whiteSpace: 'nowrap',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        textAlign: 'center'
                      }}
                    >
                      {(() => {
                        // 단내림 너비 계산
                        const acWidthMm = acUnit.width;
                        
                        // 단내림 측 프레임 폭 계산
                        let acFrameWidthMm = 0;
                        
                        if (acUnit.position === 'left') {
                          // 좌측 단내림의 경우 좌측 세그먼트 계산
                          if (spaceType === 'built-in' || (spaceType === 'semi-standing' && wallPosition === 'left')) {
                            acFrameWidthMm = Math.round((acUnit.width / 1000 - leftFrameWidth) * 1000);
                          } else {
                            acFrameWidthMm = Math.round((acUnit.width / 1000 - endPanelThickness) * 1000);
                          }
                        } else {
                          // 우측 단내림의 경우 우측 세그먼트 계산
                          if (spaceType === 'built-in' || (spaceType === 'semi-standing' && wallPosition === 'right')) {
                            acFrameWidthMm = Math.round((acUnit.width / 1000 - rightFrameWidth) * 1000);
                          } else {
                            acFrameWidthMm = Math.round((acUnit.width / 1000 - endPanelThickness) * 1000);
                          }
                        }
                        
                        return `단내림 내경: ${acFrameWidthMm}mm`;
                      })()}
                    </Html>
                  )}
                  
                  {/* 에어컨 단내림 치수 표시 삭제 */}
                </>
              )}
            </group>
          )}
        </>
      )}
      
      {/* 모듈 슬롯 (showModuleSlots일 때만 표시) */}
      {showModuleSlots && (
        <ModuleSlots
          totalWidth={width}
          slotCount={doorCount}
          slotStatuses={slotStatuses}
          onSlotHover={onSlotHover}
          onSlotClick={onSlotClick}
          position={[
            // 세미스탠딩 모드에서 엔드판넬 방향으로 치우침 보정 (약 15mm 조정)
            spaceType === 'semi-standing' && wallPosition === 'left' 
              ? baseCenterX - 0.015 // 좌측 벽일 때 오른쪽 엔드판넬 방향으로 치우침 보정
              : spaceType === 'semi-standing' && wallPosition === 'right'
                ? baseCenterX + 0.015 // 우측 벽일 때 왼쪽 엔드판넬 방향으로 치우침 보정
                : baseCenterX, // 다른 모드는 그대로
            -heightM / 2, 
            -depthM/2
          ]} // x 위치를 엔드판넬 방향 반대로 보정 (엔드판넬과 반대 방향으로 15mm 이동)
          baseHeight={baseHeight} // 받침대 높이 전달
          spaceType={placementInfo?.spaceType || 'built-in'}
          wallPosition={placementInfo?.wallPosition || null}
          hasEndPanel={placementInfo?.spaceType !== 'built-in'}
          endPanelSide={
            placementInfo?.spaceType === 'free-standing' ? 'both' : 
            (placementInfo?.spaceType === 'semi-standing' && placementInfo?.wallPosition === 'left' ? 'right' : 
            (placementInfo?.spaceType === 'semi-standing' && placementInfo?.wallPosition === 'right' ? 'left' : 'none'))
          }
          baseWidth={calculatedBaseWidthValue !== null ? calculatedBaseWidthValue : (calculateBaseWidth && editorContext ? calculateBaseWidth() : Math.round(baseWidthCalc * 1000))} // 받침대 너비를 mm 단위로 전달
          baseCenterX={baseCenterX} // 받침대 중앙 X 위치 전달
          endPanelThicknessM={endPanelThickness} // 엔드판넬 두께 전달
          spaceHeight={height} // 공간 높이를 mm 단위로 전달
          showDimension={showDimensions} // 슬롯 치수 표시 여부 전달
          showGuides={true} // 가이드 표시 여부 - 항상 표시되도록 true로 설정
          activeModuleId={null} // null로 설정하여 에러 방지
          // 단내림 관련 props 추가
          hasAirConditioner={hasAirConditioner}
          acUnit={acUnit}
          leftDoorCount={frameProperties?.leftDoorCount || 4}
          rightDoorCount={frameProperties?.rightDoorCount || 4}
          activeLayoutArea={editorContext?.activeLayoutArea || "left"}
        />
      )}
      
      {/* 에어컨 단내림 내부 벽 메쉬 추가 처리 */}
      {viewMode !== 'topView' && hasAirConditioner && (
        <group>
          {/* 세미스탠딩 - 벽이 없는 쪽에 단내림이 있는 경우에도 단내림 기둥 내부/외부 벽 메쉬 생성 */}
          {spaceType === 'semi-standing' && 
           ((wallPosition === 'left' && acUnit.position === 'right') || 
            (wallPosition === 'right' && acUnit.position === 'left')) && (
            <>
              {/* 단내림 기둥 내부 벽면 (안쪽 측벽) */}
              <mesh 
                position={[
                  acUnit.position === 'left' 
                    ? -widthM/2 + acUnit.width/1000 - 0.001  // 좌측 단내림: 단내림 폭만큼 안쪽으로
                    : widthM/2 - acUnit.width/1000 + 0.001,  // 우측 단내림: 단내림 폭만큼 안쪽으로
                  heightM/2 - acUnit.height/2000,  // 천장에서 단내림 높이의 절반만큼 아래로
                  0
                ]} 
                rotation={[0, acUnit.position === 'left' ? -Math.PI/2 : Math.PI/2, 0]}
                receiveShadow={false}
              >
                <planeGeometry args={[depthM - adjustSize, acUnit.height/1000]} />
                <primitive object={acUnit.position === 'left' ? acWallRightMaterial : acWallLeftMaterial} attach="material" />
              </mesh>
              
              {/* 외벽 쪽 단내림 메쉬를 제거했습니다 */}
              
              {/* 단내림 내부 측벽 엔드패널 추가 */}
              <mesh
                position={[
                  getEndPanelCenterX({ widthM, acUnit, endPanelThickness, position: acUnit.position }),
                  0,
                  -depthM/2 + baseDepth/2
                ]}
                receiveShadow={false}
                castShadow={false}
              >
                <boxGeometry 
                  args={[
                    endPanelThickness,
                    heightM,
                    baseDepth
                  ]} 
                />
                <meshStandardMaterial
                  color={getFrameColor('endPanel')}
                  wireframe={false}
                  roughness={0.7}
                  metalness={0.1}
                  opacity={1.0}
                  transparent={false}
                />
              </mesh>
            </>
          )}
          
          {/* 프리스탠딩 - 양쪽에 벽이 없는 경우에도 단내림 기둥 내/외부 벽 메쉬 생성 */}
          {spaceType === 'free-standing' && (
            <>
              {/* 단내림 기둥 내부 벽면 (안쪽 측벽) */}
              <mesh 
                position={[
                  acUnit.position === 'left' 
                    ? -widthM/2 + acUnit.width/1000 - 0.001  // 좌측 단내림: 단내림 폭만큼 안쪽으로
                    : widthM/2 - acUnit.width/1000 + 0.001,  // 우측 단내림: 단내림 폭만큼 안쪽으로
                  heightM/2 - acUnit.height/2000,  // 천장에서 단내림 높이의 절반만큼 아래로
                  0
                ]} 
                rotation={[0, acUnit.position === 'left' ? -Math.PI/2 : Math.PI/2, 0]}
                receiveShadow={false}
              >
                <planeGeometry args={[depthM - adjustSize, acUnit.height/1000]} />
                <primitive object={acUnit.position === 'left' ? acWallRightMaterial : acWallLeftMaterial} attach="material" />
              </mesh>
              
              {/* 외벽 쪽 단내림 메쉬를 제거했습니다 */}

              {/* 단내림 내부 측벽 엔드패널 추가 */}
              <mesh
                position={[
                  getEndPanelCenterX({ widthM, acUnit, endPanelThickness, position: acUnit.position }),
                  0,
                  -depthM/2 + baseDepth/2
                ]}
                receiveShadow={false}
                castShadow={false}
              >
                <boxGeometry 
                  args={[
                    endPanelThickness,
                    heightM,
                    baseDepth
                  ]} 
                />
                <meshStandardMaterial
                  color={getFrameColor('endPanel')}
                  wireframe={false}
                  roughness={0.7}
                  metalness={0.1}
                  opacity={1.0}
                  transparent={false}
                />
              </mesh>
            </>
          )}
        </group>
      )}
    </group>
  );
});

// Camera controller component that handles different projection modes
const CameraController = ({ projectionMode = 'perspective', viewType = 'front', spaceInfo, step = '1', enableRotate = true, enableZoom = true, enablePan = true }) => {
  const { camera, gl, size } = useThree();
  const controls = useRef();
  const [lastInteractionTime, setLastInteractionTime] = useState(Date.now());
  const resetTimerRef = useRef(null);
  
  // 공간 크기에 따라 카메라 거리 계산 (전체 공간이 화면에 꽉 차도록 개선)
  const calculateCameraDistance = useCallback(() => {
    if (!spaceInfo) return { x: 0, y: 0, z: 10 };
  
    // mm에서 m로 변환
    const width = (spaceInfo.width || 4800) / 1000;
    const height = (spaceInfo.height || 2400) / 1000;
    const depth = (spaceInfo.depth || 1500) / 1000;
    
    // 화면 비율 계산
    const aspectRatio = size.width / size.height;
    
    // 카메라의 시야각 (fov)
    const fov = camera ? camera.fov : 45;
    const fovRadians = fov * (Math.PI / 180);
    
    // 수직 방향으로 전체 공간이 보이기 위한 최소 거리 계산
    const verticalDistance = (height / 2) / Math.tan(fovRadians / 2);
    
    // 수평 방향으로 전체 공간이 보이기 위한 최소 거리 계산
    const horizontalDistance = (width / 2) / Math.tan(fovRadians / 2 * aspectRatio);
    
    // 더 큰 값 사용 (전체 공간이 보이도록)
    const baseDistance = Math.max(verticalDistance, horizontalDistance) * 1.1; // 10% 여유 추가
    
    // 스텝별 미세 조정
    let finalDistance = baseDistance;
    
    const currentStep = String(step || '1');
    
    if (currentStep === '2' || currentStep === 2) {
      // 스텝2: 공간 전체가 잘 보이도록 약간 더 멀리
      finalDistance = baseDistance * 1.05;
    } else if (currentStep === '3' || currentStep === 3) {
      // 스텝3: 가구에 초점 유지하되 전체가 보이도록
      finalDistance = baseDistance * 1.02;
    }
    
    // 정면에서 보도록 x, y는 0으로 설정
    return {
      x: 0,
      y: 0,
      z: Math.max(depth + finalDistance, 4.0) // 최소 거리 보장
    };
  }, [spaceInfo, camera, size, step]);
  
  // 마우스/터치 상호작용 핸들러
  const handleInteraction = useCallback(() => {
    setLastInteractionTime(Date.now());
    
    // 기존 리셋 타이머가 있다면 취소
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }
  }, []);
    
  // 카메라 위치 리셋 함수 - 정확히 정면에서 보도록 강제 설정
  const resetCamera = useCallback(() => {
    if (!controls || !controls.current || !camera) return;
    
    const cameraDistance = calculateCameraDistance();
    
    // 정확히 중앙을 향하도록 설정
    const targetPosition = new THREE.Vector3(0, 0, 0);
    
    // 정확히 정면에서 보는 위치로 설정 (정중앙 지향)
    camera.position.set(
      0, // 정확히 가운데에서 바라보기 (좌우 방향)
      0, // 정확히 가운데에서 바라보기 (상하 방향)
      cameraDistance.z
    );
    
    // 컨트롤 타겟도 정확히 중앙으로 설정
    controls.current.target.copy(targetPosition);
    controls.current.update();
    
  }, [camera, calculateCameraDistance]);
  
  // 화면 크기 변경 또는 컴포넌트 마운트 시 카메라 리셋
  useEffect(() => {
    // 컴포넌트 마운트 시 즉시 카메라 리셋
    resetCamera();
  }, [resetCamera, size.width, size.height]);
  
  // 스텝 또는 viewType 변경 시 카메라 위치 리셋
  useEffect(() => {
    try {
      // 즉시 카메라 리셋 (지연 없이)
      resetCamera();
      
      // 컨트롤러에 이벤트 리스너 추가
      const controller = controls?.current;
      if (controller) {
        controller.addEventListener('change', handleInteraction);
      }
      
      return () => {
        if (controller) {
          controller.removeEventListener('change', handleInteraction);
        }
        if (resetTimerRef.current) {
          clearTimeout(resetTimerRef.current);
        }
      };
    } catch (err) {
      console.warn('카메라 컨트롤러 설정 중 오류 발생:', err);
    }
  }, [resetCamera, handleInteraction, viewType, step, spaceInfo]);
  
  // 카메라 회전 제한 - 정면 고정을 위해 회전 비활성화
  return (
    <OrbitControls
      ref={controls}
      enableDamping={true}
      dampingFactor={0.1}
      rotateSpeed={0.5}
      zoomSpeed={0.5}
      // 좌우 회전 각도 제한 (방위각) - +/- 15도
      minAzimuthAngle={-Math.PI / 12} // -15도
      maxAzimuthAngle={Math.PI / 12}  // +15도
      // 상하 회전 각도 제한 (극각) - 중앙에서 +/- 15도
      minPolarAngle={Math.PI / 2 - Math.PI / 12} // 90도 - 15도 = 75도
      maxPolarAngle={Math.PI / 2 + Math.PI / 12} // 90도 + 15도 = 105도
      enableRotate={true}   // 회전 활성화
      enableZoom={true}     // 줌 활성화
      enablePan={true}      // 패닝 활성화
    />
  );
};

// Enhanced dimension display component with better 2D mode visibility
const DimensionIndicator = ({ position, value, label, projectionMode, color = '#ffffff' }) => {
  const style = {
    padding: projectionMode === 'orthographic' ? '4px 8px' : '2px 4px',
    backgroundColor: projectionMode === 'orthographic' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.5)',
    color: projectionMode === 'orthographic' ? '#000000' : '#ffffff',
    fontSize: projectionMode === 'orthographic' ? '16px' : '12px',
    fontWeight: projectionMode === 'orthographic' ? 'bold' : 'normal',
    borderRadius: '4px',
    border: projectionMode === 'orthographic' ? `2px solid ${color}` : 'none',
    userSelect: 'none',
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
  };
  
  return (
    <Html position={position} style={style} center>
      {label}: {value} mm
    </Html>
  );
};

// Scene component renders the 3D scene with Room, lights, etc.
const Scene = ({ spaceInfo, step = '1' }) => {
  // Ensure widthM, depthM, heightM are defined before use
  const widthM = (spaceInfo?.width || 4800) / 1000;
  const depthM = (spaceInfo?.depth || 1500) / 1000;
  const heightM = (spaceInfo?.height || 2400) / 1000;

  return (
    <>
      {/* Ambient light for general scene illumination */}
      <ambientLight intensity={0.6} />
      
      {/* Directional light for shadows and depth */}
      <directionalLight 
        position={[5, 5, 5]} 
        intensity={0.8} 
        castShadow={false} 
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-radius={3}
        shadow-bias={-0.0001}
      />
      
      {/* Room component with space dimensions */}
      <Room 
        spaceInfo={spaceInfo} 
        viewMode="normal"
        showFrame={true}
      />
    </>
  );
};

// --- 엔드판넬 위치 계산 함수 추가 ---
function getAcSoffitInnerWallX({ widthM, acUnit, endPanelThickness, position }) {
  // 단내림 내벽 끝: 좌측 단내림이면 -widthM/2 + acUnit.width/1000, 우측 단내림이면 widthM/2 - acUnit.width/1000
  if (position === 'left') {
    return -widthM/2 + acUnit.width/1000;
  } else {
    return widthM/2 - acUnit.width/1000;
  }
}
function getEndPanelCenterX({ widthM, acUnit, endPanelThickness, position }) {
  // 내벽 끝 - (엔드판넬 두께/2) (좌측 단내림)
  // 내벽 끝 + (엔드판넬 두께/2) (우측 단내림)
  const innerWallX = getAcSoffitInnerWallX({ widthM, acUnit, endPanelThickness, position });
  return position === 'left'
    ? innerWallX - endPanelThickness/2
    : innerWallX + endPanelThickness/2;
}
// ... existing code ...

// Main Room viewer component supporting both 2D and 3D modes
const RoomViewer3D = ({ 
  options, 
  spaceInfo, 
  placementInfo, 
  projectionMode = 'perspective', 
  viewType = 'front', 
  showFrame = true, 
  step, 
  frameData, 
  frameColor = "#555555",  // 기본 프레임 색상을 더 진한 그레이로 변경
  showModuleSlots = false,
  slotStatuses = [],
  onSlotHover,
  onSlotClick,
  showDimensionLines = true,
  showDimensions = true,   // 치수 표시 여부 (길이 수치)
  showGuides = true,        // 가이드 표시 여부 (점선 및 슬롯)
  frameProperties = null,    // 프레임 속성
  activeModuleId = null     // 활성화된 모듈 ID
}) => {
  // Canvas 크기 관련 상태 및 함수
  const containerRef = useRef(null);
  const [webGLSupported, setWebGLSupported] = useState(true);
  const [renderer, setRenderer] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [ready, setReady] = useState(false);
  
  // EditorContext에서 필요한 정보 가져오기
  const editorContext = useEditor();
  const contextFrameProperties = editorContext?.frameProperties || null;
  
  // doorCount 가져오기 및 로깅
  const doorCount = editorContext?.doorCount || 8; // doorCount를 동적으로 가져오기
  console.log('[RoomViewer3D] doorCount from EditorContext:', doorCount);
  
  // props로 전달된 frameProperties가 있으면 우선 사용하고, 없으면 컨텍스트에서 가져옴
  const finalFrameProperties = frameProperties || contextFrameProperties;
  
  // 초기 렌더링 플래그 - 마운트 시 프레임 속성 즉시 적용을 위한 상태
  const [initialRenderDone, setInitialRenderDone] = useState(false);

  // 프레임 속성 변경 시 로그 및 강제 리렌더링을 위한 상태
  const [frameUpdateCount, setFrameUpdateCount] = useState(0);
  const prevFramePropsRef = useRef(null);

  // 프레임 속성 로그 및 변경 감지
  useEffect(() => {
    console.log('[RoomViewer3D] Current frame properties:', finalFrameProperties);
    
    // 이전 속성과 현재 속성 비교 (깊은 비교)
    const prevProps = prevFramePropsRef.current;
    const propsChanged = !prevProps || 
      JSON.stringify(prevProps) !== JSON.stringify(finalFrameProperties);
    
    // 속성이 변경된 경우에만 Room 컴포넌트 업데이트
    if (propsChanged && initialRenderDone && roomRef.current && finalFrameProperties) {
      console.log('[RoomViewer3D] 프레임 속성 변경 감지 - Room 컴포넌트 업데이트');
      
      // 받침대 속성 확인 로그 - 디버깅용
      console.log('[RoomViewer3D] 받침대 속성 확인:', {
        baseHeight: finalFrameProperties.baseHeight || '설정 안됨',
        baseDepth: finalFrameProperties.baseDepth || '설정 안됨'
      });
      
      // Room 컴포넌트 업데이트
      roomRef.current.updateFrameDimensions(finalFrameProperties);
      
      // 변경 사항 저장
      prevFramePropsRef.current = {...finalFrameProperties};
      
      // 프레임 업데이트 카운트 증가 (리렌더링 트리거)
      setFrameUpdateCount(count => count + 1);
    }
  }, [finalFrameProperties, initialRenderDone]);

  // 스텝에 따른 치수 표시 여부 설정
  const shouldShowDimensions = step === undefined ? showDimensions : parseInt(step) >= 3 ? showDimensions : false;
  
  // 컴포넌트 마운트 시 초기 프레임 속성 적용
  useEffect(() => {
    console.log('[RoomViewer3D] 초기 렌더링 - 프레임 속성 초기화:', finalFrameProperties);
    
    // 최초 렌더링 시 EditorContext에서 받아온 프레임 속성이 유효한지 확인
    if (finalFrameProperties) {
      // 받침대 속성 로깅 - 디버깅용
      console.log('[RoomViewer3D] 받침대 속성 확인:', {
        baseHeight: finalFrameProperties.baseHeight,
        baseDepth: finalFrameProperties.baseDepth
      });
      
      // 첫 번째 렌더링 완료 후 즉시 실행
      if (roomRef.current) {
        console.log('[RoomViewer3D] 초기 프레임 속성 적용');
        roomRef.current.updateFrameDimensions(finalFrameProperties);
        setInitialRenderDone(true);
      }
    }
    
    // 초기 설정 후에도 프레임 속성이 변경되면 강제 업데이트 (300ms 지연)
    const updateTimer = setTimeout(() => {
      if (roomRef.current && finalFrameProperties) {
        console.log('[RoomViewer3D] 지연된 프레임 속성 적용 - 시작 시 동기화 보장');
        roomRef.current.updateFrameDimensions(finalFrameProperties);
      }
    }, 300); // 약간 지연시켜 모든 컴포넌트가 마운트된 후 실행
    
    return () => clearTimeout(updateTimer);
  }, []);

  // doorCount 변경 감지를 위한 useEffect
  useEffect(() => {
    console.log('[RoomViewer3D] doorCount 변경 감지:', doorCount);
  }, [doorCount]);
  
  // 프레임 속성 로그
  useEffect(() => {
    console.log('[RoomViewer3D] Current frame properties:', finalFrameProperties);
    // 프레임 속성이 변경될 때마다 강제 리렌더링
    setFrameUpdateCount(prevCount => prevCount + 1);
  }, [finalFrameProperties]);

  // Create a global viewportControl object for external scripts to change view
  useEffect(() => {
    window.viewportControl = {
      setViewType: (type) => {
        // Handle view type change if needed
        console.log('View type changed to:', type);
      }
    };
    
    return () => {
      delete window.viewportControl;
    };
  }, []);
  
  // Room 참조를 위한 ref
  const roomRef = useRef();

  // 프레임 속성 변경 감지 및 Room 컴포넌트 직접 업데이트
  useEffect(() => {
    if (roomRef.current && finalFrameProperties) {
      console.log('[RoomViewer3D] Updating Room component with new frame properties');
      roomRef.current.updateFrameDimensions(finalFrameProperties);
      
      // 단내림 상태가 변경되더라도 가이드 표시 상태는 유지
      if (finalFrameProperties.hasAirConditioner !== undefined) {
        console.log('[RoomViewer3D] 단내림 상태 변경 감지 - 가이드 표시 상태 유지');
        // showGuides 속성 강제 유지 (단내림 유무와 관계없이)
      }
      
      // 변경 사항을 editorContext에도 반영 (양방향 동기화)
      if (editorContext && editorContext.setFrameProperties && 
          frameProperties && JSON.stringify(frameProperties) !== JSON.stringify(editorContext.frameProperties)) {
        console.log('[RoomViewer3D] Syncing frame properties back to EditorContext');
        editorContext.setFrameProperties(frameProperties);
      }
    }
    
    // 색상 정보를 세션 스토리지에 저장 (탭 전환 시 유지)
    if (frameData?.color || frameColor) {
      try {
        sessionStorage.setItem('lastFrameColor', frameData?.color || frameColor);
        console.log('[RoomViewer3D] 프레임 색상 세션 저장:', frameData?.color || frameColor);
      } catch (e) {
        console.warn('세션 스토리지 저장 실패:', e);
      }
    }
  }, [finalFrameProperties, frameProperties, editorContext, frameData, frameColor]);

  // 세션 스토리지에서 마지막 색상 정보 복원 (컴포넌트 마운트 시)
  useEffect(() => {
    try {
      const lastColor = sessionStorage.getItem('lastFrameColor');
      if (lastColor && (!frameData?.color && !frameColor)) {
        console.log('[RoomViewer3D] 세션에서 프레임 색상 복원:', lastColor);
        // 색상 적용 로직 - 필요한 경우 여기에 추가
        setFrameUpdateCount(prev => prev + 1); // 리렌더링 트리거
      }
    } catch (e) {
      console.warn('세션 스토리지 읽기 실패:', e);
    }
    
    // 탭 포커스 복구 시 상태 재검증
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[RoomViewer3D] 탭 포커스 복구 - 상태 재검증');
        if (roomRef.current && finalFrameProperties) {
          // 색상 정보 재적용
          roomRef.current.updateFrameDimensions(finalFrameProperties);
          setFrameUpdateCount(prev => prev + 1);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // 디버깅을 위한 로그 추가
  useEffect(() => {
    console.log('[RoomViewer3D] Rendering with placementInfo:', placementInfo);
    console.log('[RoomViewer3D] Step:', step, 'ShowFrame:', showFrame);
  }, [placementInfo, step, showFrame]);
  
  // Error fallback component
  const ErrorFallback = ({ error }) => (
      <div className={styles.noWebGL}>
      <h3>Rendering Error</h3>
      <p>{error.message}</p>
      </div>
    );
  
  return (
    <div className={styles.roomViewerContainer} ref={containerRef}>
      {!webGLSupported ? (
        <div className={styles.webglError}>
          <h3>WebGL이 지원되지 않습니다</h3>
          <p>최신 브라우저에서 다시 시도해 주세요.</p>
        </div>
      ) : (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Suspense fallback={<div className={styles.loading}>로딩 중...</div>}>
            <Canvas
              style={{ width: '100%', height: '100%' }}
              legacy={false}
              gl={{
                antialias: true,
                alpha: true,
                logarithmicDepthBuffer: true,
                preserveDrawingBuffer: true
              }}
              camera={{
                position: [0, 0, 5], // 카메라 초기 위치 - 정면으로 수정
                fov: 50,
                near: 0.1,
                far: 50
              }}
              onCreated={({ gl }) => {
                gl.setClearColor(0xf5f5f5, 0);
                setRenderer(gl);
                setReady(true);
              }}
            >
              <CameraController 
                projectionMode={projectionMode} 
                viewType={viewType}
                spaceInfo={spaceInfo}
                step={step}
                enableRotate={true}  // 회전 활성화
                enableZoom={true}    // 줌 활성화
                enablePan={true}     // 패닝 활성화
              />
              
              {/* Three.js Scene */}
              <color attach="background" args={['#ffffff']} />
              <fogExp2 attach="fog" args={['#ffffff', 0.08]} />
              
              {/* 조명 설정 */}
              <ambientLight intensity={0.6} />
              <directionalLight 
                position={[0, 5, 10]} // 정면에서 빛이 오도록 조정
                intensity={0.8} 
                castShadow={true} 
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
              />
              <pointLight position={[0, 3, 5]} intensity={0.5} />
              
              {/* 메인 룸 렌더링 */}
              <Room 
                ref={roomRef}
                key={`room-${doorCount}-${frameData?.color || frameColor || 'default'}-${frameUpdateCount}`}
                spaceInfo={spaceInfo}
                viewMode={projectionMode}
                placementInfo={placementInfo}
                showFrame={showFrame}
                frameData={frameData}
                frameColor={frameColor}
                showModuleSlots={showModuleSlots}
                doorCount={doorCount}
                slotStatuses={slotStatuses}
                onSlotHover={onSlotHover}
                onSlotClick={onSlotClick}
                showDimensionLines={showDimensionLines}
                showDimensions={showDimensions}
                showGuides={showGuides}
                frameProperties={finalFrameProperties}
                activeModuleId={null} // null로 설정하여 에러 방지
              />
              
              {/* Scene component */}
              <Scene spaceInfo={spaceInfo} step={step || '1'} />
            </Canvas>
          </Suspense>
        </ErrorBoundary>
      )}
    </div>
  );
};

// Update propTypes to include new props
RoomViewer3D.propTypes = {
  options: PropTypes.object,
  spaceInfo: PropTypes.object,
  placementInfo: PropTypes.object,
  projectionMode: PropTypes.oneOf(['perspective', 'orthographic']),
  viewType: PropTypes.oneOf(['front', 'top', 'left', 'right']),
  showFrame: PropTypes.bool,
  step: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  frameData: PropTypes.object,
  frameColor: PropTypes.string,
  showModuleSlots: PropTypes.bool,
  doorCount: PropTypes.number,
  slotStatuses: PropTypes.arrayOf(PropTypes.string),
  onSlotHover: PropTypes.func,
  onSlotClick: PropTypes.func,
  showDimensionLines: PropTypes.bool,
  showDimensions: PropTypes.bool,
  showGuides: PropTypes.bool,
  frameProperties: PropTypes.object,
  activeModuleId: PropTypes.string
};

export default RoomViewer3D; 

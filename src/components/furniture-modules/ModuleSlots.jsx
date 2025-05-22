import React, { useMemo, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';

// 슬롯 상태에 따른 색상
const slotColors = {
  empty: '#0A8C60', // 빈 슬롯 (진한 그린)
  occupied: '#f44336', // 모듈이 있는 슬롯 (레드)
  hover: '#06704C', // 호버 중인 슬롯 (더 진한 그린)
  selected: '#045A3D', // 선택된 슬롯 (매우 진한 그린)
  invalid: '#9e9e9e' // 배치 불가능한 슬롯 (그레이)
};

// 가이드 선 색상 및 스타일
const GUIDE_LINE_COLOR = '#1A1A1A'; // 진한 회색으로 변경
const GUIDE_LINE_WIDTH = 2; // 선 두께
const GUIDE_LINE_DASH_SIZE = 0.07; // 대시 크기
const GUIDE_LINE_GAP_SIZE = 0.03; // 간격 크기

// 바닥 가이드 슬롯
const ModuleSlot = ({ 
  position, 
  width, 
  height, 
  status = 'empty', 
  onHover, 
  onClick,
  slotIndex,
  showDimension = true, // 내경 치수 표시 여부
  widthInMm, // 슬롯 너비 (mm)
  spaceHeight = 2400, // 공간 높이 (mm)
  baseHeight = 0, // 받침대 높이 (mm)
  topFrameHeight = 50, // 상부 프레임 높이 (mm)
  isSelected = false  // 선택 상태 (활성 모듈인지 여부)
}) => {
  // 슬롯 상태에 따른 색상 설정 - 선택 상태일 경우 분홍색
  const color = isSelected ? '#FFAEBC' : (slotColors[status] || slotColors.empty);
  
  // 슬롯 위치
  const [x, y, z] = position;
  
  // 마우스 이벤트 핸들러
  const handlePointerOver = (e) => {
    e.stopPropagation();
    if (onHover) onHover(slotIndex, true);
  };
  
  const handlePointerOut = (e) => {
    e.stopPropagation();
    if (onHover) onHover(slotIndex, false);
  };
  
  const handleClick = (e) => {
    e.stopPropagation();
    if (onClick) onClick(slotIndex);
  };
  
  // 실제 슬롯 너비 (디버깅용)
  console.log(`[ModuleSlot-${slotIndex}] 실제 너비: ${width}m (${widthInMm}mm), 위치: ${x}m`);
  
  // 공간 내경 높이의 중간 위치 계산 (m 단위)
  const baseHeightM = baseHeight / 1000; // 받침대 높이 (m)
  const topFrameHeightM = topFrameHeight / 1000; // 상부 프레임 높이 (m)
  const spaceHeightM = spaceHeight / 1000; // 공간 총 높이 (m)
  
  // 내경 높이 = 공간 높이 - (받침대 높이 + 상부 프레임 높이)
  const innerHeightM = spaceHeightM - (baseHeightM + topFrameHeightM);
  
  // 내경 중간 높이 = 받침대 높이 + (내경 높이 / 2)
  const innerCenterHeightM = baseHeightM + (innerHeightM / 2);
  
  console.log(`[ModuleSlot-${slotIndex}] 내경 중간 높이: ${innerCenterHeightM}m, 공간높이: ${spaceHeightM}m, 받침대높이: ${baseHeightM}m, 상부프레임높이: ${topFrameHeightM}m`);
  
  return (
    <group>
      <mesh 
        position={[x, y, z]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        {/* 슬롯 너비를 정확하게 사용 - 정확히 슬롯 width로 설정 */}
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={isSelected ? 0.6 : 0.35} 
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* 내경 치수 표시 - z축은 그대로 두고 y축은 공간 내경 높이의 중간에 배치 */}
      {showDimension && (
        <group position={[x, innerCenterHeightM, z - 0.3]}>
          <Text
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
            fontSize={0.06}
            color="#000000"
            anchorX="center"
            anchorY="middle"
            depthTest={false}
            renderOrder={10}
          >
            {`${widthInMm}mm`}
          </Text>
        </group>
      )}
    </group>
  );
};

// 가이드라인 컴포넌트
const GuideLines = ({
  totalWidth,
  slotWidth,
  slotCount,
  leftInset,
  rightInset,
  spaceType,
  wallPosition,
  baseWidth,
  baseCenterX,
  endPanelThicknessM,
  spaceHeight = 2400, // 공간 높이 (mm)
  leftBoundary, // 추가된 파라미터: 왼쪽 경계
  rightBoundary, // 추가된 파라미터: 오른쪽 경계
  startOffset,
  baseHeight = 0, // 받침대 높이 (mm)
  topFrameHeight = 50 // 상부 프레임 높이 (mm), 기본값 50mm
}) => {
  const xAxisLinesRef = useRef();
  const zAxisLinesRef = useRef();
  const horizontalLinesRef = useRef();
  const upperZAxisLinesRef = useRef(); // 상부 Z축 가이드라인을 위한 ref
  
  // spaceHeight를 기반으로 innerHeightM 계산 (mm를 m로 변환)
  const innerHeightM = spaceHeight / 1000;
  const baseHeightM = baseHeight / 1000; // 받침대 높이 (mm)를 m로 변환
  const topFrameHeightM = topFrameHeight / 1000; // 상부 프레임 높이 (mm)를 m로 변환
  
  console.log(`[GuideLines] 공간 높이: ${spaceHeight}mm, 변환된 높이: ${innerHeightM}m`);
  console.log(`[GuideLines] 받침대 높이: ${baseHeight}mm, 변환된 높이: ${baseHeightM}m`);
  console.log(`[GuideLines] 상부 프레임 높이: ${topFrameHeight}mm, 변환된 높이: ${topFrameHeightM}m`);
  
  const HORIZONTAL_GUIDE_LINE_COLOR = GUIDE_LINE_COLOR; // 수평 가이드라인도 같은 색상 사용
  // 상위 정의된 값 사용
  
  const { verticalSegments, zAxisSegments, horizontalSegments, upperZAxisSegments } = useMemo(() => {
    console.log(`[GuideLines] useMemo 내부 - 사용되는 공간 높이: ${spaceHeight}mm, 높이(m): ${innerHeightM}m`);
    
    const vertical = [];
    const zAxis = [];
    const horizontal = [];
    const upperZAxis = []; // 상부 Z축 가이드라인을 위한 배열
    
    // 내경 계산을 위한 변수들
    let innerWidth, slotAdjustedWidth;
    
    // 모든 수직선의 상단을 살짝 올려서 천장 메쉬 문제 해결
    const createVerticalLine = (x, y1, y2, z) => {
      vertical.push(new THREE.Vector3(x, y1, z));
      vertical.push(new THREE.Vector3(x, y2 + 0.001, z));
    };
    
    // Z축 가이드라인을 생성하는 헬퍼 함수
    const createZAxisGuideLines = (x, y, z1, z2) => {
      // 두 개의 세그먼트로 나눔 - 첫 번째는 프레임 바깥쪽
      zAxis.push(new THREE.Vector3(x, y + 0.001, -0.2));
      zAxis.push(new THREE.Vector3(x, y + 0.001, 0));
      
      // 두 번째는 프레임 안쪽
      zAxis.push(new THREE.Vector3(x, y + 0.001, 0));
      zAxis.push(new THREE.Vector3(x, y + 0.001, 1.0));
    };
    
    // 프리스탠딩 모드일 때 - 슬롯과 정확히 일치하는 계산 방식 사용
    if (spaceType === 'free-standing') {
      // leftBoundary와 rightBoundary를 이미 전달받았으므로 직접 사용
      innerWidth = rightBoundary - leftBoundary;
      
      // 슬롯 너비를 전달받은 슬롯 너비 사용
      slotAdjustedWidth = slotWidth;
      
      console.log(`[GuideLines] 프리스탠딩 가이드라인: 좌측=${leftBoundary}m, 우측=${rightBoundary}m, 간격=${slotAdjustedWidth}m`);
      
      // 가이드라인 경계 위치 로깅
      console.log('[GuideLines] 가이드라인 경계 위치:');
      
      // 수직 가이드라인 (슬롯 경계, y축) - H내경 높이에 맞춤
      for (let i = 0; i <= slotCount; i++) {
        // 시작 오프셋을 고려하여 슬롯 경계 계산
        const lineX = leftBoundary + startOffset + (i * slotWidth);
        
        console.log(`  가이드라인 ${i}: ${lineX.toFixed(6)}m`);
        
        // 수직선 (바닥부터 H내경 높이까지)
        vertical.push(new THREE.Vector3(lineX, baseHeightM, 0));
        vertical.push(new THREE.Vector3(lineX, innerHeightM - topFrameHeightM, 0));
        console.log(`[GuideLines] 수직선 ${i} 생성 - 시작: ${baseHeightM}m, 끝: ${innerHeightM - topFrameHeightM}m`);
        
        // 하부 Z축 가이드라인 (바닥에 평행하게, 깊이 방향) - 정확히 수직선의 시작점에서 시작
        zAxis.push(new THREE.Vector3(lineX, baseHeightM, 0));
        zAxis.push(new THREE.Vector3(lineX, baseHeightM, 0.8));
        
        // 상부 Z축 가이드라인은 여기서 생성하지 않고 별도로 처리
        // 별도 배열(upperZAxis)에 추가 - 정확히 수직선의 끝점에서 시작
        upperZAxis.push(new THREE.Vector3(lineX, innerHeightM - topFrameHeightM, 0));
        upperZAxis.push(new THREE.Vector3(lineX, innerHeightM - topFrameHeightM, 0.8));
      }
      
      // 수평 가이드라인 (좌우 방향)
      // 바닥 경계
      horizontal.push(new THREE.Vector3(leftBoundary, baseHeightM, 0));
      horizontal.push(new THREE.Vector3(rightBoundary, baseHeightM, 0));
      
      // 천장 경계 (내경 높이 - 상부 프레임 높이)
      horizontal.push(new THREE.Vector3(leftBoundary, innerHeightM - topFrameHeightM, 0));
      horizontal.push(new THREE.Vector3(rightBoundary, innerHeightM - topFrameHeightM, 0));
    } else if (baseWidth && baseCenterX) {
      // 받침대가 있는 경우 - 받침대 기준으로 계산
      // leftBoundary와 rightBoundary를 이미 전달받았으므로 직접 사용
      innerWidth = rightBoundary - leftBoundary;
      slotAdjustedWidth = slotWidth;
      
      // 세미스탠딩 모드에서 가이드라인 위치 보정
      let adjustedStartOffset = startOffset;
      
      // 수직 가이드라인 (슬롯 경계, y축) - H내경 높이에 맞춤
      for (let i = 0; i <= slotCount; i++) {
        // 시작 오프셋을 고려하여 슬롯 경계 계산
        const lineX = leftBoundary + adjustedStartOffset + (i * slotWidth);
        
        // 가이드라인 위치 로깅 (디버깅용)
        if (i === 0 || i === slotCount) {
          console.log(`[GuideLines] ${spaceType} - ${i === 0 ? '첫' : '마지막'} 가이드라인 위치: ${lineX.toFixed(6)}m`);
        }
        
        // 수직선 (바닥부터 H내경 높이까지)
        vertical.push(new THREE.Vector3(lineX, baseHeightM, 0));
        vertical.push(new THREE.Vector3(lineX, innerHeightM - topFrameHeightM, 0));
        console.log(`[GuideLines] 수직선 ${i} 생성 - 시작: ${baseHeightM}m, 끝: ${innerHeightM - topFrameHeightM}m`);
        
        // 하부 Z축 가이드라인 (바닥에 평행하게, 깊이 방향) - 정확히 수직선의 시작점에서 시작
        zAxis.push(new THREE.Vector3(lineX, baseHeightM, 0));
        zAxis.push(new THREE.Vector3(lineX, baseHeightM, 0.8));
        
        // 상부 Z축 가이드라인은 여기서 생성하지 않고 별도로 처리
        // 별도 배열(upperZAxis)에 추가 - 정확히 수직선의 끝점에서 시작
        upperZAxis.push(new THREE.Vector3(lineX, innerHeightM - topFrameHeightM, 0));
        upperZAxis.push(new THREE.Vector3(lineX, innerHeightM - topFrameHeightM, 0.8));
      }
      
      // 수평 가이드라인 (좌우 방향)
      // 바닥 경계
      horizontal.push(new THREE.Vector3(leftBoundary, baseHeightM, 0));
      horizontal.push(new THREE.Vector3(rightBoundary, baseHeightM, 0));
      
      // 천장 경계 (내경 높이 - 상부 프레임 높이)
      horizontal.push(new THREE.Vector3(leftBoundary, innerHeightM - topFrameHeightM, 0));
      horizontal.push(new THREE.Vector3(rightBoundary, innerHeightM - topFrameHeightM, 0));
    } else {
      // 일반적인 경우 (빌트인, 세미스탠딩) - 같은 방식 사용
      // leftBoundary와 rightBoundary를 이미 전달받았으므로 직접 사용
      innerWidth = rightBoundary - leftBoundary;
      slotAdjustedWidth = slotWidth;
      
      // 세미스탠딩 모드에서 가이드라인 위치 보정
      let adjustedStartOffset = startOffset;
      if (spaceType === 'semi-standing') {
        // 세미스탠딩 모드에서 엔드판넬 방향 가이드라인 보정
        if (wallPosition === 'left') {
          // 우측 엔드판넬 방향으로 보정 (고정 보정값 사용)
          const adjustValue = 0.025; // 좌측 벽일 경우 25mm 고정값 보정 (15mm에서 증가)
          adjustedStartOffset = startOffset - adjustValue; // 고정값으로 가이드라인 조정
          console.log(`[GuideLines] 세미스탠딩(좌측벽) 가이드라인 보정 적용: ${adjustValue}m`);
        } else if (wallPosition === 'right') {
          // 좌측 엔드판넬 방향으로 보정 (고정 보정값 사용)
          const adjustValue = 0.025; // 우측 벽일 경우 25mm 고정값 보정 (15mm에서 증가)
          adjustedStartOffset = startOffset - adjustValue; // 고정값으로 가이드라인 조정
          console.log(`[GuideLines] 세미스탠딩(우측벽) 가이드라인 보정 적용: ${adjustValue}m`);
        }
      }
      
      // 수직 가이드라인 (슬롯 경계, y축) - H내경 높이에 맞춤
      for (let i = 0; i <= slotCount; i++) {
        // 시작 오프셋을 고려하여 슬롯 경계 계산
        const lineX = leftBoundary + adjustedStartOffset + (i * slotWidth);
        
        // 가이드라인 위치 로깅 (디버깅용)
        if (i === 0 || i === slotCount) {
          console.log(`[GuideLines] ${spaceType} - ${i === 0 ? '첫' : '마지막'} 가이드라인 위치: ${lineX.toFixed(6)}m`);
        }
        
        // 수직선 (바닥부터 H내경 높이까지)
        vertical.push(new THREE.Vector3(lineX, baseHeightM, 0));
        vertical.push(new THREE.Vector3(lineX, innerHeightM - topFrameHeightM, 0));
        console.log(`[GuideLines] 수직선 ${i} 생성 - 시작: ${baseHeightM}m, 끝: ${innerHeightM - topFrameHeightM}m`);
        
        // 하부 Z축 가이드라인 (바닥에 평행하게, 깊이 방향) - 정확히 수직선의 시작점에서 시작
        zAxis.push(new THREE.Vector3(lineX, baseHeightM, 0));
        zAxis.push(new THREE.Vector3(lineX, baseHeightM, 0.8));
        
        // 상부 Z축 가이드라인은 여기서 생성하지 않고 별도로 처리
        // 별도 배열(upperZAxis)에 추가 - 정확히 수직선의 끝점에서 시작
        upperZAxis.push(new THREE.Vector3(lineX, innerHeightM - topFrameHeightM, 0));
        upperZAxis.push(new THREE.Vector3(lineX, innerHeightM - topFrameHeightM, 0.8));
      }
      
      // 수평 가이드라인 (좌우 방향)
      // 바닥 경계
      horizontal.push(new THREE.Vector3(leftBoundary, baseHeightM, 0));
      horizontal.push(new THREE.Vector3(rightBoundary, baseHeightM, 0));
      
      // 천장 경계 (내경 높이 - 상부 프레임 높이)
      horizontal.push(new THREE.Vector3(leftBoundary, innerHeightM - topFrameHeightM, 0));
      horizontal.push(new THREE.Vector3(rightBoundary, innerHeightM - topFrameHeightM, 0));
    }
    
    return { 
      verticalSegments: vertical,
      zAxisSegments: zAxis,
      horizontalSegments: horizontal,
      upperZAxisSegments: upperZAxis
    };
  }, [
    totalWidth, 
    slotWidth, 
    slotCount, 
    leftInset, 
    rightInset, 
    spaceType, 
    wallPosition, 
    baseWidth, 
    baseCenterX, 
    endPanelThicknessM,
    innerHeightM, // 내경 높이 의존성 추가
    leftBoundary, 
    rightBoundary,
    startOffset,
    baseHeight, // 받침대 높이 의존성 추가
    topFrameHeight // 상부 프레임 높이 의존성 추가
  ]);
  
  // 상부 Z축 가이드라인 geometry 생성
  const upperZAxisGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(upperZAxisSegments);
    
    // 명시적으로 라인 거리 계산
    const lineDistances = [];
    let totalDistance = 0;
    
    for (let i = 0; i < upperZAxisSegments.length; i += 2) {
      lineDistances.push(0);
      
      const distance = upperZAxisSegments[i].distanceTo(upperZAxisSegments[i + 1]);
      totalDistance += distance;
      
      lineDistances.push(distance);
    }
    
    geometry.setAttribute(
      'lineDistance',
      new THREE.Float32BufferAttribute(lineDistances, 1)
    );
    
    return geometry;
  }, [upperZAxisSegments]);
  
  // geometry 생성
  const verticalGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(verticalSegments);
    
    // 명시적으로 라인 거리 계산
    const lineDistances = [];
    let totalDistance = 0;
    
    for (let i = 0; i < verticalSegments.length; i += 2) {
      lineDistances.push(0);
      
      const distance = verticalSegments[i].distanceTo(verticalSegments[i + 1]);
      totalDistance += distance;
      
      lineDistances.push(distance);
    }
    
    geometry.setAttribute(
      'lineDistance',
      new THREE.Float32BufferAttribute(lineDistances, 1)
    );
    
    return geometry;
  }, [verticalSegments]);
  
  const zAxisGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(zAxisSegments);
    
    // 명시적으로 라인 거리 계산
    const lineDistances = [];
    let totalDistance = 0;
    
    for (let i = 0; i < zAxisSegments.length; i += 2) {
      lineDistances.push(0);
      
      const distance = zAxisSegments[i].distanceTo(zAxisSegments[i + 1]);
      totalDistance += distance;
      
      lineDistances.push(distance);
    }
    
    geometry.setAttribute(
      'lineDistance',
      new THREE.Float32BufferAttribute(lineDistances, 1)
    );
    
    return geometry;
  }, [zAxisSegments]);
  
  const horizontalGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(horizontalSegments);
    
    // 명시적으로 라인 거리 계산
    const lineDistances = [];
    let totalDistance = 0;
    
    for (let i = 0; i < horizontalSegments.length; i += 2) {
      lineDistances.push(0);
      
      const distance = horizontalSegments[i].distanceTo(horizontalSegments[i + 1]);
      totalDistance += distance;
      
      lineDistances.push(distance);
    }
    
    geometry.setAttribute(
      'lineDistance',
      new THREE.Float32BufferAttribute(lineDistances, 1)
    );
    
    return geometry;
  }, [horizontalSegments]);
  
  // computeLineDistances 호출을 위한 useEffect 사용
  useEffect(() => {
    // 모든 라인 세그먼트에 대해 정확한 거리 계산을 보장
    requestAnimationFrame(() => {
      console.log('[GuideLines] 가이드라인 거리 계산 수행 - 애니메이션 프레임에서 실행');
      if (xAxisLinesRef.current) {
        xAxisLinesRef.current.computeLineDistances();
        console.log('[GuideLines] X축 가이드라인 거리 계산 완료', 
          xAxisLinesRef.current.geometry.getAttribute('lineDistance'));
      }
      if (zAxisLinesRef.current) {
        zAxisLinesRef.current.computeLineDistances();
        console.log('[GuideLines] Z축 가이드라인 거리 계산 완료', 
          zAxisLinesRef.current.geometry.getAttribute('lineDistance'));
      }
      if (horizontalLinesRef.current) {
        horizontalLinesRef.current.computeLineDistances();
        console.log('[GuideLines] 수평 가이드라인 거리 계산 완료', 
          horizontalLinesRef.current.geometry.getAttribute('lineDistance'));
      }
      if (upperZAxisLinesRef.current) {
        upperZAxisLinesRef.current.computeLineDistances();
        console.log('[GuideLines] 상부 Z축 가이드라인 거리 계산 완료', 
          upperZAxisLinesRef.current.geometry.getAttribute('lineDistance'));
      }
    });
  });
  
  return (
    <group>
      {/* 수직 가이드선 (Y축) */}
      <lineSegments ref={xAxisLinesRef} geometry={verticalGeometry}>
        <lineDashedMaterial 
          color={GUIDE_LINE_COLOR} 
          dashSize={GUIDE_LINE_DASH_SIZE} 
          gapSize={GUIDE_LINE_GAP_SIZE} 
          linewidth={GUIDE_LINE_WIDTH}
          opacity={1.0}
          transparent={false}
          depthTest={false}
          renderOrder={10}
          scale={1.5}
        />
      </lineSegments>
      
      {/* Z축 가이드선 (깊이 방향) */}
      <lineSegments ref={zAxisLinesRef} geometry={zAxisGeometry}>
        <lineDashedMaterial 
          color="#1A1A1A" 
          dashSize={0.07} 
          gapSize={0.05} 
          linewidth={15}
          opacity={1.0}
          transparent={false}
          depthTest={false}
          depthWrite={false}
          alphaTest={0}
          renderOrder={15000}
          scale={1.5}
          polygonOffset={true}
          polygonOffsetFactor={-100}
          polygonOffsetUnits={-100}
        />
      </lineSegments>
      
      {/* 상부 Z축 가이드선 (천장 위에 표시) */}
      <lineSegments ref={upperZAxisLinesRef} geometry={upperZAxisGeometry}>
        <lineDashedMaterial 
          color="#1A1A1A" 
          dashSize={0.07} 
          gapSize={0.05} 
          linewidth={15}
          opacity={1.0}
          transparent={false}
          depthTest={false}
          depthWrite={false}
          alphaTest={0}
          renderOrder={30000}
          scale={1.5}
          polygonOffset={true}
          polygonOffsetFactor={-400}
          polygonOffsetUnits={-400}
        />
      </lineSegments>
      
      {/* 수평 가이드선 (X축) */}
      <lineSegments ref={horizontalLinesRef} geometry={horizontalGeometry}>
        <lineDashedMaterial 
          color={HORIZONTAL_GUIDE_LINE_COLOR} 
          dashSize={GUIDE_LINE_DASH_SIZE} 
          gapSize={GUIDE_LINE_GAP_SIZE} 
          linewidth={GUIDE_LINE_WIDTH}
          opacity={1.0}
          transparent={false}
          depthTest={false}
          renderOrder={10}
          scale={1.5}
        />
      </lineSegments>
    </group>
  );
};

// 슬롯들을 생성하는 메인 컴포넌트
const ModuleSlots = ({ 
  totalWidth, // 총 너비 (mm)
  slotCount,  // 슬롯 개수
  slotStatuses = [], // 슬롯 상태 배열
  onSlotHover,  // 슬롯 호버 이벤트
  onSlotClick,  // 슬롯 클릭 이벤트
  position = [0, 0, 0], // 슬롯 그룹 위치
  baseHeight = 0, // 받침대 높이 (mm)
  hasEndPanel = false, // 엔드 패널 유무
  endPanelSide = 'both', // 엔드 패널 위치: 'left', 'right', 'both', 'none'
  spaceType = 'built-in', // 공간 유형 (built-in, semi-standing, free-standing)
  wallPosition = null, // 벽 위치 (세미 스탠딩에서 'left' 또는 'right')
  endPanelThicknessM, // 엔드판넬 두께 (mm)
  baseWidth, // 받침대 너비 (mm)
  baseCenterX, // 받침대 중앙 X 위치 (m)
  spaceHeight = 2400, // 공간 높이 (mm) 추가
  topFrameHeight = 50, // 상부 프레임 높이 (mm)
  activeModuleId = null, // 활성화된 모듈 ID
  selectedModules = [], // 선택된 모듈 배열 (기존 컴포넌트와의 호환성 유지)
  // 단내림 관련 새로운 props
  hasAirConditioner = false, // 단내림 유무
  acUnit = null, // 단내림 유닛 정보
  leftDoorCount = 4, // 좌측 영역 도어 개수
  rightDoorCount = 4, // 우측 영역 도어 개수
  activeLayoutArea = "left" // 현재 활성화된 레이아웃 영역
}) => {
  // mm를 m로 변환
  const totalWidthM = totalWidth / 1000;
  const baseHeightM = baseHeight / 1000;
  const baseWidthM = baseWidth ? baseWidth / 1000 : null;
  
  // 프레임 및 엔드판넬 두께 상수
  const standardFrameWidthM = 0.05; // 표준 프레임 폭 (50mm)
  const safeEndPanelThicknessM = endPanelThicknessM || 0.02; // 안전한 엔드판넬 두께 기본값
  
  // 디버깅: 인자 값들 출력
  console.log(`[ModuleSlots] 전체 정보 - 유형: ${spaceType}, 벽 위치: ${wallPosition || '없음'}, 엔드패널: ${hasEndPanel}, 위치: ${endPanelSide}`);
  console.log(`[ModuleSlots] 전체 폭: ${totalWidth}mm = ${totalWidthM}m, 슬롯 개수: ${slotCount}`);
  console.log(`[ModuleSlots] 받침대 너비: ${baseWidth ? baseWidth : '정보 없음'}, 받침대 중앙 X: ${baseCenterX || 0}`);
  console.log(`[ModuleSlots] 엔드판넬 두께: ${safeEndPanelThicknessM * 1000}mm`);
  
  // 단내림 정보
  console.log(`[ModuleSlots] 단내림 상태: ${hasAirConditioner ? '있음' : '없음'}, 위치: ${acUnit?.position || '없음'}`);
  console.log(`[ModuleSlots] 도어 개수 - 좌측: ${leftDoorCount}, 우측: ${rightDoorCount}, 활성 영역: ${activeLayoutArea}`);

  // 공간 유형에 따른 내경 경계 설정 (좌우 inset 값)
  let leftInset, rightInset;
  let frameDescription = "";
  
  if (spaceType === 'free-standing') {
    // 프리스탠딩: 양쪽에 엔드판넬 (각 20mm)
    leftInset = safeEndPanelThicknessM; // 좌측 엔드판넬
    rightInset = safeEndPanelThicknessM; // 우측 엔드판넬
    frameDescription = "프리스탠딩: 공간 넓이 - (좌측 엔드판넬 + 우측 엔드판넬)";
  } else if (spaceType === 'semi-standing') {
    // 세미 스탠딩: 벽 있는 쪽은 표준 프레임(50mm), 벽 없는 쪽은 엔드판넬(20mm)
    if (wallPosition === 'left') {
      leftInset = standardFrameWidthM; // 왼쪽 벽: 표준 프레임 (50mm)
      rightInset = safeEndPanelThicknessM; // 오른쪽: 엔드판넬
      frameDescription = "세미스탠딩(좌측벽): 공간 넓이 - (좌측 프레임 + 우측 엔드판넬)";
    } else { // wallPosition === 'right'
      leftInset = safeEndPanelThicknessM; // 왼쪽: 엔드판넬
      rightInset = standardFrameWidthM; // 오른쪽 벽: 표준 프레임 (50mm)
      frameDescription = "세미스탠딩(우측벽): 공간 넓이 - (좌측 엔드판넬 + 우측 프레임)";
    }
  } else {
    // 빌트인: 기본값은 양쪽 표준 프레임(50mm)
    leftInset = standardFrameWidthM; // 왼쪽: 표준 프레임 (50mm)
    rightInset = standardFrameWidthM; // 오른쪽: 표준 프레임 (50mm)
    frameDescription = "빌트인: 공간 넓이 - (좌측 프레임 + 우측 프레임)";
    
    // 엔드패널 옵션이 있으면 해당 설정 적용
    if (hasEndPanel) {
      if (endPanelSide === 'left' || endPanelSide === 'both') {
        leftInset = safeEndPanelThicknessM; // 왼쪽: 엔드판넬
        frameDescription = endPanelSide === 'both' 
          ? "빌트인(양쪽 엔드패널): 공간 넓이 - (좌측 엔드판넬 + 우측 엔드판넬)"
          : "빌트인(좌측 엔드패널): 공간 넓이 - (좌측 엔드판넬 + 우측 프레임)";
      }
      if (endPanelSide === 'right' || endPanelSide === 'both') {
        rightInset = safeEndPanelThicknessM; // 오른쪽: 엔드판넬
        if (endPanelSide !== 'both') {
          frameDescription = "빌트인(우측 엔드패널): 공간 넓이 - (좌측 프레임 + 우측 엔드판넬)";
        }
      }
    }
  }
  
  console.log(`[ModuleSlots] ${frameDescription}`);
  console.log(`[ModuleSlots] 좌측여백: ${leftInset * 1000}mm, 우측여백: ${rightInset * 1000}mm`);
  
  // 내경 계산 정보
  const leftInsetMm = leftInset * 1000;
  const rightInsetMm = rightInset * 1000;
  const totalInsetMm = leftInsetMm + rightInsetMm;
  const innerWidthMm = totalWidth - totalInsetMm;
  
  console.log(`[ModuleSlots] 내경 계산식: ${totalWidth}mm - (${leftInsetMm}mm + ${rightInsetMm}mm) = ${innerWidthMm}mm`);
  
  // 슬롯 배열 생성
  const slots = useMemo(() => {
    const items = [];
    
    // 공통 변수들
    const totalHalfWidth = totalWidthM / 2;
    
    // 슬롯 너비 제한값 (mm)
    const MIN_SLOT_WIDTH_MM = 300;
    const MAX_SLOT_WIDTH_MM = 600;
    const MIN_SLOT_WIDTH_M = MIN_SLOT_WIDTH_MM / 1000;
    const MAX_SLOT_WIDTH_M = MAX_SLOT_WIDTH_MM / 1000;
    
    // 내경 유효 너비 계산
    let innerWidth, leftBoundary, rightBoundary, slotWidth, slotWidthMm, adjustedSlotCount;
    let firstSlotX, slots = [];
    let leftAreaSlotWidth, rightAreaSlotWidth, acLeftEdge, acRightEdge;
    
    // 슬롯 개수와 너비 조정 로직
    const calculateOptimalSlotConfiguration = (availableWidth, requestedSlotCount) => {
      // 요청된 슬롯 개수로 나눴을 때 슬롯 너비
      const initialSlotWidth = availableWidth / requestedSlotCount;
      const initialSlotWidthMm = initialSlotWidth * 1000;
      
      console.log(`[ModuleSlots] 초기 슬롯 너비 검사: ${initialSlotWidthMm.toFixed(2)}mm (최소 ${MIN_SLOT_WIDTH_MM}mm, 최대 ${MAX_SLOT_WIDTH_MM}mm)`);
      
      // 슬롯 너비가 최소/최대 제한 범위 내에 있는지 확인
      if (initialSlotWidthMm >= MIN_SLOT_WIDTH_MM && initialSlotWidthMm <= MAX_SLOT_WIDTH_MM) {
        // 조건 만족 - 요청된 슬롯 개수와 계산된 너비 사용
        return {
          slotCount: requestedSlotCount,
          slotWidth: initialSlotWidth,
          slotWidthMm: Math.round(initialSlotWidthMm)
        };
      } 
      // 슬롯 너비가 최소값보다 작은 경우 - 슬롯 개수 감소
      else if (initialSlotWidthMm < MIN_SLOT_WIDTH_MM) {
        // 가능한 최대 슬롯 개수 계산 (최소 너비 기준)
        const maxPossibleSlots = Math.floor(availableWidth / (MIN_SLOT_WIDTH_MM / 1000));
        // 조정된 슬롯 너비 계산 (균등 분할)
        const adjustedWidth = availableWidth / maxPossibleSlots;
        
        console.log(`[ModuleSlots] 슬롯 너비가 너무 작음: 슬롯 개수 ${requestedSlotCount}→${maxPossibleSlots} 조정`);
        
        return {
          slotCount: maxPossibleSlots,
          slotWidth: adjustedWidth,
          slotWidthMm: Math.round(adjustedWidth * 1000)
        };
      } 
      // 슬롯 너비가 최대값보다 큰 경우 - 슬롯 개수 증가
      else if (initialSlotWidthMm > MAX_SLOT_WIDTH_MM) {
        // 필요한 최소 슬롯 개수 계산 (최대 너비 기준)
        const minRequiredSlots = Math.ceil(availableWidth / (MAX_SLOT_WIDTH_MM / 1000));
        // 조정된 슬롯 너비 계산 (균등 분할)
        const adjustedWidth = availableWidth / minRequiredSlots;
        
        console.log(`[ModuleSlots] 슬롯 너비가 너무 큼: 슬롯 개수 ${requestedSlotCount}→${minRequiredSlots} 조정`);
        
        return {
          slotCount: minRequiredSlots,
          slotWidth: adjustedWidth,
          slotWidthMm: Math.round(adjustedWidth * 1000)
        };
      }
    };
    
    // 슬롯 계산 전 기본 경계 계산
    if (baseWidth && baseWidthM) {
      // 받침대 너비로 슬롯 너비 설정
      leftBoundary = baseCenterX - (baseWidthM / 2);
      rightBoundary = baseCenterX + (baseWidthM / 2);
    } else if (spaceType === 'free-standing') {
      // 프리스탠딩 모드 특별 처리
      // 내경 반폭 = 전체 반폭 - 엔드판넬 두께
      const innerHalfWidth = totalHalfWidth - safeEndPanelThicknessM;
      
      // 내경 경계 설정 (좌우 엔드패널 안쪽)
      leftBoundary = -innerHalfWidth;
      rightBoundary = innerHalfWidth;
    } else {
      // 빌트인과 세미스탠딩 모드
      leftBoundary = -totalHalfWidth + leftInset;
      rightBoundary = totalHalfWidth - rightInset;
    }
    
    innerWidth = rightBoundary - leftBoundary;
    
    // regularWidthM을 항상 정의하도록 초기화
    let regularWidthM = innerWidth; // 기본값으로 전체 내경 너비 설정
    
    if (hasAirConditioner && acUnit) {
      // 1. 단내림 유닛 위치 및 크기 계산
      const acWidthM = acUnit.width / 1000; // mm -> m 변환 (정확히 acUnit.width 사용)
      const acPosition = acUnit.position || 'left';
      
      // 단내림 유닛의 왼쪽/오른쪽 경계 계산 - 단내림 쪽 프레임 폭은 제외
      if (acPosition === 'left') {
        // 좌측에 단내림 위치 - 좌측 프레임 제외
        acLeftEdge = leftBoundary; // 좌측 경계는 그대로 (프레임 안쪽 경계)
        acRightEdge = leftBoundary + acWidthM; // 정확히 acUnit.width만큼만 사용
      } else {
        // 우측에 단내림 위치 - 우측 프레임 제외
        acLeftEdge = rightBoundary - acWidthM; // 정확히 acUnit.width만큼만 사용
        acRightEdge = rightBoundary; // 우측 경계는 그대로 (프레임 안쪽 경계)
      }
      
      console.log(`[ModuleSlots] 단내림 정확한 경계: 좌=${acLeftEdge}m, 우=${acRightEdge}m, 너비=${(acRightEdge-acLeftEdge)*1000}mm (요청 너비: ${acUnit.width}mm)`);
      
      // 2. 일반 구간 경계 계산 (단내림 구간만 제외)
      let regularLeftEdge, regularRightEdge;
      
      if (acPosition === 'left') {
        // 좌측 단내림일 경우 일반 구간은 오른쪽
        // 단내림 끝나는 지점부터 시작 (세로 프레임 포함)
        regularLeftEdge = acRightEdge; // 단내림 우측 경계부터 시작
        regularRightEdge = rightBoundary; // 우측 끝까지
      } else {
        // 우측 단내림일 경우 일반 구간은 왼쪽
        regularLeftEdge = leftBoundary; // 좌측 끝부터 시작
        regularRightEdge = acLeftEdge; // 단내림 좌측 경계까지
      }
      
      regularWidthM = regularRightEdge - regularLeftEdge;
      const regularWidthMm = regularWidthM * 1000;
      
      console.log(`[ModuleSlots] 단내림 유형: ${acPosition}측, 세로 프레임 폭도 슬롯 내경에 포함`);
      console.log(`[ModuleSlots] 일반 구간 경계: 좌=${regularLeftEdge.toFixed(4)}m, 우=${regularRightEdge.toFixed(4)}m, 너비=${regularWidthMm.toFixed(1)}mm`);
      console.log(`[ModuleSlots] 단내림 구간(${acPosition}측)은 슬롯을 생성하지 않음`);
      
      // 상부 내경 - acUnit.width 계산
      const topInnerWidthMm = innerWidth * 1000; // 상부 전체 내경 (mm)
      const acWidthMm = acUnit.width; // 단내림 너비 (mm)
      console.log(`[ModuleSlots] 상부 내경: ${topInnerWidthMm}mm`);
      console.log(`[ModuleSlots] 단내림 영역 계산 - 위치: ${acPosition}, 단내림 내경: ${acWidthMm}mm, 일반 구간: ${regularWidthMm}mm`);
      console.log(`[ModuleSlots] 단내림+일반 구간 합: ${acWidthMm + regularWidthMm}mm (상부 내경: ${topInnerWidthMm}mm)`);
      
      // 3. 일반 구간만 슬롯 생성 (단내림 구간은 슬롯 생성 안함)
      // 일반 구간 슬롯 개수 계산 (전체 슬롯 개수 사용)
      const config = calculateOptimalSlotConfiguration(regularWidthM, slotCount);
      
      slotWidth = config.slotWidth;
      slotWidthMm = config.slotWidthMm;
      adjustedSlotCount = config.slotCount;
      
      console.log(`[ModuleSlots] 일반 구간 슬롯 계산: ${adjustedSlotCount}개 (${slotWidthMm}mm)`);
      
      // 첫 번째 슬롯 중앙 위치 조정 (센터 정렬)
      const totalSlotWidth = slotWidth * adjustedSlotCount;
      const startOffset = (regularWidthM - totalSlotWidth) / 2;
      
      // 가이드라인이 상부 프레임 양쪽 끝과 일치하도록 조정
      const adjustedStartOffset = 0; // 시작점을 정확히 왼쪽 경계에 맞춤
      const adjustedSlotWidth = regularWidthM / adjustedSlotCount; // 슬롯 너비를 전체 내경으로 균등 분할
      
      console.log(`[ModuleSlots] 가이드라인 조정: 프레임 양끝에 맞춤 (원래 시작점: ${startOffset.toFixed(4)}m → 조정: ${adjustedStartOffset}m)`);
      console.log(`[ModuleSlots] 슬롯 너비 조정: ${slotWidth.toFixed(4)}m → ${adjustedSlotWidth.toFixed(4)}m (균등 분할)`);
      
      // 슬롯 생성 (일반 구간만)
      for (let i = 0; i < adjustedSlotCount; i++) {
        // 슬롯 중앙 위치 계산 - 균등하게 분배
        const slotX = regularLeftEdge + adjustedStartOffset + (i * adjustedSlotWidth) + (adjustedSlotWidth / 2);
        const status = slotStatuses[i] || 'empty';
        
        items.push({
          position: [slotX, 0, 0.3],
          width: adjustedSlotWidth, // 조정된 너비 사용
          height: 0.6,
          status,
          index: i,
          widthInMm: Math.round(adjustedSlotWidth * 1000), // 조정된 너비(mm)
          area: acPosition === 'left' ? "right" : "left" // 단내림 반대쪽 영역 표시
        });
      }
      
    } else {
      // 단내림이 없는 경우 - 기존 로직
      // 슬롯 너비 및 위치 계산 (받침대가 있으면 받침대 너비로, 없으면 기존 계산식 사용)
      if (baseWidth && baseWidthM) {
        // 받침대 너비로 슬롯 너비 설정
        // 슬롯 너비 제한 적용
        const config = calculateOptimalSlotConfiguration(innerWidth, slotCount);
        slotWidth = config.slotWidth;
        slotWidthMm = config.slotWidthMm;
        adjustedSlotCount = config.slotCount;
        
        // 첫 번째 슬롯 중앙 위치 조정 (센터 정렬)
        const totalSlotWidth = slotWidth * adjustedSlotCount;
        let startOffset = (innerWidth - totalSlotWidth) / 2;
        
        // 세미스탠딩도 빌트인과 동일하게 처리 (보정값 제거)
        let adjustedStartOffset = startOffset;
        
        // 첫 번째 슬롯 중앙 위치 계산
        firstSlotX = leftBoundary + adjustedStartOffset + (slotWidth / 2);
        
        console.log(`[ModuleSlots] 받침대 기준 슬롯: 경계=[${leftBoundary}m, ${rightBoundary}m], 내경=${innerWidth}m, 슬롯=${adjustedSlotCount}개, 너비=${slotWidth}m(${slotWidthMm}mm)`);
        
        for (let i = 0; i < adjustedSlotCount; i++) {
          const slotX = leftBoundary + adjustedStartOffset + (i * slotWidth) + (slotWidth / 2);
          const status = slotStatuses[i] || 'empty';
          
          items.push({
            position: [slotX, 0, 0.3],
            width: slotWidth,
            height: 0.6,
            status,
            index: i,
            widthInMm: slotWidthMm
          });
        }
      } else if (spaceType === 'free-standing') {
        // 슬롯 너비 제한 적용
        const config = calculateOptimalSlotConfiguration(innerWidth, slotCount);
        slotWidth = config.slotWidth;
        slotWidthMm = config.slotWidthMm;
        adjustedSlotCount = config.slotCount;
        
        // 첫 번째 슬롯 중앙 위치 조정 (센터 정렬)
        const totalSlotWidth = slotWidth * adjustedSlotCount;
        let startOffset = (innerWidth - totalSlotWidth) / 2;
        
        // 세미스탠딩도 빌트인과 동일하게 처리 (보정값 제거)
        let adjustedStartOffset = startOffset;
        
        // 첫 번째 슬롯 중앙 위치 계산
        firstSlotX = leftBoundary + adjustedStartOffset + (slotWidth / 2);
        
        console.log(`[ModuleSlots] 프리스탠딩 슬롯: 좌측경계=${leftBoundary}m, 우측경계=${rightBoundary}m, 내경=${innerWidth}m, 슬롯=${adjustedSlotCount}개, 너비=${slotWidth}m(${slotWidthMm}mm)`);
        
        // 슬롯 경계 디버깅 정보 출력 - 가이드라인과 비교 용도
        console.log('[ModuleSlots] 프리스탠딩 슬롯 경계 위치:');
        for (let i = 0; i <= adjustedSlotCount; i++) {
          const boundaryPos = leftBoundary + adjustedStartOffset + (i * slotWidth);
          console.log(`  경계 ${i}: ${boundaryPos.toFixed(6)}m`);
        }
        
        // 슬롯 생성
        for (let i = 0; i < adjustedSlotCount; i++) {
          // 슬롯 중앙 위치 계산
          const slotX = leftBoundary + adjustedStartOffset + (i * slotWidth) + (slotWidth / 2);
          const status = slotStatuses[i] || 'empty';
          
          items.push({
            position: [slotX, 0, 0.3],
            width: slotWidth,
            height: 0.6,
            status,
            index: i,
            widthInMm: slotWidthMm
          });
        }
      } else {
        // 빌트인과 세미스탠딩 모드
        // 슬롯 너비 제한 적용
        const config = calculateOptimalSlotConfiguration(innerWidth, slotCount);
        slotWidth = config.slotWidth;
        slotWidthMm = config.slotWidthMm;
        adjustedSlotCount = config.slotCount;
        
        // 첫 번째 슬롯 중앙 위치 조정 (센터 정렬)
        const totalSlotWidth = slotWidth * adjustedSlotCount;
        let startOffset = (innerWidth - totalSlotWidth) / 2;
        
        // 세미스탠딩도 빌트인과 동일하게 처리 (보정값 제거)
        let adjustedStartOffset = startOffset;
        
        // 첫 번째 슬롯 중앙 위치 계산
        firstSlotX = leftBoundary + adjustedStartOffset + (slotWidth / 2);
        
        console.log(`[ModuleSlots] 빌트인/세미 슬롯: 좌측경계=${leftBoundary}m, 우측경계=${rightBoundary}m, 내경=${innerWidth}m, 슬롯=${adjustedSlotCount}개, 너비=${slotWidth}m(${slotWidthMm}mm)`);
        
        for (let i = 0; i < adjustedSlotCount; i++) {
          // 슬롯 중앙 위치 계산
          const slotX = leftBoundary + adjustedStartOffset + (i * slotWidth) + (slotWidth / 2);
          const status = slotStatuses[i] || 'empty';
          
          items.push({
            position: [slotX, 0, 0.3],
            width: slotWidth,
            height: 0.6,
            status,
            index: i,
            widthInMm: slotWidthMm
          });
        }
      }
    }
    
    return {
      items,
      adjustedSlotCount,
      startOffset: hasAirConditioner 
                 ? (regularWidthM - (slotWidth * adjustedSlotCount)) / 2 
                 : (innerWidth - (slotWidth * adjustedSlotCount)) / 2,
      leftBoundary,
      rightBoundary,
      innerWidth,
      slotWidth,
      // 단내림 관련 정보
      acLeftEdge,
      acRightEdge,
      hasAcUnit: hasAirConditioner
    };
  }, [
    totalWidthM, 
    slotCount, 
    slotStatuses, 
    leftInset, 
    rightInset, 
    spaceType, 
    wallPosition, 
    hasEndPanel, 
    endPanelSide, 
    totalWidth, 
    baseWidth, 
    baseWidthM, 
    baseCenterX, 
    safeEndPanelThicknessM,
    // 단내림 관련 의존성 추가
    hasAirConditioner,
    acUnit,
    leftDoorCount,
    rightDoorCount
  ]);
  
  const [x, y, z] = position;
  
  // 디버깅 정보를 콘솔에 출력하기 위한 컴포넌트
  const DebugInfo = () => {
    useEffect(() => {
      if (spaceType === 'free-standing') {
        // 프리스탠딩 계산 정보
        const totalHalfWidth = totalWidthM / 2;
        const innerHalfWidth = totalHalfWidth - safeEndPanelThicknessM;
        const leftBoundary = -innerHalfWidth;
        const rightBoundary = innerHalfWidth;
        const innerWidth = rightBoundary - leftBoundary;
        const slotWidth = innerWidth / slotCount;
        
        console.log('%c[프리스탠딩 디버그 정보]', 'background: #222; color: #bada55; font-size: 16px;');
        console.log('전체 너비:', totalWidthM, 'm =', totalWidth, 'mm');
        console.log('엔드패널 두께:', safeEndPanelThicknessM, 'm =', safeEndPanelThicknessM * 1000, 'mm');
        console.log('내경 경계 좌:', leftBoundary, 'm');
        console.log('내경 경계 우:', rightBoundary, 'm');
        console.log('내경 너비:', innerWidth, 'm =', innerWidth * 1000, 'mm');
        console.log('슬롯 개수:', slotCount);
        console.log('슬롯 너비:', slotWidth, 'm =', slotWidth * 1000, 'mm');
        
        // 슬롯 경계 위치 계산
        console.log('슬롯 경계 위치:');
        for (let i = 0; i <= slotCount; i++) {
          const boundaryPos = leftBoundary + (i * slotWidth);
          console.log(`  경계 ${i}: ${boundaryPos.toFixed(6)}m`);
        }
        
        // 슬롯 중앙 위치 계산
        console.log('슬롯 중앙 위치:');
        for (let i = 0; i < slotCount; i++) {
          const centerPos = leftBoundary + (slotWidth / 2) + (i * slotWidth);
          console.log(`  슬롯 ${i} 중앙: ${centerPos.toFixed(6)}m, 너비: ${slotWidth.toFixed(6)}m`);
        }
      }
      
      // 단내림 관련 디버깅 정보 추가
      if (hasAirConditioner && acUnit) {
        console.log('%c[단내림 디버그 정보]', 'background: #222; color: #ffcc00; font-size: 16px;');
        console.log('단내림 위치:', acUnit.position);
        console.log('단내림 너비:', acUnit.width, 'mm');
        console.log('좌측 도어 개수:', leftDoorCount);
        console.log('우측 도어 개수:', rightDoorCount);
        console.log('활성 영역:', activeLayoutArea);
        
        // 슬롯 관련 디버깅
        if (slots && slots.items) {
          console.log('단내림 좌측 경계:', slots.acLeftEdge ? slots.acLeftEdge.toFixed(3) : '계산 안됨', 'm');
          console.log('단내림 우측 경계:', slots.acRightEdge ? slots.acRightEdge.toFixed(3) : '계산 안됨', 'm');
          console.log('세로 프레임 폭:', standardFrameWidthM * 1000, 'mm (슬롯 내경에 포함됨)');
          console.log('슬롯 너비:', slots.slotWidth ? (slots.slotWidth * 1000).toFixed(0) : '계산 안됨', 'mm');
          console.log('슬롯 개수:', slots.adjustedSlotCount);
          console.log('슬롯 생성 방식: 단내림 구간은 슬롯 생성 안함, 단내림과 일반 구간 사이 세로 프레임 폭 포함');
          
          // 모든 슬롯의 영역과 상태 출력
          console.log('슬롯 영역 정보:');
          slots.items.forEach((slot, idx) => {
            console.log(`  슬롯 ${idx}: 영역=${slot.area || "기본"}, 상태=${slot.status}, 중앙위치=${slot.position[0].toFixed(3)}m`);
          });
        }
      }
    }, []);
    
    return null;
  };
  
  // 활성화된 모듈 ID 디버깅 로그
  console.log('[ModuleSlots] 활성화된 모듈 ID:', activeModuleId);
  
  return (
    <>
      {/* 디버깅 정보 */}
      <DebugInfo />
      
      {/* 가이드 라인 */}
      <group position={[x, y, z]}>
        {hasAirConditioner ? (
          // 단내림이 있는 경우 일반 구간에만 가이드라인 렌더링
          <GuideLines 
            key={`guidelines-regular-${spaceType}-${wallPosition || 'none'}-${acUnit?.position || 'left'}`}
            totalWidth={totalWidthM} 
            slotWidth={slots.slotWidth}
            slotCount={slots.adjustedSlotCount}
            leftInset={0}
            rightInset={0}
            spaceType={spaceType}
            wallPosition={wallPosition}
            baseWidth={baseWidth}
            baseCenterX={baseCenterX}
            endPanelThicknessM={safeEndPanelThicknessM}
            spaceHeight={spaceHeight}
            // 단내림 경계를 그대로 사용 (세로 프레임 폭 포함)
            leftBoundary={acUnit?.position === 'left' ? 
              slots.acRightEdge : // 단내림 우측 경계부터 시작
              slots.leftBoundary}
            rightBoundary={acUnit?.position === 'right' ? 
              slots.acLeftEdge : // 단내림 좌측 경계까지
              slots.rightBoundary}
            startOffset={slots.startOffset}
            baseHeight={baseHeight}
            topFrameHeight={topFrameHeight}
          />
        ) : (
          // 단내림이 없는 경우 기존 가이드라인 렌더링
          <GuideLines 
            key={`guidelines-${spaceType}-${wallPosition || 'none'}-${leftInset}-${rightInset}-${baseWidth || 0}-${safeEndPanelThicknessM}`}
            totalWidth={totalWidthM} 
            slotWidth={slots.slotWidth}
            slotCount={slots.adjustedSlotCount}
            leftInset={leftInset}
            rightInset={rightInset}
            spaceType={spaceType}
            wallPosition={wallPosition}
            baseWidth={baseWidth}
            baseCenterX={baseCenterX}
            endPanelThicknessM={safeEndPanelThicknessM}
            spaceHeight={spaceHeight}
            leftBoundary={slots.leftBoundary}
            rightBoundary={slots.rightBoundary}
            startOffset={slots.startOffset}
            baseHeight={baseHeight}
            topFrameHeight={topFrameHeight}
          />
        )}
      </group>
      
      {/* 슬롯들 */}
      <group position={[x, y + baseHeightM + 0.001, z - 0.001]}>
        {slots.items.map(slot => {
          // 선택 여부 확인 - 문자열/숫자 모두 고려
          const isSelected = activeModuleId !== null && 
            (String(activeModuleId) === String(slot.index) || 
             (activeModuleId.toString().startsWith('모듈') && 
              slot.index === parseInt(activeModuleId.toString().replace('모듈', ''), 10) - 1));
          
          // 단내림이 있을 때 활성 영역에 해당하는 슬롯만 강조
          const isActiveArea = !hasAirConditioner || !slot.area || slot.area === activeLayoutArea;
          
          if (isSelected) {
            console.log(`[ModuleSlots] 슬롯 ${slot.index} 선택됨 (activeModuleId: ${activeModuleId})`);
          }
          
          return (
            <ModuleSlot
              key={`slot-${slot.index}`}
              position={slot.position}
              width={slot.width}
              height={slot.height}
              status={isActiveArea ? slot.status : 'invalid'}
              onHover={isActiveArea ? onSlotHover : null}
              onClick={isActiveArea ? onSlotClick : null}
              slotIndex={slot.index}
              showDimension={isActiveArea}
              widthInMm={slot.widthInMm}
              spaceHeight={spaceHeight}
              baseHeight={baseHeight}
              topFrameHeight={topFrameHeight}
              isSelected={isSelected && isActiveArea}
            />
          );
        })}
      </group>
    </>
  );
};

ModuleSlots.propTypes = {
  totalWidth: PropTypes.number.isRequired,
  slotCount: PropTypes.number.isRequired,
  slotStatuses: PropTypes.arrayOf(PropTypes.string),
  onSlotHover: PropTypes.func,
  onSlotClick: PropTypes.func,
  position: PropTypes.arrayOf(PropTypes.number),
  baseHeight: PropTypes.number,
  hasEndPanel: PropTypes.bool,
  endPanelSide: PropTypes.string,
  spaceType: PropTypes.string,
  wallPosition: PropTypes.string,
  endPanelThicknessM: PropTypes.number,
  baseWidth: PropTypes.number,
  baseCenterX: PropTypes.number,
  spaceHeight: PropTypes.number,
  topFrameHeight: PropTypes.number,
  activeModuleId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  selectedModules: PropTypes.array,
  hasAirConditioner: PropTypes.bool,
  acUnit: PropTypes.object,
  leftDoorCount: PropTypes.number,
  rightDoorCount: PropTypes.number,
  activeLayoutArea: PropTypes.string
};

ModuleSlots.defaultProps = {
  slotStatuses: [],
  position: [0, 0, 0],
  baseHeight: 0,
  hasEndPanel: false,
  endPanelSide: 'both',
  spaceType: 'built-in',
  wallPosition: null,
  topFrameHeight: 50,
  activeModuleId: null,
  selectedModules: [],
  hasAirConditioner: false,
  acUnit: null,
  leftDoorCount: 4,
  rightDoorCount: 4,
  activeLayoutArea: "left"
};

export default ModuleSlots; 
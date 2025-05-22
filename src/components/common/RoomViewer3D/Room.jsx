import React, { useState, forwardRef, useImperativeHandle, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import * as THREE from 'three';
import ModuleSlots from '../../furniture-modules/ModuleSlots';
import { Html } from '@react-three/drei';

// Room component renders the 3D room with walls, floor, and ceiling
const Room = forwardRef(({ spaceInfo, viewMode = 'normal', placementInfo, wallOpacity = 0.75, outlineMode = false, showFrame = true, frameColor = '#555555', frameData, showModuleSlots = false, doorCount = 8, slotStatuses = [], onSlotHover, onSlotClick, showDimensionLines = false, showDimensions = true, showGuides = true, frameProperties = null, activeModuleId = null }, ref) => {
  console.log('[Room] Props received:', { spaceInfo, viewMode, placementInfo, showFrame, wallOpacity, frameColor });
  console.log('[Room] Frame Properties:', frameProperties);

  // --- Frame width state (for dynamic adjustment) ---
  const [leftFrameWidth, setLeftFrameWidth] = useState(0.05); // 50mm
  const [rightFrameWidth, setRightFrameWidth] = useState(0.05); // 50mm
  const [topFrameWidth, setTopFrameWidth] = useState(0.05); // 50mm
  
  // 받침대 관련 상태 추가
  const [baseFrameHeight, setBaseFrameHeight] = useState(0.08); // 80mm
  const [baseFrameDepth, setBaseFrameDepth] = useState(0.58); // 580mm
  
  // 엔드패널 두께 상태 추가
  const [endPanelThickness, setEndPanelThickness] = useState(0.02); // 20mm
  
  // 프레임 속성이 변경되면 상태 업데이트
  useEffect(() => {
    if (frameProperties) {
      console.log('[Room] 프레임 속성 변경 감지:', frameProperties);
      
      // 모든 프레임 속성 업데이트
      setLeftFrameWidth(frameProperties.leftFrameWidth ? frameProperties.leftFrameWidth / 1000 : 0.05);
      setRightFrameWidth(frameProperties.rightFrameWidth ? frameProperties.rightFrameWidth / 1000 : 0.05);
      setTopFrameWidth(frameProperties.topFrameHeight ? frameProperties.topFrameHeight / 1000 : 0.05);
      
      // 받침대 속성 업데이트 추가
      setBaseFrameHeight(frameProperties.baseHeight ? frameProperties.baseHeight / 1000 : 0.08);
      setBaseFrameDepth(frameProperties.baseDepth ? frameProperties.baseDepth / 1000 : 0.58);
      
      // 엔드패널 두께 업데이트
      setEndPanelThickness(frameProperties.endPanelThickness ? frameProperties.endPanelThickness / 1000 : 0.02);
      
      console.log('[Room] 받침대 속성 업데이트:', {
        baseHeight: frameProperties.baseHeight,
        baseDepth: frameProperties.baseDepth
      });
    }
  }, [frameProperties]);

  // 외부에서 프레임 치수를 업데이트할 수 있는 메서드를 노출
  useImperativeHandle(ref, () => ({
    updateFrameDimensions: (newFrameProperties) => {
      console.log('[Room] updateFrameDimensions 호출됨:', newFrameProperties);
      
      if (newFrameProperties) {
        // 유효한 값이 있는 경우에만 각 상태 업데이트
        if (newFrameProperties.leftFrameWidth) {
          setLeftFrameWidth(newFrameProperties.leftFrameWidth / 1000);
        }
        
        if (newFrameProperties.rightFrameWidth) {
          setRightFrameWidth(newFrameProperties.rightFrameWidth / 1000);
        }
        
        if (newFrameProperties.topFrameHeight) {
          setTopFrameWidth(newFrameProperties.topFrameHeight / 1000);
        }
        
        // 받침대 속성 업데이트 추가
        if (newFrameProperties.baseHeight) {
          setBaseFrameHeight(newFrameProperties.baseHeight / 1000);
        }
        
        if (newFrameProperties.baseDepth) {
          setBaseFrameDepth(newFrameProperties.baseDepth / 1000);
        }
        
        // 엔드패널 두께 업데이트
        if (newFrameProperties.endPanelThickness) {
          setEndPanelThickness(newFrameProperties.endPanelThickness / 1000);
        }
        
        console.log('[Room] 프레임 치수 업데이트 완료:', {
          leftFrameWidth: leftFrameWidth * 1000, 
          rightFrameWidth: rightFrameWidth * 1000,
          topFrameHeight: topFrameWidth * 1000,
          baseHeight: baseFrameHeight * 1000,
          baseDepth: baseFrameDepth * 1000,
          endPanelThickness: endPanelThickness * 1000
        });
      }
    }
  }));

  // outlineMode 강제로 false로 설정
  const _outlineMode = false;  // 항상 false로 설정하여 2D 모드와 충돌 방지
  
  // 안전하게 값 추출하기 위한 기본값 설정
  const {
    width = 4200,
    depth = 2400,
    height = 2400,
    spaceType: originalSpaceType = 'built-in',
    wallPosition: originalWallPosition = 'left',
    hasAirConditioner = false,
    acUnit = { position: 'left', width: 850, depth: 200, height: 580 },
    hasFloorFinish: rawHasFloorFinish = false,
    floorFinishType = 'wood',
    floorThickness = 0
  } = spaceInfo || {};

  // Convert string values ('yes'/'no') to boolean
  const hasFloorFinish = rawHasFloorFinish === true || rawHasFloorFinish === 'yes';

  // spaceType 및 wallPosition 로직 개선 - 항상 벽이 보이도록 수정
  const spaceType = placementInfo?.type || spaceInfo?.spaceType || 'built-in';
  
  // 스탠딩 유형을 정규화: 'standing' → 'free-standing', 'semi-standing' 유지
  const normalizedSpaceType = spaceType === 'standing' ? 'free-standing' : 
                             (spaceType === 'semi-standing' ? 'semi-standing' : 'built-in');
  
  // 세미 스탠딩인 경우에만 wallPosition 값 사용
  const wallPosition = normalizedSpaceType === 'semi-standing' ? 
                     (placementInfo?.wallPosition || spaceInfo?.wallPosition || 'left') : null;
  
  console.log('[Room] Space type:', normalizedSpaceType, 'Wall position:', wallPosition, 'Show frame:', showFrame);
  
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
  
  // 받침대 정보 추출 - 우선순위 : 1) 상태값, 2) placementInfo, 3) 기본값
  const baseHeight = placementInfo?.baseHeight || Math.round(baseFrameHeight * 1000) || 80;
  const baseHeightM = baseFrameHeight || baseHeight / 1000;
  const baseDepth = placementInfo?.baseDepth || Math.round(baseFrameDepth * 1000) || 580;
  const baseDepthM = baseFrameDepth || baseDepth / 1000;
  const hasBase = placementInfo?.hasBase === true || baseHeight > 0;
  
  console.log('[Room] Base settings:', { 
    baseFrameHeight: baseFrameHeight * 1000,
    baseFrameDepth: baseFrameDepth * 1000,
    baseHeight, 
    baseHeightM, 
    baseDepth,
    baseDepthM, 
    hasBase: placementInfo?.hasBase,
    hasBaseResult: hasBase
  });
  
  // 배치 타입 정보 추출
  const placementType = placementInfo?.placementType || 'floor';
  const raiseHeight = placementInfo?.raiseHeight || 0;
  const raiseHeightM = raiseHeight / 1000;

  console.log('[Room] Dimensions in meters:', { widthM, heightM, depthM, floorThicknessM });
  
  // Frame colors
  const getFrameColor = (frameName) => {
    // 선택한 색상을 약간 더 진하게 조정하여 렌더링 후 원래 색상에 더 가깝게 표현
    // 포커스된 프레임인 경우 강조 색상 사용
    const focused = placementInfo?.focusedFrame;
    if (focused === frameName) {
      return "#00C092"; // 강조 색상
    }
    
    // frameData에서 색상 정보가 있으면 해당 색상 사용
    if (frameData && frameData.color) {
      try {
        const color = frameData.color;
        console.log(`[Room] frameData에서 색상 사용 (${frameName}): ${color}`);
        
        // 색상 강화 처리 (선명하게 보이도록)
        const r = parseInt(color.substring(1, 3), 16);
        const g = parseInt(color.substring(3, 5), 16);
        const b = parseInt(color.substring(5, 7), 16);
        
        const enhancedR = Math.min(255, Math.round(r * 1.1));
        const enhancedG = Math.min(255, Math.round(g * 1.1));
        const enhancedB = Math.min(255, Math.round(b * 1.1));
        
        return '#' + 
          enhancedR.toString(16).padStart(2, '0') + 
          enhancedG.toString(16).padStart(2, '0') + 
          enhancedB.toString(16).padStart(2, '0');
      } catch (e) {
        console.warn('색상 변환 오류, 원본 색상 사용:', frameData.color);
        return frameData.color;
      }
    }
    
    // frameColor prop이 설정되어 있으면 해당 색상 사용
    if (frameColor) {
      try {
        console.log(`[Room] frameColor에서 색상 사용 (${frameName}): ${frameColor}`);
        
        // 색상 강화 처리 (선명하게 보이도록)
        const r = parseInt(frameColor.substring(1, 3), 16);
        const g = parseInt(frameColor.substring(3, 5), 16);
        const b = parseInt(frameColor.substring(5, 7), 16);
        
        const enhancedR = Math.min(255, Math.round(r * 1.1));
        const enhancedG = Math.min(255, Math.round(g * 1.1));
        const enhancedB = Math.min(255, Math.round(b * 1.1));
        
        return '#' + 
          enhancedR.toString(16).padStart(2, '0') + 
          enhancedG.toString(16).padStart(2, '0') + 
          enhancedB.toString(16).padStart(2, '0');
      } catch (e) {
        console.warn('색상 변환 오류, 원본 색상 사용:', frameColor);
        return frameColor;
      }
    }
    
    // 기본 색상 - 모든 모드에서 동일한 기본 색상 사용
    console.log(`[Room] 기본 색상 사용 (${frameName}): #555555, spaceType: ${normalizedSpaceType}`);
    return '#555555';
  };
  
  // Frame opacity based on fitting
  const getFrameOpacity = (frameName) => {
    if (placementInfo && placementInfo.fit === 'tight') {
      return 0.5; // 50% opacity for 'tight' fit
    }
    return 1.0; // Full opacity for regular fit
  };

  // 상부, 하부 내경 계산 함수 추가
  const calculateBaseWidth = () => {
    // 받침대 너비 계산 (mm 단위로 반환)
    if (normalizedSpaceType === 'free-standing') {
      return Math.round((widthM - endPanelThickness * 2) * 1000);
    } else if (normalizedSpaceType === 'semi-standing') {
      // 세미스탠딩: 벽쪽 프레임과 반대쪽 엔드판넬 고려
      if (wallPosition === 'left') {
        return Math.round((widthM - leftFrameWidth - endPanelThickness) * 1000);
      } else { // wallPosition === 'right'
        return Math.round((widthM - rightFrameWidth - endPanelThickness) * 1000);
      }
    } else {
      // 빌트인: 양쪽 프레임을 뺀 값
      if (hasAirConditioner && acUnit) {
        // 단내림이 있는 경우 분절 엔드패널 고려
        // 공식 수정: 상부 내경 = 공간 전체 너비 - 단내림 너비 - 분절 엔드패널(20mm) - 반대쪽 세로 프레임(50mm)
        const endPanelThicknessMm = 20; // 고정값 20mm
        if (acUnit.position === 'left') {
          return Math.round((widthM - (acUnit.width/1000) - (endPanelThicknessMm/1000) - rightFrameWidth) * 1000);
        } else {
          return Math.round((widthM - (acUnit.width/1000) - (endPanelThicknessMm/1000) - leftFrameWidth) * 1000);
        }
      } else {
        return Math.round((widthM - leftFrameWidth - rightFrameWidth) * 1000);
      }
    }
  };

  // Calculate wardrobe dimensions
  const calculateWardrobeDimensions = () => {
    return {
      width: widthM,
      height: heightM,
      depth: depthM,
      color: '#fafafa' // Light color for wardrobe
    };
  };

  const wardrobeDimensions = calculateWardrobeDimensions();
  
  // --- 벽 렌더링 여부 판단 - 조건 명확화 ---
  // 좌측 벽: 빌트인이거나, 세미스탠딩일 때 우측벽이 아닌 경우만 렌더링
  const shouldRenderLeftWall = normalizedSpaceType === 'built-in' || 
                              (normalizedSpaceType === 'semi-standing' && wallPosition !== 'right');
  
  // 우측 벽: 빌트인이거나, 세미스탠딩일 때 좌측벽이 아닌 경우만 렌더링
  const shouldRenderRightWall = normalizedSpaceType === 'built-in' || 
                                (normalizedSpaceType === 'semi-standing' && wallPosition !== 'left');
  
  // 뒷벽: 프리스탠딩이 아닌 경우만 렌더링
  const shouldRenderBackWall = normalizedSpaceType !== 'free-standing';

  console.log('[Room] Wall rendering conditions:', {
    leftWall: shouldRenderLeftWall,
    rightWall: shouldRenderRightWall,
    backWall: shouldRenderBackWall
  });

  // Frame placement logic
  const frameThickness = 0.02;  // Frame thickness (20mm)
  const endPanelDepth = depthM; // End panel depth (full depth)

  // 상부/하부 내경 계산을 위한 전체 너비 계산
  const baseWidthCalc = calculateBaseWidth() / 1000; // m 단위로 변환

  // 상부 프레임과 받침대 위치를 위한 중앙 위치 계산
  let centerX = 0; // 기본값

  // 세로 프레임 간 내경 너비 계산 (세로 프레임 안쪽 사이 거리)
  let frameInnerWidth = widthM - leftFrameWidth - rightFrameWidth;

  // 좌측/우측 프레임 위치 계산
  const leftFramePosition = -widthM/2 + leftFrameWidth/2;
  const rightFramePosition = widthM/2 - rightFrameWidth/2;

  // 단내림이 있는 경우, 단내림 영역을 제외한 위치 계산
  if (hasAirConditioner && acUnit) {
    if (acUnit.position === 'left') {
      // 좌측 단내림: 단내림 없는 상부 위치 조정 (오른쪽으로 이동)
      const nonAcWidth = widthM - acUnit.width/1000 - rightFrameWidth;
      centerX = (-widthM/2 + leftFrameWidth + acUnit.width/1000 + widthM/2 - rightFrameWidth) / 2;
      frameInnerWidth = widthM - acUnit.width/1000 - rightFrameWidth - endPanelThickness;
    } else {
      // 우측 단내림: 단내림 없는 상부 위치 조정 (왼쪽으로 이동)
      const nonAcWidth = widthM - acUnit.width/1000 - leftFrameWidth;
      centerX = (-widthM/2 + leftFrameWidth + widthM/2 - acUnit.width/1000) / 2;
      frameInnerWidth = widthM - acUnit.width/1000 - leftFrameWidth - endPanelThickness;
    }
  }

  // --- 내부 유효 치수 계산 ---
  // 좌우 프레임을 제외한 내부 너비 (inner width)
  const effectiveLeftFrameWidth = leftFrameWidth;
  const effectiveRightFrameWidth = rightFrameWidth;
  const innerWidth = widthM - effectiveLeftFrameWidth - effectiveRightFrameWidth;
  
  // Log mounted status for debugging
  const isFullyMounted = typeof window !== 'undefined';
  console.log('[Room] Full mount check:', { isFullyMounted });

  // activeModuleId를 selectedModules 배열로 변환
  const selectedModules = useMemo(() => {
    if (!activeModuleId) return [];
    // 활성화된 모듈이 있으면 해당 모듈을 포함하는 배열 생성
    return [{ id: activeModuleId, slotId: activeModuleId }];
  }, [activeModuleId]);

  console.log('[Room] Active Module ID:', activeModuleId);
  console.log('[Room] Selected Modules:', selectedModules);

  // 단내림 내경 계산 함수 추가
  const calculateAcInnerWidth = () => {
    if (!hasAirConditioner || !acUnit) return 0;
    
    // 단내림 내경 계산 (mm 단위로 반환)
    if (acUnit.position === 'left') {
      if (normalizedSpaceType === 'built-in' || (normalizedSpaceType === 'semi-standing' && wallPosition === 'left')) {
        return Math.round((acUnit.width / 1000 - leftFrameWidth) * 1000);
      } else {
        return Math.round((acUnit.width / 1000 - endPanelThickness) * 1000);
      }
    } else { // 우측 단내림
      if (normalizedSpaceType === 'built-in' || (normalizedSpaceType === 'semi-standing' && wallPosition === 'right')) {
        return Math.round((acUnit.width / 1000 - rightFrameWidth) * 1000);
      } else {
        return Math.round((acUnit.width / 1000 - endPanelThickness) * 1000);
      }
    }
  };

  // --- 렌더링 시작 ---
  return (
    <group ref={ref} position={[0, raiseHeightM, 0]}>
      {/* 바닥 */}
      <mesh
        position={[0, -heightM/2, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[widthM * 3, depthM * 3]} />
        <meshStandardMaterial color="#f0f0f0" />
      </mesh>
      
      {/* Left wall (if needed) */}
      {shouldRenderLeftWall && (
        <mesh 
          position={[-widthM/2, 0, 0]} 
          rotation={[0, Math.PI / 2, 0]}
          receiveShadow
        >
          <planeGeometry args={[depthM * 3, heightM * 3]} />
          <meshStandardMaterial 
            color="#ffffff" 
            side={THREE.DoubleSide}
            transparent
            opacity={wallOpacity}
          />
        </mesh>
      )}
      
      {/* Right wall (if needed) */}
      {shouldRenderRightWall && (
        <mesh 
          position={[widthM/2, 0, 0]} 
          rotation={[0, -Math.PI / 2, 0]}
          receiveShadow
        >
          <planeGeometry args={[depthM * 3, heightM * 3]} />
          <meshStandardMaterial 
            color="#ffffff" 
            side={THREE.DoubleSide}
            transparent
            opacity={wallOpacity}
          />
        </mesh>
      )}
      
      {/* Back wall (if needed) */}
      {shouldRenderBackWall && (
        <mesh 
          position={[0, 0, -depthM/2]} 
          receiveShadow
        >
          <planeGeometry args={[widthM * 3, heightM * 3]} />
          <meshStandardMaterial 
            color="#b0b0b0" 
            side={THREE.DoubleSide}
            transparent
            opacity={1.0}
          />
        </mesh>
      )}
      
      {/* 천장 추가 */}
      {shouldRenderBackWall && (
        <mesh
          position={[0, heightM/2, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[widthM * 3, depthM * 3]} />
          <meshStandardMaterial 
            color="#f0f0f0" 
            side={THREE.DoubleSide}
            transparent
            opacity={1.0}
          />
        </mesh>
      )}
      
      {/* 상부 프레임 - 세로 프레임 사이를 정확히 채움 */}
      {showFrame && (
        <>
          {/* 단내림이 없는 영역의 상부 프레임 */}
          <mesh
            position={[
              centerX, // 단내림 위치에 따라 조정된 X축 중앙 위치
              heightM/2 - topFrameWidth/2, // 상단에 붙은 위치
              -depthM/2 + baseDepthM/2 // Z축 앞부분에 배치
            ]}
            receiveShadow={false}
            castShadow={false}
          >
            <boxGeometry 
              args={[
                hasAirConditioner && acUnit ? 
                  // 단내림이 있는 경우, 단내림 제외 영역 너비
                  frameInnerWidth :
                  // 단내림 없는 경우 기존 내경
                  innerWidth,
                topFrameWidth, // 높이
                baseDepthM  // 깊이
              ]}
            />
            <meshStandardMaterial
              color={getFrameColor('top')}
              transparent={false}
              wireframe={false}
              roughness={0.9}
              metalness={0.0}
            />
          </mesh>
          
          {/* 단내림 영역 하단의 상부 프레임 */}
          {hasAirConditioner && acUnit && (
            <mesh
              position={[
                acUnit.position === 'left' ?
                  // 좌측 단내림: 단내림 내경 중앙
                  -widthM/2 + leftFrameWidth/2 + acUnit.width/2000 :
                  // 우측 단내림: 단내림 내경 중앙
                  widthM/2 - rightFrameWidth/2 - acUnit.width/2000,
                heightM/2 - acUnit.height/1000 - topFrameWidth/2, // 단내림 높이(height) 사용
                -depthM/2 + baseDepthM/2 // Z축 앞부분에 배치
              ]}
              receiveShadow={false}
              castShadow={false}
            >
              <boxGeometry 
                args={[
                  // 단내림 내경 너비
                  acUnit.position === 'left' ?
                    acUnit.width/1000 - leftFrameWidth :
                    acUnit.width/1000 - rightFrameWidth,
                  topFrameWidth, // 높이
                  baseDepthM  // 깊이
                ]}
              />
              <meshStandardMaterial
                color={getFrameColor('top')}
                transparent={false}
                wireframe={false}
                roughness={0.9}
                metalness={0.0}
              />
            </mesh>
          )}
        </>
      )}
      
      {/* 좌측 프레임 - 바닥부터 시작하여 받침대와 독립적으로 렌더링 */}
      {/* 좌측 프레임: built-in 또는 (semi-standing + 우측벽 아님) 또는 (free-standing + 우측벽) */}
      {showFrame && ((spaceType === 'built-in' || (spaceType === 'semi-standing' && wallPosition !== 'right')) || (spaceType === 'free-standing' && wallPosition === 'right')) && (
        <mesh
          position={[leftFramePosition, -heightM/2 + (heightM/2) + (hasFloorFinish ? floorThicknessM : 0), -depthM/2 + baseDepthM/2]}
          receiveShadow={false}
          castShadow={false}
        >
          <boxGeometry 
            args={[
              leftFrameWidth,
              heightM,
              baseDepthM
            ]}
          />
          <meshStandardMaterial
            color={getFrameColor('left')}
            transparent={false}
            wireframe={false}
            roughness={0.9}
            metalness={0.0}
          />
        </mesh>
      )}
      
      {/* 우측 프레임 - 바닥부터 시작하여 받침대와 독립적으로 렌더링 */}
      {/* 우측 프레임: built-in 또는 (semi-standing + 좌측벽 아님) 또는 (free-standing + 좌측벽) */}
      {showFrame && ((spaceType === 'built-in' || (spaceType === 'semi-standing' && wallPosition !== 'left')) || (spaceType === 'free-standing' && wallPosition === 'left')) && (
        <mesh
          position={[rightFramePosition, -heightM/2 + (heightM/2) + (hasFloorFinish ? floorThicknessM : 0), -depthM/2 + baseDepthM/2]}
          receiveShadow={false}
          castShadow={false}
        >
          <boxGeometry 
            args={[
              rightFrameWidth,
              heightM,
              baseDepthM
            ]}
          />
          <meshStandardMaterial
            color={getFrameColor('right')}
            transparent={false}
            wireframe={false}
            roughness={0.9}
            metalness={0.0}
          />
        </mesh>
      )}
      
      {/* Wardrobe base - 받침대 위치 변경 */}
      {showFrame && hasBase && (
        <>
          {/* 단내림이 없는 영역의 받침대 */}
          <mesh
            position={[
              centerX, // 상부 프레임과 동일한 X축 중앙 위치
              -heightM/2 + baseFrameHeight/2 + (hasFloorFinish ? floorThicknessM : 0), // 바닥 마감재 위에 배치
              -depthM/2 + baseFrameDepth/2 // Z축 앞부분에 배치
            ]}
            receiveShadow={false}
            castShadow={false}
          >
            <boxGeometry 
              args={[
                hasAirConditioner && acUnit ? 
                  // 단내림이 있는 경우, 단내림 제외 영역 너비 (상부 프레임과 동일)
                  frameInnerWidth :
                  // 단내림 없는 경우 기존 내경
                  innerWidth, // 좌우 프레임 사이 내경
                baseFrameHeight, // 새 상태값 사용
                baseFrameDepth  // 새 상태값 사용
              ]}
            />
            <meshStandardMaterial
              color={placementInfo?.focusedFrame === 'baseHeight' ? '#00C092' : getFrameColor('base')}
              transparent={placementInfo?.focusedFrame === 'baseHeight'}
              opacity={placementInfo?.focusedFrame === 'baseHeight' ? 0.7 : 1.0}
              wireframe={false}
              roughness={0.9}
              metalness={0.0}
            />
          </mesh>
          
          {/* 단내림 영역의 받침대 */}
          {hasAirConditioner && acUnit && (
            <mesh
              position={[
                acUnit.position === 'left' ?
                  // 좌측 단내림: 단내림 내경 중앙
                  -widthM/2 + leftFrameWidth/2 + acUnit.width/2000 :
                  // 우측 단내림: 단내림 내경 중앙
                  widthM/2 - rightFrameWidth/2 - acUnit.width/2000,
                -heightM/2 + baseFrameHeight/2 + (hasFloorFinish ? floorThicknessM : 0), // 바닥 마감재 위에 배치
                -depthM/2 + baseFrameDepth/2 // Z축 앞부분에 배치
              ]}
              receiveShadow={false}
              castShadow={false}
            >
              <boxGeometry 
                args={[
                  // 단내림 내경 너비 (상부 프레임 단내림 영역과 동일)
                  acUnit.position === 'left' ?
                    acUnit.width/1000 - leftFrameWidth :
                    acUnit.width/1000 - rightFrameWidth,
                  baseFrameHeight, // 새 상태값 사용
                  baseFrameDepth  // 새 상태값 사용
                ]}
              />
              <meshStandardMaterial
                color={placementInfo?.focusedFrame === 'baseHeight' ? '#00C092' : getFrameColor('base')}
                transparent={placementInfo?.focusedFrame === 'baseHeight'}
                opacity={placementInfo?.focusedFrame === 'baseHeight' ? 0.7 : 1.0}
                wireframe={false}
                roughness={0.9}
                metalness={0.0}
              />
            </mesh>
          )}
        </>
      )}

      {/* 단내림 분절 엔드패널 - 단내림이 있는 경우에만 표시 */}
      {showFrame && hasAirConditioner && acUnit && (
        <mesh
          position={[
            acUnit.position === 'left' ?
              // 좌측 단내림: 단내림 우측 끝에 엔드패널
              -widthM/2 + acUnit.width/1000 - endPanelThickness/2 :
              // 우측 단내림: 단내림 좌측 끝에 엔드패널
              widthM/2 - acUnit.width/1000 + endPanelThickness/2,
            0, // Y축 중앙
            -depthM/2 + baseDepthM/2 // Z축 앞부분에 배치
          ]}
          receiveShadow={false}
          castShadow={false}
        >
          <boxGeometry 
            args={[
              endPanelThickness, // 두께
              heightM, // 높이
              baseDepthM // 깊이
            ]}
          />
          <meshStandardMaterial
            color={getFrameColor('endPanel')}
            transparent={false}
            wireframe={false}
            roughness={0.9}
            metalness={0.0}
          />
        </mesh>
      )}

      {/* 조명 효과를 위한 추가 요소 */}
      <directionalLight 
        position={[0, 5, 5]} 
        intensity={0.7} 
        castShadow={false}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={15}
        shadow-camera-near={0.5}
      />
      <ambientLight intensity={0.5} />
      <spotLight 
        position={[5, 5, 5]} 
        angle={0.3} 
        penumbra={0.8} 
        intensity={0.6} 
        castShadow={false}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      {/* 모듈 슬롯 표시 */}
      {showFrame && showModuleSlots && (
        <>
          {/* 모듈 슬롯 정보 로깅 */}
          {console.log('[Room] ModuleSlots 렌더링 - Space Type:', normalizedSpaceType, 'Wall Position:', wallPosition)}
          {console.log('[Room] EndPanel 설정 - hasEndPanel:', normalizedSpaceType !== 'built-in', 'Side:', 
                      normalizedSpaceType === 'free-standing' ? 'both' : 
                      (normalizedSpaceType === 'semi-standing' && wallPosition === 'left' ? 'right' : 
                      (normalizedSpaceType === 'semi-standing' && wallPosition === 'right' ? 'left' : 'none')))}
          {console.log('[Room] 공간 높이 값:', height, 'mm =', height/1000, 'm')}
          {console.log('[Room] ModuleSlots 렌더링 - doorCount:', doorCount)}
          
          <ModuleSlots 
            key={`room-${doorCount}-${frameData?.color || frameColor || 'default'}-${frameUpdateCount}-${Date.now()}`}
            totalWidth={width}
            slotCount={doorCount}
            slotStatuses={slotStatuses}
            onSlotHover={onSlotHover}
            onSlotClick={onSlotClick}
            baseHeight={baseHeight}
            spaceType={normalizedSpaceType}
            wallPosition={wallPosition}
            endPanelThicknessM={endPanelThickness}
            spaceHeight={height}
            topFrameHeight={topFrameWidth * 1000}
            selectedModules={selectedModules}
          />
        </>
      )}

      {/* 치수 텍스트 레이블 - showDimensions가 true일 때만 표시 */}
      {showDimensions && (
        <>
          {/* 바닥 가로 치수 */}
          {hasAirConditioner && acUnit ? (
            <>
              {/* 단내림이 있는 경우: 메인 하부 내경 치수 */}
              <Html
                key="bottom-width-main-dimension"
                position={[
                  centerX, // 단내림 없는 영역 중심
                  -heightM/2 - 0.2, // 바닥 아래 위치
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
                  borderRadius: '4px'
                }}
              >
                {(() => {
                  // 일반 구간 내경 계산
                  // 상부 내경 계산과 동일하게 직접 계산 적용
                  let mainBaseWidthMm;
                  if (acUnit.position === 'left') {
                    // 좌측 단내림: 전체 너비 - 단내림 너비 - 분절 엔드패널(20mm) - 우측 프레임(50mm)
                    mainBaseWidthMm = Math.round(width - acUnit.width - 20 - 50);
                  } else {
                    // 우측 단내림: 전체 너비 - 단내림 너비 - 분절 엔드패널(20mm) - 좌측 프레임(50mm)
                    mainBaseWidthMm = Math.round(width - acUnit.width - 20 - 50);
                  }
                  return `일반 하부 내경: ${mainBaseWidthMm}mm`;
                })()}
              </Html>
              
              {/* 단내림 하부 내경 치수 */}
              <Html
                key="bottom-width-ac-dimension"
                position={[
                  acUnit.position === 'left' ?
                    // 좌측 단내림: 단내림 내경 중앙
                    -widthM/2 + leftFrameWidth/2 + acUnit.width/2000 :
                    // 우측 단내림: 단내림 내경 중앙
                    widthM/2 - rightFrameWidth/2 - acUnit.width/2000,
                  -heightM/2 - 0.2, // 바닥 아래 위치
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
                  borderRadius: '4px'
                }}
              >
                {(() => {
                  // 단내림 하부 내경 계산 (단내림 내경과 동일한 계산법)
                  const acBaseWidthMm = calculateAcInnerWidth();
                  return `단내림 하부 내경: ${acBaseWidthMm}mm`;
                })()}
              </Html>
            </>
          ) : (
            // 단내림이 없는 경우 기존 하부 내경 치수
            <Html
              key="bottom-width-dimension"
              position={[0, -heightM/2 - 0.2, 0]}
              style={{
                color: '#FFFFFF',
                fontSize: '14px',
                fontWeight: 'bold',
                transform: 'translate3d(-50%, -25px, 0)',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                backgroundColor: 'rgba(0,0,0,0.5)',
                padding: '4px 8px',
                borderRadius: '4px'
              }}
            >
              {(() => {
                const baseWidthMm = calculateBaseWidth();
                return `하부 내경: ${baseWidthMm}mm`;
              })()}
            </Html>
          )}

          {/* 상단 프레임 위에 가로 치수 배치 */}
          <Html
            key="top-width-dimension"
            position={[0, heightM/2 + 0.25, 0]}
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
              border: '1px solid #FFFFFF'
            }}
          >
            {(() => {
              // 상부 프레임 내경 계산 - 단내림이 있는 경우 수정된 공식 적용
              let topInnerWidthMm;
              if (hasAirConditioner && acUnit) {
                // 단내림이 있는 경우 직접 계산식 적용
                // 상부 내경 = 공간폭 - 단내림폭 - 분절 엔드패널(20mm) - 프레임(50mm)
                if (acUnit.position === 'left') {
                  topInnerWidthMm = Math.round(width - acUnit.width - 20 - 50);
                } else {
                  topInnerWidthMm = Math.round(width - acUnit.width - 20 - 50);
                }
              } else {
                // 단내림이 없는 경우 기존 계산 사용
                topInnerWidthMm = Math.round(innerWidth * 1000);
              }
              
              return `상부 내경: ${topInnerWidthMm}mm`;
            })()}
          </Html>
          
          {/* 단내림 내경 치수 - 단내림이 있는 경우만 표시 */}
          {hasAirConditioner && acUnit && (
            <Html
              key="ac-inner-width-dimension"
              position={[
                acUnit.position === 'left' 
                  ? -widthM/2 + acUnit.width/2000 // 좌측 단내림 중앙
                  : widthM/2 - acUnit.width/2000, // 우측 단내림 중앙
                heightM/2 - 0.2, // 상부 단내림 아래
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
                borderRadius: '4px'
              }}
            >
              {`단내림 내경: ${calculateAcInnerWidth()}mm`}
            </Html>
          )}

          {/* 좌측 세로 치수 */}
          <Html
            key="left-height-dimension"
            position={[-widthM/2, 0, 0]}
            style={{
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 'bold',
              transform: 'translate3d(-40px, 0, 0)',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              backgroundColor: 'rgba(0,0,0,0.5)',
              padding: '4px 8px',
              borderRadius: '4px'
            }}
          >
            높이: {height}mm
          </Html>

          {/* 우측 프레임 중앙에 세로 치수 배치 - 내경 높이 표시 */}
          <Html
            key="right-inner-height-dimension"
            position={[widthM/2 - 0.02, 0, 0]}
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
              border: '1px solid #FFFFFF',
              zIndex: 100
            }}
          >
            {(() => {
              // 내경 높이 계산: 전체 높이 - 상부 프레임 너비 - 받침대 높이
              // 프레임 너비와 받침대 높이를 mm 단위로 변환
              const topFrameHeightMm = Math.round(topFrameWidth * 1000);
              const baseHeightMm = baseFrameHeight * 1000;
              const innerHeightMm = height - topFrameHeightMm - baseHeightMm;
              
              return `H내경: ${innerHeightMm}mm`;
            })()}
          </Html>
        </>
      )}
    </group>
  );
});

Room.propTypes = {
  spaceInfo: PropTypes.object.isRequired,
  viewMode: PropTypes.string,
  placementInfo: PropTypes.object,
  wallOpacity: PropTypes.number,
  outlineMode: PropTypes.bool,
  showFrame: PropTypes.bool,
  frameColor: PropTypes.string,
  frameData: PropTypes.object,
  showModuleSlots: PropTypes.bool,
  doorCount: PropTypes.number,
  slotStatuses: PropTypes.array,
  onSlotHover: PropTypes.func,
  onSlotClick: PropTypes.func,
  showDimensionLines: PropTypes.bool,
  showDimensions: PropTypes.bool,
  showGuides: PropTypes.bool,
  frameProperties: PropTypes.object,
  activeModuleId: PropTypes.string
};

export default Room; 
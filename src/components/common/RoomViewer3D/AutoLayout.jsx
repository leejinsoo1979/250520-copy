import React, { useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';

// 자동 레이아웃 계산 기능을 제공하는 컴포넌트
const AutoLayout = ({ 
  width = 4800,        // 전체 폭 (mm) 
  height = 2400,       // 전체 높이 (mm)
  doorCount = 4,       // 도어 개수
  spaceType = 'built-in',  // 설치 타입
  wallPosition = 'left',   // 벽 위치
  leftFrameWidth = 50,  // 좌측 프레임 폭 (mm)
  rightFrameWidth = 50, // 우측 프레임 폭 (mm)
  topFrameWidth = 50,   // 상단 프레임 폭 (mm)
  acUnit = null,        // 단내림 정보 (위치, 폭)
  onLayoutGenerated     // 생성된 레이아웃 결과를 부모 컴포넌트에 전달하는 콜백
}) => {
  // 슬롯 계산 결과 상태
  const [slots, setSlots] = useState([]);
  
  // 프레임 내부 사용 가능 공간 계산
  const innerSpace = useMemo(() => {
    // 프레임 타입에 따른 유효 폭 계산
    let effectiveLeftWidth = leftFrameWidth;
    let effectiveRightWidth = rightFrameWidth;
    
    // semi-standing 모드에서 벽 위치에 따른 프레임 폭 계산
    if (spaceType === 'semi-standing') {
      if (wallPosition === 'left') {
        // 좌측 벽, 우측에는 20mm 패널
        effectiveRightWidth = 20;
      } else if (wallPosition === 'right') {
        // 우측 벽, 좌측에는 20mm 패널
        effectiveLeftWidth = 20;
      }
    } else if (spaceType === 'free-standing' || spaceType === 'standing') {
      // 프리스탠딩이나 스탠딩인 경우 양쪽 모두 20mm 패널
      effectiveLeftWidth = 20;
      effectiveRightWidth = 20;
    }
    
    // 단내림 영역 고려
    let effectiveWidth = width - effectiveLeftWidth - effectiveRightWidth;
    let soffitWidth = 0;
    let soffitPosition = null;
    
    if (acUnit && acUnit.present) {
      soffitWidth = acUnit.width || 850;
      soffitPosition = acUnit.position || 'left';
    }
    
    return {
      width: effectiveWidth,
      height: height - topFrameWidth,
      leftOffset: effectiveLeftWidth,
      rightOffset: effectiveRightWidth,
      topOffset: topFrameWidth,
      soffitWidth,
      soffitPosition
    };
  }, [width, height, leftFrameWidth, rightFrameWidth, topFrameWidth, spaceType, wallPosition, acUnit]);
  
  // 도어 개수에 따라 슬롯 계산
  useEffect(() => {
    if (!innerSpace || doorCount <= 0) return;
    
    // 각 도어의 폭 계산 (mm)
    const doorWidth = Math.floor(innerSpace.width / doorCount);
    
    // 슬롯 배열 생성
    const newSlots = [];
    
    // 단내림 영역 확인
    const hasSoffit = innerSpace.soffitWidth > 0;
    const soffitStartX = innerSpace.soffitPosition === 'left' ? innerSpace.leftOffset : width - innerSpace.rightOffset - innerSpace.soffitWidth;
    const soffitEndX = soffitStartX + innerSpace.soffitWidth;
    
    // 각 도어에 대해 슬롯 생성
    for (let i = 0; i < doorCount; i++) {
      const startX = innerSpace.leftOffset + (i * doorWidth);
      const endX = startX + doorWidth;
      
      // 단내림 영역 충돌 확인 (단내림 영역이 있는 경우만)
      const isBelowSoffit = hasSoffit && (
        (startX >= soffitStartX && startX < soffitEndX) || 
        (endX > soffitStartX && endX <= soffitEndX) ||
        (startX <= soffitStartX && endX >= soffitEndX)
      );
      
      // 슬롯 정보 생성
      newSlots.push({
        id: `slot-${i + 1}`,
        index: i,
        startX,
        endX,
        width: doorWidth,
        isBelowSoffit,
        position: {
          x: (startX + doorWidth / 2) - (width / 2), // 슬롯 중앙 X 좌표 (Three.js 중앙 좌표계 기준)
          y: 0, // 슬롯 중앙 Y 좌표
          z: -750 / 1000 // 깊이는 일반적으로 750mm 정도로 설정
        },
        dimensions: {
          width: doorWidth / 1000, // m 단위로 변환
          height: innerSpace.height / 1000, // m 단위로 변환
          depth: 550 / 1000 // 기본 깊이값 (m 단위)
        }
      });
    }
    
    // 계산된 슬롯 정보 설정
    setSlots(newSlots);
    
    // 부모 컴포넌트에 레이아웃 결과 전달
    if (onLayoutGenerated) {
      onLayoutGenerated(newSlots);
    }
    
    console.log('Auto layout generated:', newSlots);
  }, [innerSpace, doorCount, width, onLayoutGenerated]);
  
  // 렌더링 없음 (로직만 수행하는 컴포넌트)
  return null;
};

export default AutoLayout; 
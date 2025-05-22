import React, { useRef, useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

// 치수선 컴포넌트
const DimensionLine = ({ start, end, value, scale, isHorizontal }) => {
  const padding = 20 / scale; // 치수선과 객체 사이의 간격
  
  // 시작점과 끝점 계산
  let x1, y1, x2, y2;
  let textX, textY;
  let textAnchor = "middle";
  
  if (isHorizontal) {
    y1 = y2 = start.y - padding;
    x1 = start.x;
    x2 = end.x;
    textX = (x1 + x2) / 2;
    textY = y1 - 10 / scale;
  } else {
    x1 = x2 = start.x - padding;
    y1 = start.y;
    y2 = end.y;
    textX = x1 - 10 / scale;
    textY = (y1 + y2) / 2;
    textAnchor = "end";
  }
  
  return (
    <>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="black"
        strokeWidth={1 / scale}
      />
      {/* 양쪽 끝 화살표 */}
      <line
        x1={x1}
        y1={y1}
        x2={isHorizontal ? x1 : x1 - 5 / scale}
        y2={isHorizontal ? y1 - 5 / scale : y1}
        stroke="black"
        strokeWidth={1 / scale}
      />
      <line
        x1={x1}
        y1={y1}
        x2={isHorizontal ? x1 : x1 + 5 / scale}
        y2={isHorizontal ? y1 + 5 / scale : y1}
        stroke="black"
        strokeWidth={1 / scale}
      />
      <line
        x1={x2}
        y1={y2}
        x2={isHorizontal ? x2 : x2 - 5 / scale}
        y2={isHorizontal ? y2 - 5 / scale : y2}
        stroke="black"
        strokeWidth={1 / scale}
      />
      <line
        x1={x2}
        y1={y2}
        x2={isHorizontal ? x2 : x2 + 5 / scale}
        y2={isHorizontal ? y2 + 5 / scale : y2}
        stroke="black"
        strokeWidth={1 / scale}
      />
      <text
        x={textX}
        y={textY}
        fontSize={12 / scale}
        textAnchor={textAnchor}
        dominantBaseline={isHorizontal ? "auto" : "middle"}
        fill="black"
      >
        {value}mm
      </text>
    </>
  );
};

const TwoDViewer = ({ 
  options, 
  onUpdate, 
  viewType = 'front',
  onViewTypeChange = () => {},
  hideViewButtons = false,
  installationType = 'built-in',
  wallPosition = 'left', // 추가: 벽 위치 props
  hasAirConditioner = false,
  hasFloorFinish = false,
  acUnitPosition = 'left',
  acUnitWidth = 900,  // 단내림 폭 (mm)
  acUnitDepth = 200,  // 단내림 두께(높이, mm)
  floorFinishType = 'wood',
  floorFinishHeight = 20,  // 바닥 마감재 높이 명시적 prop 추가
  hasBase = false,  // 받침대 유무
  baseHeight = 0,   // 받침대 높이 (mm)
  activeDimensionField = null,  // 현재 선택된 입력 필드
  onDimensionFieldReset = null   // 입력 필드 초기화 콜백
}) => {
  const PADDING = 180;
  
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({
    width: options?.width || 4800,
    height: options?.height || 2400,
    depth: options?.depth || 1500,
    color: options?.color || '#e0e0e0',
    floorFinishHeight: floorFinishHeight || options?.floorFinishHeight || 20,
    baseHeight: baseHeight || options?.baseHeight || 0
  });

  // 단내림 너비와 깊이를 props에서 직접 사용
  const resolvedAcUnitWidth = acUnitWidth;
  // 단내림 깊이는 props에서 받은 값 사용
  const resolvedAcUnitDepth = acUnitDepth;
  // 단내림 높이는 props에서 받은 값 사용
  const resolvedAcUnitHeight = acUnitDepth;
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [isInitialized, setIsInitialized] = useState(false);
  // 초기 줌 값을 1.2로 설정하여 3D 뷰어와 비슷한 크기로 표시
  const [zoomFactor, setZoomFactor] = useState(1.2);
  // Track which frame field is active for highlight
  const [activeFrameField, setActiveFrameField] = useState(null);
  const idleTimerRef = useRef(null);
  // 현재 스텝이 3인지 여부를 추적하는 변수 추가
  const isStep3 = options?.step === 'step3';

  const resetIdleTimer = () => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = setTimeout(() => {
      setPan({ x: 0, y: 0 });
      setLastPos({ x: 0, y: 0 });
      draw();
    }, 60000); // 60초 후 뷰 리셋
  };
  
  // 팬 시작 (마우스 다운)
  const handlePanStart = (e) => {
    setDragging(true);
    setDragStart({
      x: e.clientX - lastPos.x,
      y: e.clientY - lastPos.y
    });
  };
  
  // 팬 이동 (마우스 이동)
  const handlePanMove = (e) => {
    if (dragging) {
      const newPan = {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      };
      setPan(newPan);
      setLastPos(newPan);
      draw();
    }
  };

  // 팬 종료 (마우스 업 또는 마우스 리브)
  const handlePanEnd = () => {
    setDragging(false);
  };
  
  // 화면 크기 변경 핸들러
  const handleResize = () => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setContainerSize({ width, height });
    }
  };
  
  // 뷰 타입 변경 핸들러 개선
  const handleViewTypeChange = (newViewType) => {
    // Step 3에서는 정면도만 허용
    if (options?.step === 'step3' && newViewType !== 'front') {
      return; // Step 3에서 정면도 외 다른 뷰 차단
    }

    if (viewType !== newViewType) {
      // 뷰 타입 변경 시 팬 초기화
      setPan({ x: 0, y: 0 });
      setLastPos({ x: 0, y: 0 });
      
      // 부모에게 변경 알림
      onViewTypeChange(newViewType);
    }
  };
  
  // props가 변경되면 즉시 업데이트
  useEffect(() => {
    setDimensions(prev => ({
      ...prev,
      floorFinishHeight: floorFinishHeight
    }));
    
    // props 변경 시 다시 그리기
    if (canvasRef.current && isInitialized) {
      draw();
    }
  }, [floorFinishHeight, hasFloorFinish, acUnitPosition, hasAirConditioner, installationType, acUnitWidth, acUnitDepth, hasBase, baseHeight, activeDimensionField]);

  // 활성화된 프레임 필드가 변경될 때 다시 그리기
  useEffect(() => {
    if (canvasRef.current && isInitialized) {
      // 콘솔에 현재 활성화된 필드 출력
      console.log('활성화된 프레임 필드:', activeDimensionField);
      // 프레임 강조를 위해 activeDimensionField를 activeFrameField에 매핑
      // 필드 이름과 매핑 이름을 일관되게 사용
      if (activeDimensionField === 'leftFrame' || activeDimensionField === 'rightFrame' || activeDimensionField === 'topFrame') {
        setActiveFrameField(activeDimensionField);
      } else {
        setActiveFrameField(null);
      }
      draw();
    }
  }, [activeDimensionField]);

  // 컴포넌트 마운트/언마운트 시 상태 초기화
  useEffect(() => {
    // 컴포넌트 마운트 시 상태 초기화
    // 수직 위치 초기 오프셋 적용 (3D 뷰어와 일치하도록)
    setPan({ x: 0, y: 0 });
    setLastPos({ x: 0, y: 0 });
    setDragStart({ x: 0, y: 0 });
    setDragging(false);
    
    // 초기화 지연 설정 - 컴포넌트가 마운트된 후 약간의 지연 시간을 두고 초기화
    const timer = setTimeout(() => {
      setIsInitialized(true);
      // 강제로 다시 그리기
      if (canvasRef.current) {
        draw();
      }
    }, 100);
    
    // 컴포넌트 언마운트 시 이벤트 리스너 정리
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);
  
  // viewType이 변경될 때마다 리셋
  useEffect(() => {
    setPan({ x: 0, y: 0 });
    setLastPos({ x: 0, y: 0 });
    
    // 약간의 지연 후 다시 그리기
    const timer = setTimeout(() => {
      draw();
    }, 50);
    
    return () => clearTimeout(timer);
  }, [viewType]);
  
  // 옵션 변경 감지 및 재계산
  useEffect(() => {
    if (options) {
      const newDimensions = {
        width: options.width || dimensions.width,
        height: options.height || dimensions.height,
        depth: options.depth || dimensions.depth,
        color: options.color || dimensions.color,
        floorFinishHeight: options.floorFinishHeight !== undefined ? options.floorFinishHeight : dimensions.floorFinishHeight,
        baseHeight: options.baseHeight !== undefined ? options.baseHeight : dimensions.baseHeight || baseHeight
      };

      setDimensions(newDimensions);
      
      // Always call draw() after updating dimensions to ensure re-rendering
      setTimeout(() => {
        if (canvasRef.current) {
          draw();
        }
      }, 50);
      // 팬 초기화 및 즉시 다시 그리기 (사이즈가 변경되었을 경우)
      if (
        newDimensions.width !== dimensions.width ||
        newDimensions.height !== dimensions.height ||
        newDimensions.depth !== dimensions.depth ||
        newDimensions.floorFinishHeight !== dimensions.floorFinishHeight ||
        newDimensions.baseHeight !== dimensions.baseHeight
      ) {
        setPan({ x: 0, y: 0 });
        setLastPos({ x: 0, y: 0 });
        setTimeout(() => {
          if (canvasRef.current) {
            draw();
          }
        }, 50);
      }
    }
  }, [options]);

  // 컨테이너 크기 감지
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setContainerSize({ width, height });
      }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // 캔버스 크기 설정 - 개선된 로직
  useEffect(() => {
    if (containerSize.width && containerSize.height) {
      // 단순히 컨테이너 크기를 캔버스 크기로 설정
      const canvasWidth = containerSize.width;
      const canvasHeight = containerSize.height;
      setCanvasSize({ width: canvasWidth, height: canvasHeight });
    }
  }, [containerSize, viewType]);

  // 캔버스 설정
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && containerSize.width && containerSize.height) {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = containerSize.width * dpr;
      canvas.height = containerSize.height * dpr;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        
        // 약간의 지연 후 다시 그리기
        setTimeout(() => {
          draw();
        }, 50);
      }
    }
  }, [containerSize]);

  // 뷰 변경 시 다시 그리기
  useEffect(() => {
    // 약간의 지연 후 다시 그리기
    const timer = setTimeout(() => {
      draw();
    }, 50);
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [dimensions, dimensions.floorFinishHeight, dimensions.baseHeight, viewType, pan, installationType, hasAirConditioner, hasFloorFinish, hasBase, isInitialized]);

  // 줌 변경 시 다시 그리기
  useEffect(() => {
    draw();
  }, [zoomFactor]);

  // 스케일 계산 함수
  const calculateScale = (viewType, contentWidth, contentHeight, containerWidth, containerHeight) => {
    // Add padding to ensure content doesn't touch edges
    const effectiveContainerWidth = containerWidth - PADDING * 2;
    const effectiveContainerHeight = containerHeight - PADDING * 2;
    
    // Scale calculation with aspect ratio preservation
    let scaleByWidth = effectiveContainerWidth / contentWidth;
    let scaleByHeight = effectiveContainerHeight / contentHeight;
    
    // 3D 뷰어와 일관된 크기를 위해 스케일 조정
    // 폭과 높이 중 작은 쪽에 맞춤 (컨테이너에 완전히 맞도록)
    let scale = Math.min(scaleByWidth, scaleByHeight);
    
    // 너무 작거나 큰 스케일 방지를 위한 범위 제한
    // 최소값을 0.04에서 0.06으로 증가, 최대값을 0.13에서 0.18로 증가
    scale = Math.min(Math.max(scale, 0.06), 0.18);
    
    // 3D 뷰어와 일치하도록 스케일 조정값 변경 (0.95에서 1.2로 증가하여 더 크게 표시)
    scale *= 1.2 * zoomFactor;
    
    return scale;
  };
  
  // 그리기 함수
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas || !isInitialized) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fdfdfd';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw light grid pattern
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    
    const gridSize = 20;
    const w = canvas.width;
    const h = canvas.height;
    
    // Draw vertical lines
    for (let x = 0; x <= w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = 0; y <= h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    
    try {
      if (viewType === 'top') {
        drawTopView(ctx);
      } else if (viewType === 'front') {
        drawFrontView(ctx);
      } else if (viewType === 'left') {
        drawLeftView(ctx);
      } else if (viewType === 'right') {
        drawRightView(ctx);
      }
    } catch (error) {
      console.error('Error drawing view:', error);
    }
  };
  
  // 상단 뷰 그리기
  const drawTopView = (ctx) => {
    const { width, depth } = dimensions;

    // --- Define rear wall offset for rear frame logic ---
    const rearWallOffset = 580; // mm - distance from back wall

    // 색상 정의
    const outlineColor = '#666666'; // 회색 윤곽선
    const fillColor = 'white';    // 흰색 채우기
    const acOutlineColor = '#666666'; // 에어컨 윤곽선 색상
    const acFillColor = '#e5e5e5';    // 에어컨 채우기 색상
    const frameColor = '#bbbbbb';

    // 스케일 동적 계산
    const scale = calculateScale('top', width, depth, canvasSize.width, canvasSize.height);

    // 픽셀 단위로 변환
    const widthPx = width * scale;
    const depthPx = depth * scale;

    // 캔버스 정중앙에 배치 + 팬 오프셋 적용
    const x = (canvasSize.width - widthPx) / 2 + pan.x;
    const y = (canvasSize.height - depthPx) / 2 + pan.y;

    // 전체 캔버스 초기화
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    // --- 배경/공간 그리기 ---
    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y, widthPx, depthPx);
    ctx.strokeStyle = outlineColor
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, widthPx, depthPx);


    // --- 에어컨 단내림 표시 ---
    if (hasAirConditioner) {
      ctx.fillStyle = acFillColor; // 에어컨 채우기 색상
      // resolvedAcUnitWidth 사용 (acUnitWidth에서 직접 전달받은 값)
      const acWidthPx = resolvedAcUnitWidth * scale;
      // Use resolvedAcUnitDepth for acDepthPx to match the space depth
      const acDepthPx = resolvedAcUnitDepth * scale;

      // acUnitPosition에 따라 위치 결정
      let acX;
      if (acUnitPosition === 'left') {
        acX = x; // 프레임 두께만큼 우측으로 밀지 않고, 꼭짓점에 붙임
      } else if (acUnitPosition === 'right') {
        acX = x + widthPx - acWidthPx; // 우측에 배치
      } else {
        // 중앙 배치
        acX = x + (widthPx - acWidthPx) / 2;
      }

      // 뒷벽 쪽에 에어컨 단내림 표시 - 채우기 및 테두리
      ctx.beginPath();
      ctx.rect(acX, y + depthPx - acDepthPx, acWidthPx, acDepthPx);
      ctx.fill();
      ctx.strokeStyle = acOutlineColor; // 에어컨 외곽선 색상
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // --- 내부 분할 패널: back wall에서 580mm 떨어진 위치에 폭 전체, 두께 20mm 프레임 ---
    ctx.fillStyle = frameColor; 
    const innerFrameThicknessPx = 20 * scale;                // 두께 20mm
    const innerFrameOffsetPx = rearWallOffset * scale;       // back wall으로부터 580mm
    ctx.beginPath();
    ctx.rect(x, y + depthPx - innerFrameOffsetPx - innerFrameThicknessPx, widthPx, innerFrameThicknessPx);
    ctx.fill();
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    // 치수선 그리기
      drawDimensionLines(ctx, 'top', x, y, widthPx, 0, depthPx, scale);
  };
  
  // 정면 뷰 그리기 (프레임/단내림 로직 반영) - 프레임 하이라이트 지원
  const drawFrontView = (ctx) => {
    const { width, height, floorFinishHeight, baseHeight: dimensionsBaseHeight } = dimensions;
    // 프레임 두께(벽체프레임) 설정
    const leftFrameWidth = options?.leftFrameWidth ?? 50;   // 프레임 폭을 50mm로 설정 (Step 3)
    const rightFrameWidth = options?.rightFrameWidth ?? 50; // 프레임 폭을 50mm로 설정 (Step 3)
    const upperFrameWidth = options?.upperFrameWidth ?? 40; // mm
    const lowerFrameWidth = options?.lowerFrameWidth ?? 40; // mm
    const frameThickness = 20; // 프레임 두께를 20mm로 설정 (Z축 두께)
    
    // 받침대 높이 정보 가져오기
    const baseHeight = options?.baseHeight || dimensionsBaseHeight || 0;
    const hasBaseFromOptions = options?.hasBase || hasBase;
    
    // Step 2/3 여부 확인 (함수 전체에서 사용)
    const isStep2 = options?.step === 'step2';
    const isStep3 = options?.step === 'step3';

    // 색상 정의
    const outlineColor = '#666666';
    const fillColor = 'white';
    const acOutlineColor = '#666666';
    const acFillColor = '#e5e5e5';
    // Step 3에서는 프레임 색상을 더 진하게 표시 (step2에서는 덜 강조)
    const frameColor = isStep3 ? '#bbbbbb' : '#dddddd';
    const highlightColor = '#FF69B4'; // 연한 연두색에서 분홍색으로 변경
    const floorFinishColor = hasFloorFinish ? '#e5e5e5' : 'transparent'; // 바닥 마감재 색상

    // 3D 뷰어와 동일한 스케일로 계산
    const scale = calculateScale('front', width, height, canvasSize.width, canvasSize.height);
    const widthPx = width * scale;
    const heightPx = height * scale;
    const floorFinishHeightPx = hasFloorFinish ? floorFinishHeight * scale : 0;

    // 정확히 캔버스 중앙에 배치 (3D 뷰어와 일치하도록)
    // 수직 위치 조정: 수직 중앙에서 살짝 위로 이동(3D 뷰어와 일치하게)
    const x = (canvasSize.width - widthPx) / 2 + pan.x;
    const verticalOffset = heightPx * 0.03; // 높이의 3% 정도 위로 올림
    const y = (canvasSize.height - heightPx) / 2 - verticalOffset + pan.y;

    // 전체 캔버스 초기화
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    // 본체 영역
    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y, widthPx, heightPx);
    
    // 벽 라인 그리기 (설치 타입에 따라 표시 여부 결정)
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 1.5; // 선을 더 두껍게 설정
    
    // Step 2에서는 벽 라인을 더 강조 (공간 경계 강조)
    if (isStep2) {
      ctx.lineWidth = 2.0;
      ctx.strokeStyle = '#333333';
    }
    
    // 상단 및 하단 라인은 항상 그리기
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + widthPx, y);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(x, y + heightPx);
    ctx.lineTo(x + widthPx, y + heightPx);
    ctx.stroke();
    
    // 좌측 벽 라인
    if (installationType === 'built-in' || 
        (installationType === 'semi-standing' && wallPosition === 'left')) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + heightPx);
      ctx.stroke();
    }
    
    // 우측 벽 라인
    if (installationType === 'built-in' || 
        (installationType === 'semi-standing' && wallPosition === 'right')) {
      ctx.beginPath();
      ctx.moveTo(x + widthPx, y);
      ctx.lineTo(x + widthPx, y + heightPx);
      ctx.stroke();
    }
    
    // 배경 약간 진하게 표시 (3D 뷰어와 같은 느낌을 주기 위해)
    ctx.fillStyle = 'rgba(250, 250, 250, 0.8)';
    ctx.fillRect(x, y, widthPx, heightPx - floorFinishHeightPx);

    // --- 프레임 그리기 (계속) ---
    // Only render frames if viewType === 'front' and options.step !== 'step2'
    if (viewType === 'front' && !isStep2) {
      // Step 3에서 프레임 강조를 위한 라벨 추가
      if (isStep3) {
        // 프레임 라벨 관련 변수는 유지 (필요시 사용)
        ctx.font = `${12 * scale * 10}px Arial`;
        ctx.fillStyle = '#666666';
        // 좌측/우측 프레임 중앙 위치 계산 (다른 기능에서 활용 가능성 있음)
        const lfLabelX = x + (leftFrameWidth * scale) / 2;
        const lfLabelY = y + heightPx / 2;
        const rfLabelX = x + widthPx - (rightFrameWidth * scale) / 2;
        const rfLabelY = y + heightPx / 2;
        
        // 프레임 라벨 텍스트 없음 - 요청에 따라 50mm 텍스트 제거
      }
      
      // 좌/우/상 프레임 (좌측 프레임은 AC 단내림이 있는 경우 높이 조정, 하단 프레임은 제거)
      // 좌측 프레임
      ctx.fillStyle = activeFrameField === 'leftFrame' ? highlightColor : frameColor;
      let lf_x = x;
      let lf_y, lf_h;
      if (hasAirConditioner && acUnitPosition === 'left') {
        lf_y = y + resolvedAcUnitHeight * scale;
        lf_h = (height - resolvedAcUnitHeight) * scale;
      } else {
        lf_y = y;
        lf_h = height * scale;
      }
      let lf_w = leftFrameWidth * scale;
      ctx.fillRect(lf_x, lf_y, lf_w, lf_h);
      ctx.strokeStyle = outlineColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(lf_x, lf_y, lf_w, lf_h);
      // 우측 프레임
      ctx.fillStyle = activeFrameField === 'rightFrame' ? highlightColor : frameColor;
      let rf_x = x + widthPx - rightFrameWidth * scale;
      let rf_y = y;
      let rf_w = rightFrameWidth * scale;
      let rf_h = heightPx;
      ctx.fillRect(rf_x, rf_y, rf_w, rf_h);
      ctx.strokeStyle = outlineColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(rf_x, rf_y, rf_w, rf_h);

      // 상단 프레임 (단내림이 있을 경우 분할)
      let soffitY = y;
      let soffitHeightPx = 0;
      if (hasAirConditioner) {
        soffitHeightPx = resolvedAcUnitHeight * scale;
        // 단내림(soffit) 아래 짧은 프레임(폭)
        // AC lower frame = 단내림 폭 - 해당 벽 프레임
        let shortFrameWidth;
        if (installationType === 'semi-standing' && resolvedAcUnitWidth === 900) {
          // 세미스탠딩 + 단내림 900mm일 때 정확히 850mm로 설정
          shortFrameWidth = 850;
        } else {
          // 기존 계산식 유지
          shortFrameWidth = Math.max(
            (resolvedAcUnitWidth - (acUnitPosition === 'left' ? leftFrameWidth : rightFrameWidth)),
            0.001
          );
        }
        const shortFrameWidthPx = shortFrameWidth * scale;
        // 상부 프레임 = 전체 폭 - 단내림 폭 - 해당 벽 프레임
        const topFrameLength = width - resolvedAcUnitWidth - (acUnitPosition === 'left' ? rightFrameWidth : leftFrameWidth);
        const topFrameLengthPx = Math.max(topFrameLength * scale, 0);

        // 상단 프레임 하이라이트
        ctx.fillStyle = activeFrameField === 'topFrame' ? highlightColor : frameColor;
        if (acUnitPosition === 'left') {
          // 좌측 프레임에 딱 붙도록 시작 위치 조정
          const leftFrameEndX = x + leftFrameWidth * scale;
          
          // (1) 단내림 아래 짧은 프레임 (좌측) - 바로 AC 단내림 아래, 좌측 프레임 끝에서 시작하여 단내림 폭만큼
          let s1_x = leftFrameEndX; // 좌측 프레임 바로 옆에서 시작
          let s1_y = y + soffitHeightPx;
          // 단내림 너비에서 좌측 프레임 너비를 뺀 값으로 정확히 계산
          let s1_w = resolvedAcUnitWidth * scale - leftFrameWidth * scale;
          let s1_h = upperFrameWidth * scale;
          ctx.fillRect(s1_x, s1_y, s1_w, s1_h);
          ctx.strokeStyle = outlineColor;
          ctx.lineWidth = 1;
          ctx.strokeRect(s1_x, s1_y, s1_w, s1_h);
          
          // (2) 천장쪽 긴 프레임 (우측) - 단내림 오른쪽 끝에서 시작하여 우측 프레임까지
          // 단내림 우측 끝 계산
          let s2_x = x + resolvedAcUnitWidth * scale;
          let s2_y = y;
          // 전체 너비에서 단내림 너비와 우측 프레임 너비를 제외한 값
          let s2_w = widthPx - resolvedAcUnitWidth * scale - rightFrameWidth * scale;
          let s2_h = upperFrameWidth * scale;
          ctx.fillRect(s2_x, s2_y, s2_w, s2_h);
          ctx.strokeStyle = outlineColor;
          ctx.lineWidth = 1;
          ctx.strokeRect(s2_x, s2_y, s2_w, s2_h);
        } else if (acUnitPosition === 'right') {
          // 우측 프레임 시작 위치 계산
          const rightFrameStartX = x + widthPx - rightFrameWidth * scale;
          
          // (1) 천장쪽 긴 프레임 (좌측) - 좌측 프레임 끝에서 시작하여 단내림 시작점까지
          let s1_x = x + leftFrameWidth * scale;
          let s1_y = y;
          // 전체 너비에서 단내림 너비와 좌측 프레임 너비를 제외한 값
          let s1_w = widthPx - resolvedAcUnitWidth * scale - leftFrameWidth * scale;
          let s1_h = upperFrameWidth * scale;
          ctx.fillRect(s1_x, s1_y, s1_w, s1_h);
          ctx.strokeStyle = outlineColor;
          ctx.lineWidth = 1;
          ctx.strokeRect(s1_x, s1_y, s1_w, s1_h);
          
          // (2) 단내림 아래 짧은 프레임 (우측) - 단내림 시작점에서 우측 프레임까지
          // 단내림 시작점 계산
          let s2_x = rightFrameStartX - (resolvedAcUnitWidth - rightFrameWidth) * scale;
          let s2_y = y + soffitHeightPx;
          // 단내림 너비에서 우측 프레임 너비를 뺀 값으로 정확히 계산
          let s2_w = (resolvedAcUnitWidth - rightFrameWidth) * scale;
          let s2_h = upperFrameWidth * scale;
          ctx.fillRect(s2_x, s2_y, s2_w, s2_h);
          ctx.strokeStyle = outlineColor;
          ctx.lineWidth = 1;
          ctx.strokeRect(s2_x, s2_y, s2_w, s2_h);
        }
        // 중앙 배치(미지원): else 안 그림
      } else {
        // 단내림 없으면 상단 프레임은 좌우 프레임 사이에만 그린다 (vertical frame 우선)
        ctx.fillStyle = activeFrameField === 'topFrame' ? highlightColor : frameColor;
        let tf_x = x + leftFrameWidth * scale;
        let tf_y = y;
        let tf_w = (width - leftFrameWidth - rightFrameWidth) * scale;
        let tf_h = upperFrameWidth * scale;
        ctx.fillRect(tf_x, tf_y, tf_w, tf_h);
        ctx.strokeStyle = outlineColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(tf_x, tf_y, tf_w, tf_h);
      }
    }

    // --- 단내림(soffit) 그리기 ---
    // Step 3에서는 단내림 높이(Z축) 관련 정보 숨김
    if (hasAirConditioner && (!isStep3 || (isStep3 && viewType === 'front'))) {
      ctx.fillStyle = acFillColor;
      const acWidthPx = resolvedAcUnitWidth * scale;
      const acHeightPx = resolvedAcUnitHeight * scale;
      let acX;
      if (acUnitPosition === 'left') {
        acX = x; // 프레임과 겹치지 않도록 기둥이 꼭짓점에 붙게
      } else if (acUnitPosition === 'right') {
        // Align soffit exactly with the top-right corner of the wall (do NOT offset by frame width)
        acX = x + widthPx - acWidthPx;
      } else {
        acX = x + (widthPx - acWidthPx) / 2;
      }
      ctx.beginPath();
      ctx.rect(acX, y, acWidthPx, acHeightPx);
      ctx.fill();
      ctx.strokeStyle = acOutlineColor;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // --- 마감재 ---
    if (hasFloorFinish && floorFinishHeightPx > 0) {
      // 마감재 채우기
      ctx.fillStyle = floorFinishColor;
      ctx.fillRect(x, y + heightPx - floorFinishHeightPx, widthPx, floorFinishHeightPx);
      
      // 마감재 테두리 (점선)
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#999999';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y + heightPx - floorFinishHeightPx, widthPx, floorFinishHeightPx);
      ctx.setLineDash([]);
    }
    
    // --- 받침대 그리기 ---
    if ((options?.hasBase || hasBaseFromOptions) && baseHeight > 0) {
      const baseHeightPx = baseHeight * scale;
      const baseDepth = options?.baseDepth || 580;
      const baseInsideFrame = true;
      const floorFinishHeightPx = hasFloorFinish ? dimensions.floorFinishHeight * scale : 0;
      const baseY = y + heightPx - baseHeightPx - floorFinishHeightPx;

      // --- 상부 내경(상부 프레임) 사이즈 계산 ---
      let topFrameInnerWidth;
      if (hasAirConditioner) {
        // 단내림이 있을 때 공식 적용
        if (acUnitPosition === 'left') {
          topFrameInnerWidth = width - acUnitWidth - rightFrameWidth;
        } else {
          topFrameInnerWidth = width - acUnitWidth - leftFrameWidth;
        }
      } else {
        // 단내림이 없을 때 기존 공식
        topFrameInnerWidth = width - leftFrameWidth - rightFrameWidth;
      }

      // --- 하부 단내림 내경(받침대) 중앙정렬 위치 계산 ---
      if (hasAirConditioner) {
        let acBaseCenterX;
        if (acUnitPosition === 'left') {
          acBaseCenterX = x + leftFrameWidth * scale + (acUnitWidth * scale) / 2;
        } else {
          acBaseCenterX = x + widthPx - rightFrameWidth * scale - (acUnitWidth * scale) / 2;
        }
        // 중앙정렬: 상부 내경과 동일한 x축 위치로 맞춤
        // (상부 내경 중앙 = acBaseCenterX)
        const acBaseWidthPx = (acUnitWidth - (acUnitPosition === 'left' ? leftFrameWidth : rightFrameWidth)) * scale;
        ctx.fillStyle = activeDimensionField === 'baseHeight' ? '#FF69B4' : frameColor;
        ctx.fillRect(acBaseCenterX - acBaseWidthPx / 2, baseY, acBaseWidthPx, baseHeightPx);
        ctx.strokeStyle = '#999999';
        ctx.lineWidth = 1;
        ctx.strokeRect(acBaseCenterX - acBaseWidthPx / 2, baseY, acBaseWidthPx, baseHeightPx);
      }
      // ... 기존 일반 받침대 렌더링 코드 ...
    }

    // 치수선 - Step 3에서는 정면도 전용 치수선만 표시
    if (isStep3) {
      // Step 3에서는 정면도 관련 치수선만 그리기 (Z축 치수 제외)
      drawFrontViewDimensions(ctx, x, y, widthPx, heightPx, scale);
    } else {
      // 일반 치수선 그리기
    drawDimensionLines(ctx, 'front', x, y, widthPx, heightPx, 0, scale);
    }
  };
  
  // Step 3 정면도 전용 치수선 그리기 함수
  const drawFrontViewDimensions = (ctx, x, y, widthPx, heightPx, scale) => {
    // 필요한 변수들 정의
    const { width, height } = dimensions;
    const leftFrameWidth = options?.leftFrameWidth || 50;
    const rightFrameWidth = options?.rightFrameWidth || 50;
    const upperFrameWidth = options?.upperFrameWidth || 40;
    const lowerFrameWidth = options?.lowerFrameWidth || 0; // 하단 프레임 (있는 경우)
    const hasBaseFromOptions = options?.hasBase || hasBase;
    const baseHeight = options?.baseHeight || dimensions.baseHeight || 0;
    
    // 기본 스타일 설정 - 스텝2와 정확히 동일한 값 사용
    const frameColor = '#bbbbbb';
    const highlightColor = '#FF69B4';
    const normalDimensionColor = '#00C092'; // 기본 치수선 색상
    const outlineColor = '#666666';
    const extensionLineGap = 15; // 확장선 갭 (공간과 보조선 사이 거리 증가)
    const gapFromObject = 30; // 객체와 치수선 사이 간격 - 모든 치수선에 동일하게 적용
    
    // 텍스트 스타일 설정
    const fontSize = Math.max(12, 14 * scale * 10);
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // CAD 스타일의 슬래시 끝점 그리기 함수 
    const drawSlashEnd = (x, y, isStart, isVertical, color) => {
      const slashLength = 4; // 슬래시 크기를 절반으로 줄임
      
      ctx.strokeStyle = color;
      ctx.beginPath();
      if (isVertical) {
        // 세로 방향 슬래시
        if (isStart) {
          // 시작점
          ctx.moveTo(x - slashLength/2, y - slashLength/2);
          ctx.lineTo(x + slashLength/2, y + slashLength/2);
        } else {
          // 끝점
          ctx.moveTo(x - slashLength/2, y + slashLength/2);
          ctx.lineTo(x + slashLength/2, y - slashLength/2);
        }
      } else {
        // 가로 방향 슬래시
        if (isStart) {
          // 시작점
          ctx.moveTo(x - slashLength/2, y - slashLength/2);
          ctx.lineTo(x + slashLength/2, y + slashLength/2);
        } else {
          // 끝점
          ctx.moveTo(x - slashLength/2, y - slashLength/2);
          ctx.lineTo(x + slashLength/2, y + slashLength/2);
        }
      }
      ctx.stroke();
    };
    
    // CAD 스타일 치수선 그리기 - 계단식 배치 제거하고 일관된 간격 사용
    const drawDimensionLine = (start, end, value, order = 0, opts = {}) => {
      const dimensionColor = opts.color || normalDimensionColor;
      const isHorizontal = start.y === end.y;
      let textX, textY;
      
      // 모든 치수선에 동일한 간격 적용 (계단식 배치 제거)
      const padding = gapFromObject;
      // 객체와 보조선 사이 간격 (픽셀)
      const objectGap = 5;
      
      ctx.strokeStyle = dimensionColor;
      ctx.fillStyle = dimensionColor;
      
      if (isHorizontal) {
        // 가로 치수선
        const isTop = start.y < y + heightPx / 2;
        // 상단과 하단 모두 간격을 동일하게 적용 (gapFromObject 만큼 띄움)
        const lineY = isTop ? 
          start.y - gapFromObject : // 상단에 표시할 때 (동일한 간격)
          start.y + gapFromObject;  // 하단에 표시할 때 (동일한 간격)
        
        // 보조선 시작점에 간격 추가 (객체에서 약간 떨어진 위치에서 시작)
        const startOffsetY = isTop ? -objectGap : objectGap;
        const endOffsetY = isTop ? -objectGap : objectGap;
        
        // 왼쪽 확장선
        ctx.beginPath();
        ctx.moveTo(start.x, start.y + startOffsetY);
        ctx.lineTo(start.x, lineY);
        ctx.stroke();
        
        // 오른쪽 확장선
        ctx.beginPath();
        ctx.moveTo(end.x, end.y + endOffsetY);
        ctx.lineTo(end.x, lineY);
        ctx.stroke();
        
        // 치수선
        ctx.beginPath();
        ctx.moveTo(start.x, lineY);
        ctx.lineTo(end.x, lineY);
        ctx.stroke();
        
        // 슬래시 끝점
        drawSlashEnd(start.x, lineY, true, false, dimensionColor);
        drawSlashEnd(end.x, lineY, false, false, dimensionColor);
        
        // 텍스트 위치
        textX = (start.x + end.x) / 2;
        textY = lineY;
      } else {
        // 세로 치수선
        const isLeft = start.x < x + widthPx / 2;
        // 좌측과 우측 모두 간격을 동일하게 적용 (gapFromObject/2 만큼 띄움)
        const lineX = isLeft ? 
          start.x - gapFromObject : // 좌측에 표시할 때 (동일한 간격)
          start.x + gapFromObject;  // 우측에 표시할 때 (동일한 간격)
        
        // 보조선 시작점에 간격 추가 (객체에서 약간 떨어진 위치에서 시작)
        const startOffsetX = isLeft ? -objectGap : objectGap;
        const endOffsetX = isLeft ? -objectGap : objectGap;
        
        // 위쪽 확장선
        ctx.beginPath();
        ctx.moveTo(start.x + startOffsetX, start.y);
        ctx.lineTo(lineX, start.y);
        ctx.stroke();
        
        // 아래쪽 확장선
        ctx.beginPath();
        ctx.moveTo(end.x + endOffsetX, end.y);
        ctx.lineTo(lineX, end.y);
        ctx.stroke();
        
        // 치수선
        ctx.beginPath();
        ctx.moveTo(lineX, start.y);
        ctx.lineTo(lineX, end.y);
        ctx.stroke();
        
        // 슬래시 끝점
        drawSlashEnd(lineX, start.y, true, true, dimensionColor);
        drawSlashEnd(lineX, end.y, false, true, dimensionColor);
        
        // 텍스트 위치
        textX = lineX;
        textY = (start.y + end.y) / 2;
      }
      
      // 치수 텍스트 배경
      const textWidth = ctx.measureText(`${value}`).width;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(
        textX - textWidth/2 - 6,
        textY - 12,
        textWidth + 12,
        24
      );
      
      // 치수 텍스트
      ctx.fillStyle = dimensionColor;
      ctx.fillText(`${value}`, textX, textY);
    };
    
    // ===== 치수선 그리기 시작 =====
    
    // 1. 좌측 프레임 너비 치수 - 하단에 표시
    if (leftFrameWidth > 0) {
      const dimensionColor = activeDimensionField === 'leftFrame' ? highlightColor : normalDimensionColor;
      
      // 좌측 프레임 하단 위치
      const baseBottomY = y + heightPx - (hasFloorFinish ? dimensions.floorFinishHeight * scale : 0);
      
      drawDimensionLine(
        { x: x, y: baseBottomY },
        { x: x + leftFrameWidth * scale, y: baseBottomY },
        leftFrameWidth,
        0,
        { color: dimensionColor }
      );
    }
    
    // 2. 우측 프레임 너비 치수 - 하단에 표시
    if (rightFrameWidth > 0) {
      const dimensionColor = activeDimensionField === 'rightFrame' ? highlightColor : normalDimensionColor;
      
      // 우측 프레임 하단 위치
      const baseBottomY = y + heightPx - (hasFloorFinish ? dimensions.floorFinishHeight * scale : 0);
      
      drawDimensionLine(
        { x: x + widthPx - rightFrameWidth * scale, y: baseBottomY },
        { x: x + widthPx, y: baseBottomY },
        rightFrameWidth,
        0,
        { color: dimensionColor }
      );
    }
    
    // 3. 세로 프레임 길이 치수 - 단내림 양쪽 모두 표시
    if (hasAirConditioner) {
      const dimensionColor = normalDimensionColor;
      
      // 3-1. 단내림 반대쪽 세로 프레임 (바닥에서 천장까지 전체 높이)
      // 올바른 높이 계산: 바닥에서 천장까지 전체 높이
      const verticalFrameFullHeight = height; // 예: 2400mm
      
      // 단내림 반대쪽 X 좌표 계산
      let oppositeFrameX;
      
      if (acUnitPosition === 'left') {
        // 단내림이 좌측이면 우측 프레임에 전체 높이 표시
        oppositeFrameX = x + widthPx - rightFrameWidth * scale / 2;
      } else {
        // 단내림이 우측이면 좌측 프레임에 전체 높이 표시
        oppositeFrameX = x + leftFrameWidth * scale / 2;
      }
      
      // 전체 프레임 시작/끝 지점
      const fullFrameTopY = y;
      const fullFrameBottomY = y + heightPx;
      
      // 단내림 반대쪽 세로 프레임 길이 치수선 그리기 (바닥에서 천장까지)
      drawDimensionLine(
        { x: oppositeFrameX, y: fullFrameTopY },
        { x: oppositeFrameX, y: fullFrameBottomY },
        verticalFrameFullHeight,
        0,
        { color: dimensionColor }
      );
      
      // 3-2. 단내림 쪽 세로 프레임 (바닥에서 단내림까지)
      // 단내림 아래 세로 프레임 길이 계산 (바닥에서 단내림 하단까지)
      // 전체 높이에서 단내림 높이만 빼기 (예: 2400 - 200 = 2200mm)
      const soffitSideFullHeight = height - resolvedAcUnitHeight; // 예: 2400 - 200 = 2200mm
      
      // 단내림쪽 X 좌표 계산
      let soffitSideFrameX;
      
      // 공간과 일정한 갭 유지 (다른 치수들과 동일하게)
      // 내부에 표시하되, 벽에서 떨어진 위치 사용
      if (acUnitPosition === 'left') {
        // 단내림이 좌측이면 좌측 프레임 위치 (프레임 중앙에 표시)
        soffitSideFrameX = x + leftFrameWidth * scale / 2;
      } else {
        // 단내림이 우측이면 우측 프레임 위치 (프레임 중앙에 표시)
        soffitSideFrameX = x + widthPx - rightFrameWidth * scale / 2;
      }
      
      // 단내림 쪽 세로 프레임 시작/끝 지점 (바닥부터 단내림 하단까지)
      const soffitTopY = y + resolvedAcUnitHeight * scale; // 단내림 하단 위치
      const soffitBottomY = y + heightPx; // 바닥 위치
      
      // 단내림 쪽 세로 프레임 길이 치수선 그리기 (바닥에서 단내림 하단까지)
      drawDimensionLine(
        { x: soffitSideFrameX, y: soffitTopY },
        { x: soffitSideFrameX, y: soffitBottomY },
        soffitSideFullHeight,
        0,
        { color: dimensionColor }
      );
    }
    
    // 4. 상단 프레임 높이 치수
    if (upperFrameWidth > 0) {
      const dimensionColor = activeDimensionField === 'topFrame' ? highlightColor : normalDimensionColor;
      
      // 상단 프레임 위치 계산
      let frameMiddleX;
      
      if (hasAirConditioner) {
        // 단내림이 있는 쪽에 상단 프레임 높이 치수를 표시
        // 공간과 일정한 갭 유지하고 모든 치수와 동일한 간격 적용
        if (acUnitPosition === 'left') {
          // 좌측에 단내림이 있으면 좌측 프레임 중앙에 표시
          frameMiddleX = x + leftFrameWidth * scale / 2;
        } else {
          // 우측에 단내림이 있으면 우측 프레임 중앙에 표시
          frameMiddleX = x + widthPx - rightFrameWidth * scale / 2;
        }
      } else {
        // 단내림이 없는 경우 중앙에 표시
        frameMiddleX = x + widthPx / 2;
      }
      
      // 상단 프레임 높이 치수선 그리기
      drawDimensionLine(
        { x: frameMiddleX, y: y },
        { x: frameMiddleX, y: y + upperFrameWidth * scale },
        upperFrameWidth,
        0,
        { color: dimensionColor }
      );
      
      // 모든 상단 프레임 가로 치수선은 동일한 높이에 표시 (계단식 X)
      if (hasAirConditioner) {
        // 단내림이 있는 경우
        // 상단 프레임 치수 표시 높이 - 일관된 높이로 표시
        // 단내림 위 프레임과 단내림 아래 프레임 모두 동일한 높이에 표시
        
        // 상단 프레임 치수 Y 좌표 (단내림 위 프레임) - 모든 치수와 동일한 간격 적용
        const topFrameY = y - gapFromObject; // 일관된 30px 간격 유지
        
        // 단내림 아래 프레임 치수 Y 좌표도 동일하게 설정
        const lowerTopFrameY = topFrameY; // 동일한 높이에 표시
        
        if (acUnitPosition === 'left') {
          // 1. 좌측 단내림 아래 짧은 프레임
          const leftSegmentWidth = resolvedAcUnitWidth - leftFrameWidth;
          const leftSegmentStartX = x + leftFrameWidth * scale; 
          const leftSegmentEndX = x + resolvedAcUnitWidth * scale;
          
          // 좌측 상단 단내림 아래 짧은 프레임 치수선 (상단과 동일한 높이에 표시)
          drawDimensionLine(
            { x: leftSegmentStartX, y: lowerTopFrameY },
            { x: leftSegmentEndX, y: lowerTopFrameY },
            leftSegmentWidth,
            0,
            { color: dimensionColor }
          );
          
          // 2. 우측 상단 긴 프레임
          const rightSegmentWidth = width - resolvedAcUnitWidth - rightFrameWidth;
          const rightSegmentStartX = x + resolvedAcUnitWidth * scale;
          const rightSegmentEndX = x + widthPx - rightFrameWidth * scale;
          
          // 우측 상단 긴 프레임 치수선 (동일한 높이에 표시)
          drawDimensionLine(
            { x: rightSegmentStartX, y: topFrameY },
            { x: rightSegmentEndX, y: topFrameY },
            rightSegmentWidth,
            0,
            { color: dimensionColor }
          );
          
        } else if (acUnitPosition === 'right') {
          // 1. 좌측 상단 긴 프레임
          const leftSegmentWidth = width - resolvedAcUnitWidth - leftFrameWidth;
          const leftSegmentStartX = x + leftFrameWidth * scale;
          const leftSegmentEndX = x + widthPx - resolvedAcUnitWidth * scale;
          
          // 좌측 상단 긴 프레임 치수선 (동일한 높이에 표시)
          drawDimensionLine(
            { x: leftSegmentStartX, y: topFrameY },
            { x: leftSegmentEndX, y: topFrameY },
            leftSegmentWidth,
            0,
            { color: dimensionColor }
          );
          
          // 2. 우측 상단 단내림 아래 짧은 프레임
          const rightSegmentWidth = resolvedAcUnitWidth - rightFrameWidth;
          const rightSegmentStartX = x + widthPx - resolvedAcUnitWidth * scale;
          const rightSegmentEndX = x + widthPx - rightFrameWidth * scale;
          
          // 우측 상단 단내림 아래 짧은 프레임 치수선 (상단과 동일한 높이에 표시)
          drawDimensionLine(
            { x: rightSegmentStartX, y: lowerTopFrameY },
            { x: rightSegmentEndX, y: lowerTopFrameY },
            rightSegmentWidth,
            0,
            { color: dimensionColor }
          );
        }
      } else {
        // 단내림 없는 경우 전체 상단 프레임 가로 길이 표시
        const topFrameWidth = width - leftFrameWidth - rightFrameWidth;
        const topFrameLeftX = x + leftFrameWidth * scale;
        const topFrameRightX = x + widthPx - rightFrameWidth * scale;
        const topFrameY = y - gapFromObject; // 상단에 표시
        
        // 상단 프레임 가로 길이 치수 표시
        drawDimensionLine(
          { x: topFrameLeftX, y: topFrameY },
          { x: topFrameRightX, y: topFrameY },
          topFrameWidth,
          0,
          { color: dimensionColor }
        );
      }
    }
    
    // 5. 받침대 관련 치수 (있는 경우)
    if (hasBaseFromOptions && baseHeight > 0) {
      const baseWidthValue = width - leftFrameWidth - rightFrameWidth;
      const baseColor = activeDimensionField === 'baseHeight' ? highlightColor : normalDimensionColor;
      
      // 받침대 높이
      const floorFinishHeightPx = dimensions.floorFinishHeight * scale;
      const baseBottomY = y + heightPx - (hasFloorFinish ? floorFinishHeightPx : 0);
      const baseTopY = baseBottomY - baseHeight * scale;
      
      // 받침대 시작/끝 지점
      const baseLeftX = x + leftFrameWidth * scale;
      const baseRightX = x + widthPx - rightFrameWidth * scale;
      
      // 받침대 가로 길이 치수 - 하단에 표시
      drawDimensionLine(
        { x: baseLeftX, y: baseBottomY },
        { x: baseRightX, y: baseBottomY },
        baseWidthValue,
        0,
        { color: baseColor }
      );
      
      // 받침대 높이 치수 - 좌측 하단에 표시
      drawDimensionLine(
        { x: baseLeftX, y: baseTopY },
        { x: baseLeftX, y: baseBottomY },
        baseHeight,
        0,
        { color: baseColor }
      );
    }
  };
  
  // 좌측 측면 뷰 그리기
  const drawLeftView = (ctx) => {
    const { depth, height } = dimensions;
    
    // 색상 정의
    const outlineColor = '#666666'; // 회색 윤곽선
    const fillColor = 'white';    // 흰색 채우기
    const acOutlineColor = '#666666'; // 에어컨 윤곽선 색상
    const acFillColor = '#e5e5e5';    // 에어컨 채우기 색상
    const frameColor = '#bbbbbb'; // 분할판 및 프레임 채우기 색상
    
    // 스케일 동적 계산
    const scale = calculateScale('left', depth, height, canvasSize.width, canvasSize.height);
    
    // 픽셀 단위로 변환
    const depthPx = depth * scale;
    const heightPx = height * scale;
    
    // 캔버스 정중앙에 배치 + 팬 오프셋 적용
    const x = (canvasSize.width - depthPx) / 2 + pan.x;
    const y = (canvasSize.height - heightPx) / 2 + pan.y;
    
    // 디버깅용 로그
    console.log('Drawing left view:', { x, y, depthPx, heightPx, canvasSize, scale });
    
    // 전체 캔버스 초기화
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
    
    // 외곽선 그리기
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 1;
    
    if (installationType === 'built-in') {
      // 빌트인은 모든 벽 표시
      
      // 공간 채우기
      ctx.fillStyle = fillColor;
      ctx.fillRect(x, y, depthPx, heightPx);
      
      // 외곽선 그리기
      ctx.strokeRect(x, y, depthPx, heightPx);
    } else if (installationType === 'semi-standing') {
      // 반스탠딩은 천장, 바닥, 한쪽 벽만 표시
      
      // 공간 채우기
      ctx.fillStyle = fillColor;
      ctx.fillRect(x, y, depthPx, heightPx);
      
      // 천장
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + depthPx, y);
      ctx.stroke();
      
      // 바닥
      ctx.beginPath();
      ctx.moveTo(x, y + heightPx);
      ctx.lineTo(x + depthPx, y + heightPx);
      ctx.stroke();
      
      // 벽 (acUnitPosition에 따라)
      ctx.beginPath();
      if (acUnitPosition === 'left') {
        // 좌측 벽임 (우측에 벽 표시)
        ctx.moveTo(x + depthPx, y);
        ctx.lineTo(x + depthPx, y + heightPx);
      } else {
        // 우측 벽임 (좌측에 벽 표시)
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + heightPx);
      }
      ctx.stroke();
    } else if (installationType === 'standing') {
      // 스탠딩은 천장, 바닥만 실선으로 표시
      
      // 공간 채우기
      ctx.fillStyle = fillColor;
      ctx.fillRect(x, y, depthPx, heightPx);
      
      // 천장 (실선)
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + depthPx, y);
      ctx.stroke();
      
      // 바닥 (실선)
      ctx.beginPath();
      ctx.moveTo(x, y + heightPx);
      ctx.lineTo(x + depthPx, y + heightPx);
      ctx.stroke();
    }
    
    // 에어컨 단내림 표시 - 위치에 따라 다르게
    // 스텝3에서는 에어컨 단내림 표시 안함 (바닥마감재, 프레임, 받침대만 표시)
    if (hasAirConditioner) {
      ctx.fillStyle = acFillColor; // 에어컨 채우기 색상
      // For 'left' position, width is horizontal (x-axis), resolvedAcUnitHeight is vertical (y-axis)
      const acWidthPx = dimensions.depth * scale; // horizontal width
      const acHeightPx = resolvedAcUnitHeight * scale; // vertical height

      if (acUnitPosition === 'left') {
        ctx.beginPath();
        ctx.rect(x, y, acWidthPx, acHeightPx);
        ctx.fill();
        ctx.strokeStyle = acOutlineColor;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      // else if needed, handle other positions...
    }
    
    // 바닥 마감재 그리기 - 더 투명한 색상 사용
    if (hasFloorFinish) {
      const floorFinishHeight = dimensions.floorFinishHeight * scale;
      
      ctx.fillStyle = '#d8d8d8';
      ctx.beginPath();
      ctx.rect(x, y + heightPx - floorFinishHeight, depthPx, floorFinishHeight);
      ctx.fill();
      ctx.stroke();
    }

    // --- 좌측면도: built-in 상단 쉐이딩 (단내림 높이) ---
    const soffitHeightPx = resolvedAcUnitHeight * scale;
    ctx.fillStyle = 'rgba(238, 238, 238, 0.3)';
    ctx.fillRect(x, y, depthPx, soffitHeightPx);

    // --- 좌측면도: built-in 분할판 경계 ---
    const dividerThicknessPx = 20 * scale; // 프레임 두께 20mm
    // built-in depth offset from back wall (right side)
    const rearWallOffset = 580; // mm - 뒷벽에서 580mm 떨어진 위치
    const dividerX = x + depthPx - rearWallOffset * scale;
    ctx.fillStyle = frameColor;
    ctx.beginPath();
    ctx.rect(
      dividerX,
      y + soffitHeightPx,               // 상단 쉐이딩 아래
      dividerThicknessPx,
      heightPx - soffitHeightPx         // 나머지 전체 높이
    );
    ctx.fill();
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // 치수선 그리기
    drawDimensionLines(ctx, 'left', x, y, 0, heightPx, depthPx, scale);

    // 받침대 그리기 (있는 경우에만)
    if (hasBase) {
      // 받침대 높이 입력 필드에 포커스가 있으면 분홍색, 그렇지 않으면 노란색
      ctx.fillStyle = activeDimensionField === 'baseHeight' ? '#FF69B4' : '#FFD700';
      
      const baseHeightPx = baseHeight * scale;
      ctx.fillRect(
        x,
        y + heightPx - baseHeightPx - (hasFloorFinish ? floorFinishHeightPx : 0),
        depthPx,
        baseHeightPx
      );
    }
  };
  
  // 우측 측면 뷰 그리기
  const drawRightView = (ctx) => {
    const { depth, height } = dimensions;
    
    // 색상 정의
    const outlineColor = '#666666'; // 회색 윤곽선
    const fillColor = 'white';    // 흰색 채우기
    const acOutlineColor = '#666666'; // 에어컨 윤곽선 색상
    const acFillColor = '#e5e5e5';    // 에어컨 채우기 색상
    const frameColor = '#bbbbbb'; // 분할판 및 프레임 채우기 색상
    
    // 스케일 동적 계산
    const scale = calculateScale('right', depth, height, canvasSize.width, canvasSize.height);
    
    // 픽셀 단위로 변환
    const depthPx = depth * scale;
    const heightPx = height * scale;
    
    // 캔버스 정중앙에 배치 + 팬 오프셋 적용
    const x = (canvasSize.width - depthPx) / 2 + pan.x;
    const y = (canvasSize.height - heightPx) / 2 + pan.y;
    
    // 디버깅용 로그
    console.log('Drawing right view:', { x, y, depthPx, heightPx, canvasSize, scale });
    
    // 전체 캔버스 초기화
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
    
    // 외곽선 그리기
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 1;
    
    if (installationType === 'built-in') {
      // 빌트인은 모든 벽 표시
      
      // 공간 채우기
      ctx.fillStyle = fillColor;
      ctx.fillRect(x, y, depthPx, heightPx);
      
      // 외곽선 그리기
      ctx.strokeRect(x, y, depthPx, heightPx);
    } else if (installationType === 'semi-standing') {
      // 반스탠딩은 천장, 바닥, 한쪽 벽만 표시
      
      // 공간 채우기
      ctx.fillStyle = fillColor;
      ctx.fillRect(x, y, depthPx, heightPx);
      
      // 천장
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + depthPx, y);
      ctx.stroke();
      
      // 바닥
      ctx.beginPath();
      ctx.moveTo(x, y + heightPx);
      ctx.lineTo(x + depthPx, y + heightPx);
      ctx.stroke();
      
      // 벽 (acUnitPosition에 따라)
      ctx.beginPath();
      if (acUnitPosition === 'right') {
        // 우측 벽임 (좌측에 벽 표시)
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + heightPx);
      } else {
        // 좌측 벽임 (우측에 벽 표시)
        ctx.moveTo(x + depthPx, y);
        ctx.lineTo(x + depthPx, y + heightPx);
      }
      ctx.stroke();
    } else if (installationType === 'standing') {
      // 스탠딩은 천장, 바닥만 실선으로 표시
      
      // 공간 채우기
      ctx.fillStyle = fillColor;
      ctx.fillRect(x, y, depthPx, heightPx);
      
      // 천장 (실선)
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + depthPx, y);
      ctx.stroke();
      
      // 바닥 (실선)
      ctx.beginPath();
      ctx.moveTo(x, y + heightPx);
      ctx.lineTo(x + depthPx, y + heightPx);
      ctx.stroke();
    }
    
    // 에어컨 단내림 표시 - 위치에 따라 다르게
    if (hasAirConditioner) {
      ctx.fillStyle = acFillColor; // 에어컨 채우기 색상
      // For 'right' position, width is horizontal (x-axis), resolvedAcUnitHeight is vertical (y-axis)
      const acWidthPx = dimensions.depth * scale; // horizontal width
      const acHeightPx = resolvedAcUnitHeight * scale; // vertical height

      if (acUnitPosition === 'right') {
        ctx.beginPath();
        ctx.rect(x + depthPx - acWidthPx, y, acWidthPx, acHeightPx);
        ctx.fill();
        ctx.strokeStyle = acOutlineColor;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      // else if needed, handle other positions...
    }
    
    // 옷장 그리기 - 더 투명한 색상 사용
    ctx.fillStyle = 'rgba(238, 238, 238, 0.3)';
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    
    const wardrobeDepth = dimensions.depth * scale;
    const wardrobeX = x;
    
    ctx.beginPath();
    ctx.rect(wardrobeX, y, wardrobeDepth, heightPx);
    ctx.fill();
    ctx.stroke();
    
    // 바닥 마감재 그리기 - 더 투명한 색상 사용
    if (hasFloorFinish) {
      const floorFinishHeight = dimensions.floorFinishHeight * scale;
      
      ctx.fillStyle = '#d8d8d8';
      ctx.beginPath();
      ctx.rect(x, y + heightPx - floorFinishHeight, depthPx, floorFinishHeight);
      ctx.fill();
      ctx.stroke();
    }
    
    // 치수선 그리기
    drawDimensionLines(ctx, 'right', x, y, 0, heightPx, depthPx, scale);

    // 받침대 그리기 (있는 경우에만)
    if (hasBase) {
      // 받침대 높이 입력 필드에 포커스가 있으면 분홍색, 그렇지 않으면 노란색
      ctx.fillStyle = activeDimensionField === 'baseHeight' ? '#FF69B4' : '#FFD700';
      
      const baseHeightPx = baseHeight * scale;
      ctx.fillRect(
        x,
        y + heightPx - baseHeightPx - (hasFloorFinish ? floorFinishHeightPx : 0),
        depthPx,
        baseHeightPx
      );
    }
  };
  
  // 치수선 그리기 함수
  const drawDimensionLines = (ctx, viewType, x, y, widthPx, heightPx, depthPx, scale) => {
    // 디버그 코드 추가 - 현재 상태 출력
    console.log('drawDimensionLines 호출됨:', { 
      step: options?.step, 
      showFrame: options?.showFrame, 
      viewType,
      installationType,
      wallPosition,
      fitOption: options?.fitOption
    });
    
    // hasBaseFromOptions 변수 정의
    const hasBaseFromOptions = options?.hasBase || hasBase;
    
    // 노 서라운드 모드 체크
    const isNoSurround = options?.fitOption === 'tight';
    
    // Step 설정에 따른 주요 동작 분기 처리
    // Step 2: 공간 치수만 표시 (프레임 치수 표시 안 함)
    // Step 3: 프레임 치수 표시 (노 서라운드 모드에서는 제외)
    const isStep2 = options?.step === 'step2';
    const isStep3 = options?.step === 'step3';
    
    // 프레임 치수 표시 여부 결정
    // 스텝3에서는 항상 프레임 치수를 표시하도록 수정 (isNoSurround 조건 제거)
    const showFrameDimensions = isStep3;
    // Step 3에서는 공간 치수 표시 안함
    const showSpaceDimensions = !isStep3;
    
    // Step 3에서는 정면도만 표시하고, Z축 관련 치수 표시 안함
    if (isStep3 && viewType === 'front') {
      // Z축(깊이) 관련 치수는 표시하지 않음
      const showZAxisDimensions = false;
    }
    
    // 색상 정의 - 선택된 필드에 따라 치수선 색상 결정
    const getNormalDimensionColor = () => '#00C092'; // 기본 색상은 초록색으로 유지
    const getHighlightDimensionColor = () => '#FF69B4'; // 강조 색상을 분홍색으로 변경
    
    // Step 2: 공간 치수 색상 - 더 진한 초록색으로 강조
    const getSpaceDimensionColor = () => isStep2 ? '#00A075' : '#00C092';
    // Step 3: 프레임 치수 색상 - 프레임 치수를 구분하기 위한 색상 (보라색에서 초록색으로 변경)
    const getFrameDimensionColor = () => '#00C092';
    
    // 선택된 필드에 따라 치수선 색상 결정하는 함수
    const getDimensionColor = (dimensionType) => {
      // 활성화된 필드가 있으면 강조 색상 반환
      if (activeDimensionField && activeDimensionField === dimensionType) {
        return getHighlightDimensionColor();
      }

      // 특정 프레임에 대한 치수선 처리 - 선택된 프레임만 강조표시
      // 필드명과 치수타입명 매핑 처리
      if (dimensionType === 'leftFrameWidth' || dimensionType === 'rightFrameWidth' || dimensionType === 'topFrameHeight') {
        // 필드명과 치수타입명 매핑 관계
        const fieldToTypeMap = {
          'leftFrame': 'leftFrameWidth',
          'rightFrame': 'rightFrameWidth',
          'topFrame': 'topFrameHeight'
        };
        
        // 활성화된 필드에 해당하는 치수 타입 확인
        if (activeDimensionField && fieldToTypeMap[activeDimensionField] === dimensionType) {
          return getHighlightDimensionColor();
        }
        
        // Step 3에서 프레임 치수는 다른 색상으로 표시
        return isStep3 ? getFrameDimensionColor() : getNormalDimensionColor();
      }
      
      // 받침대 높이 처리 - baseHeight 입력 필드 선택 시 받침대 높이 치수선 강조
      if (dimensionType === 'baseHeight' && activeDimensionField === 'baseHeight') {
        return getHighlightDimensionColor();
      }
      
      // 공간 치수(width, height, depth)는 step2에서 더 강조
      if (dimensionType === 'width' || dimensionType === 'height' || dimensionType === 'depth') {
        return getSpaceDimensionColor();
      }
      
      return getNormalDimensionColor();
    };
    
    // 그리기 전 기본 폰트 및 선 스타일 설정
    ctx.lineWidth = 1.2; // 선 두께
    // 스텝2에서는 공간 치수 폰트 크기를 더 크게 설정
    const fontSize = isStep2 ? 
      Math.max(14, 16 * scale * 10) : 
      Math.max(12, 14 * scale * 10);
    ctx.font = `${fontSize}px Arial`; // 폰트 크기 동적 조정
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // CAD 스타일 상수 정의 - 간격 감소 및 표준화 (더 타이트한 레이아웃)
    const gapFromObject = 30; // 치수선과 객체 사이의 간격 (더 가깝게 조정)
    const extensionLineGap = 7; // 치수선 확장선의 간격 (절반으로 줄임)
    const dimensionLineGap = 25; // 계단식 간격(치수선끼리 간격)
    
    // 슬래시 스타일의 치수선 끝 그리기 함수
    const drawSlashEnd = (x, y, isStart, isVertical, dimensionColor) => {
      // 스텝2에서는 슬래시 크기 더 크게 - 공간 치수 강조
      const slashLength = isStep2 ? 5 : 4; // 절반으로 줄임
      
      ctx.strokeStyle = dimensionColor;
      ctx.beginPath();
      if (isVertical) {
        // 세로 방향 슬래시
        if (isStart) {
          // 시작점
          ctx.moveTo(x - slashLength/2, y - slashLength/2);
          ctx.lineTo(x + slashLength/2, y + slashLength/2);
        } else {
          // 끝점
          ctx.moveTo(x - slashLength/2, y + slashLength/2);
          ctx.lineTo(x + slashLength/2, y - slashLength/2);
        }
      } else {
        // 가로 방향 슬래시
        if (isStart) {
          // 시작점
          ctx.moveTo(x - slashLength/2, y - slashLength/2);
          ctx.lineTo(x + slashLength/2, y + slashLength/2);
        } else {
          // 끝점
          ctx.moveTo(x - slashLength/2, y - slashLength/2);
          ctx.lineTo(x + slashLength/2, y + slashLength/2);
        }
      }
      ctx.stroke();
    };
    
    // 프레임 치수선 그리기 함수
    const drawFrameDimension = (startX, startY, endX, endY, value, frameType, isVertical, opts = {}) => {
      // Step 2에서는 프레임 치수를 표시하지 않음
      // 노 서라운드 모드에서도 표시하지 않음
      if (!showFrameDimensions) return;
      
      // 필드명과 치수타입명 매핑 관계
      const fieldToTypeMap = {
        'leftFrame': 'leftFrameWidth',
        'rightFrame': 'rightFrameWidth',
        'topFrame': 'topFrameHeight'
      };
      
      // 역방향 매핑 (치수타입명 -> 필드명)
      const typeToFieldMap = {
        'leftFrameWidth': 'leftFrame',
        'rightFrameWidth': 'rightFrame',
        'topFrameHeight': 'topFrame'
      };
      
      // frameType이 치수타입(예: leftFrameWidth)인 경우 필드명(leftFrame)으로 변환
      const fieldName = typeToFieldMap[frameType] || frameType;
      
      // 치수 타입에 맞는 색상 설정
      const dimensionColor = activeDimensionField ? 
        (activeDimensionField === fieldName ? getHighlightDimensionColor() : getFrameDimensionColor()) : 
        getFrameDimensionColor();
      
      // 일반 치수선 함수 사용하여 프레임 치수 그리기
      // 상단 프레임(topFrameHeight)의 경우 항상 외부에 보이도록 설정
      // isOutside 옵션이 true이면 치수선을 객체 외부에 표시
      const isOutside = opts.isOutside || frameType === 'topFrameHeight';
      
      // 치수선이 외부에 표시되도록 오프셋 조정
      let adjustedStartX = startX;
      let adjustedStartY = startY;
      let adjustedEndX = endX;
      let adjustedEndY = endY;
      
      // 상단 프레임 치수의 경우 y 좌표를 위로 이동 (외부에 표시하기 위함)
      if (frameType === 'topFrameHeight' && isOutside) {
        // 상단 외부로 이동
        adjustedStartY = y - gapFromObject/2;
        adjustedEndY = adjustedStartY;
      }
      
      drawDimensionWithExtension(
        adjustedStartX, adjustedStartY,
        adjustedEndX, adjustedEndY,
        isVertical,
        `${value}`,
        1,  // 모든 프레임 치수는 dimensionOrder를 1로 통일
        { noStacking: true, color: dimensionColor, frameType, isOutside }
      );
    };
    
    // 치수선 그리기 함수에 색상 파라미터 추가
    const drawDimensionWithExtension = (startX, startY, endX, endY, isVertical, measurementText, dimensionOrder = 0, opts = {}) => {
      // 치수 타입 결정 (폭, 높이, 깊이, 에어컨 단내림, 바닥 마감재 등)
      let dimensionType = null;
      
      // 치수 값에 따라 타입 결정 - 숫자로 비교하도록 수정
      const measurementValue = Number(measurementText);
      
      if (measurementValue === dimensions.width) dimensionType = 'width';
      else if (measurementValue === dimensions.height) dimensionType = 'height';
      else if (measurementValue === dimensions.depth) dimensionType = 'depth';
      else if (measurementValue === acUnitWidth) dimensionType = 'acUnitWidth';
      else if (measurementValue === acUnitDepth) dimensionType = 'acUnitDepth';
      else if (measurementValue === resolvedAcUnitHeight) dimensionType = 'acUnitDepth';
      else if (measurementValue === dimensions.floorFinishHeight) dimensionType = 'floorFinishHeight';
      else if (measurementValue === baseHeight) dimensionType = 'baseHeight';
      
      // 프레임 관련 치수 타입도 체크
      const leftFrameWidth = options?.leftFrameWidth || 50;
      const rightFrameWidth = options?.rightFrameWidth || 50;
      const upperFrameWidth = options?.upperFrameWidth || 50;
      
      if (measurementValue === leftFrameWidth) dimensionType = 'leftFrameWidth';
      else if (measurementValue === rightFrameWidth) dimensionType = 'rightFrameWidth';
      else if (measurementValue === upperFrameWidth) dimensionType = 'topFrameHeight';
      
      // 프레임 치수는 step3에서만 표시하고 step2에서는 표시하지 않음
      // 또한 노 서라운드 모드에서도 표시하지 않음
      if (!showFrameDimensions && (
        dimensionType === 'leftFrameWidth' || 
        dimensionType === 'rightFrameWidth' || 
        dimensionType === 'topFrameHeight'
      )) {
        return;
      }
      
      // 공간 치수(width, height, depth)는 step3에서는 표시하지 않음
      // 단, 단내림이 없는 쪽에는 전체 높이 치수 표시해야 함
      if (isStep3 && (
        dimensionType === 'width' || 
        dimensionType === 'height' ||
        dimensionType === 'depth'
      ) && !opts.isFrameDimension) {
        return;
      }
      
      // 외부에서 색상이 지정된 경우 해당 색상 사용, 아니면 계산된 색상 사용
      const dimensionColor = opts.color || getDimensionColor(dimensionType);
      
      // console.log('Drawing:', dimensionType, measurementText, '-> Color:', dimensionColor);
      
      ctx.strokeStyle = dimensionColor;
      ctx.fillStyle = dimensionColor;
      
      // 치수선을 객체 외부에 강제로 표시하는 옵션 처리
      const forceOutside = opts.forceOutside || false;
      // Step 3에서는 항상 치수를 외부에 표시
      const isStep3ForceOutside = options?.step === 'step3' && (dimensionType === 'topFrameHeight' || opts.isFrameDimension);
      
      ctx.beginPath();
      if (isVertical) {
        // Always use fixed offset regardless of dimensionOrder or stacking
        let dimensionX;
        // left side: dimensionX = x - gapFromObject
        // right side: dimensionX = x + widthPx + gapFromObject (or depthPx for side views)
        // Determine if this is left or right side based on startX/endX vs geometry
        // For front/top: widthPx is used; for left/right: depthPx is used
        let isLeft;
        if (typeof widthPx !== 'undefined' && widthPx > 0) {
          // front/top views: geometry from x to x+widthPx
          isLeft = (startX <= x + widthPx / 2);
          
          // 단내림 없음/Step3에서는 항상 바깥에 치수 표시
          if (forceOutside || isStep3ForceOutside) {
          if (isLeft) {
              dimensionX = x - gapFromObject; // 왼쪽 외부에 표시
          } else {
              dimensionX = x + widthPx + gapFromObject; // 오른쪽 외부에 표시
          }
          } else {
            // 기존 로직
          if (isLeft) {
              dimensionX = x - gapFromObject; // 왼쪽 간격 유지
          } else {
              dimensionX = x + widthPx + gapFromObject; // 오른쪽 간격 유지
            }
          }
        } else if (typeof depthPx !== 'undefined' && depthPx > 0) {
          // left/right views: geometry from x to x+depthPx
          isAbove = (startY <= y + depthPx / 2);
          if (isAbove) {
            dimensionY = y - gapFromObject; // 상단 간격 유지
          } else {
            dimensionY = y + depthPx + gapFromObject; // 하단 간격 유지
          }
        } else {
          dimensionY = startY - gapFromObject; // 기본 간격 유지
        }
        
        // 모든 치수 타입(프레임 포함)에 대해 동일한 extensionLineGap 사용
        const startOffsetY = (isAbove) ? -extensionLineGap : extensionLineGap;
        
        // 객체와 보조선 사이 간격 추가 (Step 3에서 보조선이 객체에 붙지 않도록)
        const objectGap = 5;
        const objGapY = isAbove ? -objectGap : objectGap;
        
        ctx.moveTo(startX, startY + objGapY);
        ctx.lineTo(startX, dimensionY);
        ctx.moveTo(endX, endY + objGapY);
        ctx.lineTo(endX, dimensionY);
        ctx.moveTo(startX, dimensionY);
        ctx.lineTo(endX, dimensionY);
        ctx.stroke();
        drawSlashEnd(startX, dimensionY, true, !isVertical, dimensionColor);
        drawSlashEnd(endX, dimensionY, false, !isVertical, dimensionColor);
        const midX = (startX + endX) / 2;
        const textWidth = ctx.measureText(`${measurementText}`).width;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(
          midX - textWidth/2 - 6, 
          dimensionY - 12,
          textWidth + 12,
          24
        );
        ctx.fillStyle = dimensionColor;
        ctx.fillText(`${measurementText}`, midX, dimensionY);
      }
    };
    
    if (viewType === 'front') {
      const rightX = x + widthPx;
      const leftX = x;
      
      // 전체 가로 치수 (Step3에서는 표시 안함)
      if (showSpaceDimensions) {
        // 정면도 - 전체 가로 치수 (하단만 표시) - 가장 바깥쪽
        drawDimensionWithExtension(
          x, y + heightPx,
          x + widthPx, y + heightPx,
          false,
          `${dimensions.width}`,
          0 // 가장 바깥쪽
        );

        // 단내림이 없는 쪽에만 전체 높이 치수를 표시하고, 단내림이 있는 쪽에만 분절 치수를 표시
        if (hasAirConditioner) {
          // 에어컨 단내림이 있을 경우에만 분리
          const totalHeightSideX = acUnitPosition === 'left' ? rightX : leftX;
          drawDimensionWithExtension(
            totalHeightSideX, y,
            totalHeightSideX, y + heightPx,
            true,
            `${dimensions.height}`,
            0 // 바깥쪽
          );
        } else {
          // 에어컨 단내림이 없으면 양쪽 모두에 전체 높이 표시 (기존 로직)
          drawDimensionWithExtension(
            leftX, y,
            leftX, y + heightPx,
            true,
            `${dimensions.height}`,
            0 // 바깥쪽
          );
          
          drawDimensionWithExtension(
            rightX, y,
            rightX, y + heightPx,
            true,
            `${dimensions.height}`,
            0 // 바깥쪽
          );
        }
      } else if (showFrameDimensions) {
        // Step 3에서 받침대 가로 길이 표시 (있는 경우에만)
        if ((options?.hasBase || hasBaseFromOptions) && baseHeight > 0) {
          const leftFrameWidth = options?.leftFrameWidth || 50;
          const rightFrameWidth = options?.rightFrameWidth || 50;
          const baseWidth = dimensions.width - leftFrameWidth - rightFrameWidth;
          
          // 받침대 시작/끝 좌표 계산
          const baseStartX = x + leftFrameWidth * scale;
          const baseEndX = x + widthPx - rightFrameWidth * scale;
          
          // 받침대 가로 길이 치수선 (바닥에서 gapFromObject 만큼 아래에 표시)
          drawDimensionWithExtension(
            baseStartX, y + heightPx + gapFromObject,
            baseEndX, y + heightPx + gapFromObject,
            false,
            `${baseWidth}`,
            0
          );
        }
      }

      // === 분절 치수선 (단내림 + 마감재 + 받침대) ===
      // 전체 높이 치수선과 반대쪽에 분절 표시
      // Step3에서는 항상 에어컨 위치 반대쪽에 분절 치수선 표시
      const segmentedSideX = acUnitPosition === 'left' ? leftX : rightX;
      
      // 필요한 변수 정의
      const acHeightPx = hasAirConditioner ? resolvedAcUnitHeight * scale : 0;
      const finishHeightPx = hasFloorFinish ? dimensions.floorFinishHeight * scale : 0;
      const baseHeightPx = (options?.hasBase || hasBaseFromOptions) ? baseHeight * scale : 0;
      const baseHeightValue = (options?.hasBase || hasBaseFromOptions) ? baseHeight : 0;
      
      // Step3에서는 단내림 있는 쪽에 분절 치수선, 없는 쪽에 전체 치수선 표시
      if (options?.step === 'step3') {
        console.log("Step 3: 단내림쪽 분절치수, 반대쪽 전체치수 표시", { 
          segmentedSideX,
          acUnitPosition,
          hasAirConditioner,
          finishHeightPx,
          baseHeightPx
        });
        
        // 단내림이 없는 경우에는 전체 높이 치수를 표시하지 않음
        // Step3에서는 공간 치수가 아닌 프레임 치수만 표시해야 함
        /*
        // 단내림이 없는 쪽에 전체 높이 치수 표시
        if (hasAirConditioner) {
          const totalHeightSideX = acUnitPosition === 'left' ? rightX : leftX;
          drawDimensionWithExtension(
            totalHeightSideX, y,
            totalHeightSideX, y + heightPx,
            true,
            `${dimensions.height}`,
            0 // 바깥쪽
          );
        } else {
          // 단내림이 없는 경우 오른쪽에 전체 높이 표시
          drawDimensionWithExtension(
            rightX, y,
            rightX, y + heightPx,
            true,
            `${dimensions.height}`,
            0 // 바깥쪽
          );
        }
        */
      } else if (options?.step === 'step2') {
        console.log("Step 2 분절 치수 표시 - hasFloorFinish:", hasFloorFinish, "finishHeightPx:", finishHeightPx);
        
        // 단내림이 있는 경우
        if (hasAirConditioner) {
          // 단내림 높이 치수선 제거 (원래 여기 있던 코드)
          
          // 2. 중간 부분 (에어컨 아래 ~ 바닥마감재/받침대 위)
          const middleHeight = heightPx - acHeightPx - finishHeightPx - baseHeightPx;
          const middleHeightMm = dimensions.height - resolvedAcUnitHeight - 
                                (hasFloorFinish ? dimensions.floorFinishHeight : 0) - 
                                baseHeightValue;
          
          drawDimensionWithExtension(
            segmentedSideX, y + acHeightPx,
            segmentedSideX, y + heightPx - finishHeightPx - baseHeightPx,
            true,
            `${middleHeightMm}`,
            1,
            { noStacking: true }
          );
          
          // 3. 받침대 높이 (있을 경우만)
          if (baseHeightPx > 0) {
            drawDimensionWithExtension(
              segmentedSideX, y + heightPx - finishHeightPx - baseHeightPx,
              segmentedSideX, y + heightPx - finishHeightPx,
              true,
              `${baseHeightValue}`,
              1,
              { noStacking: true }
            );
          }
          
          // 4. 바닥 마감재 높이 (있을 경우만)
          if (finishHeightPx > 0) {
            drawDimensionWithExtension(
              segmentedSideX, y + heightPx - finishHeightPx,
              segmentedSideX, y + heightPx,
              true,
              `${dimensions.floorFinishHeight}`,
              1,
              { noStacking: true }
            );
          }
        } else {
          // 단내림 없는 경우에는 전체 높이만 표시 (분절 없이)
          drawDimensionWithExtension(
            segmentedSideX, y,
            segmentedSideX, y + heightPx,
            true,
            `${dimensions.height}`,
            1
          );
        }
      } else if (hasAirConditioner || hasFloorFinish || baseHeightPx > 0) {
        // 스텝2나 스텝3이 아닌 경우, 단내림이나 마감재, 받침대 중 하나라도 있을 때만 표시
        // 기존 로직 유지
      }
      
      // === 상단 가로 치수선 분할 (에어컨 단내림 위치에 따라 좌/우측에 분할 표시) ===
      if (hasAirConditioner && acUnitWidth > 0) {
        const acWidthPx = acUnitWidth * scale;
        const leftFrameWidth = options?.leftFrameWidth || 50;
        const rightFrameWidth = options?.rightFrameWidth || 50;
        
        // 스텝3에서는 프레임 너비를 제외한 내부 치수 표시
        const isStep3 = options?.step === 'step3';
        
        if (acUnitPosition === 'right') {
          // 왼쪽: 단내림 없는 구간
          const leftSegmentWidth = isStep3 
            ? dimensions.width - acUnitWidth - leftFrameWidth
            : dimensions.width - acUnitWidth;
          
          drawDimensionWithExtension(
            isStep3 ? x + leftFrameWidth * scale : x, 
            y,
            x + widthPx - acWidthPx, 
            y,
            false,
            `${leftSegmentWidth}`,
            2
          );
          
          // 오른쪽: 단내림 구간
          const rightSegmentWidth = isStep3 
            ? acUnitWidth - rightFrameWidth
            : acUnitWidth;
            
          drawDimensionWithExtension(
            x + widthPx - acWidthPx, 
            y,
            isStep3 ? x + widthPx - rightFrameWidth * scale : x + widthPx, 
            y,
            false,
            `${rightSegmentWidth}`,
            3
          );
        } else if (acUnitPosition === 'left') {
          // 왼쪽: 단내림 구간
          const leftSegmentWidth = isStep3 
            ? acUnitWidth - leftFrameWidth
            : acUnitWidth;
            
          drawDimensionWithExtension(
            isStep3 ? x + leftFrameWidth * scale : x, 
            y,
            x + acWidthPx, 
            y,
            false,
            `${leftSegmentWidth}`,
            2
          );
          
          // 오른쪽: 단내림 없는 구간
          const rightSegmentWidth = isStep3 
            ? dimensions.width - acUnitWidth - rightFrameWidth
            : dimensions.width - acUnitWidth;
            
          drawDimensionWithExtension(
            x + acWidthPx, 
            y,
            isStep3 ? x + widthPx - rightFrameWidth * scale : x + widthPx, 
            y,
            false,
            `${rightSegmentWidth}`,
            3
          );
        }
      }

      // 프레임 치수선 추가 (뷰 타입에 따라 다르게 표시)
      if (showFrameDimensions) {
        // 좌측 프레임 두께 치수
        const leftFrameWidth = options?.leftFrameWidth || 50;
        if (leftFrameWidth > 0) {
          // 프레임 치수 그리기 함수 사용 (매핑 로직 포함)
          drawFrameDimension(
            x, y + heightPx / 2,
            x + leftFrameWidth * scale, y + heightPx / 2,
            leftFrameWidth,
            'leftFrameWidth',
            false
          );
        }
        
        // 우측 프레임 두께 치수
        const rightFrameWidth = options?.rightFrameWidth || 50;
        if (rightFrameWidth > 0) {
          // 프레임 치수 그리기 함수 사용 (매핑 로직 포함)
          drawFrameDimension(
            x + widthPx - rightFrameWidth * scale, y + heightPx / 2,
            x + widthPx, y + heightPx / 2,
            rightFrameWidth,
            'rightFrameWidth',
            false
          );
        }
        
        // 상단 프레임 두께 치수 - 단내림 여부와 상관없이 항상 표시
        const topFrameHeight = options?.upperFrameWidth || 40;
        if (topFrameHeight > 0) {
          // 수정: Step 3에서는 상단 프레임 치수가 항상 외부에 표시되도록 개선
          const isStep3 = options?.step === 'step3';
          
          // 상단 프레임 치수는 항상 외부에 표시 (Step 3일 때)
          if (isStep3) {
            // 외부에 표시하는 방식으로 변경
            // 2D Viewer의 상단에 가로 치수로 표시
            const outsideY = y - gapFromObject;
            
            drawDimensionWithExtension(
              x + widthPx / 2 - 25 * scale, outsideY,
              x + widthPx / 2 + 25 * scale, outsideY, 
              false, // 수평 치수선
              `${topFrameHeight}`,
              0, // 바깥쪽
              { isFrameDimension: true, forceOutside: true }
            );
          } else {
            // 기존 방식대로 표시 (Step 3가 아닐 때)
          drawFrameDimension(
            x + widthPx / 2, y,
            x + widthPx / 2, y + topFrameHeight * scale,
            topFrameHeight,
            'topFrameHeight',
              true // 세로 치수선
          );
          }
        }
      }
    } else if (viewType === 'top') {
      // 에어컨 위치에 따라 깊이 치수선 위치 결정 (에어컨 없는 쪽에 표시)
      const showDepthOnLeft = acUnitPosition === 'right';

      // 공간 치수는 Step3에서 표시 안함
      if (showSpaceDimensions) {
        // 평면도 - 전체 가로 치수 (하단만 표시) - 바깥쪽
        drawDimensionWithExtension(
          x, y + depthPx,
          x + widthPx, y + depthPx,
          false,
          `${dimensions.width}`,
          0 // 바깥쪽
        );
  
        if (showDepthOnLeft) {
          // 평면도 - 전체 깊이 치수 (좌측에 표시) - 바깥쪽
          drawDimensionWithExtension(
            x, y,
            x, y + depthPx,
            true,
            `${dimensions.depth}`,
            0 // 바깥쪽
          );
        } else {
          // 평면도 - 전체 깊이 치수 (우측에 표시) - 바깥쪽
          drawDimensionWithExtension(
            x + widthPx, y,
            x + widthPx, y + depthPx,
            true,
            `${dimensions.depth}`,
            0 // 바깥쪽
          );
        }
      }

      // 에어컨 단내림이 있는 경우 추가 치수 표시
      if (hasAirConditioner) {
        const acWidthPx = acUnitWidth * scale;
        // Use resolvedAcUnitDepth for acDepthPx instead of acUnitDepth
        const acDepthPx = resolvedAcUnitDepth * scale;
        let acX;

        if (acUnitPosition === 'left') {
          acX = x; // 좌측에 배치

          // 프레임 관련 치수선만 표시를 위한 조건 체크
          const leftFrameWidth = options?.leftFrameWidth || 50;

          // 단내림 폭 치수 (상단) - 안쪽
          // Step 3에서만 프레임 관련 치수 표시
          if (showFrameDimensions) {
            const leftWidthValue = acUnitWidth - leftFrameWidth;
            const leftStartX = x + leftFrameWidth * scale;
          
          drawDimensionWithExtension(
            leftStartX, y,
            x + acWidthPx, y,
            false,
            `${leftWidthValue}`,
            1
          );

          // 나머지 공간 치수 (상단) - 안쪽
            const rightFrameWidth = options?.rightFrameWidth || 50;
            const rightWidthValue = dimensions.width - acUnitWidth - rightFrameWidth;
            const rightEndX = x + widthPx - rightFrameWidth * scale;
          
          drawDimensionWithExtension(
            x + acWidthPx, y,
            rightEndX, y,
            false,
            `${rightWidthValue}`,
            2
          );
          } else if (showSpaceDimensions) {
            // Step 3가 아닐 때는 일반 공간 치수 표시
            drawDimensionWithExtension(
              x, y,
              x + acWidthPx, y,
              false,
              `${acUnitWidth}`,
              1
            );

            // 나머지 공간 치수 (상단) - 안쪽
            drawDimensionWithExtension(
              x + acWidthPx, y,
              x + widthPx, y,
              false,
              `${dimensions.width - acUnitWidth}`,
              2
            );
          }

          // 단내림 깊이 치수 표시 (단, step3에서는 프레임 관련 치수만 표시)
          if (showSpaceDimensions) {
            // 내부 치수선
            drawDimensionWithExtension(
              x, y + depthPx - acDepthPx,
              x, y + depthPx,
              true,
              `${resolvedAcUnitDepth}`,
              1
            );
            
            // 외부 치수선 추가 (단내림 높이)
            drawDimensionWithExtension(
              x - 50, y + depthPx - acDepthPx,
              x - 50, y + depthPx,
              true,
              `${resolvedAcUnitDepth}`,
              0 // 외부 치수선은 0번 순서
            );
          }
        } else if (acUnitPosition === 'right') {
          acX = x + widthPx - acWidthPx; // 우측에 배치

          // 프레임 관련 치수선만 표시를 위한 조건 체크
          const leftFrameWidth = options?.leftFrameWidth || 50;
          const rightFrameWidth = options?.rightFrameWidth || 50;
          
          // Step 3에서만 프레임 관련 치수 표시
          if (showFrameDimensions) {
          // 나머지 공간 치수 (상단) - 안쪽
            const leftWidthValue = dimensions.width - acUnitWidth - leftFrameWidth;
            const leftStartX = x + leftFrameWidth * scale;
          
          drawDimensionWithExtension(
            leftStartX, y,
            acX, y,
            false,
            `${leftWidthValue}`,
            1
          );

          // 단내림 폭 치수 (상단)
            const rightWidthValue = acUnitWidth - rightFrameWidth;
            const rightEndX = x + widthPx - rightFrameWidth * scale;
          
          drawDimensionWithExtension(
            acX, y,
            rightEndX, y,
            false,
            `${rightWidthValue}`,
            2
          );
          } else if (showSpaceDimensions) {
            // Step 3가 아닐 때는 일반 공간 치수 표시
            // 나머지 공간 치수 (상단) - 안쪽
            drawDimensionWithExtension(
              x, y,
              acX, y,
              false,
              `${dimensions.width - acUnitWidth}`,
              1
            );

            // 단내림 폭 치수 (상단)
            drawDimensionWithExtension(
              acX, y,
              x + widthPx, y,
              false,
              `${acUnitWidth}`,
              2
            );
          }

          // 단내림 깊이 치수 표시 (단, step3에서는 프레임 관련 치수만 표시)
          if (showSpaceDimensions) {
            // 내부 치수선
            drawDimensionWithExtension(
              x + widthPx, y + depthPx - acDepthPx,
              x + widthPx, y + depthPx,
              true,
              `${resolvedAcUnitDepth}`,
              1
            );
            
            // 외부 치수선 추가 (단내림 높이)
            drawDimensionWithExtension(
              x + widthPx + 50, y + depthPx - acDepthPx,
              x + widthPx + 50, y + depthPx,
              true,
              `${resolvedAcUnitDepth}`,
              0 // 외부 치수선은 0번 순서
            );
          }
        } else {
          // 중앙 배치
          acX = x + (widthPx - acWidthPx) / 2;

          // 왼쪽 공간 치수 (상단) - 안쪽
          const leftSpaceValue = isStep3 
            ? Math.round((dimensions.width - acUnitWidth) / 2) - leftFrameWidth 
            : Math.round((dimensions.width - acUnitWidth) / 2);
          const leftStartX = isStep3 ? x + leftFrameWidth * scale : x;
          
          drawDimensionWithExtension(
            leftStartX, y,
            acX, y,
            false,
            `${leftSpaceValue}`,
            1
          );

          // 단내림 폭 치수 (상단) - 안쪽
          const acValue = isStep3 ? acUnitWidth : acUnitWidth;
          
          drawDimensionWithExtension(
            acX, y,
            acX + acWidthPx, y,
            false,
            `${acValue}`,
            2
          );

          // 오른쪽 공간 치수 (상단) - 안쪽
          const rightSpaceValue = isStep3 
            ? Math.round((dimensions.width - acUnitWidth) / 2) - rightFrameWidth 
            : Math.round((dimensions.width - acUnitWidth) / 2);
          const rightStartX = isStep3 ? x + rightFrameWidth * scale : x + widthPx;
          
          drawDimensionWithExtension(
            rightStartX, y,
            x + widthPx, y,
            false,
            `${rightSpaceValue}`,
            3
          );

          // 단내림 깊이 치수 (우측) - 안쪽
          drawDimensionWithExtension(
            x + widthPx, y,
            x + widthPx, y + acDepthPx,
            true,
            `${resolvedAcUnitDepth}`,
            1
          );
          
          // 외부 치수선 추가 (단내림 높이) - 중앙 배치일 때
          if (showSpaceDimensions) {
            drawDimensionWithExtension(
              x + widthPx + 50, y,
              x + widthPx + 50, y + acDepthPx,
              true,
              `${resolvedAcUnitDepth}`,
              0 // 외부 치수선은 0번 순서
            );
          }
        }
      }

      // === 바닥 마감재 두께 치수선 추가 ===
      if (hasFloorFinish && dimensions.floorFinishHeight > 0 && showSpaceDimensions) {
        const finishHeightPx = dimensions.floorFinishHeight * scale;
        const label = `${dimensions.floorFinishHeight}`;
        const showOnLeft = acUnitPosition === 'right';

        if (showOnLeft) {
          drawDimensionWithExtension(
            x, y + depthPx - finishHeightPx,
            x, y + depthPx,
            true,
            label,
            2
          );
        } else {
          drawDimensionWithExtension(
            x + widthPx, y + depthPx - finishHeightPx,
            x + widthPx, y + depthPx,
            true,
            label,
            2
          );
        }
      }
    } else if (viewType === 'left' || viewType === 'right') {
      // --- Determine which side to draw the total height and segmented height dimension lines ---
      // For 'left' view: total height on left, segments on right
      // For 'right' view: total height on right, segments on left
      const drawTotalHeightOnLeft = (viewType === 'left');
      const drawSegmentsOnLeft = !drawTotalHeightOnLeft;

      // 공간 치수는 Step3에서 표시 안함
      if (showSpaceDimensions) {
        // 측면도 - 깊이 치수 (하단만 표시) - 바깥쪽
        drawDimensionWithExtension(
          x, y + heightPx,
          x + depthPx, y + heightPx,
          false,
          `${dimensions.depth}`,
          0 // 바깥쪽
        );
  
        // --- Draw total height dimension line (always on one side) ---
        if (drawTotalHeightOnLeft) {
          drawDimensionWithExtension(
            x, y,
            x, y + heightPx,
            true,
            `${dimensions.height}`,
            0 // 바깥쪽
          );
        } else {
          drawDimensionWithExtension(
            x + depthPx, y,
            x + depthPx, y + heightPx,
            true,
            `${dimensions.height}`,
            0 // 바깥쪽
          );
        }
      }

      // --- Draw segmented dimension lines (AC unit height and remainder) on the other side ---
      if (options?.step === 'step3') {
        console.log("Step 3 측면도: 단내림쪽 분절치수, 반대쪽 전체치수 표시", { 
          hasAirConditioner,
          acUnitPosition,
          viewType
        });

        // 전체 높이 치수는 항상 단내림이 없는 쪽에 표시
        const totalHeightSideX = (viewType === 'left' && acUnitPosition === 'left') || 
                                 (viewType === 'right' && acUnitPosition === 'right') ? 
                                 x + depthPx : x;
        
        // 전체 높이 표시 (단내림이 없는 쪽에)
        // Step 3에서는 프레임 치수만 표시하므로 전체 높이 치수를 표시하지 않음
        if (options?.step !== 'step3') {
          drawDimensionWithExtension(
            totalHeightSideX, y,
            totalHeightSideX, y + heightPx,
            true,
            `${dimensions.height}`,
            0 // 바깥쪽
          );
        }

        // 분절치수는 단내림이 있는 쪽에 표시
        if (hasAirConditioner) {
          const segmentSideX = (viewType === 'left' && acUnitPosition === 'left') || 
                               (viewType === 'right' && acUnitPosition === 'right') ? 
                               x : x + depthPx;
          
          // 바닥 마감재, 받침대 등 분절 치수 표시
          if (hasBaseFromOptions && baseHeight > 0) {
            // 1. 상단부터 받침대 위까지 - Step 3에서는 표시하지 않음
            const upperHeight = dimensions.height - 
                               (hasFloorFinish ? dimensions.floorFinishHeight : 0) - 
                               baseHeight;
            
            // Step 3에서는 이 치수를 표시하지 않음
            if (!isStep3) {
              drawDimensionWithExtension(
                segmentSideX, y,
                segmentSideX, y + heightPx - (hasFloorFinish ? floorFinishHeightPx : 0) - baseHeight * scale,
                true,
                `${upperHeight}`,
                1,
                { noStacking: true }
              );
            }
            
            // 2. 받침대 높이 - Step 3에서도 표시 (프레임 관련)
            drawDimensionWithExtension(
              segmentSideX, y + heightPx - (hasFloorFinish ? floorFinishHeightPx : 0) - baseHeight * scale,
              segmentSideX, y + heightPx - (hasFloorFinish ? floorFinishHeightPx : 0),
              true,
              `${baseHeight}`,
              1,
              { noStacking: true }
            );
            
            // 3. 바닥 마감재 (있을 경우) - Step 3에서는 표시하지 않음
            if (hasFloorFinish && dimensions.floorFinishHeight > 0 && !isStep3) {
              drawDimensionWithExtension(
                segmentSideX, y + heightPx - floorFinishHeightPx,
                segmentSideX, y + heightPx,
                true,
                `${dimensions.floorFinishHeight}`,
                1,
                { noStacking: true }
              );
            }
          } else if (hasFloorFinish && dimensions.floorFinishHeight > 0) {
            // 받침대 없이 마감재만 있는 경우
            // 1. 상단부터 마감재 위까지 - Step 3에서는 표시하지 않음
            if (!isStep3) {
            const upperHeight = dimensions.height - dimensions.floorFinishHeight;
            
            drawDimensionWithExtension(
              segmentSideX, y,
              segmentSideX, y + heightPx - floorFinishHeightPx,
              true,
              `${upperHeight}`,
              1,
              { noStacking: true }
            );
            
              // 2. 마감재 높이 - Step 3에서는 표시하지 않음
            drawDimensionWithExtension(
              segmentSideX, y + heightPx - floorFinishHeightPx,
              segmentSideX, y + heightPx,
              true,
              `${dimensions.floorFinishHeight}`,
              1,
              { noStacking: true }
            );
            }
          } else {
            // 받침대도 마감재도, 단내림도 없는 경우 전체 높이만 표시
            // 이미 전체 높이가 표시되어 있으므로 추가 작업 없음
          }
        }
      } else {
        // 스텝2나 기타 모드에서는 항상 전체 높이만 표시
        drawDimensionWithExtension(
          drawSegmentsOnLeft ? x : x + depthPx,
          y,
          drawSegmentsOnLeft ? x : x + depthPx,
          y + heightPx,
          true,
          `${dimensions.height}`,
          0 // 바깥쪽
        );
      }

      // --- Draw depth split only if it makes sense (no unnecessary 1000mm line) ---
      // Only draw depth split if resolvedAcUnitDepth < dimensions.depth and only if AC unit is at the corresponding side
      if (hasAirConditioner && resolvedAcUnitDepth > 0 && resolvedAcUnitDepth < dimensions.depth && !isStep3) {
        const acDepthPx = resolvedAcUnitDepth * scale;
        if ((viewType === 'left' && acUnitPosition === 'left') ||
            (viewType === 'right' && acUnitPosition === 'right')) {
          // AC unit at starting side
          // AC depth (from start)
          drawDimensionWithExtension(
            x, y,
            x + acDepthPx, y,
            false,
            `${resolvedAcUnitDepth}`,
            1
          );
          // Remainder depth
          drawDimensionWithExtension(
            x + acDepthPx, y,
            x + depthPx, y,
            false,
            `${dimensions.depth - resolvedAcUnitDepth}`,
            2
          );
        } else if ((viewType === 'left' && acUnitPosition === 'right') ||
                  (viewType === 'right' && acUnitPosition === 'left')) {
          // AC unit at ending side
          // Remainder depth
          drawDimensionWithExtension(
            x, y,
            x + depthPx - acDepthPx, y,
            false,
            `${dimensions.depth - resolvedAcUnitDepth}`,
            1
          );
          // AC depth (at end)
          drawDimensionWithExtension(
            x + depthPx - acDepthPx, y,
            x + depthPx, y,
            false,
            `${resolvedAcUnitDepth}`,
            2
          );
        }
      }
      // Suppress unnecessary 1000mm (or any fixed) horizontal dimension lines for AC unit width/depth
    }
    
    // 정면도에서 프레임 치수선 그리기 (step3에서만 사용)
    if (viewType === 'front' && options?.step === 'step3') { // 스텝3에서만 표시되도록 조건 사용
      console.log('프레임 치수선 그리기 시작');
      
      // 노서라운드 모드 확인 (fitOption 또는 fit이 'tight'인 경우)
      const isNoSurround = options?.fitOption === 'tight' || options?.fit === 'tight';
      
      // 노서라운드 모드에서는 프레임 치수를 표시하지 않음
      if (isNoSurround) {
        console.log('노서라운드 모드: 프레임 치수 표시 안함');
        return; // 함수 종료
      }
      
      // 단내림 없음일 때의 프레임 치수 표시 방식 변경
      if (!hasAirConditioner) {
        console.log('단내림 없음: 좌측 프레임 분절, 우측 세로 프레임 치수 고정');
      
      // 설치 타입과 벽 위치 정보 가져오기
      const spaceType = options?.spaceType || installationType;
      const position = options?.wallPosition || wallPosition;
      
      // 프레임 두께 정보 가져오기
      const leftFrameWidth = options?.leftFrameWidth || 50;
      const rightFrameWidth = options?.rightFrameWidth || 50;
      const upperFrameWidth = options?.upperFrameWidth || 50;
        
        // 단내림 없는 경우 - 양쪽에 프레임 치수 표시
        // 좌측 세로 프레임 치수
        drawDimensionWithExtension(
          leftX, y,
          leftX, y + heightPx,
          true,
          `${dimensions.height}`,
          0, // 바깥쪽
          { isFrameDimension: true, forceOutside: true } // 프레임 치수임을 표시, 항상 바깥에 표시
        );
        
        // 우측 세로 프레임 치수
        drawDimensionWithExtension(
          rightX, y,
          rightX, y + heightPx,
          true,
          `${dimensions.height}`,
          0, // 바깥쪽
          { isFrameDimension: true, forceOutside: true } // 프레임 치수임을 표시, 항상 바깥에 표시
        );
        
        // 단내림이 없는 경우 Step3에서도 상단 프레임 너비 치수 표시
        const tf_x = x + leftFrameWidth * scale;
        const tf_y = y - gapFromObject; // 상단 외부에 표시하도록 위치 조정
        const tf_w = (dimensions.width - leftFrameWidth - rightFrameWidth) * scale;
        
        drawDimensionWithExtension(
          tf_x, tf_y,
          tf_x + tf_w, tf_y,
          false,
          `${dimensions.width - leftFrameWidth - rightFrameWidth}`,
          0, // 바깥쪽
          { isFrameDimension: true, forceOutside: true } // 프레임 치수임을 표시, 항상 바깥에 표시
        );
      }
      
      // 하부에 받침대 가로 길이 표시 (baseHeight가 있고 hasBase가 true일 때만)
      if (hasBaseFromOptions && baseHeight > 0) {
        // 받침대 가로 길이 = 전체 폭 - 좌우 프레임 두께
        const baseWidthValue = width - leftFrameWidth - rightFrameWidth;
        
        // 정면도에서는 가로 길이만 표시하고 깊이는 표시하지 않음
        if (viewType === 'front') {
          // 받침대 위치에서 가로 길이 표시 (하단 중앙)
          const baseY = y + heightPx - (hasFloorFinish ? dimensions.floorFinishHeight * scale : 0) - baseHeight * scale / 2;
          
          // 받침대 왼쪽 끝과 오른쪽 끝 좌표
          const baseLeftX = x + leftFrameWidth * scale;
          const baseRightX = x + widthPx - rightFrameWidth * scale;
          
          // 보조선 그리기 (확장선)
          ctx.strokeStyle = getFrameDimensionColor();
          ctx.beginPath();
          
          // 왼쪽 보조선
          ctx.moveTo(baseLeftX, baseY - extensionLineGap);
          ctx.lineTo(baseLeftX, baseY + extensionLineGap);
          
          // 오른쪽 보조선
          ctx.moveTo(baseRightX, baseY - extensionLineGap);
          ctx.lineTo(baseRightX, baseY + extensionLineGap);
          
          ctx.stroke();
          
          // 치수선 표시 (확장선 포함)
          drawDimensionWithExtension(
            baseLeftX, baseY,
            baseRightX, baseY,
            false,
            `${baseWidthValue}`,
            1,
            { noStacking: true }  // 중첩 방지
          );
        }
      }
    }
    
    // 단내림 없을 때 Step 3의 치수 위치 설정
    if (viewType === 'front' && options?.step === 'step3' && !hasAirConditioner) {
      console.log('단내림 없음 (Step 3): 좌측 프레임 분절, 우측 세로 프레임 치수 설정');
      
      // 프레임 두께 정보
      const leftFrameWidth = options?.leftFrameWidth || 50;
      const rightFrameWidth = options?.rightFrameWidth || 50;
      
      // 좌측 프레임부터 우측 프레임까지의 내부 공간 치수
      const innerWidth = dimensions.width - leftFrameWidth - rightFrameWidth;
      const leftSideX = x + leftFrameWidth * scale;
      const rightSideX = x + widthPx - rightFrameWidth * scale;
      
      // 이미 그려진 치수선을 지우기 위해 캔버스 클리어 (부분적으로)
      const canvasWidth = ctx.canvas.width;
      const canvasHeight = ctx.canvas.height;
      const topY = y - gapFromObject * 2;
      
      // 좌측 프레임 분절 치수 (내부 공간 가로)
      drawDimensionWithExtension(
        leftSideX, y - gapFromObject,
        rightSideX, y - gapFromObject,
        false, // 수평 치수선
        `${innerWidth}`,
        0, // 바깥쪽
        { isFrameDimension: true, forceOutside: true }
      );
      
      // 우측 세로 프레임 치수 (전체 높이)
      const rightX = x + widthPx;
      drawDimensionWithExtension(
        rightX, y,
        rightX, y + heightPx,
        true, // 세로 치수선
        `${dimensions.height}`,
        0, // 바깥쪽
        { isFrameDimension: true, forceOutside: true }
      );
      
      return; // 추가 치수 표시하지 않음
    }
  };
  
  // 휠 스크롤로 확대/축소 처리 핸들러
  const handleWheel = (e) => {
    e.preventDefault();
    
    try {
      const delta = e.deltaY;
      // 더 작은 줌 스텝으로 부드러운 줌 효과 구현 (3D 뷰어와 유사하게)
      const zoomStep = 0.03; 
      
      // 마우스 위치 기준으로 확대/축소
      if (delta > 0) {
        // 축소 - 3D 뷰어와 비슷한 느낌으로 줌아웃
        setZoomFactor(prev => Math.max(prev - zoomStep, 0.3));
      } else {
        // 확대 - 3D 뷰어와 비슷한 한계까지 줌인
        setZoomFactor(prev => Math.min(prev + zoomStep, 1.8));
      }
      
      // 즉시 다시 그리기
      requestAnimationFrame(() => {
        draw();
      });
    } catch (error) {
      console.error("TwoDViewer wheel handler error:", error);
    }
  };
  
  // 뷰타입별 종횡비 계산 - 비율 조정
  const getAspectRatio = (viewType) => {
    switch (viewType) {
      case 'front':
        return 1.6; // 가로:세로 = 1.6:1 비율로 조정
      case 'left':
      case 'right':
        return 1.2; // 가로:세로 = 1.2:1 비율로 조정
      case 'top':
        return 1.6; // 가로:세로 = 1.6:1 비율로 조정
      default:
        return 1.6;
    }
  };
  
  // Idle timer effect for mouse activity (reset pan after inactivity)
  useEffect(() => {
    const handleMouseActivity = () => {
      resetIdleTimer();
    };

    document.addEventListener('mousemove', handleMouseActivity);
    document.addEventListener('mousedown', handleMouseActivity);
    document.addEventListener('mouseup', handleMouseActivity);

    resetIdleTimer();

    return () => {
      document.removeEventListener('mousemove', handleMouseActivity);
      document.removeEventListener('mousedown', handleMouseActivity);
      document.removeEventListener('mouseup', handleMouseActivity);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  // NOTE: The following handlers are to be attached to frame input fields elsewhere:
  // Example usage in parent:
  // <input ... onFocus={() => setActiveFrameField('left')} onBlur={() => setActiveFrameField(null)} />
  // <input ... onFocus={() => setActiveFrameField('right')} onBlur={() => setActiveFrameField(null)} />
  // <input ... onFocus={() => setActiveFrameField('top')} onBlur={() => setActiveFrameField(null)} />

  // 캔버스 클릭 시 치수 필드 초기화
  const handleCanvasClick = useCallback((e) => {
    // 마우스 왼쪽 버튼만 처리
    if (e.button === 0) {
      // 활성 필드가 있고 콜백이 제공된 경우에만 호출
      if (onDimensionFieldReset) {
        console.log('캔버스 클릭: 필드 초기화');
        onDimensionFieldReset();
      }
    }
  }, [onDimensionFieldReset]);

  // useEffect 추가 - hasBase 변경 시 다시 그리기
  useEffect(() => {
    if (canvasRef.current && isInitialized) {
      draw();
    }
  }, [hasBase, baseHeight, activeDimensionField]);

  // Step 3에서는 정면도로 강제 설정하는 로직 추가
  useEffect(() => {
    // Step 3일 때, 정면도가 아니면 정면도로 변경
    if (options?.step === 'step3' && viewType !== 'front') {
      onViewTypeChange('front');
    }
  }, [options?.step, viewType, onViewTypeChange]);

  // Redraw canvas when activeFrameField changes (for highlight)
  useEffect(() => {
    if (canvasRef.current && isInitialized) {
      draw();
    }
  }, [activeFrameField]);

  return (
    <ViewerContainer ref={containerRef}>
      <Canvas
        ref={canvasRef}
        onMouseDown={(e) => { 
          if (e.button === 0) {
            handlePanStart(e);
            handleCanvasClick(e);
          } 
        }}
        onMouseMove={(e) => { if (e.buttons === 1) handlePanMove(e); }}
        onMouseUp={handlePanEnd}
        onMouseLeave={handlePanEnd}
        onWheel={handleWheel}
        style={{
          width: '100%',
          height: '100%',
          touchAction: 'none',
          cursor: dragging ? 'grabbing' : 'grab'
        }}
      />

      {!hideViewButtons && (
        <ViewControls>
          {/* Step 3에서는 정면도 버튼만 표시 */}
          {options?.step === 'step3' ? (
            <ViewButton
              $active={true}
              onClick={() => {}}
            >
              정면도
            </ViewButton>
          ) : (
            <>
            <ViewButton
              $active={viewType === 'front'}
              onClick={() => handleViewTypeChange('front')}
            >
              정면도
            </ViewButton>
          <ViewButton
            $active={viewType === 'top'}
            onClick={() => handleViewTypeChange('top')}
          >
            평면도
          </ViewButton>
          <ViewButton
            $active={viewType === 'left'}
            onClick={() => handleViewTypeChange('left')}
          >
            좌측면도
          </ViewButton>
            <ViewButton
              $active={viewType === 'right'}
              onClick={() => handleViewTypeChange('right')}
            >
              우측면도
            </ViewButton>
            </>
          )}
        </ViewControls>
      )}
      
      {/* Step 3에서는 줌 컨트롤만 표시 */}
      <ZoomControls>
        <ZoomButton onClick={() => setZoomFactor(prev => Math.min(prev + 0.1, 2))}>+</ZoomButton>
        <ZoomButton onClick={() => setZoomFactor(prev => Math.max(prev - 0.1, 0.2))}>−</ZoomButton>
      </ZoomControls>
    </ViewerContainer>
  );
};

TwoDViewer.propTypes = {
  options: PropTypes.object,
  onUpdate: PropTypes.func,
  viewType: PropTypes.oneOf(['front', 'side', 'top', 'left', 'right']),
  onViewTypeChange: PropTypes.func,
  hideViewButtons: PropTypes.bool,
  installationType: PropTypes.string,
  wallPosition: PropTypes.string, // 추가: 벽 위치 props 타입 정의
  hasAirConditioner: PropTypes.bool,
  hasFloorFinish: PropTypes.bool,
  acUnitPosition: PropTypes.string,
  acUnitWidth: PropTypes.number,
  acUnitDepth: PropTypes.number,
  floorFinishType: PropTypes.string,
  floorFinishHeight: PropTypes.number,
  leftFrameWidth: PropTypes.number,
  rightFrameWidth: PropTypes.number,
  upperFrameWidth: PropTypes.number,
  lowerFrameWidth: PropTypes.number,
  activeDimensionField: PropTypes.string,
  onDimensionFieldReset: PropTypes.func,
  hasBase: PropTypes.bool,
  baseHeight: PropTypes.number
};

const ViewerContainer = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  background-color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: auto;
  padding: 20px;
`;

const Canvas = styled.canvas`
  display: block;
  border: none;
`;

const ViewControls = styled.div`
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  z-index: 10;
`;

const ViewButton = styled.button`
  background-color: ${props => props.$active ? '#00C092' : 'white'};
  color: ${props => props.$active ? 'white' : '#555'};
  border: 1px solid ${props => props.$active ? '#00C092' : '#ddd'};
  padding: 8px 12px;
  margin: 0 4px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${props => props.$active ? '#00C092' : '#f5f5f5'};
  }
  
  &:focus {
    outline: none;
  }
`;

const ZoomControls = styled.div`
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  padding: 4px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  z-index: 10;
`;

const ZoomButton = styled.button`
  background-color: #fff;
  color: #333;
  border: 1px solid #ccc;
  padding: 6px 10px;
  margin: 0 2px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;

  &:hover {
    background-color: #f0f0f0;
  }

  &:focus {
    outline: none;
  }
`;

const ZoomReset = styled(ZoomButton)`
  font-size: 12px;
  background-color: #f8f8f8;
`;

export default TwoDViewer;
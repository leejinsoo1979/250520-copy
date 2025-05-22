import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const TwoDViewer = ({
  dimensions,
  viewType = 'front',
  hasAirConditioner = false,
  hasFloorFinish = false,
  acUnitPosition = 'left',
  acUnitWidth = 900,
  acUnitDepth = 200,
  floorFinishHeight = 20,
  installationType = 'built-in',
  showFrame = true
}) => {
  const canvasRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [zoomFactor, setZoomFactor] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePosition, setLastMousePosition] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const idleTimerRef = useRef(null);
  
  // Constants
  const PADDING = 50;
  const DEFAULT_FRAME_COLOR = '#F8F8F8';
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;
      
      const { width: containerWidth, height: containerHeight } = container.getBoundingClientRect();
      const aspectRatio = getAspectRatio(viewType);
      
      // Calculate canvas dimensions based on container and aspect ratio
      let canvasWidth = containerWidth;
      let canvasHeight = containerHeight;
      
      if (containerWidth / containerHeight > aspectRatio) {
        canvasWidth = containerHeight * aspectRatio;
      } else {
        canvasHeight = containerWidth / aspectRatio;
      }
      
      // Set canvas dimensions with device pixel ratio for sharp rendering
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvasWidth * dpr;
      canvas.height = canvasHeight * dpr;
      
      // Scale canvas CSS dimensions
      canvas.style.width = `${canvasWidth}px`;
      canvas.style.height = `${canvasHeight}px`;
      
      // Scale context to match device pixel ratio
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      
      setIsInitialized(true);
      draw();
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [viewType]);
  
  // Pan and zoom event handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const handleMouseDown = (e) => {
      setIsDragging(true);
      setLastMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      const dx = e.clientX - lastMousePosition.x;
      const dy = e.clientY - lastMousePosition.y;
      
      setPanOffset(prev => ({
        x: prev.x + dx,
        y: prev.y + dy
      }));
      
      setLastMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [isDragging, lastMousePosition]);
  
  // Reset pan offset after inactivity
  const resetIdleTimer = () => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    
    idleTimerRef.current = setTimeout(() => {
      setPanOffset({ x: 0, y: 0 });
    }, 3000); // Reset after 3 seconds of inactivity
  };
  
  // Draw whenever dimensions or view type changes
  useEffect(() => {
    if (isInitialized) {
      draw();
    }
  }, [dimensions, viewType, hasAirConditioner, hasFloorFinish, acUnitPosition, 
      acUnitWidth, acUnitDepth, floorFinishHeight, installationType, showFrame, 
      zoomFactor, panOffset]);
  
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
    scale = Math.min(Math.max(scale, 0.06), 0.18);
    
    // 3D 뷰어와 일치하도록 스케일 조정값 변경
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
    
    // Apply pan offset
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    
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
    
    ctx.restore();
  };
  
  // View-specific drawing functions
  const drawTopView = (ctx) => {
    const { width, depth } = dimensions;
    const scale = calculateScale(
      'top',
      width,
      depth,
      ctx.canvas.width,
      ctx.canvas.height
    );
    
    // Center the drawing
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    
    // Convert dimensions to pixels
    const widthPx = width * scale;
    const depthPx = depth * scale;
    
    // Calculate starting position
    const x = centerX - widthPx / 2;
    const y = centerY - depthPx / 2;
    
    // Draw main rectangle
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, widthPx, depthPx);
    
    // Draw dimension lines
    drawDimensionLine(ctx, x, y - 30, x + widthPx, y - 30, width, true);
    drawDimensionLine(ctx, x - 30, y, x - 30, y + depthPx, depth, false);
  };
  
  const drawFrontView = (ctx) => {
    const { width, height } = dimensions;
    const scale = calculateScale(
      'front',
      width,
      height,
      ctx.canvas.width,
      ctx.canvas.height
    );
    
    // Center the drawing
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    
    // Convert dimensions to pixels
    const widthPx = width * scale;
    const heightPx = height * scale;
    
    // Calculate starting position
    const x = centerX - widthPx / 2;
    const y = centerY - heightPx / 2;
    
    // Draw main rectangle
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, widthPx, heightPx);
    
    // Draw dimension lines
    drawDimensionLine(ctx, x, y - 30, x + widthPx, y - 30, width, true);
    drawDimensionLine(ctx, x - 30, y, x - 30, y + heightPx, height, false);
    
    // Draw air conditioner if enabled
    if (hasAirConditioner) {
      const acWidth = acUnitWidth * scale;
      const acHeight = 200 * scale; // Fixed height for visualization
      const acX = acUnitPosition === 'left' ? x : x + widthPx - acWidth;
      const acY = y;
      
      ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
      ctx.fillRect(acX, acY, acWidth, acHeight);
      ctx.strokeStyle = '#666';
      ctx.strokeRect(acX, acY, acWidth, acHeight);
    }
    
    // Draw floor finish if enabled
    if (hasFloorFinish) {
      const floorHeight = floorFinishHeight * scale;
      ctx.fillStyle = 'rgba(180, 140, 100, 0.3)';
      ctx.fillRect(x, y + heightPx - floorHeight, widthPx, floorHeight);
      ctx.strokeStyle = '#8B4513';
      ctx.strokeRect(x, y + heightPx - floorHeight, widthPx, floorHeight);
    }
  };
  
  const drawLeftView = (ctx) => {
    const { depth, height } = dimensions;
    const scale = calculateScale(
      'left',
      depth,
      height,
      ctx.canvas.width,
      ctx.canvas.height
    );
    
    // Center the drawing
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    
    // Convert dimensions to pixels
    const depthPx = depth * scale;
    const heightPx = height * scale;
    
    // Calculate starting position
    const x = centerX - depthPx / 2;
    const y = centerY - heightPx / 2;
    
    // Draw main rectangle
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, depthPx, heightPx);
    
    // Draw dimension lines
    drawDimensionLine(ctx, x, y - 30, x + depthPx, y - 30, depth, true);
    drawDimensionLine(ctx, x - 30, y, x - 30, y + heightPx, height, false);
  };
  
  const drawRightView = (ctx) => {
    // Similar to left view but mirrored
    drawLeftView(ctx);
  };
  
  const drawDimensionLine = (ctx, startX, startY, endX, endY, measurement, isHorizontal) => {
    const arrowSize = 10;
    
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw arrows
    ctx.beginPath();
    if (isHorizontal) {
      ctx.moveTo(startX, startY);
      ctx.lineTo(startX + arrowSize, startY - arrowSize / 2);
      ctx.lineTo(startX + arrowSize, startY + arrowSize / 2);
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX - arrowSize, endY - arrowSize / 2);
      ctx.lineTo(endX - arrowSize, endY + arrowSize / 2);
    } else {
      ctx.moveTo(startX, startY);
      ctx.lineTo(startX - arrowSize / 2, startY + arrowSize);
      ctx.lineTo(startX + arrowSize / 2, startY + arrowSize);
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX - arrowSize / 2, endY - arrowSize);
      ctx.lineTo(endX + arrowSize / 2, endY - arrowSize);
    }
    ctx.fillStyle = '#666';
    ctx.fill();
    
    // Draw measurement text
    ctx.font = '14px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const textX = (startX + endX) / 2;
    const textY = (startY + endY) / 2;
    const text = `${measurement}mm`;
    
    // Draw white background for text
    const textWidth = ctx.measureText(text).width;
    const padding = 4;
    ctx.fillStyle = 'white';
    ctx.fillRect(
      textX - textWidth / 2 - padding,
      textY - 8 - padding,
      textWidth + padding * 2,
      16 + padding * 2
    );
    
    // Draw text
    ctx.fillStyle = '#333';
    ctx.fillText(text, textX, textY);
  };
  
  const handleWheel = (e) => {
    e.preventDefault();
    
    try {
      const delta = e.deltaY;
      const zoomStep = 0.03;
      
      if (delta > 0) {
        setZoomFactor(prev => Math.max(prev - zoomStep, 0.3));
      } else {
        setZoomFactor(prev => Math.min(prev + zoomStep, 1.8));
      }
      
      requestAnimationFrame(() => {
        draw();
      });
    } catch (error) {
      console.error("TwoDViewer wheel handler error:", error);
    }
  };
  
  const getAspectRatio = (viewType) => {
    switch (viewType) {
      case 'front':
        return 1.6;
      case 'left':
      case 'right':
        return 1.2;
      case 'top':
        return 1.6;
      default:
        return 1.6;
    }
  };
  
  return (
    <ViewerContainer>
      <Canvas ref={canvasRef} />
      <ZoomControls>
        <ZoomButton onClick={() => setZoomFactor(prev => Math.min(prev + 0.1, 2))}>+</ZoomButton>
        <ZoomButton onClick={() => setZoomFactor(prev => Math.max(prev - 0.1, 0.2))}>−</ZoomButton>
      </ZoomControls>
    </ViewerContainer>
  );
};

TwoDViewer.propTypes = {
  dimensions: PropTypes.shape({
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    depth: PropTypes.number.isRequired
  }).isRequired,
  viewType: PropTypes.oneOf(['front', 'top', 'left', 'right']),
  hasAirConditioner: PropTypes.bool,
  hasFloorFinish: PropTypes.bool,
  acUnitPosition: PropTypes.string,
  acUnitWidth: PropTypes.number,
  acUnitDepth: PropTypes.number,
  floorFinishHeight: PropTypes.number,
  installationType: PropTypes.string,
  showFrame: PropTypes.bool
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

export default TwoDViewer; 
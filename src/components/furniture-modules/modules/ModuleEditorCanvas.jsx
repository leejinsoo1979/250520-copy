import React, { useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import ModuleRenderer from '../ModuleRenderer';
import ModuleSlots from '../ModuleSlots';

// 3D 캔버스 영역
const ModuleEditorCanvas = ({ 
  dimensions, 
  doorCount, 
  placedModules = [], 
  ghostModule = null,
  slotStatuses = [],
  onSlotHover,
  onSlotClick,
  highlightSlot = null,
  showDimensions = true,
  children
}) => {
  console.log('[ModuleEditorCanvas] 렌더링 시작', { doorCount, placedModulesCount: placedModules.length });
  
  // 드롭 모드 상태 관리
  const [dropMode, setDropMode] = useState(false);
  
  // mm에서 m로 변환
  const widthM = dimensions.width / 1000;
  const heightM = dimensions.height / 1000;
  const depthM = dimensions.depth / 1000;
  
  // 하이라이트된 슬롯이 있다면 상태 업데이트
  const updatedSlotStatuses = React.useMemo(() => {
    if (highlightSlot === null) return slotStatuses;
    
    // 슬롯 상태 복사본 생성
    const newStatuses = [...slotStatuses];
    
    // 하이라이트된 슬롯 상태 업데이트
    if (newStatuses[highlightSlot] === 'empty') {
      newStatuses[highlightSlot] = 'highlight';
    }
    
    return newStatuses;
  }, [slotStatuses, highlightSlot]);
  
  // 캔버스 참조 생성
  const canvasRef = useRef(null);
  
  // 하이라이트 슬롯 변경 시 드롭 모드 설정
  useEffect(() => {
    setDropMode(highlightSlot !== null);
  }, [highlightSlot]);
  
  // 캔버스 초기화 확인
  useEffect(() => {
    console.log('[ModuleEditorCanvas] 캔버스 마운트됨');
    
    return () => {
      console.log('[ModuleEditorCanvas] 캔버스 언마운트됨');
    };
  }, []);
  
  return (
    <div 
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative', 
        overflow: 'hidden',
        border: dropMode ? '2px dashed #3b82f6' : '2px solid transparent',
        transition: 'border-color 0.3s ease',
        background: dropMode ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
      }}
    >
      {/* 슬롯 구분선 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1,
        pointerEvents: 'none'
      }}>
        {Array.from({ length: doorCount + 1 }).map((_, i) => (
          <div
            key={`slot-divider-${i}`}
            style={{
              position: 'absolute',
              left: `${(i / doorCount) * 100}%`,
              top: 0,
              bottom: 0,
              width: '1px',
              backgroundColor: '#e5e7eb',
              zIndex: 2,
              pointerEvents: 'none'
            }}
          />
        ))}
        
        {/* 슬롯 인덱스 표시 */}
        {Array.from({ length: doorCount }).map((_, i) => (
          <div
            key={`slot-index-${i}`}
            style={{
              position: 'absolute',
              left: `${((i + 0.5) / doorCount) * 100}%`,
              top: '5px',
              transform: 'translateX(-50%)',
              color: highlightSlot === i ? '#3b82f6' : '#64748b',
              fontWeight: highlightSlot === i ? 'bold' : 'normal',
              fontSize: '12px',
              zIndex: 3,
              pointerEvents: 'none',
              textShadow: '0 0 2px white'
            }}
          >
            {i + 1}
          </div>
        ))}
      </div>
      
      {/* 드롭 안내 메시지 */}
      {dropMode && (
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '8px 16px',
          backgroundColor: 'rgba(59, 130, 246, 0.9)',
          color: 'white',
          borderRadius: '4px',
          zIndex: 10,
          fontSize: '14px',
          pointerEvents: 'none'
        }}>
          슬롯 {highlightSlot + 1}에 모듈을 배치합니다
        </div>
      )}

      <Canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', background: '#f5f5f5' }}
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 2, 4], fov: 50 }}
        onCreated={({ gl }) => {
          console.log('[ModuleEditorCanvas] WebGL 렌더러 생성 완료');
          gl.setClearColor('#f5f5f5');
        }}
      >
        <color attach="background" args={['#f5f5f5']} />
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1} 
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        
        {/* 3D 화면 조작 컨트롤 */}
        <OrbitControls
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          target={[0, 1, 0]}
        />
        
        {/* 바닥 그리드 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[10, 10]} />
          <meshStandardMaterial color="#f0f0f0" />
        </mesh>
        
        {/* 모듈 슬롯 */}
        <ModuleSlots
          totalWidth={dimensions.width}
          slotCount={doorCount}
          slotStatuses={updatedSlotStatuses}
          onSlotHover={onSlotHover}
          onSlotClick={onSlotClick}
          position={[0, 0, 0]}
          baseHeight={100}  // 받침대 높이 (mm)
          depth={dimensions.depth}
          baseDepth={dimensions.depth - 20}  // 받침대의 깊이 (mm)
          highlightSlot={highlightSlot}
          showDimension={showDimensions}
        />
        
        {/* 배치된 모듈들 */}
        {placedModules.map((module, index) => (
          <ModuleRenderer
            key={`placed-module-${module.id}-${index}`}
            module={module}
            position={[module.position.x / 1000, module.position.y / 1000 + 0.1, module.position.z / 1000]}
            isSelected={false}
            isHovered={false}
          />
        ))}

        {/* 고스트 모듈 (마우스 호버 시 미리보기) */}
        {ghostModule && (
          <ModuleRenderer
            key="ghost-module"
            module={ghostModule}
            position={[ghostModule.position.x / 1000, ghostModule.position.y / 1000 + 0.1, ghostModule.position.z / 1000]}
            isSelected={false}
            isHovered={true}
            isGhost={true}
          />
        )}
        
        {/* 자식 요소 렌더링 */}
        {children}
      </Canvas>
      
      {/* 캔버스 로드 상태 표시 */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        padding: '5px 10px',
        background: 'rgba(0,0,0,0.5)',
        color: 'white',
        fontSize: '12px',
        borderRadius: '4px',
        zIndex: 100,
        display: 'none' // 기본적으로 숨김
      }}>
        3D 뷰 준비 중...
      </div>
    </div>
  );
};

ModuleEditorCanvas.propTypes = {
  dimensions: PropTypes.shape({
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    depth: PropTypes.number.isRequired
  }).isRequired,
  doorCount: PropTypes.number.isRequired,
  placedModules: PropTypes.array,
  ghostModule: PropTypes.object,
  slotStatuses: PropTypes.array,
  onSlotHover: PropTypes.func.isRequired,
  onSlotClick: PropTypes.func.isRequired,
  highlightSlot: PropTypes.number,
  showDimensions: PropTypes.bool,
  children: PropTypes.node
};

export default ModuleEditorCanvas; 
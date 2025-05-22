import React, { useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useDnDStore, PANEL_THICKNESS, calculateInnerDimensions } from './useDnDStore';

// 위치 및 스케일 타입 정의
interface Position {
  x: number;
  y: number;
  z: number;
}

interface Scale {
  x: number;
  y: number;
  z: number;
}

// 배치된 아이템 타입 정의
interface PlacedItem {
  id: string;
  type: string;
  width: number;
  height: number;
  depth: number;
  image: string;
  name: string;
  color?: string;
  position: Position;
  scale: Scale;
  slotId: string;
}

interface SlotCanvasProps {
  slotId: string;
  width: number;
  height: number;
  depth: number;
  className?: string;
}

// mm를 미터 단위로 변환 (Three.js에서 사용)
const mmToMeter = (mm: number) => mm / 1000;

// 패널 컴포넌트
const Panel = ({ 
  position, 
  width, 
  height, 
  depth, 
  color = '#8B4513' 
}: { 
  position: [number, number, number]; 
  width: number; 
  height: number; 
  depth: number; 
  color?: string; 
}) => {
  return (
    <mesh position={position}>
      <boxGeometry args={[width, height, depth]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
};

// 캐비닛 컴포넌트
const Cabinet = ({ width, height, depth }: { width: number; height: number; depth: number }) => {
  // mm를 미터 단위로 변환
  const w = mmToMeter(width);
  const h = mmToMeter(height);
  const d = mmToMeter(depth);
  const t = mmToMeter(PANEL_THICKNESS);
  
  return (
    <group>
      {/* 후면 패널 */}
      <Panel 
        position={[0, 0, -d/2 + t/2]} 
        width={w} 
        height={h} 
        depth={t} 
      />
      
      {/* 상단 패널 */}
      <Panel 
        position={[0, h/2 - t/2, 0]} 
        width={w} 
        height={t} 
        depth={d} 
      />
      
      {/* 하단 패널 */}
      <Panel 
        position={[0, -h/2 + t/2, 0]} 
        width={w} 
        height={t} 
        depth={d} 
      />
      
      {/* 좌측 패널 */}
      <Panel 
        position={[-w/2 + t/2, 0, 0]} 
        width={t} 
        height={h} 
        depth={d} 
      />
      
      {/* 우측 패널 */}
      <Panel 
        position={[w/2 - t/2, 0, 0]} 
        width={t} 
        height={h} 
        depth={d} 
      />
    </group>
  );
};

// 배치된 모듈 렌더링 컴포넌트
const PlacedModule = ({ item }: { item: PlacedItem }) => {
  // 텍스처 로드를 위한 참조
  const textureRef = useRef<THREE.Texture | null>(null);
  
  // mm를 미터 단위로 변환
  const width = mmToMeter(item.width);
  const height = mmToMeter(item.height);
  const depth = mmToMeter(item.depth);
  
  // 텍스처 로드
  React.useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(item.image, (texture) => {
      textureRef.current = texture;
    });
    
    return () => {
      if (textureRef.current) {
        textureRef.current.dispose();
      }
    };
  }, [item.image]);
  
  return (
    <mesh 
      position={[0, 0, 0]} 
      scale={[item.scale.x, item.scale.y, item.scale.z]}
    >
      <boxGeometry args={[width, height, depth]} />
      <meshStandardMaterial 
        color={item.color || '#F0F0F0'} 
        map={textureRef.current || undefined}
      />
    </mesh>
  );
};

// 메인 SlotCanvas 컴포넌트
const SlotCanvas: React.FC<SlotCanvasProps> = ({ 
  slotId, 
  width, 
  height, 
  depth, 
  className 
}) => {
  const { placedItems } = useDnDStore();
  
  // 현재 슬롯에 배치된 아이템 찾기
  const placedItem = placedItems.find(item => item.slotId === slotId);
  
  // 내부 유효 공간 계산
  const innerDimensions = calculateInnerDimensions(width, height, depth);
  
  return (
    <div 
      className={`w-full h-full relative overflow-hidden rounded-md ${className || ''}`}
      style={{ aspectRatio: '1 / 1' }}
    >
      <Canvas shadows>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <PerspectiveCamera 
          makeDefault 
          position={[0, 0, mmToMeter(Math.max(width, height, depth) * 2)]} 
        />
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={mmToMeter(Math.max(width, height, depth))}
          maxDistance={mmToMeter(Math.max(width, height, depth) * 3)}
        />
        
        {/* 캐비닛 렌더링 */}
        <Cabinet width={width} height={height} depth={depth} />
        
        {/* 배치된 아이템 렌더링 */}
        {placedItem && <PlacedModule item={placedItem} />}
      </Canvas>
      
      {/* 슬롯 ID 및 크기 정보 오버레이 */}
      <div className="absolute bottom-2 left-2 text-xs bg-white bg-opacity-70 p-1 rounded">
        슬롯 ID: {slotId} | 내부 크기: {innerDimensions.width}x{innerDimensions.height}x{innerDimensions.depth}mm
      </div>
    </div>
  );
};

export default SlotCanvas; 
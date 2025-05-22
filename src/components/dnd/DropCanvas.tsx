import React, { useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useDnDStore } from './useDnDStore';

// 캔버스에 배치된 아이템들을 표시하는 컴포넌트
const PlacedItems = () => {
  const { placedItems } = useDnDStore();
  
  return (
    <>
      {placedItems.map((item) => (
        <mesh
          key={item.id}
          position={[item.position.x, item.position.y, item.position.z]}
          scale={[item.width / 100, item.height / 100, 0.5]}
        >
          <boxGeometry args={[1, 1, 0.1]} />
          <meshStandardMaterial color={item.color || '#f0f0f0'} />
          {/* 텍스처를 로드하여 적용할 수도 있음 */}
        </mesh>
      ))}
    </>
  );
};

// 캐비닛 기본 구조 (벽, 선반 등)
const Cabinet = () => {
  return (
    <mesh position={[0, 0, -0.6]}>
      <boxGeometry args={[6, 8, 1]} />
      <meshStandardMaterial color="#e0e0e0" transparent opacity={0.5} />
    </mesh>
  );
};

// 드롭 핸들러 및 광선 충돌 검사
const DropHandler = () => {
  const { scene, camera, raycaster, pointer } = useThree();
  const { isDragging, draggingItem, addPlacedItem, setIsDragging, setDraggingItem } = useDnDStore();
  const dropPlaneRef = useRef<THREE.Mesh>(null);
  
  // 매 프레임마다 광선 검사 수행
  useFrame(() => {
    if (!isDragging || !dropPlaneRef.current || !draggingItem) return;
    
    // 광선 위치 업데이트
    raycaster.setFromCamera(pointer, camera);
    
    // 광선과 드롭 영역 평면과의 충돌 검사
    const intersects = raycaster.intersectObject(dropPlaneRef.current);
    
    if (intersects.length > 0) {
      // 마우스 오버 효과를 표시할 수 있음
      dropPlaneRef.current.material.opacity = 0.3;
    } else {
      dropPlaneRef.current.material.opacity = 0.1;
    }
  });
  
  // 마우스 업 이벤트 핸들러 등록
  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      if (!isDragging || !dropPlaneRef.current || !draggingItem) return;
      
      // 광선과 드롭 영역 평면과의 충돌 검사
      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObject(dropPlaneRef.current);
      
      if (intersects.length > 0) {
        // 충돌 지점 계산
        const point = intersects[0].point;
        
        // 아이템 배치
        addPlacedItem({
          ...draggingItem,
          position: {
            x: point.x,
            y: point.y,
            z: point.z + 0.1, // 평면 앞쪽으로 약간 이동
          },
          color: draggingItem.color || getRandomColor(),
        });
      }
      
      // 드래그 상태 초기화
      setIsDragging(false);
      setDraggingItem(null);
    };
    
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, draggingItem, addPlacedItem, setIsDragging, setDraggingItem, raycaster, pointer, camera]);
  
  // 랜덤 색상 생성기
  const getRandomColor = () => {
    return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
  };
  
  // 드롭 영역 평면 렌더링
  return (
    <mesh ref={dropPlaneRef} position={[0, 0, -0.5]}>
      <planeGeometry args={[6, 8]} />
      <meshStandardMaterial 
        color="#ffffff" 
        transparent 
        opacity={0.1} 
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

// 메인 DropCanvas 컴포넌트
const DropCanvas: React.FC = () => {
  return (
    <div className="w-full h-full border rounded-lg overflow-hidden">
      <Canvas>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <PerspectiveCamera makeDefault position={[0, 0, 8]} />
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={3}
          maxDistance={20}
        />
        <Cabinet />
        <DropHandler />
        <PlacedItems />
      </Canvas>
    </div>
  );
};

export default DropCanvas; 
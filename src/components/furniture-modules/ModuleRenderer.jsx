import React from 'react';
import PropTypes from 'prop-types';
import { MODULE_TYPES } from './ModuleTypes';
import * as THREE from 'three';
import { useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';

// 모듈별 색상 정의
const moduleColors = {
  [MODULE_TYPES.DRAWER]: '#e0e0e0', // 서랍장 색상
  [MODULE_TYPES.SHELF]: '#f5f5f5',  // 선반 색상
  [MODULE_TYPES.HANGING]: '#d1d1d1', // 행거바 색상
  [MODULE_TYPES.DOOR]: '#ffffff',   // 도어 색상
  [MODULE_TYPES.ACCESSORY]: '#cccccc', // 액세서리 색상
  [MODULE_TYPES.CABINET]: '#f0f0f0'  // 캐비넷 색상
};

// 각 모듈 타입별 3D 메쉬 생성
const ModuleRenderer = ({ module, position, onClick, isSelected, isHovered, isGhost = false }) => {
  // 모듈 정보 추출
  const { id, type, dimensions, options } = module;
  const { width, height, depth } = dimensions;
  
  // mm 단위를 m 단위로 변환
  const widthM = width / 1000;
  const heightM = height / 1000;
  const depthM = depth / 1000;
  
  // 모듈 타입별 색상 선택 (선택/호버 상태에 따라 다른 색상 적용)
  let color = moduleColors[type] || '#cccccc';
  
  if (isSelected) {
    color = '#4caf50'; // 선택된 경우 그린 색상
  } else if (isHovered) {
    color = '#90caf9'; // 호버 시 밝은 파란색
  }
  
  // 고스트 모드 설정 (모듈을 반투명하게 표시)
  const opacity = isGhost ? 0.5 : 1.0;
  
  // 모듈 타입에 따라 다른 컴포넌트 렌더링
  switch (type) {
    case MODULE_TYPES.DRAWER:
      return (
        <DrawerModule 
          width={widthM} 
          height={heightM} 
          depth={depthM} 
          position={position}
          drawerCount={options.drawerCount || 1}
          color={color}
          onClick={onClick}
          id={id}
          isGhost={isGhost}
          opacity={opacity}
        />
      );
      
    case MODULE_TYPES.SHELF:
      return (
        <ShelfModule 
          width={widthM} 
          height={heightM} 
          depth={depthM} 
          position={position}
          fixed={options.fixed}
          color={color}
          onClick={onClick}
          id={id}
          isGhost={isGhost}
          opacity={opacity}
        />
      );
      
    case MODULE_TYPES.HANGING:
      return (
        <HangingModule 
          width={widthM} 
          height={heightM} 
          depth={depthM} 
          position={position}
          rodDiameter={options.rodDiameter / 1000 || 0.025}
          color={color}
          onClick={onClick}
          id={id}
          isGhost={isGhost}
          opacity={opacity}
        />
      );
      
    case MODULE_TYPES.DOOR:
      return (
        <DoorModule 
          width={widthM} 
          height={heightM} 
          depth={depthM} 
          position={position}
          doorType={options.type || 'hinge'}
          color={color}
          onClick={onClick}
          id={id}
          isGhost={isGhost}
          opacity={opacity}
        />
      );
      
    case MODULE_TYPES.ACCESSORY:
      return (
        <AccessoryModule 
          width={widthM} 
          height={heightM} 
          depth={depthM} 
          position={position}
          color={color}
          onClick={onClick}
          id={id}
          isGhost={isGhost}
          opacity={opacity}
        />
      );

    case MODULE_TYPES.CABINET:
      return (
        <CabinetModule 
          width={widthM} 
          height={heightM} 
          depth={depthM} 
          position={position}
          panelThickness={(options.panelThickness || 18) / 1000}
          modules={options.modules || []}
          panels={options.hasTop !== undefined ? 
            {
              hasTop: options.hasTop,
              hasBottom: options.hasBottom,
              hasLeft: options.hasLeft,
              hasRight: options.hasRight,
              hasBack: options.hasBack
            } : 
            { hasTop: true, hasBottom: true, hasLeft: true, hasRight: true, hasBack: true }
          }
          color={color}
          onClick={onClick}
          id={id}
          isGhost={isGhost}
          opacity={opacity}
        />
      );
      
    default:
      // 기본 박스 형태로 렌더링
      return (
        <mesh position={position} onClick={onClick}>
          <boxGeometry args={[widthM, heightM, depthM]} />
          <meshStandardMaterial color={color} transparent={isGhost} opacity={opacity} />
        </mesh>
      );
  }
};

// 서랍장 모듈
const DrawerModule = ({ width, height, depth, position, drawerCount, color, onClick, id, isGhost, opacity }) => {
  // 서랍 하나당 높이 계산
  const drawerHeight = height / drawerCount;
  const drawerGap = 0.002; // 서랍 사이 간격 (2mm)
  
  return (
    <group position={position} onClick={(e) => onClick && onClick(e, id)}>
      {/* 서랍장 본체 */}
      <mesh>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={color} transparent={isGhost} opacity={opacity} />
      </mesh>
      
      {/* 서랍들 */}
      {Array.from({ length: drawerCount }).map((_, index) => (
        <mesh key={`drawer-${id}-${index}`} position={[0, height/2 - (drawerHeight/2) - (index * (drawerHeight + drawerGap)), 0.001]}>
          <boxGeometry args={[width * 0.95, drawerHeight * 0.9, 0.005]} />
          <meshStandardMaterial color="#ffffff" transparent={isGhost} opacity={opacity} />
        </mesh>
      ))}
      
      {/* 서랍 손잡이 */}
      {Array.from({ length: drawerCount }).map((_, index) => (
        <mesh key={`handle-${id}-${index}`} position={[0, height/2 - (drawerHeight/2) - (index * (drawerHeight + drawerGap)), 0.005]}>
          <boxGeometry args={[width * 0.3, 0.01, 0.01]} />
          <meshStandardMaterial color="#999999" transparent={isGhost} opacity={opacity} />
        </mesh>
      ))}
    </group>
  );
};

// 선반 모듈
const ShelfModule = ({ width, height, depth, position, fixed, color, onClick, id, isGhost, opacity }) => {
  return (
    <group position={position} onClick={(e) => onClick && onClick(e, id)}>
      <mesh>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={color} transparent={isGhost} opacity={opacity} />
      </mesh>
      
      {/* 선반 지지대 (고정형인 경우) */}
      {fixed && (
        <>
          <mesh position={[-width/2 + 0.02, -height/2, 0]}>
            <boxGeometry args={[0.02, 0.1, depth]} />
            <meshStandardMaterial color="#999999" transparent={isGhost} opacity={opacity} />
          </mesh>
          <mesh position={[width/2 - 0.02, -height/2, 0]}>
            <boxGeometry args={[0.02, 0.1, depth]} />
            <meshStandardMaterial color="#999999" transparent={isGhost} opacity={opacity} />
          </mesh>
        </>
      )}
    </group>
  );
};

// 행거바 모듈
const HangingModule = ({ width, height, depth, position, rodDiameter, color, onClick, id, isGhost, opacity }) => {
  return (
    <group position={position} onClick={(e) => onClick && onClick(e, id)}>
      {/* 행거바 지지대 (양쪽) */}
      <mesh position={[-width/2 + 0.02, 0, 0]}>
        <boxGeometry args={[0.04, height, 0.04]} />
        <meshStandardMaterial color="#999999" transparent={isGhost} opacity={opacity} />
      </mesh>
      <mesh position={[width/2 - 0.02, 0, 0]}>
        <boxGeometry args={[0.04, height, 0.04]} />
        <meshStandardMaterial color="#999999" transparent={isGhost} opacity={opacity} />
      </mesh>
      
      {/* 행거바 (원통형) */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[rodDiameter, rodDiameter, width, 16]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.2} transparent={isGhost} opacity={opacity} />
      </mesh>
    </group>
  );
};

// 도어 모듈
const DoorModule = ({ width, height, depth, position, doorType, color, onClick, id, isGhost, opacity }) => {
  // 손잡이 위치 계산
  const handlePosition = doorType === 'hinge' ? 
    [width/2 - 0.03, 0, depth/2 + 0.005] : // 여닫이 도어 손잡이 위치
    [0, 0, depth/2 + 0.005]; // 슬라이딩 도어 손잡이 위치
    
  return (
    <group position={position} onClick={(e) => onClick && onClick(e, id)}>
      {/* 도어 본체 */}
      <mesh>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={color} transparent={isGhost} opacity={opacity} />
      </mesh>
      
      {/* 도어 프레임 (테두리) */}
      <mesh position={[0, 0, depth/2 + 0.001]}>
        <boxGeometry args={[width * 0.98, height * 0.98, 0.002]} />
        <meshStandardMaterial color="#f0f0f0" transparent={isGhost} opacity={opacity} />
      </mesh>
      
      {/* 도어 손잡이 */}
      <mesh position={handlePosition}>
        <boxGeometry args={[0.03, 0.1, 0.01]} />
        <meshStandardMaterial color="#999999" metalness={0.8} roughness={0.2} transparent={isGhost} opacity={opacity} />
      </mesh>
    </group>
  );
};

// 액세서리 모듈 (옷걸이 바구니 등)
const AccessoryModule = ({ width, height, depth, position, color, onClick, id, isGhost, opacity }) => {
  return (
    <group position={position} onClick={(e) => onClick && onClick(e, id)}>
      <mesh>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={color} transparent={isGhost} opacity={opacity} />
      </mesh>
      
      {/* 액세서리 구분용 패턴 */}
      <mesh position={[0, 0, depth/2 + 0.001]}>
        <planeGeometry args={[width * 0.9, height * 0.9]} />
        <meshStandardMaterial color="#cccccc" transparent={isGhost} opacity={opacity} />
      </mesh>
    </group>
  );
};

// 캐비넷 모듈 (상부장 + 하부장)
const CabinetModule = ({ 
  width, 
  height, 
  depth, 
  position, 
  panelThickness, 
  modules,
  panels,
  color, 
  onClick, 
  id,
  isGhost,
  opacity
}) => {
  // 패널 색상 및 재질 설정
  const panelColor = "#f0f0f0"; // 패널 기본 색상
  const frameColor = color;     // 프레임 색상
  
  // 패널 두께 (기본값 18mm)
  const thickness = panelThickness || 0.018;
  
  // 내부 사용 가능 크기 (패널 두께 제외)
  const innerWidth = width - (thickness * 2);
  const innerHeight = height - (thickness * 2);
  const innerDepth = depth - (thickness);
  
  // 모듈 생성
  const renderSubModules = () => {
    return modules.map((subModule, index) => {
      // 모듈 위치 계산 (상단, 하단)
      let yPos = 0;
      if (subModule.position === 'top') {
        // 상단 모듈은 하단 모듈 높이만큼 위로
        const lowerModule = modules.find(m => m.position === 'base');
        const lowerHeight = lowerModule ? lowerModule.dimensions.height / 1000 : 0;
        yPos = -height/2 + lowerHeight + subModule.dimensions.height/1000/2;
      } else if (subModule.position === 'base') {
        // 하단 모듈은 캐비넷 바닥에 맞춤
        yPos = -height/2 + subModule.dimensions.height/1000/2;
      }
      
      // 서브모듈 렌더링 (기본 박스 형태)
      const subModuleWidthM = subModule.dimensions.width / 1000;
      const subModuleHeightM = subModule.dimensions.height / 1000;
      const subModuleDepthM = subModule.dimensions.depth / 1000;
      
      return (
        <group key={`submodule-${id}-${index}`} position={[0, yPos, 0]}>
          <mesh>
            <boxGeometry args={[subModuleWidthM, subModuleHeightM, subModuleDepthM]} />
            <meshStandardMaterial color={color} opacity={isGhost ? opacity * 0.7 : 0.7} transparent />
          </mesh>
          
          {/* 서브모듈 테두리 - 구분을 위한 용도 */}
          <mesh position={[0, 0, subModuleDepthM/2 + 0.001]}>
            <boxGeometry args={[subModuleWidthM, subModuleHeightM, 0.001]} />
            <meshStandardMaterial color="#dddddd" transparent={isGhost} opacity={opacity} />
          </mesh>
          
          {/* 서브모듈 라벨 */}
          <mesh position={[0, 0, subModuleDepthM/2 + 0.002]}>
            <boxGeometry args={[subModuleWidthM * 0.5, subModuleHeightM * 0.1, 0.001]} />
            <meshStandardMaterial color="#bbbbbb" transparent={isGhost} opacity={opacity} />
          </mesh>
        </group>
      );
    });
  };
  
  return (
    <group position={position} onClick={(e) => onClick && onClick(e, id)}>
      {/* 캐비넷 프레임 */}
      <mesh>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={frameColor} opacity={isGhost ? opacity * 0.2 : 0.2} transparent />
      </mesh>
      
      {/* 상단 패널 */}
      {panels.hasTop && (
        <mesh position={[0, height/2 - thickness/2, 0]}>
          <boxGeometry args={[width, thickness, depth]} />
          <meshStandardMaterial color={panelColor} transparent={isGhost} opacity={opacity} />
        </mesh>
      )}
      
      {/* 하단 패널 */}
      {panels.hasBottom && (
        <mesh position={[0, -height/2 + thickness/2, 0]}>
          <boxGeometry args={[width, thickness, depth]} />
          <meshStandardMaterial color={panelColor} transparent={isGhost} opacity={opacity} />
        </mesh>
      )}
      
      {/* 좌측 패널 */}
      {panels.hasLeft && (
        <mesh position={[-width/2 + thickness/2, 0, 0]}>
          <boxGeometry args={[thickness, height, depth]} />
          <meshStandardMaterial color={panelColor} transparent={isGhost} opacity={opacity} />
        </mesh>
      )}
      
      {/* 우측 패널 */}
      {panels.hasRight && (
        <mesh position={[width/2 - thickness/2, 0, 0]}>
          <boxGeometry args={[thickness, height, depth]} />
          <meshStandardMaterial color={panelColor} transparent={isGhost} opacity={opacity} />
        </mesh>
      )}
      
      {/* 후면 패널 */}
      {panels.hasBack && (
        <mesh position={[0, 0, -depth/2 + thickness/2]}>
          <boxGeometry args={[width, height, thickness]} />
          <meshStandardMaterial color={panelColor} transparent={isGhost} opacity={opacity} />
        </mesh>
      )}
      
      {/* 서브 모듈 렌더링 (상부장/하부장) */}
      {renderSubModules()}
    </group>
  );
};

ModuleRenderer.propTypes = {
  module: PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    dimensions: PropTypes.shape({
      width: PropTypes.number.isRequired,
      height: PropTypes.number.isRequired,
      depth: PropTypes.number.isRequired
    }).isRequired,
    options: PropTypes.object
  }).isRequired,
  position: PropTypes.arrayOf(PropTypes.number),
  onClick: PropTypes.func,
  isSelected: PropTypes.bool,
  isHovered: PropTypes.bool,
  isGhost: PropTypes.bool
};

ModuleRenderer.defaultProps = {
  position: [0, 0, 0],
  isSelected: false,
  isHovered: false,
  isGhost: false
};

export default ModuleRenderer; 
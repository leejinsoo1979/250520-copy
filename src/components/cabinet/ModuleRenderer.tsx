import React from 'react';
import { ModuleTemplate, Panel } from '../../data/moduleTemplates';

interface ModuleRendererProps {
  module: ModuleTemplate;
  x: number;
  y: number;
  scale?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
}

const ModuleRenderer: React.FC<ModuleRendererProps> = ({
  module,
  x,
  y,
  scale = { x: 1, y: 1, z: 1 },
  rotation = { x: 0, y: 0, z: 0 }
}) => {
  // 패널 렌더링 함수
  const renderPanel = (panel: Panel, index: number) => {
    // 패널 타입에 따른 스타일 적용
    let panelStyle: React.CSSProperties = {
      position: 'absolute',
      backgroundColor: panel.color || '#8B4513',
      transformOrigin: 'center',
      boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
    };
    
    // 패널 위치에 따른 스타일
    switch (panel.position) {
      case 'left':
        panelStyle = {
          ...panelStyle,
          left: x + panel.x * scale.x,
          top: y + panel.y * scale.y,
          width: panel.width * scale.x,
          height: panel.height * scale.y,
          transform: `translateZ(${panel.z * scale.z}px) rotateY(90deg)`,
          transformOrigin: 'left center',
        };
        break;
      case 'right':
        panelStyle = {
          ...panelStyle,
          left: x + panel.x * scale.x,
          top: y + panel.y * scale.y,
          width: panel.width * scale.x,
          height: panel.height * scale.y,
          transform: `translateZ(${panel.z * scale.z}px) rotateY(270deg)`,
          transformOrigin: 'right center',
        };
        break;
      case 'top':
        panelStyle = {
          ...panelStyle,
          left: x + panel.x * scale.x,
          top: y + panel.y * scale.y,
          width: panel.width * scale.x,
          height: panel.depth * scale.z,
          transform: `translateZ(${panel.z * scale.z}px) rotateX(270deg)`,
          transformOrigin: 'center top',
        };
        break;
      case 'bottom':
        panelStyle = {
          ...panelStyle,
          left: x + panel.x * scale.x,
          top: y + panel.y * scale.y,
          width: panel.width * scale.x,
          height: panel.depth * scale.z,
          transform: `translateZ(${panel.z * scale.z}px) rotateX(90deg)`,
          transformOrigin: 'center bottom',
        };
        break;
      case 'back':
        panelStyle = {
          ...panelStyle,
          left: x + panel.x * scale.x,
          top: y + panel.y * scale.y,
          width: panel.width * scale.x,
          height: panel.height * scale.y,
          transform: `translateZ(${panel.z * scale.z}px)`,
        };
        break;
      case 'shelf':
        panelStyle = {
          ...panelStyle,
          left: x + panel.x * scale.x,
          top: y + panel.y * scale.y,
          width: panel.width * scale.x,
          height: panel.depth * scale.z,
          transform: `translateZ(${panel.z * scale.z}px) rotateX(90deg)`,
          transformOrigin: 'center bottom',
          backgroundColor: panel.color || '#A67C52', // 선반은 다른 색상
        };
        break;
      case 'door':
        panelStyle = {
          ...panelStyle,
          left: x + panel.x * scale.x,
          top: y + panel.y * scale.y,
          width: panel.width * scale.x,
          height: panel.height * scale.y,
          transform: `translateZ(${panel.z * scale.z}px)`,
          backgroundColor: panel.color || '#D2B48C', // 도어는 다른 색상
          border: '1px solid #A67C52',
          zIndex: 10, // 도어는 앞에 보이도록
        };
        break;
      default:
        break;
    }
    
    return (
      <div 
        key={`${panel.id}-${index}`}
        style={panelStyle}
        className="panel"
        data-panel-id={panel.id}
        data-panel-type={panel.type}
      >
        {/* 필요 시 패널 내부 세부사항 추가 */}
      </div>
    );
  };
  
  // 2D 뷰용 단순화된 렌더링
  // 실제로는 Three.js 또는 CSS 3D 변환으로 구현할 수 있음
  const renderSimplified2D = () => {
    return (
      <div
        className="module-container relative"
        style={{
          width: module.width * scale.x,
          height: module.height * scale.y,
          position: 'absolute',
          left: x,
          top: y,
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) rotateZ(${rotation.z}deg)`,
          border: '1px solid #ccc',
          backgroundColor: 'rgba(240, 240, 240, 0.8)',
          overflow: 'hidden',
        }}
      >
        {/* 단순화된 상자 형태로 표시 */}
        <div className="module-content relative w-full h-full">
          {/* 패널 두께 표시 (상단, 좌측, 우측) */}
          <div
            className="top-panel bg-amber-800"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '18px',
            }}
          />
          <div
            className="bottom-panel bg-amber-800"
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              height: '18px',
            }}
          />
          <div
            className="left-panel bg-amber-800"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '18px',
              height: '100%',
            }}
          />
          <div
            className="right-panel bg-amber-800"
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '18px',
              height: '100%',
            }}
          />
          
          {/* 모듈 정보 표시 */}
          <div 
            className="module-info absolute inset-0 flex flex-col items-center justify-center text-xs text-center p-4"
            style={{ pointerEvents: 'none' }}
          >
            <div className="font-semibold">{module.name}</div>
            <div>{module.width}x{module.height}x{module.depth}mm</div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="module-wrapper">
      {renderSimplified2D()}
    </div>
  );
};

export default ModuleRenderer;
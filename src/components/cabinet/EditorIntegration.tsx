import React, { useEffect, useState } from 'react';
import { useEditor } from '@context/EditorContext';
import { MODULE_TEMPLATES, ModuleTemplate } from '../../data/moduleTemplates';
import ModuleSelector from './ModuleSelector';
import CabinetGrid from './CabinetGrid';

interface EditorIntegrationProps {
  isVisible?: boolean;
}

const EditorIntegration: React.FC<EditorIntegrationProps> = ({ 
  isVisible = true 
}) => {
  const { 
    dimensions,
    modulesGap,
    spaceType,
    wallPosition
  } = useEditor();
  
  const [cabinetGridConfig, setCabinetGridConfig] = useState({
    rows: 3,
    cols: 3,
    cellWidth: 600,
    cellHeight: 700,
    padding: 20
  });
  
  // 에디터 공간 크기 변경에 따라 캐비닛 그리드 설정 조정
  useEffect(() => {
    if (dimensions) {
      // 에디터의 공간 크기에 맞게 그리드 설정 조정
      // dimensions.width, dimensions.height 활용
      
      // 내부 공간 크기 계산 (프레임 두께 고려)
      let innerWidth = dimensions.width;
      let innerHeight = dimensions.height;
      
      if (spaceType === 'built-in') {
        // 빌트인: 좌우 프레임 고려
        innerWidth -= (modulesGap.left.width + modulesGap.right.width);
        innerHeight -= (modulesGap.top.width + modulesGap.bottom.height);
      } else if (spaceType === 'semi-standing') {
        // 세미 스탠딩: 한쪽만 프레임
        innerWidth -= modulesGap.left.width;
        innerHeight -= (modulesGap.top.width + modulesGap.bottom.height);
      }
      
      // 그리드 열 수 계산 - 기본 셀 너비로 나눔
      const baseColWidth = 600; // 기본 셀 너비
      const cols = Math.max(1, Math.floor(innerWidth / baseColWidth));
      
      // 그리드 행 수 계산 - 기본 셀 높이로 나눔
      const baseRowHeight = 700; // 기본 셀 높이
      const rows = Math.max(1, Math.floor(innerHeight / baseRowHeight));
      
      // 남은 공간을 균등 분배하여 셀 크기 조정
      const cellWidth = innerWidth / cols;
      const cellHeight = innerHeight / rows;
      
      setCabinetGridConfig({
        rows,
        cols,
        cellWidth,
        cellHeight,
        padding: 20
      });
      
      console.log(`EditorIntegration: 그리드 설정 업데이트 - ${rows}x${cols} (${cellWidth}x${cellHeight}mm)`);
    }
  }, [dimensions, modulesGap, spaceType]);
  
  if (!isVisible) return null;
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-hidden flex">
        {/* 좌측: 모듈 선택기 */}
        <ModuleSelector />
        
        {/* 우측: 캐비닛 그리드 */}
        <div className="flex-1 overflow-auto p-4">
          <CabinetGrid
            rows={cabinetGridConfig.rows}
            cols={cabinetGridConfig.cols}
            cellWidth={cabinetGridConfig.cellWidth}
            cellHeight={cabinetGridConfig.cellHeight}
            padding={cabinetGridConfig.padding}
            className="mx-auto"
          />
        </div>
      </div>
    </div>
  );
};

export default EditorIntegration;
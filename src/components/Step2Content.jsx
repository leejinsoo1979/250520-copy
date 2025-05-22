import React, { useRef } from 'react';
import StepViewTwoDViewer from '../components/StepViewTwoDViewer';

const Step2Content = () => {
  const twoDViewerRef = useRef(null);
  const viewerData = {
    width: 1000,
    height: 1000,
    depth: 1000,
    color: '#000000',
    viewType: '3D',
    type: 'installationType',
    acUnitOption: 'none',
    floorFinishOption: 'none',
    acUnitPosition: { x: 0, y: 0, z: 0 },
  };

  const handleTwoDViewTypeChange = (newViewType) => {
    // Handle view type change
  };

  return (
    <StepViewTwoDViewer
      ref={twoDViewerRef}
      options={{
        width: viewerData.width,
        height: viewerData.height,
        depth: viewerData.depth,
        color: viewerData.color,
      }}
      viewType={viewerData.viewType}
      onViewTypeChange={handleTwoDViewTypeChange}
      hideViewButtons={true}
      installationType={viewerData.type}
      hasAirConditioner={viewerData.acUnitOption !== 'none'}
      hasFloorFinish={viewerData.floorFinishOption !== 'none'}
      acUnitPosition={viewerData.acUnitPosition}
      floorFinishType={viewerData.floorFinishOption}
    />
  );
};

export default Step2Content; 
import React from 'react';
import Input from '../common/Input';
import Button from '../common/Button';

const PropertiesPanel = ({ component, onUpdate, onDelete }) => {
  if (!component) {
    return (
      <div className="properties-panel">
        <p>컴포넌트를 선택해주세요</p>
      </div>
    );
  }

  const handleChange = (field, value) => {
    onUpdate({
      ...component,
      [field]: value
    });
  };

  const handlePositionChange = (axis, value) => {
    onUpdate({
      ...component,
      position: {
        ...component.position,
        [axis]: parseFloat(value) || 0
      }
    });
  };

  const handleDimensionChange = (dimension, value) => {
    onUpdate({
      ...component,
      dimensions: {
        ...component.dimensions,
        [dimension]: parseFloat(value) || 0
      }
    });
  };

  return (
    <div className="properties-panel">
      <h3>속성</h3>
      
      <div className="property-group">
        <h4>기본 정보</h4>
        <Input
          label="이름"
          value={component.name || ''}
          onChange={(e) => handleChange('name', e.target.value)}
        />
      </div>

      <div className="property-group">
        <h4>위치</h4>
        <Input
          label="X"
          type="number"
          value={component.position?.x || 0}
          onChange={(e) => handlePositionChange('x', e.target.value)}
        />
        <Input
          label="Y"
          type="number"
          value={component.position?.y || 0}
          onChange={(e) => handlePositionChange('y', e.target.value)}
        />
        <Input
          label="Z"
          type="number"
          value={component.position?.z || 0}
          onChange={(e) => handlePositionChange('z', e.target.value)}
        />
      </div>

      <div className="property-group">
        <h4>크기</h4>
        <Input
          label="너비"
          type="number"
          value={component.dimensions?.width || 0}
          onChange={(e) => handleDimensionChange('width', e.target.value)}
        />
        <Input
          label="높이"
          type="number"
          value={component.dimensions?.height || 0}
          onChange={(e) => handleDimensionChange('height', e.target.value)}
        />
        <Input
          label="깊이"
          type="number"
          value={component.dimensions?.depth || 0}
          onChange={(e) => handleDimensionChange('depth', e.target.value)}
        />
      </div>

      <div className="property-group">
        <h4>작업</h4>
        <Button onClick={() => onDelete(component.id)} variant="danger">
          삭제
        </Button>
      </div>
    </div>
  );
};

export default PropertiesPanel; 
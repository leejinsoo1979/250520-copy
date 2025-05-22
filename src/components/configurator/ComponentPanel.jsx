import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const components = [
  { id: 'shelf', name: '선반', icon: '🗄️' },
  { id: 'drawer', name: '서랍', icon: '📦' },
  { id: 'rod', name: '옷걸이 봉', icon: '🎯' },
  { id: 'door', name: '도어', icon: '🚪' },
];

const ComponentPanel = ({ onAddComponent }) => {
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const componentId = result.draggableId;
    const component = components.find(c => c.id === componentId);
    
    if (component) {
      onAddComponent({
        type: component.id,
        position: {
          x: result.destination.x || 0,
          y: result.destination.y || 0,
          z: 0
        }
      });
    }
  };

  return (
    <div className="component-panel">
      <h3>컴포넌트</h3>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="components">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="component-list"
            >
              {components.map((component, index) => (
                <Draggable
                  key={component.id}
                  draggableId={component.id}
                  index={index}
                >
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="component-item"
                    >
                      <span className="component-icon">{component.icon}</span>
                      <span className="component-name">{component.name}</span>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default ComponentPanel; 
import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

export const useConfigurator = () => {
  const [components, setComponents] = useState([]);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const addComponent = useCallback((componentData) => {
    const newComponent = {
      id: uuidv4(),
      ...componentData,
      position: componentData.position || { x: 0, y: 0, z: 0 },
      dimensions: componentData.dimensions || { width: 1, height: 1, depth: 1 }
    };

    setComponents(prev => {
      const newComponents = [...prev, newComponent];
      addToHistory(newComponents);
      return newComponents;
    });
  }, []);

  const updateComponent = useCallback((updatedComponent) => {
    setComponents(prev => {
      const newComponents = prev.map(comp =>
        comp.id === updatedComponent.id ? updatedComponent : comp
      );
      addToHistory(newComponents);
      return newComponents;
    });
  }, []);

  const deleteComponent = useCallback((componentId) => {
    setComponents(prev => {
      const newComponents = prev.filter(comp => comp.id !== componentId);
      addToHistory(newComponents);
      return newComponents;
    });
    if (selectedComponent?.id === componentId) {
      setSelectedComponent(null);
    }
  }, [selectedComponent]);

  const selectComponent = useCallback((componentId) => {
    const component = components.find(comp => comp.id === componentId);
    setSelectedComponent(component || null);
  }, [components]);

  const addToHistory = useCallback((newComponents) => {
    setHistory(prev => {
      const newHistory = [...prev.slice(0, historyIndex + 1), newComponents];
      if (newHistory.length > 50) {
        newHistory.shift();
      }
      return newHistory;
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setComponents(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setComponents(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  return {
    components,
    selectedComponent,
    addComponent,
    updateComponent,
    deleteComponent,
    selectComponent,
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1
  };
};

export default useConfigurator; 
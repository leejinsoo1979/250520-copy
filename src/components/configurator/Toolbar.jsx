import React from 'react';
import { useStorage } from '../../hooks/useStorage';
import Button from '../common/Button';

const Toolbar = () => {
  const { saveProject, loadProject } = useStorage();

  const handleSave = async () => {
    try {
      await saveProject();
    } catch (error) {
      console.error('Failed to save project:', error);
    }
  };

  const handleLoad = async () => {
    try {
      await loadProject();
    } catch (error) {
      console.error('Failed to load project:', error);
    }
  };

  const handleUndo = () => {
    // TODO: Implement undo functionality
  };

  const handleRedo = () => {
    // TODO: Implement redo functionality
  };

  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <Button onClick={handleSave}>저장</Button>
        <Button onClick={handleLoad}>불러오기</Button>
      </div>
      <div className="toolbar-group">
        <Button onClick={handleUndo}>실행 취소</Button>
        <Button onClick={handleRedo}>다시 실행</Button>
      </div>
      <div className="toolbar-group">
        <Button>내보내기</Button>
        <Button>공유하기</Button>
      </div>
    </div>
  );
};

export default Toolbar; 
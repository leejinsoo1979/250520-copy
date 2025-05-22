import { useContext } from 'react';
import RoomContext from '../contexts/RoomContext';

/**
 * Room 컨텍스트를 사용하기 위한 훅
 * @returns {Object} Room 컨텍스트 값
 */
export const useRoomContext = () => {
  const context = useContext(RoomContext);
  
  if (!context) {
    throw new Error('useRoomContext must be used within a RoomProvider');
  }
  
  return context;
};

export default useRoomContext; 
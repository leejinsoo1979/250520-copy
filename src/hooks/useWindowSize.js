import { useState, useEffect } from 'react';

// 윈도우 크기를 추적하는 커스텀 훅
const useWindowSize = () => {
  // 초기 상태를 설정합니다.
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    // 윈도우 객체가 존재하는지 확인합니다 (SSR 대응)
    if (typeof window === 'undefined') {
      return;
    }

    // 크기 변경 이벤트를 처리하는 핸들러 함수
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // 이벤트 리스너 등록
    window.addEventListener('resize', handleResize);
    
    // 초기 크기 설정을 위해 한 번 실행
    handleResize();

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []); // 빈 의존성 배열은 마운트와 언마운트 시에만 실행됨을 의미

  return windowSize;
};

export default useWindowSize; 
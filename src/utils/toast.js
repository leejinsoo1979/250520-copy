/**
 * 토스트 메시지를 표시합니다.
 * @param {string} message - 표시할 메시지
 * @param {string} type - 메시지 타입 ('success', 'error', 'warning', 'info' 중 하나)
 * @param {number} duration - 메시지를 표시할 시간(ms)
 */
export const showToast = (message, type = 'success', duration = 3000) => {
  // 기존 토스트가 있으면 제거
  const existingToast = document.querySelector('.toast-message');
  if (existingToast) {
    existingToast.remove();
  }

  // 토스트 컨테이너 생성
  const toast = document.createElement('div');
  toast.className = `toast-message toast-${type}`;
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.backgroundColor = type === 'error' ? '#f44336' : '#4caf50';
  toast.style.color = 'white';
  toast.style.padding = '16px';
  toast.style.borderRadius = '4px';
  toast.style.zIndex = '1000';
  toast.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
  toast.textContent = message;

  // 토스트를 DOM에 추가
  document.body.appendChild(toast);

  // 지정된 시간 후 토스트 제거
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.5s ease';
    
    setTimeout(() => {
      if (toast.parentNode) {
        document.body.removeChild(toast);
      }
    }, 500);
  }, duration);
}; 
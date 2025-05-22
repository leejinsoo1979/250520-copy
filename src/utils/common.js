/**
 * 무작위 색상 코드를 생성합니다.
 * @returns {string} 16진수 색상 코드 (예: #FF0000)
 */
export const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

/**
 * 고유한 ID를 생성합니다.
 * @returns {string} 타임스탬프와 난수를 조합한 고유 ID
 */
export const generateId = () => {
  return `id_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}; 
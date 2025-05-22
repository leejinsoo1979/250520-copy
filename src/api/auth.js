import { API_BASE_URL, API_ENDPOINTS, TOKEN_STORAGE_KEYS } from './config';

// Mock user data for testing
const MOCK_USERS = [
  {
    email: 'test@example.com',
    password: 'password123',
    name: '테스트 사용자',
    role: 'user',
  },
  {
    email: 'admin@example.com',
    password: 'admin123',
    name: '관리자',
    role: 'admin',
  },
];

const generateToken = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || '서버 오류가 발생했습니다.');
  }
  return data;
};

/**
 * 이메일/패스워드 로그인 API
 * @param {string} email 사용자 이메일
 * @param {string} password 사용자 비밀번호
 * @returns {Promise<Object>} 사용자 정보
 */
export const loginApi = async (email, password) => {
  // 서버 API 호출 대신 지연시간을 주어 실제 네트워크 요청을 시뮬레이션
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 고정된 아이디/비밀번호 체크
      if (email === 'admin' && password === '1111') {
        resolve({
          success: true,
          data: {
            email,
            name: '관리자',
            token: 'mock-jwt-token-xyz123',
          }
        });
      } else {
        reject({
          success: false,
          message: '아이디 또는 비밀번호가 일치하지 않습니다.'
        });
      }
    }, 500);
  });
};

/**
 * 회원가입 API
 * @param {Object} userData 사용자 정보
 * @returns {Promise<Object>} 회원가입 결과
 */
export const signupApi = async (userData) => {
  // 서버 API 호출 대신 지연시간을 주어 실제 네트워크 요청을 시뮬레이션
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        data: {
          email: userData.email,
          name: userData.name,
        }
      });
    }, 500);
  });
};

// 로그아웃 API
export const logoutApi = () => {
  return new Promise((resolve) => {
    // API 호출을 시뮬레이션하기 위한 타임아웃
    setTimeout(() => {
      resolve({ success: true });
    }, 500); // 0.5초 지연
  });
};

// 사용자 정보 조회 API
export const getUserApi = () => {
  return new Promise((resolve, reject) => {
    // API 호출을 시뮬레이션하기 위한 타임아웃
    setTimeout(() => {
      const token = localStorage.getItem('authToken');
      
      if (token) {
        // 모의 사용자 데이터
        resolve({
          id: '123456',
          email: 'user@example.com',
          name: '테스트 사용자',
          phone: '010-1234-5678',
          company: '테스트 회사',
        });
      } else {
        reject(new Error('인증되지 않은 사용자입니다.'));
      }
    }, 800); // 0.8초 지연
  });
};

// 비밀번호 재설정 요청 API
export const resetPasswordRequestApi = (email) => {
  return new Promise((resolve, reject) => {
    // API 호출을 시뮬레이션하기 위한 타임아웃
    setTimeout(() => {
      if (!email) {
        reject(new Error('이메일 주소를 입력해주세요.'));
        return;
      }
      
      // 성공 응답
      resolve({
        success: true,
        message: '비밀번호 재설정 링크가 이메일로 전송되었습니다.',
      });
    }, 1000); // 1초 지연
  });
};

/**
 * 이메일 중복 확인 API
 * @param {string} email 사용자 이메일
 * @returns {Promise<boolean>} 중복 여부
 */
export const checkEmailDuplicationApi = async (email) => {
  // 서버 API 호출 대신 지연시간을 주어 실제 네트워크 요청을 시뮬레이션
  return new Promise((resolve) => {
    setTimeout(() => {
      // admin 이메일은 이미 존재하는 것으로 처리
      resolve(email === 'admin');
    }, 300);
  });
};

export const refreshTokenApi = async () => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const accessToken = generateToken();
  const refreshToken = generateToken();
  
  return {
    accessToken,
    refreshToken,
    user: MOCK_USERS[0], // For testing, always return the first user
  };
}; 
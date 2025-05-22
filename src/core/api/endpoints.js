// Auth endpoints
export const AUTH = {
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh-token',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
};

// User endpoints
export const USER = {
  PROFILE: '/user/profile',
  UPDATE_PROFILE: '/user/profile',
  CHANGE_PASSWORD: '/user/change-password',
};

// Project endpoints
export const PROJECT = {
  LIST: '/projects',
  DETAIL: (id) => `/projects/${id}`,
  CREATE: '/projects',
  UPDATE: (id) => `/projects/${id}`,
  DELETE: (id) => `/projects/${id}`,
  EXPORT: (id) => `/projects/${id}/export`,
};

// Design endpoints
export const DESIGN = {
  LIST: (projectId) => `/projects/${projectId}/designs`,
  DETAIL: (projectId, designId) => `/projects/${projectId}/designs/${designId}`,
  CREATE: (projectId) => `/projects/${projectId}/designs`,
  UPDATE: (projectId, designId) => `/projects/${projectId}/designs/${designId}`,
  DELETE: (projectId, designId) => `/projects/${projectId}/designs/${designId}`,
};

// Component endpoints
export const COMPONENT = {
  LIST: '/components',
  DETAIL: (id) => `/components/${id}`,
  CATEGORIES: '/components/categories',
};

// Storage endpoints
export const STORAGE = {
  UPLOAD: '/storage/upload',
  DOWNLOAD: (fileId) => `/storage/download/${fileId}`,
  DELETE: (fileId) => `/storage/delete/${fileId}`,
}; 
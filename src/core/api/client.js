import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const auth = {
  login: async (email, password) => {
    try {
      const response = await client.post('/auth/login', { email, password });
      const { token } = response.data;
      localStorage.setItem('token', token);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('savedEmail');
  },

  saveEmail: (email) => {
    localStorage.setItem('savedEmail', email);
  },

  getSavedEmail: () => {
    return localStorage.getItem('savedEmail');
  }
};

export const get = (url, config = {}) => client.get(url, config);
export const post = (url, data, config = {}) => client.post(url, data, config);
export const put = (url, data, config = {}) => client.put(url, data, config);
export const del = (url, config = {}) => client.delete(url, config);

export default client; 
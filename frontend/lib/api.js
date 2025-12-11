// API клиент для взаимодействия с backend
import axios from 'axios';
import Cookies from 'js-cookie';

// Используем относительные пути, так как API проксируется через Next.js rewrites
// Если NEXT_PUBLIC_API_URL не установлен, используем относительные пути
const baseURL = process.env.NEXT_PUBLIC_API_URL || '';

const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавление токена к запросам
api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Обработка ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Токен истек или недействителен
      Cookies.remove('token');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API методы для аутентификации
export const authAPI = {
  checkCode: (data) => api.post('/api/auth/register/check-code', data),
  getGroups: () => api.get('/api/auth/register/groups'),
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  getCurrentUser: () => api.get('/api/auth/me'),
  getUsers: (params) => api.get('/api/auth/users', { params }),
};

// API методы для чатов
export const chatAPI = {
  createChat: (data) => api.post('/api/chats', data),
  getUserChats: () => api.get('/api/chats'),
  getChatById: (chatId) => api.get(`/api/chats/${chatId}`),
  addParticipant: (chatId, data) => api.post(`/api/chats/${chatId}/participants`, data),
};

// API методы для сообщений
export const messageAPI = {
  sendMessage: (chatId, data) => api.post(`/api/messages/${chatId}`, data),
  getChatMessages: (chatId, params) => api.get(`/api/messages/${chatId}`, { params }),
  editMessage: (messageId, data) => api.put(`/api/messages/${messageId}`, data),
  deleteMessage: (messageId) => api.delete(`/api/messages/${messageId}`),
  searchMessages: (chatId, query) => api.get(`/api/messages/${chatId}/search`, { params: { q: query } }),
};

// API методы для файлов
export const fileAPI = {
  uploadFile: (formData) => api.post('/api/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getFileInfo: (fileId) => api.get(`/api/files/${fileId}`),
  downloadFile: (fileId) => api.get(`/api/files/${fileId}/download`, { responseType: 'blob' }),
};

export default api;


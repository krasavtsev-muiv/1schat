// Утилиты для работы с аутентификацией
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

export const getToken = () => {
  return Cookies.get('token');
};

export const setToken = (token) => {
  Cookies.set('token', token, { expires: 7 });
};

export const removeToken = () => {
  Cookies.remove('token');
};

export const isAuthenticated = () => {
  return !!getToken();
};

export const logout = () => {
  removeToken();
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};


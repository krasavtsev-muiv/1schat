// WebSocket клиент для реального времени
import { io } from 'socket.io-client';
import Cookies from 'js-cookie';

let socket = null;

export const initSocket = () => {
  if (socket && socket.connected) {
    return socket;
  }

  const token = Cookies.get('token');
  if (!token) {
    console.error('Токен отсутствует, невозможно подключиться к WebSocket');
    return null;
  }

  socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001', {
    auth: {
      token: token,
    },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('Подключено к WebSocket серверу');
    // Присоединение к чатам пользователя
    socket.emit('join_chats');
  });

  socket.on('disconnect', () => {
    console.log('Отключено от WebSocket сервера');
  });

  socket.on('error', (error) => {
    console.error('Ошибка WebSocket:', error);
  });

  return socket;
};

export const getSocket = () => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default socket;


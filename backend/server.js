// Главный файл сервера Express
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Настройка Socket.IO для WebSocket
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Устанавливаем io в утилиту для доступа из других модулей
const socketUtils = require('./src/utils/socket.io');
socketUtils.setIO(io);

// Функция для получения экземпляра Socket.IO из других модулей
// Определяем сразу после создания io, чтобы была доступна при импорте
const getSocket = () => {
  return io;
};

// Middleware
const requestLogger = require('./src/middleware/logger.middleware');
app.use(requestLogger);

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Подключение к базе данных
const { query } = require('./config/database');

// Проверка подключения к БД
query('SELECT NOW()')
  .then(() => {
    console.log('✅ Подключение к базе данных установлено');
  })
  .catch((err) => {
    console.error('❌ Ошибка подключения к базе данных:', err);
  });

// WebSocket подключения
const { handleConnection } = require('./src/services/websocket/chat.socket');
handleConnection(io);

// Базовые маршруты
app.get('/', (req, res) => {
  res.json({ 
    message: 'Chat Service API',
    version: '1.0.0',
    status: 'running'
  });
});

app.get('/health', async (req, res) => {
  try {
    await query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

// Middleware для обработки ошибок (должен быть последним)
const errorHandler = require('./src/middleware/error.middleware');
app.use(errorHandler);

// Подключение маршрутов
const authRoutes = require('./src/routes/auth.routes');
const chatRoutes = require('./src/routes/chat.routes');
const messageRoutes = require('./src/routes/message.routes');

app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/files', require('./src/routes/file.routes'));
app.use('/api/export', require('./src/routes/export.routes'));
app.use('/api/notifications', require('./src/routes/notification.routes'));
app.use('/api/feedback', require('./src/routes/feedback.routes'));
app.use('/api/admin', require('./src/routes/admin.routes'));
app.use('/api/1c', require('./src/routes/1c-integration.routes'));

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
});

module.exports = { app, server, io, getSocket };


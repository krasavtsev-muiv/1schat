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

// Middleware
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
io.on('connection', (socket) => {
  console.log('Новое WebSocket подключение:', socket.id);

  socket.on('disconnect', () => {
    console.log('WebSocket отключен:', socket.id);
  });
});

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

// Подключение маршрутов (будут добавлены позже)
// const authRoutes = require('./src/routes/auth.routes');
// app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
});

module.exports = { app, server, io };


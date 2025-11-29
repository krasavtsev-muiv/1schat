// Маршруты для работы с чатами
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { authenticateToken, requireChatParticipant } = require('../middleware/auth.middleware');

// Все маршруты требуют аутентификации
router.use(authenticateToken);

// Создание нового чата
router.post('/', chatController.createChat);

// Получение списка чатов пользователя
router.get('/', chatController.getUserChats);

// Получение информации о чате
router.get('/:chatId', requireChatParticipant, chatController.getChatById);

// Добавление участника в чат
router.post('/:chatId/participants', requireChatParticipant, chatController.addParticipant);

module.exports = router;


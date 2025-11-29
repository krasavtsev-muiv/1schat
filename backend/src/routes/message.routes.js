// Маршруты для работы с сообщениями
const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.controller');
const { authenticateToken, requireChatParticipant } = require('../middleware/auth.middleware');

// Все маршруты требуют аутентификации
router.use(authenticateToken);

// Отправка сообщения
router.post('/:chatId', requireChatParticipant, messageController.sendMessage);

// Получение сообщений чата
router.get('/:chatId', requireChatParticipant, messageController.getChatMessages);

// Поиск сообщений в чате
router.get('/:chatId/search', requireChatParticipant, messageController.searchMessages);

// Редактирование сообщения
router.put('/:messageId', messageController.editMessage);

// Удаление сообщения
router.delete('/:messageId', messageController.deleteMessage);

module.exports = router;


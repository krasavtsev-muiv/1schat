// Маршруты для уведомлений
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.use(authenticateToken);

// Получение уведомлений пользователя
router.get('/', notificationController.getUserNotifications);

// Получение непрочитанных уведомлений
router.get('/unread', notificationController.getUnreadNotifications);

// Отметить уведомление как прочитанное
router.put('/:notificationId/read', notificationController.markAsRead);

// Отметить все уведомления как прочитанные
router.put('/read-all', notificationController.markAllAsRead);

module.exports = router;


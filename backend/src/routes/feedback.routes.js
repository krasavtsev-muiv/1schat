// Маршруты для обратной связи
const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedback.controller');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

// Создание обращения (доступно всем, включая неавторизованных)
router.post('/', feedbackController.createFeedback);

// Получение списка обращений (только для администраторов)
router.get('/', authenticateToken, requireRole('admin'), feedbackController.getFeedbackList);

// Ответ на обращение (только для администраторов)
router.put('/:feedbackId/respond', authenticateToken, requireRole('admin'), feedbackController.respondToFeedback);

module.exports = router;


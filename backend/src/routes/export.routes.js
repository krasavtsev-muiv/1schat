// Маршруты для экспорта
const express = require('express');
const router = express.Router();
const exportController = require('../controllers/export.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.use(authenticateToken);

// Экспорт истории чатов
router.post('/history', exportController.exportChatHistory);

// Получение истории экспортов
router.get('/history', exportController.getExportHistory);

module.exports = router;


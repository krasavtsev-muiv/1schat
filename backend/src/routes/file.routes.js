// Маршруты для работы с файлами
const express = require('express');
const router = express.Router();
const fileController = require('../controllers/file.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { uploadSingle } = require('../middleware/upload.middleware');

// Все маршруты требуют аутентификации
router.use(authenticateToken);

// Загрузка файла
router.post('/upload', uploadSingle, fileController.uploadFile);

// Получение информации о файле
router.get('/:fileId', fileController.getFileInfo);

// Скачивание файла
router.get('/:fileId/download', fileController.downloadFile);

module.exports = router;


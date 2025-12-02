// Маршруты для интеграции с 1С
const express = require('express');
const router = express.Router();
const integrationController = require('../controllers/1c-integration.controller');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

// Все маршруты требуют аутентификации и роль администратора
router.use(authenticateToken);
router.use(requireRole('admin'));

// Синхронизация пользователей из 1С
router.post('/sync-users', integrationController.syncUsers);

// Проверка подключения к 1С
router.get('/check-connection', integrationController.checkConnection);

module.exports = router;


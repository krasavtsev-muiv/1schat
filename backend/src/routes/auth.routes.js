// Маршруты для аутентификации
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Регистрация
router.post('/register', authController.register);

// Вход
router.post('/login', authController.login);

// Получение текущего пользователя (требует аутентификации)
router.get('/me', authenticateToken, authController.getCurrentUser);

module.exports = router;


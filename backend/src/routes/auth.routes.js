// Маршруты для аутентификации
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Регистрация
const { validateRegister, validateLoginData } = require('../middleware/validation.middleware');
router.post('/register', validateRegister, authController.register);

// Вход
router.post('/login', validateLoginData, authController.login);

// Получение текущего пользователя (требует аутентификации)
router.get('/me', authenticateToken, authController.getCurrentUser);

// Выход из системы (требует аутентификации)
router.post('/logout', authenticateToken, authController.logout);

// Получение списка пользователей (требует аутентификации)
router.get('/users', authenticateToken, authController.getUsers);

module.exports = router;


// Маршруты для аутентификации
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Проверка кода пользователя в 1С (для регистрации)
router.post('/register/check-code', authController.checkCode);

// Получение списка групп из 1С (для формы регистрации)
router.get('/register/groups', authController.getGroups);

// Регистрация (обновлённая версия с интеграцией 1С)
router.post('/register', authController.register);

// Вход
const { validateLoginData } = require('../middleware/validation.middleware');
router.post('/login', validateLoginData, authController.login);

// Получение текущего пользователя (требует аутентификации)
router.get('/me', authenticateToken, authController.getCurrentUser);

// Выход из системы (требует аутентификации)
router.post('/logout', authenticateToken, authController.logout);

// Получение списка пользователей (требует аутентификации)
router.get('/users', authenticateToken, authController.getUsers);

module.exports = router;

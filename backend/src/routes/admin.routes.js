// Маршруты административной панели
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

// Все маршруты требуют аутентификации и роль администратора
router.use(authenticateToken);
router.use(requireRole('admin'));

// Получение статистики системы
router.get('/stats', adminController.getSystemStats);

// Управление пользователями
router.get('/users', adminController.getAllUsers);
router.put('/users/:userId/toggle-status', adminController.toggleUserStatus);

module.exports = router;


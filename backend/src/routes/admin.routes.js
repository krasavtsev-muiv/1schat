// Маршруты административной панели
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const admin1CController = require('../controllers/admin-1c.controller');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

// Все маршруты требуют аутентификации и роль администратора
router.use(authenticateToken);
router.use(requireRole('admin'));

// Получение статистики системы
router.get('/stats', adminController.getSystemStats);

// Управление пользователями
router.get('/users', adminController.getAllUsers);
router.put('/users/:userId/toggle-status', adminController.toggleUserStatus);

// Создание сущностей в 1С
router.post('/1c/departments', admin1CController.createDepartment);
router.post('/1c/groups', admin1CController.createGroup);
router.post('/1c/disciplines', admin1CController.createDiscipline);
router.post('/1c/teachers', admin1CController.createTeacher);
router.post('/1c/students', admin1CController.createStudent);

module.exports = router;


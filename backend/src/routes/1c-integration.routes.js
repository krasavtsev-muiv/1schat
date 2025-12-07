// Маршруты для интеграции с 1С
const express = require('express');
const router = express.Router();
const integrationController = require('../controllers/1c-integration.controller');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

// Все маршруты требуют аутентификации и роль администратора
router.use(authenticateToken);
router.use(requireRole('admin'));

// Проверка подключения к 1С
router.get('/check-connection', integrationController.checkConnection);

// Получение данных из 1С
router.get('/departments', integrationController.getDepartments);
router.get('/groups', integrationController.getGroups);
router.get('/disciplines', integrationController.getDisciplines);
router.get('/teachers', integrationController.getTeachers);
router.get('/students', integrationController.getStudents);

module.exports = router;

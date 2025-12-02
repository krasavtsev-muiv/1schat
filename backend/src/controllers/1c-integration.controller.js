// Контроллер для интеграции с 1С
const oneCService = require('../services/1c-integration.service');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

// Синхронизация пользователей из 1С
const syncUsers = async (req, res) => {
  try {
    const result = await oneCService.syncUsers();
    res.json({
      message: 'Синхронизация завершена',
      ...result
    });
  } catch (error) {
    console.error('Ошибка синхронизации с 1С:', error);
    res.status(500).json({ error: 'Ошибка при синхронизации с 1С' });
  }
};

// Проверка подключения к 1С
const checkConnection = async (req, res) => {
  try {
    const result = await oneCService.checkConnection();
    res.json(result);
  } catch (error) {
    console.error('Ошибка проверки подключения к 1С:', error);
    res.status(500).json({ error: 'Ошибка при проверке подключения' });
  }
};

module.exports = {
  syncUsers,
  checkConnection,
};


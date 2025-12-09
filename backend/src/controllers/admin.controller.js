// Контроллер для административной панели
const User = require('../models/user.model');
const Chat = require('../models/chat.model');
const { query } = require('../../config/database');

// Получение статистики системы
const getSystemStats = async (req, res) => {
  try {
    const usersCount = await query('SELECT COUNT(*) as count FROM users WHERE is_active = TRUE');
    const chatsCount = await query('SELECT COUNT(*) as count FROM chats WHERE is_active = TRUE');
    const messagesCount = await query('SELECT COUNT(*) as count FROM messages WHERE is_deleted = FALSE');
    const activeUsersCount = await query(
      'SELECT COUNT(*) as count FROM users WHERE last_online > NOW() - INTERVAL \'24 hours\''
    );

    res.json({
      stats: {
        totalUsers: parseInt(usersCount.rows[0].count),
        totalChats: parseInt(chatsCount.rows[0].count),
        totalMessages: parseInt(messagesCount.rows[0].count),
        activeUsers24h: parseInt(activeUsersCount.rows[0].count),
      }
    });
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({ error: 'Ошибка при получении статистики' });
  }
};

// Управление пользователями
const getAllUsers = async (req, res) => {
  try {
    const { role_id, is_active, search, includeUnregistered } = req.query;
    const filters = {};
    if (role_id) filters.role_id = parseInt(role_id);
    if (is_active !== undefined) filters.is_active = is_active === 'true';
    if (search) filters.search = search;
    // Для админки можно показать всех пользователей, включая незарегистрированных
    if (includeUnregistered === 'true') {
      filters.onlyRegistered = false;
    }

    const users = await User.findAll(filters);
    res.json({ users });
  } catch (error) {
    console.error('Ошибка получения пользователей:', error);
    res.status(500).json({ error: 'Ошибка при получении списка пользователей' });
  }
};

// Блокировка/разблокировка пользователя
const toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const updatedUser = await User.update(userId, { is_active: !user.is_active });
    res.json({
      message: `Пользователь ${updatedUser.is_active ? 'активирован' : 'заблокирован'}`,
      user: updatedUser
    });
  } catch (error) {
    console.error('Ошибка изменения статуса пользователя:', error);
    res.status(500).json({ error: 'Ошибка при изменении статуса пользователя' });
  }
};

module.exports = {
  getSystemStats,
  getAllUsers,
  toggleUserStatus,
};


// Middleware для аутентификации и авторизации
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

// Проверка JWT токена
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Токен доступа отсутствует' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Получаем пользователя из БД
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Пользователь не найден или неактивен' });
    }

    req.user = user;
    req.userId = user.user_id;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Недействительный токен' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ error: 'Токен истек' });
    }
    return res.status(500).json({ error: 'Ошибка аутентификации' });
  }
};

// Проверка роли пользователя
const requireRole = (...roles) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Требуется аутентификация' });
    }

    // Получаем роль пользователя
    const { query } = require('../../config/database');
    const roleResult = await query(
      'SELECT role_name FROM roles WHERE role_id = $1',
      [req.user.role_id]
    );

    const userRole = roleResult.rows[0]?.role_name;

    if (!roles.includes(userRole)) {
      return res.status(403).json({ error: 'Недостаточно прав доступа' });
    }

    next();
  };
};

// Проверка, что пользователь является участником чата
const requireChatParticipant = async (req, res, next) => {
  try {
    const chatId = req.params.chatId || req.body.chat_id;
    const userId = req.userId;

    const { query } = require('../../config/database');
    const result = await query(
      'SELECT * FROM chat_participants WHERE chat_id = $1 AND user_id = $2 AND left_at IS NULL',
      [chatId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Вы не являетесь участником этого чата' });
    }

    req.chatParticipant = result.rows[0];
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Ошибка проверки участника чата' });
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  requireChatParticipant,
};


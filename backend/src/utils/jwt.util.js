// Утилиты для работы с JWT токенами
const jwt = require('jsonwebtoken');

// Генерация JWT токена
const generateToken = (userId, roleId) => {
  return jwt.sign(
    { userId, roleId },
    process.env.JWT_SECRET || 'default-secret-key',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};

// Верификация JWT токена
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key');
  } catch (error) {
    throw error;
  }
};

// Декодирование токена без верификации (для отладки)
const decodeToken = (token) => {
  return jwt.decode(token);
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
};


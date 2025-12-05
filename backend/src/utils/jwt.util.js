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

// Получить время истечения токена
const getTokenExpiration = () => {
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  const expirationDate = new Date();
  
  // Парсинг формата '7d', '30d', '1h' и т.д.
  const match = expiresIn.match(/^(\d+)([dhms])$/);
  if (match) {
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 'd':
        expirationDate.setDate(expirationDate.getDate() + value);
        break;
      case 'h':
        expirationDate.setHours(expirationDate.getHours() + value);
        break;
      case 'm':
        expirationDate.setMinutes(expirationDate.getMinutes() + value);
        break;
      case 's':
        expirationDate.setSeconds(expirationDate.getSeconds() + value);
        break;
      default:
        expirationDate.setDate(expirationDate.getDate() + 7); // По умолчанию 7 дней
    }
  } else {
    // Если формат не распознан, используем 7 дней по умолчанию
    expirationDate.setDate(expirationDate.getDate() + 7);
  }
  
  return expirationDate;
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
  getTokenExpiration,
};


// Middleware для обработки ошибок
const errorHandler = (err, req, res, next) => {
  console.error('Ошибка:', err);

  // Ошибка валидации
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Ошибка валидации',
      details: err.message,
    });
  }

  // Ошибка базы данных
  if (err.code === '23505') { // Unique violation
    return res.status(409).json({
      error: 'Запись с такими данными уже существует',
    });
  }

  if (err.code === '23503') { // Foreign key violation
    return res.status(400).json({
      error: 'Нарушение целостности данных',
    });
  }

  // Ошибка JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Недействительный токен',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Токен истек',
    });
  }

  // Общая ошибка сервера
  res.status(err.status || 500).json({
    error: err.message || 'Внутренняя ошибка сервера',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;


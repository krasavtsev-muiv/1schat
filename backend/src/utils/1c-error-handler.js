// Утилита для обработки ошибок интеграции с 1С
const logger = require('./logger');

/**
 * Обрабатывает ошибки от 1С API и возвращает соответствующий ответ
 * @param {Error} error - Ошибка от сервиса 1С
 * @param {Object} res - Express response объект
 * @param {string} defaultMessage - Сообщение по умолчанию при других ошибках
 * @returns {boolean} - true если ошибка обработана, false если нужно обработать дальше
 */
function handle1CError(error, res, defaultMessage = 'Ошибка при обращении к системе 1С') {
  // Проверяем, это ли ошибка лимита запросов
  if (error.isLimitError || error.message === 'LIMIT_REACHED') {
    logger.warn('Обнаружена ошибка лимита запросов к 1С');
    res.status(429).json({
      success: false,
      error: 'Достигнут лимит запросов к системе 1С. Пожалуйста, подождите 10 секунд и попробуйте снова.',
      isLimitError: true,
      retryAfter: 10,
    });
    return true;
  }

  // Другие ошибки обрабатываются вызывающим кодом
  return false;
}

module.exports = {
  handle1CError,
};

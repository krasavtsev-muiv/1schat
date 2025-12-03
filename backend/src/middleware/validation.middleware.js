// Middleware для валидации запросов
const { validateRegistration, validateLogin } = require('../utils/validation');

const validateRegister = (req, res, next) => {
  const validation = validateRegistration(req.body);
  if (!validation.isValid) {
    return res.status(400).json({
      error: 'Ошибка валидации',
      details: validation.errors,
    });
  }
  next();
};

const validateLoginData = (req, res, next) => {
  const validation = validateLogin(req.body);
  if (!validation.isValid) {
    return res.status(400).json({
      error: 'Ошибка валидации',
      details: validation.errors,
    });
  }
  next();
};

module.exports = {
  validateRegister,
  validateLoginData,
};


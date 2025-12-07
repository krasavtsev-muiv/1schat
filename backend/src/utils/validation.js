// Утилиты для валидации данных

// Валидация пароля (минимум 6 символов)
const isValidPassword = (password) => {
  return password && password.length >= 6;
};

// Валидация username (только буквы, цифры, подчеркивания)
const isValidUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  return usernameRegex.test(username) && username.length >= 3 && username.length <= 50;
};

// Валидация данных регистрации
const validateRegistration = (data) => {
  const errors = [];

  if (!data.username || !isValidUsername(data.username)) {
    errors.push('Имя пользователя должно содержать 3-50 символов (буквы, цифры, подчеркивания)');
  }

  if (!data.password || !isValidPassword(data.password)) {
    errors.push('Пароль должен содержать минимум 6 символов');
  }

  if (!data.first_name || data.first_name.trim().length < 2) {
    errors.push('Имя должно содержать минимум 2 символа');
  }

  if (!data.last_name || data.last_name.trim().length < 2) {
    errors.push('Фамилия должна содержать минимум 2 символа');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Валидация данных входа
const validateLogin = (data) => {
  const errors = [];

  // Вход по username (код из 1С)
  if (!data.username || data.username.trim().length === 0) {
    errors.push('Логин (код из 1С) обязателен');
  }

  if (!data.password || data.password.trim().length === 0) {
    errors.push('Пароль обязателен');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = {
  isValidPassword,
  isValidUsername,
  validateRegistration,
  validateLogin,
};


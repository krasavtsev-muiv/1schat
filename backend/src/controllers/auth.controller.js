// Контроллер для аутентификации
const User = require('../models/user.model');
const { generateToken } = require('../utils/jwt.util');
const { hashPassword, comparePassword } = require('../utils/password.util');

// Регистрация нового пользователя
const register = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      first_name,
      last_name,
      middle_name,
      phone,
      role_id = 3, // По умолчанию студент
      faculty,
      department,
      position,
      student_group
    } = req.body;

    // Проверка существования пользователя
    const existingUser = await User.findByEmail(email) || await User.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь с таким email или username уже существует' });
    }

    // Хеширование пароля
    const password_hash = await hashPassword(password);

    // Создание пользователя
    const user = await User.create({
      username,
      email,
      password_hash,
      first_name,
      last_name,
      middle_name,
      phone,
      role_id,
      faculty,
      department,
      position,
      student_group
    });

    // Генерация токена
    const token = generateToken(user.user_id, user.role_id);

    // Удаляем пароль из ответа
    delete user.password_hash;

    res.status(201).json({
      message: 'Пользователь успешно зарегистрирован',
      user,
      token
    });
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({ error: 'Ошибка при регистрации пользователя' });
  }
};

// Вход в систему
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email и пароль обязательны' });
    }

    // Поиск пользователя
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    // Проверка пароля
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    // Проверка активности пользователя
    if (!user.is_active) {
      return res.status(403).json({ error: 'Аккаунт деактивирован' });
    }

    // Обновление времени последнего онлайна
    await User.updateLastOnline(user.user_id);

    // Генерация токена
    const token = generateToken(user.user_id, user.role_id);

    // Удаляем пароль из ответа
    delete user.password_hash;

    res.json({
      message: 'Успешный вход в систему',
      user,
      token
    });
  } catch (error) {
    console.error('Ошибка входа:', error);
    res.status(500).json({ error: 'Ошибка при входе в систему' });
  }
};

// Получение текущего пользователя
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    delete user.password_hash;
    res.json({ user });
  } catch (error) {
    console.error('Ошибка получения пользователя:', error);
    res.status(500).json({ error: 'Ошибка при получении данных пользователя' });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
};


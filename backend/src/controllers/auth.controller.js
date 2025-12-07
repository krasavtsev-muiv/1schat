// Контроллер для аутентификации
const User = require('../models/user.model');
const Session = require('../models/session.model');
const { generateToken, getTokenExpiration } = require('../utils/jwt.util');
const { hashPassword, comparePassword } = require('../utils/password.util');
const registrationService = require('../services/registration.service');
const oneCService = require('../services/1c-integration.service');
const userUpdateService = require('../services/user-update.service');
const logger = require('../utils/logger');

// Проверка кода пользователя в 1С (для регистрации)
const checkCode = async (req, res) => {
  try {
    const { code, role, group } = req.body;

    if (!code || !role) {
      return res.status(400).json({ error: 'Код и роль обязательны' });
    }

    if (role === 'student') {
      if (!group) {
        return res.status(400).json({ error: 'Для студента необходимо указать группу' });
      }
      const result = await registrationService.checkStudentCode(code, group);
      if (!result.valid) {
        return res.status(400).json({ error: result.error });
      }
      return res.json({
        valid: true,
        message: 'Код студента подтверждён',
        data: {
          code: result.data.Код,
          name: `${result.data.Фамилия} ${result.data.Имя} ${result.data.Отчество || ''}`.trim(),
          group: result.data.Группа,
          department: result.data.Кафедра,
        },
      });
    } else if (role === 'teacher') {
      const result = await registrationService.checkTeacherCode(code);
      if (!result.valid) {
        return res.status(400).json({ error: result.error });
      }
      return res.json({
        valid: true,
        message: 'Код преподавателя подтверждён',
        data: {
          code: result.data.Код,
          name: `${result.data.Фамилия} ${result.data.Имя} ${result.data.Отчество || ''}`.trim(),
          discipline: result.data.Дисциплина?.Наименование || result.data.Дисциплина,
        },
      });
    } else {
      return res.status(400).json({ error: 'Неверная роль. Используйте "student" или "teacher"' });
    }
  } catch (error) {
    logger.error('Ошибка проверки кода:', error);
    res.status(500).json({ error: 'Ошибка при проверке кода' });
  }
};

// Получение списка групп из 1С (для формы регистрации)
const getGroups = async (req, res) => {
  try {
    const groups = await oneCService.getGroups();
    res.json({
      success: true,
      data: groups,
    });
  } catch (error) {
    logger.error('Ошибка получения групп из 1С:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка при получении групп',
    });
  }
};

// Регистрация нового пользователя с данными из 1С
const register = async (req, res) => {
  try {
    const { code, role, password, group } = req.body;

    if (!code || !role || !password) {
      return res.status(400).json({ error: 'Код, роль и пароль обязательны' });
    }

    let result;
    if (role === 'student') {
      if (!group) {
        return res.status(400).json({ error: 'Для студента необходимо указать группу' });
      }
      // Проверяем код студента
      const checkResult = await registrationService.checkStudentCode(code, group);
      if (!checkResult.valid) {
        return res.status(400).json({ error: checkResult.error });
      }
      // Регистрируем студента
      result = await registrationService.registerStudent(checkResult.data, password);
    } else if (role === 'teacher') {
      // Проверяем код преподавателя
      const checkResult = await registrationService.checkTeacherCode(code);
      if (!checkResult.valid) {
        return res.status(400).json({ error: checkResult.error });
      }
      // Регистрируем преподавателя
      result = await registrationService.registerTeacher(checkResult.data, password);
    } else {
      return res.status(400).json({ error: 'Неверная роль. Используйте "student" или "teacher"' });
    }

    if (!result.success) {
      return res.status(500).json({ error: 'Ошибка при регистрации пользователя' });
    }

    // Генерация токена
    const token = generateToken(result.user.user_id, result.user.role_id);

    // Удаляем пароль из ответа
    delete result.user.password_hash;

    res.status(201).json({
      message: 'Пользователь успешно зарегистрирован',
      user: result.user,
      token,
    });
  } catch (error) {
    logger.error('Ошибка регистрации:', error);
    res.status(500).json({ error: error.message || 'Ошибка при регистрации пользователя' });
  }
};

// Вход в систему
const login = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Поддержка входа по username или email (для обратной совместимости)
    // Но основной способ - по username (код@фамилия или группа@фамилия)
    const loginField = username || email;
    
    if (!loginField || !password) {
      return res.status(400).json({ error: 'Логин и пароль обязательны' });
    }

    // Поиск пользователя по username или email
    let user = await User.findByUsername(loginField);
    if (!user) {
      user = await User.findByEmail(loginField);
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    // Проверка пароля
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    // Проверка активности пользователя
    if (!user.is_active) {
      return res.status(403).json({ error: 'Аккаунт деактивирован' });
    }

    // Синхронизация данных из 1С (только если не администратор)
    if (user.role_id !== 1 && user.sync_1c_id) {
      try {
        if (user.role_id === 3) {
          // Студент
          const studentData = await oneCService.getStudentByCode(user.sync_1c_id);
          if (studentData) {
            await userUpdateService.updateStudentData(user.user_id, studentData);
            // Обновляем данные пользователя после синхронизации
            user = await User.findById(user.user_id);
          }
        } else if (user.role_id === 2) {
          // Преподаватель
          const teacherData = await oneCService.getTeacherByCode(user.sync_1c_id);
          if (teacherData) {
            await userUpdateService.updateTeacherData(user.user_id, teacherData);
            // Обновляем данные пользователя после синхронизации
            user = await User.findById(user.user_id);
          }
        }
      } catch (syncError) {
        logger.error('Ошибка синхронизации данных из 1С при авторизации:', syncError);
        // Не прерываем процесс входа при ошибке синхронизации
      }
    }

    // Обновление времени последнего онлайна
    await User.updateLastOnline(user.user_id);

    // Генерация токена
    const token = generateToken(user.user_id, user.role_id);

    // Создание сессии пользователя
    const expiresAt = getTokenExpiration();
    const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    try {
      await Session.create({
        user_id: user.user_id,
        session_token: token,
        ip_address: ipAddress,
        user_agent: userAgent,
        expires_at: expiresAt
      });
    } catch (sessionError) {
      logger.error('Ошибка создания сессии:', sessionError);
      // Не прерываем процесс входа, если не удалось создать сессию
    }

    // Удаляем пароль из ответа
    delete user.password_hash;

    res.json({
      message: 'Успешный вход в систему',
      user,
      token
    });
  } catch (error) {
    logger.error('Ошибка входа:', error);
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
    logger.error('Ошибка получения пользователя:', error);
    res.status(500).json({ error: 'Ошибка при получении данных пользователя' });
  }
};

// Выход из системы
const logout = async (req, res) => {
  try {
    if (req.sessionId) {
      await Session.deactivate(req.sessionId);
    }
    
    res.json({ message: 'Успешный выход из системы' });
  } catch (error) {
    logger.error('Ошибка выхода:', error);
    res.status(500).json({ error: 'Ошибка при выходе из системы' });
  }
};

// Получение списка пользователей (для выбора собеседников)
const getUsers = async (req, res) => {
  try {
    const { search } = req.query;
    const filters = {
      is_active: true,
    };
    if (search) {
      filters.search = search;
    }

    const users = await User.findAll(filters);
    
    // Удаляем пароли из ответа
    const usersWithoutPasswords = users.map(user => {
      delete user.password_hash;
      return user;
    });

    res.json({ users: usersWithoutPasswords });
  } catch (error) {
    logger.error('Ошибка получения пользователей:', error);
    res.status(500).json({ error: 'Ошибка при получении списка пользователей' });
  }
};

module.exports = {
  checkCode,
  getGroups,
  register,
  login,
  getCurrentUser,
  logout,
  getUsers,
};

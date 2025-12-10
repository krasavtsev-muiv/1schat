// Контроллер для аутентификации
const User = require('../models/user.model');
const Session = require('../models/session.model');
const { generateToken, getTokenExpiration } = require('../utils/jwt.util');
const { hashPassword, comparePassword } = require('../utils/password.util');
const registrationService = require('../services/registration.service');
const oneCService = require('../services/1c-integration.service');
const userUpdateService = require('../services/user-update.service');
const logger = require('../utils/logger');
const { handle1CError } = require('../utils/1c-error-handler');
const { getSocket } = require('../utils/socket.io');

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
        // Если студент не найден, возвращаем 404
        const isNotFound = result.error.includes('не найден');
        return res.status(isNotFound ? 404 : 400).json({ error: result.error });
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
        // Если преподаватель не найден, возвращаем 404
        const isNotFound = result.error.includes('не найден');
        return res.status(isNotFound ? 404 : 400).json({ error: result.error });
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
    
    // Обрабатываем ошибку лимита запросов
    if (handle1CError(error, res, 'Ошибка при проверке кода в системе 1С')) {
      return;
    }
    
    res.status(500).json({ 
      error: error.message || 'Ошибка при проверке кода в системе 1С' 
    });
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
    
    // Обрабатываем ошибку лимита запросов
    if (handle1CError(error, res, 'Ошибка при получении групп из системы 1С')) {
      return;
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка при получении групп из системы 1С',
    });
  }
};

// Регистрация нового пользователя с данными из 1С
const register = async (req, res) => {
  try {
    const { code, role, password, username, group } = req.body;

    if (!code || !role || !password) {
      return res.status(400).json({ error: 'Код, роль и пароль обязательны' });
    }

    if (!username || username.trim() === '') {
      return res.status(400).json({ error: 'Логин обязателен для заполнения' });
    }

    const trimmedUsername = username.trim();

    // Проверка уникальности username
    const existingUser = await User.findByUsername(trimmedUsername);
    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь с таким логином уже существует' });
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
      result = await registrationService.registerStudent(checkResult.data, password, trimmedUsername);
    } else if (role === 'teacher') {
      // Проверяем код преподавателя
      const checkResult = await registrationService.checkTeacherCode(code);
      if (!checkResult.valid) {
        return res.status(400).json({ error: checkResult.error });
      }
      // Регистрируем преподавателя
      result = await registrationService.registerTeacher(checkResult.data, password, trimmedUsername);
    } else {
      return res.status(400).json({ error: 'Неверная роль. Используйте "student" или "teacher"' });
    }

    if (!result.success) {
      return res.status(500).json({ error: 'Ошибка при регистрации пользователя' });
    }

    // Обновление времени последнего онлайна
    await User.updateLastOnline(result.user.user_id);

    // Генерация токена
    const token = generateToken(result.user.user_id, result.user.role_id);

    // Создание сессии пользователя (как при логине)
    const expiresAt = getTokenExpiration();
    const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    try {
      await Session.create({
        user_id: result.user.user_id,
        session_token: token,
        ip_address: ipAddress,
        user_agent: userAgent,
        expires_at: expiresAt
      });
    } catch (sessionError) {
      logger.error('Ошибка создания сессии при регистрации:', sessionError);
      // Не прерываем процесс регистрации, если не удалось создать сессию
    }

    // Удаляем пароль из ответа
    delete result.user.password_hash;

    // Отправляем ответ клиенту сначала
    res.status(201).json({
      message: 'Пользователь успешно зарегистрирован',
      user: result.user,
      token,
    });

    // Отправляем уведомление всем пользователям о новом зарегистрированном пользователе
    // Это нужно для обновления списка контактов
    // Делаем это после отправки ответа, чтобы не задерживать регистрацию
    try {
      const io = getSocket();
      if (io) {
        // Получаем полную информацию о пользователе с ролью (после сохранения в БД)
        const registeredUser = await User.findById(result.user.user_id);
        if (registeredUser && registeredUser.role_name && registeredUser.username && registeredUser.is_active) {
          const userData = {
            user_id: registeredUser.user_id,
            first_name: registeredUser.first_name,
            last_name: registeredUser.last_name,
            middle_name: registeredUser.middle_name,
            role_name: registeredUser.role_name,
            student_group: registeredUser.student_group,
            is_active: registeredUser.is_active,
            username: registeredUser.username
          };
          
          // Получаем количество пользователей в комнате для отладки
          const contactsRoom = io.sockets.adapter.rooms.get('contacts_updates');
          const usersInRoom = contactsRoom ? contactsRoom.size : 0;
          
          logger.info(`Отправка события user_registered для пользователя ${registeredUser.user_id} (${registeredUser.first_name} ${registeredUser.last_name}). Пользователей в комнате contacts_updates: ${usersInRoom}`);
          io.to('contacts_updates').emit('user_registered', userData);
          logger.info(`Событие user_registered отправлено в комнату contacts_updates (${usersInRoom} пользователей)`);
        } else {
          logger.warn(`Не удалось отправить уведомление для пользователя ${result.user.user_id}: username=${registeredUser?.username}, is_active=${registeredUser?.is_active}, role_name=${registeredUser?.role_name}`);
        }
      } else {
        logger.warn('Socket.IO недоступен для отправки уведомления о регистрации');
      }
    } catch (socketError) {
      // Логируем ошибку, но не прерываем процесс регистрации
      logger.error('Ошибка отправки уведомления о регистрации через WebSocket:', socketError);
    }
  } catch (error) {
    logger.error('Ошибка регистрации:', error);
    res.status(500).json({ error: error.message || 'Ошибка при регистрации пользователя' });
  }
};

// Вход в систему
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Вход по username (код из 1С: код@фамилия или группа@фамилия)
    const loginField = username;
    
    if (!loginField || !password) {
      return res.status(400).json({ error: 'Логин и пароль обязательны' });
    }

    // Поиск пользователя по username (формат: группа@фамилия или код@фамилия)
    let user = await User.findByUsername(loginField);
    
    if (!user) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    // Проверка пароля (сравнение с хешем в БД через bcrypt)
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    // Проверка активности пользователя
    if (!user.is_active) {
      return res.status(403).json({ error: 'Аккаунт деактивирован' });
    }

    // Синхронизация данных из 1С (только если не администратор и есть sync_1c_id)
    if (user.role_name !== 'admin' && user.sync_1c_id) {
      try {
        if (user.role_name === 'student') {
          // Студент: получаем актуальные данные из 1С и обновляем в БД
          const studentData = await oneCService.getStudentByCode(user.sync_1c_id);
          if (studentData) {
            await userUpdateService.updateStudentData(user.user_id, studentData);
            // Обновляем данные пользователя после синхронизации
            user = await User.findById(user.user_id);
          }
        } else if (user.role_name === 'teacher') {
          // Преподаватель: получаем актуальные данные из 1С и обновляем в БД
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

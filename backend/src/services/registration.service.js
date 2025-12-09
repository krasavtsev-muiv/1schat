// Сервис для регистрации пользователей с интеграцией 1С
const oneCService = require('./1c-integration.service');
const User = require('../models/user.model');
const Department = require('../models/department.model');
const Group = require('../models/group.model');
const Discipline = require('../models/discipline.model');
const StudentDiscipline = require('../models/student-discipline.model');
const TeacherDiscipline = require('../models/teacher-discipline.model');
const chatService = require('./chat.service');
const contactService = require('./contact.service');
const logger = require('../utils/logger');

class RegistrationService {
  // Проверка кода студента в 1С
  async checkStudentCode(code, selectedGroup) {
    try {
      const studentData = await oneCService.getStudentByCode(code);
      
      if (!studentData) {
        return {
          valid: false,
          error: 'Студент с таким кодом не найден в системе 1С',
        };
      }

      // Проверка соответствия группы
      if (studentData.Группа !== selectedGroup) {
        return {
          valid: false,
          error: `Выбранная группа "${selectedGroup}" не соответствует группе студента "${studentData.Группа}" в системе 1С`,
        };
      }

      return {
        valid: true,
        data: studentData,
      };
    } catch (error) {
      logger.error(`Ошибка проверки кода студента ${code}:`, error);
      
      // Пробрасываем ошибку лимита дальше без обработки
      if (error.isLimitError || error.message === 'LIMIT_REACHED') {
        throw error;
      }
      
      return {
        valid: false,
        error: error.message || 'Ошибка при проверке кода в системе 1С',
      };
    }
  }

  // Проверка кода преподавателя в 1С
  async checkTeacherCode(code) {
    try {
      const teacherData = await oneCService.getTeacherByCode(code);
      
      if (!teacherData) {
        return {
          valid: false,
          error: 'Преподаватель с таким кодом не найден в системе 1С',
        };
      }

      return {
        valid: true,
        data: teacherData,
      };
    } catch (error) {
      logger.error(`Ошибка проверки кода преподавателя ${code}:`, error);
      
      // Пробрасываем ошибку лимита дальше без обработки
      if (error.isLimitError || error.message === 'LIMIT_REACHED') {
        throw error;
      }
      return {
        valid: false,
        error: error.message || 'Ошибка при проверке кода в системе 1С',
      };
    }
  }

  // Регистрация студента
  async registerStudent(studentData1C, password, username) {
    try {
      const mappedData = oneCService.map1CStudentToLocalUser(studentData1C);
      
      if (!mappedData) {
        throw new Error('Не удалось обработать данные студента из 1С');
      }

      if (!username || username.trim() === '') {
        throw new Error('Логин обязателен для заполнения');
      }

      // Проверка существования пользователя по username
      const existingUser = await User.findByUsername(username.trim());
      if (existingUser) {
        throw new Error('Пользователь с таким логином уже существует');
      }

      // Проверка существования пользователя по sync_1c_id
      if (mappedData.sync_1c_id) {
        const { query } = require('../../config/database');
        const existingByCode = await query(
          'SELECT * FROM users WHERE sync_1c_id = $1',
          [mappedData.sync_1c_id]
        );
        if (existingByCode.rows.length > 0) {
          const existing = existingByCode.rows[0];
          // Если пользователь существует но без username, обновляем его
          if (!existing.username) {
            // Обновляем username, пароль и активируем пользователя
            const { hashPassword } = require('../utils/password.util');
            const password_hash = await hashPassword(password);
            await User.update(existing.user_id, { 
              username: username.trim(),
              password_hash,
              is_active: true  // Активируем пользователя при регистрации
            });
            return {
              success: true,
              user: await User.findById(existing.user_id),
            };
          } else {
            throw new Error('Пользователь с таким кодом уже зарегистрирован');
          }
        }
      }

      // Создание/получение кафедры
      let department = null;
      if (studentData1C.Кафедра) {
        department = await Department.findOrCreate({
          name: studentData1C.Кафедра,
          sync_1c_code: null, // Кафедра не имеет кода в ответе студента
        });
      }

      // Создание/получение группы
      let group = null;
      if (studentData1C.Группа && department) {
        group = await Group.findOrCreate({
          name: studentData1C.Группа,
          department_id: department.department_id,
          sync_1c_code: null,
        });
      }

      // Создание/получение дисциплин и преподавателей
      const disciplineIds = [];
      const teacherIds = new Set();

      if (studentData1C.Дисциплины && Array.isArray(studentData1C.Дисциплины)) {
        for (const disciplineData of studentData1C.Дисциплины) {
          // Создание/получение дисциплины
          const discipline = await Discipline.findOrCreate({
            name: disciplineData.Наименование || disciplineData,
            department_id: department?.department_id || null,
            sync_1c_code: disciplineData.Код?.toString() || null,
          });
          disciplineIds.push(discipline.discipline_id);

          // Создание/получение преподавателей по дисциплине
          if (disciplineData.Преподаватели && Array.isArray(disciplineData.Преподаватели)) {
            for (const teacherData of disciplineData.Преподаватели) {
              const teacherMapped = oneCService.map1CTeacherToLocalUser({
                Код: teacherData.Код,
                Фамилия: teacherData.Фамилия,
                Имя: teacherData.Имя,
                Отчество: teacherData.Отчество,
                Дисциплина: disciplineData.Наименование || disciplineData,
              });

              // Проверяем существование преподавателя по sync_1c_id
              let teacher = null;
              if (teacherData.Код) {
                const { query } = require('../../config/database');
                const teacherResult = await query(
                  'SELECT * FROM users WHERE sync_1c_id = $1',
                  [teacherData.Код.toString()]
                );
                if (teacherResult.rows.length > 0) {
                  teacher = teacherResult.rows[0];
                }
              }
              
              if (!teacher) {
                // Преподаватель ещё не зарегистрирован, создаём запись без username и пароля
                // Username и пароль будут установлены при регистрации преподавателя
                // Используем временный пароль для возможности создания записи
                const { hashPassword } = require('../utils/password.util');
                const tempPasswordHash = await hashPassword('temp_' + teacherData.Код);
                
                teacher = await User.create({
                  username: null, // Username будет установлен при регистрации
                  password_hash: tempPasswordHash,
                  first_name: teacherData.Имя || '',
                  last_name: teacherData.Фамилия || '',
                  middle_name: teacherData.Отчество || null,
                  role_id: 2, // teacher
                  sync_1c_id: teacherData.Код?.toString(),
                });
              }

              teacherIds.add(teacher.user_id);

              // Создание связи преподаватель-дисциплина
              await TeacherDiscipline.create(teacher.user_id, discipline.discipline_id);
            }
          }
        }
      }

      // Создание пользователя (студента)
      const { hashPassword } = require('../utils/password.util');
      const password_hash = await hashPassword(password);

      const user = await User.create({
        username: username.trim(),
        password_hash,
        first_name: mappedData.first_name,
        last_name: mappedData.last_name,
        middle_name: mappedData.middle_name,
        role_id: 3, // student
        department: studentData1C.Кафедра || null,
        student_group: studentData1C.Группа || null,
        sync_1c_id: mappedData.sync_1c_id,
      });

      // Создание связей студент-дисциплина
      for (const disciplineId of disciplineIds) {
        await StudentDiscipline.create(user.user_id, disciplineId);
      }

      // Создание/обновление общегруппового чата (только групповой чат, не приватные)
      let groupChat = null;
      if (studentData1C.Группа) {
        groupChat = await chatService.createOrUpdateGroupChat(studentData1C.Группа);
        await chatService.addUserToGroupChat(groupChat.chat_id, user.user_id);
      }

      // Примечание: Приватные чаты с конкретными пользователями НЕ создаются автоматически
      // Пользователь сам выбирает с кем начать чат из списка контактов

      return {
        success: true,
        user,
        department,
        group,
        disciplineIds,
        teacherIds: Array.from(teacherIds),
        groupChat,
      };
    } catch (error) {
      logger.error('Ошибка регистрации студента:', error);
      throw error;
    }
  }

  // Регистрация преподавателя
  async registerTeacher(teacherData1C, password, username) {
    try {
      const mappedData = oneCService.map1CTeacherToLocalUser(teacherData1C);
      
      if (!mappedData) {
        throw new Error('Не удалось обработать данные преподавателя из 1С');
      }

      if (!username || username.trim() === '') {
        throw new Error('Логин обязателен для заполнения');
      }

      // Проверка существования пользователя по username
      const existingUser = await User.findByUsername(username.trim());
      if (existingUser) {
        throw new Error('Пользователь с таким логином уже существует');
      }

      // Проверка существования пользователя по sync_1c_id
      if (mappedData.sync_1c_id) {
        const { query } = require('../../config/database');
        const existingByCode = await query(
          'SELECT * FROM users WHERE sync_1c_id = $1',
          [mappedData.sync_1c_id]
        );
        if (existingByCode.rows.length > 0) {
          const existing = existingByCode.rows[0];
          // Если пользователь существует но без username, обновляем его
          if (!existing.username) {
            // Обновляем username, пароль и активируем пользователя
            const { hashPassword } = require('../utils/password.util');
            const password_hash = await hashPassword(password);
            await User.update(existing.user_id, { 
              username: username.trim(),
              password_hash,
              is_active: true  // Активируем пользователя при регистрации
            });
            return {
              success: true,
              user: await User.findById(existing.user_id),
            };
          } else {
            throw new Error('Пользователь с таким кодом уже зарегистрирован');
          }
        }
      }

      // Создание/получение дисциплины
      let discipline = null;
      if (teacherData1C.Дисциплина) {
        const disciplineName = typeof teacherData1C.Дисциплина === 'string' 
          ? teacherData1C.Дисциплина 
          : teacherData1C.Дисциплина.Наименование;
        
        const disciplineCode = typeof teacherData1C.Дисциплина === 'object'
          ? teacherData1C.Дисциплина.Код?.toString()
          : null;

        discipline = await Discipline.findOrCreate({
          name: disciplineName,
          department_id: null, // Кафедра не указана в данных преподавателя
          sync_1c_code: disciplineCode,
        });
      }

      // Создание пользователя (преподавателя)
      const { hashPassword } = require('../utils/password.util');
      const password_hash = await hashPassword(password);

      const user = await User.create({
        username: username.trim(),
        password_hash,
        first_name: mappedData.first_name,
        last_name: mappedData.last_name,
        middle_name: mappedData.middle_name,
        role_id: 2, // teacher (преподаватель)
        sync_1c_id: mappedData.sync_1c_id,
      });

      // Создание связи преподаватель-дисциплина
      if (discipline) {
        await TeacherDiscipline.create(user.user_id, discipline.discipline_id);

        // Примечание: Приватные чаты с конкретными пользователями НЕ создаются автоматически
        // Пользователь сам выбирает с кем начать чат из списка контактов

        return {
          success: true,
          user,
          discipline,
        };
      }

      return {
        success: true,
        user,
        discipline,
        contactsAdded: {
          students: 0,
        },
      };
    } catch (error) {
      logger.error('Ошибка регистрации преподавателя:', error);
      throw error;
    }
  }
}

module.exports = new RegistrationService();


// Сервис для регистрации пользователей с интеграцией 1С
const oneCService = require('./1c-integration.service');
const User = require('../models/user.model');
const Department = require('../models/department.model');
const Group = require('../models/group.model');
const Discipline = require('../models/discipline.model');
const StudentDiscipline = require('../models/student-discipline.model');
const TeacherDiscipline = require('../models/teacher-discipline.model');
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
      return {
        valid: false,
        error: error.message || 'Ошибка при проверке кода в системе 1С',
      };
    }
  }

  // Регистрация студента
  async registerStudent(studentData1C, password) {
    try {
      const mappedData = oneCService.map1CStudentToLocalUser(studentData1C);
      
      if (!mappedData) {
        throw new Error('Не удалось обработать данные студента из 1С');
      }

      // Проверка существования пользователя
      const existingUser = await User.findByUsername(mappedData.username);
      if (existingUser) {
        throw new Error('Пользователь с таким username уже существует');
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

              // Проверяем существование преподавателя
              const teacherUsername = `${teacherData.Код}@${teacherData.Фамилия}`;
              let teacher = await User.findByUsername(teacherUsername);
              if (!teacher) {
                // Преподаватель ещё не зарегистрирован, создаём запись без пароля
                // Пароль будет установлен при регистрации преподавателя
                // Используем временный пароль для возможности создания записи
                const { hashPassword } = require('../utils/password.util');
                const tempPasswordHash = await hashPassword('temp_' + teacherData.Код);
                
                teacher = await User.create({
                  username: teacherUsername,
                  email: `${teacherUsername}@temp.local`,
                  password_hash: tempPasswordHash,
                  first_name: teacherData.Имя || '',
                  last_name: teacherData.Фамилия || '',
                  middle_name: teacherData.Отчество || null,
                  role_id: 2, // manager
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

      // Формируем username: группа@фамилия
      const username = studentData1C.Группа
        ? `${studentData1C.Группа}@${studentData1C.Фамилия}`
        : `${studentData1C.Код}@${studentData1C.Фамилия}`;

      const user = await User.create({
        username,
        email: `${username}@temp.local`, // Временный email для совместимости со схемой
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

      return {
        success: true,
        user,
        department,
        group,
        disciplineIds,
        teacherIds: Array.from(teacherIds),
      };
    } catch (error) {
      logger.error('Ошибка регистрации студента:', error);
      throw error;
    }
  }

  // Регистрация преподавателя
  async registerTeacher(teacherData1C, password) {
    try {
      const mappedData = oneCService.map1CTeacherToLocalUser(teacherData1C);
      
      if (!mappedData) {
        throw new Error('Не удалось обработать данные преподавателя из 1С');
      }

      // Проверка существования пользователя
      const existingUser = await User.findByUsername(mappedData.username);
      if (existingUser) {
        throw new Error('Пользователь с таким username уже существует');
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

      // Формируем username: код@фамилия
      const username = `${teacherData1C.Код}@${teacherData1C.Фамилия}`;

      const user = await User.create({
        username,
        email: `${username}@temp.local`, // Временный email для совместимости со схемой
        password_hash,
        first_name: mappedData.first_name,
        last_name: mappedData.last_name,
        middle_name: mappedData.middle_name,
        role_id: 2, // manager (преподаватель)
        sync_1c_id: mappedData.sync_1c_id,
      });

      // Создание связи преподаватель-дисциплина
      if (discipline) {
        await TeacherDiscipline.create(user.user_id, discipline.discipline_id);
      }

      return {
        success: true,
        user,
        discipline,
      };
    } catch (error) {
      logger.error('Ошибка регистрации преподавателя:', error);
      throw error;
    }
  }
}

module.exports = new RegistrationService();


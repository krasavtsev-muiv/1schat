// Сервис для обновления данных пользователя из 1С при авторизации
const oneCService = require('./1c-integration.service');
const User = require('../models/user.model');
const Department = require('../models/department.model');
const Group = require('../models/group.model');
const Discipline = require('../models/discipline.model');
const StudentDiscipline = require('../models/student-discipline.model');
const TeacherDiscipline = require('../models/teacher-discipline.model');
const chatService = require('./chat.service');
const contactService = require('./contact.service');
const { query } = require('../../config/database');
const logger = require('../utils/logger');

class UserUpdateService {
  // Обновление данных студента из 1С
  async updateStudentData(userId, studentData1C) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Пользователь не найден');
      }

      if (user.role_name !== 'student') {
        throw new Error('Пользователь не является студентом');
      }

      // Определяем изменения
      const oldGroup = user.student_group;
      const newGroup = studentData1C.Группа || null;

      // Обновляем данные пользователя
      await User.update(userId, {
        first_name: studentData1C.Имя || user.first_name,
        last_name: studentData1C.Фамилия || user.last_name,
        middle_name: studentData1C.Отчество || user.middle_name,
        department: studentData1C.Кафедра || user.department,
        student_group: newGroup,
      });

      // Обновляем связи студент-дисциплина
      const newDisciplineIds = [];
      if (studentData1C.Дисциплины && Array.isArray(studentData1C.Дисциплины)) {
        // Создаём/получаем дисциплины
        for (const disciplineData of studentData1C.Дисциплины) {
          const disciplineName = disciplineData.Наименование || disciplineData;
          const disciplineCode = disciplineData.Код?.toString() || null;

          // Получаем кафедру для дисциплины
          let department = null;
          if (studentData1C.Кафедра) {
            department = await Department.findByName(studentData1C.Кафедра);
          }

          const discipline = await Discipline.findOrCreate({
            name: disciplineName,
            department_id: department?.department_id || null,
            sync_1c_code: disciplineCode,
          });

          newDisciplineIds.push(discipline.discipline_id);
        }
      }

      // Обновляем связи студент-дисциплина
      await StudentDiscipline.updateStudentDisciplines(userId, newDisciplineIds);

      // Обновляем только групповой чат если группа изменилась
      // Приватные чаты с конкретными пользователями НЕ создаются автоматически
      if (oldGroup !== newGroup) {
        // Удаляем из старого группового чата
        if (oldGroup) {
          const oldGroupChat = await chatService.createOrUpdateGroupChat(oldGroup);
          if (oldGroupChat) {
            await chatService.removeUserFromGroupChat(oldGroupChat.chat_id, userId);
          }
        }
        // Добавляем в новый групповой чат
        if (newGroup) {
          const newGroupChat = await chatService.createOrUpdateGroupChat(newGroup);
          await chatService.addUserToGroupChat(newGroupChat.chat_id, userId);
        }
      }

      logger.info(`Данные студента ${userId} обновлены из 1С`);
      return { success: true };
    } catch (error) {
      logger.error(`Ошибка обновления данных студента ${userId}:`, error);
      throw error;
    }
  }

  // Обновление данных преподавателя из 1С
  async updateTeacherData(userId, teacherData1C) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Пользователь не найден');
      }

      if (user.role_name !== 'teacher') {
        throw new Error('Пользователь не является преподавателем');
      }

      // Обновляем данные пользователя
      await User.update(userId, {
        first_name: teacherData1C.Имя || user.first_name,
        last_name: teacherData1C.Фамилия || user.last_name,
        middle_name: teacherData1C.Отчество || user.middle_name,
      });

      // Обновляем связи преподаватель-дисциплина
      const newDisciplineIds = [];
      if (teacherData1C.Дисциплина) {
        const disciplineName = typeof teacherData1C.Дисциплина === 'string'
          ? teacherData1C.Дисциплина
          : teacherData1C.Дисциплина.Наименование;
        
        const disciplineCode = typeof teacherData1C.Дисциплина === 'object'
          ? teacherData1C.Дисциплина.Код?.toString()
          : null;

        const discipline = await Discipline.findOrCreate({
          name: disciplineName,
          department_id: null,
          sync_1c_code: disciplineCode,
        });

        newDisciplineIds.push(discipline.discipline_id);
      }

      // Обновляем связи преподаватель-дисциплина
      await TeacherDiscipline.updateTeacherDisciplines(userId, newDisciplineIds);

      // Примечание: Приватные чаты с конкретными пользователями НЕ создаются автоматически
      // Пользователь сам выбирает с кем начать чат из списка контактов

      logger.info(`Данные преподавателя ${userId} обновлены из 1С`);
      return { success: true };
    } catch (error) {
      logger.error(`Ошибка обновления данных преподавателя ${userId}:`, error);
      throw error;
    }
  }

  // Примечание: Методы updateStudentConnections, updateStudentContacts, updateStudentContactsByDisciplines
  // больше не используются, так как приватные чаты не создаются автоматически
  // Оставлены для совместимости, но не вызываются

  // Обновление контактов преподавателя
  async updateTeacherContacts(teacherId, newDisciplineIds) {
    try {
      // Получаем всех студентов по новым дисциплинам
      const newStudentIds = new Set();
      for (const disciplineId of newDisciplineIds) {
        const students = await StudentDiscipline.findByDisciplineId(disciplineId);
        for (const student of students) {
          newStudentIds.add(student.user_id);
        }
      }

      // Получаем текущие контакты преподавателя
      const currentContacts = await this.getUserContacts(teacherId);

      // Удаляем контакты со студентами, которые не соответствуют новым дисциплинам
      for (const contactId of currentContacts) {
        const contact = await User.findById(contactId);
        if (contact && contact.role_name === 'student') {
          // Это студент
          if (!newStudentIds.has(contactId)) {
            await contactService.removeContact(teacherId, contactId);
          }
        }
      }

      // Добавляем студентов по новым дисциплинам
      if (newDisciplineIds.length > 0) {
        await contactService.addStudentsToTeacherContacts(teacherId, newDisciplineIds);
      }

      logger.info(`Контакты преподавателя ${teacherId} обновлены`);
    } catch (error) {
      logger.error(`Ошибка обновления контактов преподавателя ${teacherId}:`, error);
      throw error;
    }
  }

  // Получить список контактов пользователя (ID пользователей из приватных чатов)
  async getUserContacts(userId) {
    try {
      const result = await query(
        `SELECT DISTINCT cp2.user_id
         FROM chats c
         JOIN chat_participants cp1 ON c.chat_id = cp1.chat_id
         JOIN chat_participants cp2 ON c.chat_id = cp2.chat_id
         WHERE c.chat_type = 'private'
         AND cp1.user_id = $1
         AND cp2.user_id != $1
         AND cp1.left_at IS NULL
         AND cp2.left_at IS NULL`,
        [userId]
      );
      return result.rows.map(row => row.user_id);
    } catch (error) {
      logger.error(`Ошибка получения контактов пользователя ${userId}:`, error);
      return [];
    }
  }
}

module.exports = new UserUpdateService();


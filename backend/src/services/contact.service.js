// Сервис для работы с контактами
const User = require('../models/user.model');
const StudentDiscipline = require('../models/student-discipline.model');
const TeacherDiscipline = require('../models/teacher-discipline.model');
const Discipline = require('../models/discipline.model');
const chatService = require('./chat.service');
const { query } = require('../../config/database');
const logger = require('../utils/logger');

class ContactService {
  // Добавить контакт (двусторонняя связь через приватный чат)
  async addContact(userId, contactId) {
    try {
      // Создаём или получаем приватный чат между пользователями
      await chatService.getOrCreatePrivateChat(userId, contactId);
      logger.info(`Контакт добавлен: пользователь ${userId} <-> ${contactId}`);
    } catch (error) {
      logger.error(`Ошибка добавления контакта ${userId} <-> ${contactId}:`, error);
      throw error;
    }
  }

  // Добавить одногруппников в контакты студента
  async addGroupmatesToContacts(studentId, groupName) {
    try {
      const groupmates = await chatService.findStudentsByGroup(groupName);
      const added = [];

      for (const groupmate of groupmates) {
        if (groupmate.user_id !== studentId) {
          await this.addContact(studentId, groupmate.user_id);
          added.push(groupmate.user_id);
        }
      }

      logger.info(`Добавлены одногруппники в контакты студента ${studentId}: ${added.length} контактов`);
      return added;
    } catch (error) {
      logger.error(`Ошибка добавления одногруппников в контакты студента ${studentId}:`, error);
      throw error;
    }
  }

  // Добавить преподавателей по дисциплинам в контакты студента
  async addTeachersToContacts(studentId, disciplineIds) {
    try {
      const teacherIds = new Set();

      for (const disciplineId of disciplineIds) {
        const teachers = await TeacherDiscipline.findByDisciplineId(disciplineId);
        for (const teacher of teachers) {
          teacherIds.add(teacher.user_id);
        }
      }

      const added = [];
      for (const teacherId of teacherIds) {
        await this.addContact(studentId, teacherId);
        added.push(teacherId);
      }

      logger.info(`Добавлены преподаватели в контакты студента ${studentId}: ${added.length} контактов`);
      return added;
    } catch (error) {
      logger.error(`Ошибка добавления преподавателей в контакты студента ${studentId}:`, error);
      throw error;
    }
  }

  // Добавить студентов преподавателю по дисциплинам
  async addStudentsToTeacherContacts(teacherId, disciplineIds) {
    try {
      const studentIds = new Set();

      for (const disciplineId of disciplineIds) {
        const students = await StudentDiscipline.findByDisciplineId(disciplineId);
        for (const student of students) {
          studentIds.add(student.user_id);
        }
      }

      const added = [];
      for (const studentId of studentIds) {
        await this.addContact(teacherId, studentId);
        added.push(studentId);
      }

      logger.info(`Добавлены студенты в контакты преподавателя ${teacherId}: ${added.length} контактов`);
      return added;
    } catch (error) {
      logger.error(`Ошибка добавления студентов в контакты преподавателя ${teacherId}:`, error);
      throw error;
    }
  }

  // Найти студентов с пересечениями по предметам
  async findStudentsWithCommonDisciplines(studentId) {
    try {
      // Получаем дисциплины студента
      const studentDisciplines = await StudentDiscipline.findByStudentId(studentId);
      const disciplineIds = studentDisciplines.map(sd => sd.discipline_id);

      if (disciplineIds.length === 0) {
        return [];
      }

      // Находим всех студентов с такими же дисциплинами
      const result = await query(
        `SELECT DISTINCT u.user_id, u.first_name, u.last_name, u.middle_name, u.student_group
         FROM users u
         JOIN student_disciplines sd ON u.user_id = sd.user_id
         JOIN roles r ON u.role_id = r.role_id
         WHERE sd.discipline_id = ANY($1::int[])
         AND u.user_id != $2
         AND r.role_name = 'student'
         AND u.is_active = true`,
        [disciplineIds, studentId]
      );

      return result.rows;
    } catch (error) {
      logger.error(`Ошибка поиска студентов с общими дисциплинами для студента ${studentId}:`, error);
      throw error;
    }
  }

  // Удалить контакт (удалить приватный чат или пометить как удалённый)
  async removeContact(userId, contactId) {
    try {
      // Находим приватный чат между пользователями
      const chat = await query(
        `SELECT c.chat_id FROM chats c
         JOIN chat_participants cp1 ON c.chat_id = cp1.chat_id
         JOIN chat_participants cp2 ON c.chat_id = cp2.chat_id
         WHERE c.chat_type = 'private'
         AND cp1.user_id = $1 AND cp2.user_id = $2
         AND cp1.left_at IS NULL AND cp2.left_at IS NULL`,
        [userId, contactId]
      );

      if (chat.rows[0]) {
        // Помечаем, что пользователь вышел из чата
        await query(
          `UPDATE chat_participants 
           SET left_at = CURRENT_TIMESTAMP 
           WHERE chat_id = $1 AND user_id = $2`,
          [chat.rows[0].chat_id, userId]
        );
        logger.info(`Контакт удалён: пользователь ${userId} удалил контакт ${contactId}`);
      }
    } catch (error) {
      logger.error(`Ошибка удаления контакта ${userId} <-> ${contactId}:`, error);
      throw error;
    }
  }
}

module.exports = new ContactService();


// Сервис для работы с чатами
const Chat = require('../models/chat.model');
const User = require('../models/user.model');
const { query } = require('../../config/database');
const logger = require('../utils/logger');

// Импортируем query для использования в методах
const getQuery = () => require('../../config/database').query;

class ChatService {
  // Создать или получить существующий общегрупповой чат
  async createOrUpdateGroupChat(groupName) {
    try {
      const chatName = `Группа ${groupName}`;
      
      // Ищем существующий чат для группы
      const existingChat = await query(
        `SELECT c.* FROM chats c 
         WHERE c.chat_name = $1 AND c.chat_type = 'group' AND c.is_active = true`,
        [chatName]
      );

      if (existingChat.rows[0]) {
        return existingChat.rows[0];
      }

      // Создаём новый чат
      const chat = await Chat.create({
        chat_name: chatName,
        chat_type: 'group',
        created_by: null, // Системный чат
        description: `Общегрупповой чат для группы ${groupName}`,
      });

      logger.info(`Создан общегрупповой чат для группы ${groupName}`);
      return chat;
    } catch (error) {
      logger.error(`Ошибка создания/получения группового чата для группы ${groupName}:`, error);
      throw error;
    }
  }

  // Добавить пользователя в групповой чат
  async addUserToGroupChat(chatId, userId) {
    try {
      await Chat.addParticipant(chatId, userId, 'member');
      logger.info(`Пользователь ${userId} добавлен в групповой чат ${chatId}`);
    } catch (error) {
      logger.error(`Ошибка добавления пользователя ${userId} в чат ${chatId}:`, error);
      throw error;
    }
  }

  // Удалить пользователя из группового чата (пометить left_at)
  async removeUserFromGroupChat(chatId, userId) {
    try {
      const { query } = require('../../config/database');
      await query(
        `UPDATE chat_participants 
         SET left_at = CURRENT_TIMESTAMP 
         WHERE chat_id = $1 AND user_id = $2`,
        [chatId, userId]
      );
      logger.info(`Пользователь ${userId} удалён из группового чата ${chatId}`);
    } catch (error) {
      logger.error(`Ошибка удаления пользователя ${userId} из чата ${chatId}:`, error);
      throw error;
    }
  }

  // Найти студентов по группе
  async findStudentsByGroup(groupName) {
    try {
      const result = await query(
        `SELECT u.* FROM users u 
         JOIN roles r ON u.role_id = r.role_id
         WHERE u.student_group = $1 AND r.role_name = 'student' AND u.is_active = true
         ORDER BY u.last_name, u.first_name`,
        [groupName]
      );
      return result.rows;
    } catch (error) {
      logger.error(`Ошибка поиска студентов по группе ${groupName}:`, error);
      throw error;
    }
  }

  // Получить или создать приватный чат между двумя пользователями
  async getOrCreatePrivateChat(userId1, userId2) {
    try {
      // Ищем существующий приватный чат между этими пользователями
      const existingChat = await query(
        `SELECT c.* FROM chats c
         JOIN chat_participants cp1 ON c.chat_id = cp1.chat_id
         JOIN chat_participants cp2 ON c.chat_id = cp2.chat_id
         WHERE c.chat_type = 'private'
         AND cp1.user_id = $1 AND cp2.user_id = $2
         AND cp1.left_at IS NULL AND cp2.left_at IS NULL
         LIMIT 1`,
        [userId1, userId2]
      );

      if (existingChat.rows[0]) {
        return existingChat.rows[0];
      }

      // Создаём новый приватный чат
      const user1 = await User.findById(userId1);
      const user2 = await User.findById(userId2);
      
      const chatName = `${user1.first_name} ${user1.last_name} - ${user2.first_name} ${user2.last_name}`;
      
      const chat = await Chat.create({
        chat_name: chatName,
        chat_type: 'private',
        created_by: userId1,
        description: null,
      });

      // Добавляем обоих участников
      await Chat.addParticipant(chat.chat_id, userId1, 'member');
      await Chat.addParticipant(chat.chat_id, userId2, 'member');

      logger.info(`Создан приватный чат между пользователями ${userId1} и ${userId2}`);
      return chat;
    } catch (error) {
      logger.error(`Ошибка создания/получения приватного чата:`, error);
      throw error;
    }
  }
}

module.exports = new ChatService();


// Модель сообщения
const { query } = require('../../config/database');

class Message {
  // Получить сообщение по ID
  static async findById(messageId) {
    const result = await query(
      'SELECT * FROM messages WHERE message_id = $1',
      [messageId]
    );
    return result.rows[0];
  }

  // Создать новое сообщение
  static async create(messageData) {
    const {
      chat_id,
      sender_id,
      message_text,
      message_type = 'text',
      forwarded_from_message_id,
      forwarded_from_user_id
    } = messageData;

    const result = await query(
      `INSERT INTO messages (
        chat_id, sender_id, message_text, message_type,
        forwarded_from_message_id, forwarded_from_user_id
      ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [chat_id, sender_id, message_text, message_type, forwarded_from_message_id, forwarded_from_user_id]
    );
    return result.rows[0];
  }

  // Получить сообщения чата с пагинацией
  static async findByChatId(chatId, limit = 50, offset = 0) {
    const result = await query(
      `SELECT m.*, u.username, u.first_name, u.last_name, u.avatar_url
       FROM messages m
       JOIN users u ON m.sender_id = u.user_id
       WHERE m.chat_id = $1 AND m.is_deleted = FALSE
       ORDER BY m.created_at DESC
       LIMIT $2 OFFSET $3`,
      [chatId, limit, offset]
    );
    return result.rows.reverse(); // Возвращаем в хронологическом порядке
  }

  // Получить количество сообщений в чате
  static async countByChatId(chatId) {
    const result = await query(
      'SELECT COUNT(*) as count FROM messages WHERE chat_id = $1 AND is_deleted = FALSE',
      [chatId]
    );
    return parseInt(result.rows[0].count);
  }

  // Обновить сообщение
  static async update(messageId, messageData) {
    const result = await query(
      `UPDATE messages 
       SET message_text = $1, is_edited = TRUE, edited_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE message_id = $2 RETURNING *`,
      [messageData.message_text, messageId]
    );
    return result.rows[0];
  }

  // Удалить сообщение (мягкое удаление)
  static async delete(messageId) {
    const result = await query(
      `UPDATE messages 
       SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP
       WHERE message_id = $1 RETURNING *`,
      [messageId]
    );
    return result.rows[0];
  }

  // Поиск сообщений по тексту
  static async search(chatId, searchText) {
    const result = await query(
      `SELECT m.*, u.username, u.first_name, u.last_name
       FROM messages m
       JOIN users u ON m.sender_id = u.user_id
       WHERE m.chat_id = $1 
         AND m.message_text ILIKE $2 
         AND m.is_deleted = FALSE
       ORDER BY m.created_at DESC`,
      [chatId, `%${searchText}%`]
    );
    return result.rows;
  }
}

module.exports = Message;


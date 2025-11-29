// Модель чата
const { query } = require('../../config/database');

class Chat {
  // Получить чат по ID
  static async findById(chatId) {
    const result = await query(
      'SELECT * FROM chats WHERE chat_id = $1',
      [chatId]
    );
    return result.rows[0];
  }

  // Создать новый чат
  static async create(chatData) {
    const {
      chat_name,
      chat_type,
      created_by,
      description,
      avatar_url
    } = chatData;

    const result = await query(
      `INSERT INTO chats (chat_name, chat_type, created_by, description, avatar_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [chat_name, chat_type, created_by, description, avatar_url]
    );
    return result.rows[0];
  }

  // Получить чаты пользователя
  static async findByUserId(userId) {
    const result = await query(
      `SELECT c.*, cp.last_read_at, cp.is_muted
       FROM chats c
       JOIN chat_participants cp ON c.chat_id = cp.chat_id
       WHERE cp.user_id = $1 AND cp.left_at IS NULL
       ORDER BY c.last_message_at DESC NULLS LAST`,
      [userId]
    );
    return result.rows;
  }

  // Обновить чат
  static async update(chatId, chatData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(chatData).forEach((key) => {
      if (chatData[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(chatData[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return await this.findById(chatId);
    }

    values.push(chatId);
    const result = await query(
      `UPDATE chats SET ${fields.join(', ')} WHERE chat_id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  // Добавить участника в чат
  static async addParticipant(chatId, userId, roleInChat = 'member') {
    const result = await query(
      `INSERT INTO chat_participants (chat_id, user_id, role_in_chat)
       VALUES ($1, $2, $3)
       ON CONFLICT (chat_id, user_id) DO UPDATE SET left_at = NULL, role_in_chat = $3
       RETURNING *`,
      [chatId, userId, roleInChat]
    );
    return result.rows[0];
  }

  // Получить участников чата
  static async getParticipants(chatId) {
    const result = await query(
      `SELECT u.*, cp.role_in_chat, cp.joined_at, cp.last_read_at
       FROM chat_participants cp
       JOIN users u ON cp.user_id = u.user_id
       WHERE cp.chat_id = $1 AND cp.left_at IS NULL
       ORDER BY cp.joined_at`,
      [chatId]
    );
    return result.rows;
  }
}

module.exports = Chat;


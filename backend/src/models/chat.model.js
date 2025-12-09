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
      description
    } = chatData;

    const result = await query(
      `INSERT INTO chats (chat_name, chat_type, created_by, description)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [chat_name, chat_type, created_by, description]
    );
    return result.rows[0];
  }

  // Получить чаты пользователя
  static async findByUserId(userId) {
    // Для приватных чатов получаем информацию о собеседнике
    const result = await query(
      `SELECT 
        c.*, 
        cp.last_read_at, 
        cp.is_muted,
        CASE 
          WHEN c.chat_type = 'private' THEN (
            SELECT json_build_object(
              'user_id', u.user_id,
              'first_name', u.first_name,
              'last_name', u.last_name,
              'middle_name', u.middle_name,
              'username', u.username,
              'avatar_url', u.avatar_url,
              'role_name', r.role_name
            )
            FROM chat_participants cp2
            JOIN users u ON cp2.user_id = u.user_id
            JOIN roles r ON u.role_id = r.role_id
            WHERE cp2.chat_id = c.chat_id 
              AND cp2.user_id != $1 
              AND cp2.left_at IS NULL
            LIMIT 1
          )
          ELSE NULL
        END as other_participant
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
      `SELECT u.*, r.role_name, cp.role_in_chat, cp.joined_at, cp.last_read_at
       FROM chat_participants cp
       JOIN users u ON cp.user_id = u.user_id
       JOIN roles r ON u.role_id = r.role_id
       WHERE cp.chat_id = $1 AND cp.left_at IS NULL
       ORDER BY cp.joined_at`,
      [chatId]
    );
    return result.rows;
  }

  // Найти приватный чат между двумя пользователями
  static async findPrivateChatBetweenUsers(userId1, userId2) {
    const result = await query(
      `SELECT c.*
       FROM chats c
       WHERE c.chat_type = 'private'
         AND EXISTS (
           SELECT 1 FROM chat_participants cp1
           WHERE cp1.chat_id = c.chat_id AND cp1.user_id = $1 AND cp1.left_at IS NULL
         )
         AND EXISTS (
           SELECT 1 FROM chat_participants cp2
           WHERE cp2.chat_id = c.chat_id AND cp2.user_id = $2 AND cp2.left_at IS NULL
         )
       LIMIT 1`,
      [userId1, userId2]
    );
    return result.rows[0] || null;
  }
}

module.exports = Chat;


// Модель сессий пользователей
const { query } = require('../../config/database');

class Session {
  // Создать новую сессию
  static async create(sessionData) {
    const {
      user_id,
      session_token,
      ip_address,
      user_agent,
      expires_at
    } = sessionData;

    const result = await query(
      `INSERT INTO user_sessions (
        user_id, session_token, ip_address, user_agent, expires_at
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [user_id, session_token, ip_address, user_agent, expires_at]
    );
    return result.rows[0];
  }

  // Найти сессию по токену
  static async findByToken(token) {
    const result = await query(
      `SELECT * FROM user_sessions 
       WHERE session_token = $1 
       AND is_active = TRUE 
       AND expires_at > CURRENT_TIMESTAMP`,
      [token]
    );
    return result.rows[0];
  }

  // Обновить время последней активности
  static async updateLastActivity(sessionId) {
    const result = await query(
      `UPDATE user_sessions 
       SET last_activity_at = CURRENT_TIMESTAMP 
       WHERE session_id = $1 
       RETURNING *`,
      [sessionId]
    );
    return result.rows[0];
  }

  // Деактивировать сессию (выход)
  static async deactivate(sessionId) {
    const result = await query(
      `UPDATE user_sessions 
       SET is_active = FALSE 
       WHERE session_id = $1 
       RETURNING *`,
      [sessionId]
    );
    return result.rows[0];
  }

  // Деактивировать все сессии пользователя
  static async deactivateAllUserSessions(userId) {
    const result = await query(
      `UPDATE user_sessions 
       SET is_active = FALSE 
       WHERE user_id = $1 
       RETURNING *`,
      [userId]
    );
    return result.rows;
  }

  // Получить все активные сессии пользователя
  static async getUserActiveSessions(userId) {
    const result = await query(
      `SELECT * FROM user_sessions 
       WHERE user_id = $1 
       AND is_active = TRUE 
       AND expires_at > CURRENT_TIMESTAMP
       ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  // Удалить истекшие сессии
  static async deleteExpired() {
    const result = await query(
      `DELETE FROM user_sessions 
       WHERE expires_at < CURRENT_TIMESTAMP`,
      []
    );
    return result.rowCount;
  }
}

module.exports = Session;


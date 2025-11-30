// Модель уведомлений
const { query } = require('../../config/database');

class Notification {
  // Создание уведомления
  static async create(notificationData) {
    const {
      user_id,
      notification_type,
      title,
      message,
      related_chat_id,
      related_message_id
    } = notificationData;

    const result = await query(
      `INSERT INTO notifications (
        user_id, notification_type, title, message,
        related_chat_id, related_message_id
      ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [user_id, notification_type, title, message, related_chat_id, related_message_id]
    );
    return result.rows[0];
  }

  // Получение уведомлений пользователя
  static async findByUserId(userId, limit = 50, offset = 0) {
    const result = await query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  }

  // Получение непрочитанных уведомлений
  static async findUnreadByUserId(userId) {
    const result = await query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 AND is_read = FALSE 
       ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  // Отметить уведомление как прочитанное
  static async markAsRead(notificationId, userId) {
    const result = await query(
      `UPDATE notifications 
       SET is_read = TRUE, read_at = CURRENT_TIMESTAMP 
       WHERE notification_id = $1 AND user_id = $2 
       RETURNING *`,
      [notificationId, userId]
    );
    return result.rows[0];
  }

  // Отметить все уведомления как прочитанные
  static async markAllAsRead(userId) {
    const result = await query(
      `UPDATE notifications 
       SET is_read = TRUE, read_at = CURRENT_TIMESTAMP 
       WHERE user_id = $1 AND is_read = FALSE 
       RETURNING *`,
      [userId]
    );
    return result.rows;
  }

  // Подсчет непрочитанных уведомлений
  static async countUnread(userId) {
    const result = await query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = FALSE',
      [userId]
    );
    return parseInt(result.rows[0].count);
  }
}

module.exports = Notification;


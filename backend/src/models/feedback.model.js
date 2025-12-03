// Модель обратной связи
const { query } = require('../../config/database');

class Feedback {
  // Создание обращения
  static async create(feedbackData) {
    const {
      user_id,
      name,
      email,
      subject,
      message
    } = feedbackData;

    const result = await query(
      `INSERT INTO feedback (user_id, name, email, subject, message)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [user_id, name, email, subject, message]
    );
    return result.rows[0];
  }

  // Получение всех обращений
  static async findAll(filters = {}) {
    let sql = 'SELECT * FROM feedback WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (filters.status) {
      sql += ` AND status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);
    return result.rows;
  }

  // Получение обращения по ID
  static async findById(feedbackId) {
    const result = await query(
      'SELECT * FROM feedback WHERE feedback_id = $1',
      [feedbackId]
    );
    return result.rows[0];
  }

  // Обновление обращения
  static async update(feedbackId, feedbackData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(feedbackData).forEach((key) => {
      if (feedbackData[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(feedbackData[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return await this.findById(feedbackId);
    }

    values.push(feedbackId);
    const result = await query(
      `UPDATE feedback SET ${fields.join(', ')} WHERE feedback_id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  }
}

module.exports = Feedback;


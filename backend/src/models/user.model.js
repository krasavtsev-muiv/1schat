// Модель пользователя
const { query } = require('../../config/database');

class User {
  // Получить пользователя по ID
  static async findById(userId) {
    const result = await query(
      'SELECT * FROM users WHERE user_id = $1',
      [userId]
    );
    return result.rows[0];
  }

  // Получить пользователя по username
  static async findByUsername(username) {
    const result = await query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    return result.rows[0];
  }

  // Создать нового пользователя
  static async create(userData) {
    const {
      username,
      password_hash,
      first_name,
      last_name,
      middle_name,
      phone,
      role_id,
      faculty,
      department,
      position,
      student_group,
      sync_1c_id
    } = userData;

    const result = await query(
      `INSERT INTO users (
        username, password_hash, first_name, last_name, middle_name,
        phone, role_id, faculty, department, position, student_group, sync_1c_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        username, password_hash, first_name, last_name, middle_name,
        phone, role_id, faculty, department, position, student_group, sync_1c_id
      ]
    );
    return result.rows[0];
  }

  // Обновить пользователя
  static async update(userId, userData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(userData).forEach((key) => {
      if (userData[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(userData[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return await this.findById(userId);
    }

    values.push(userId);
    const result = await query(
      `UPDATE users SET ${fields.join(', ')} WHERE user_id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  // Обновить время последнего онлайна
  static async updateLastOnline(userId) {
    const result = await query(
      'UPDATE users SET last_online = CURRENT_TIMESTAMP WHERE user_id = $1 RETURNING *',
      [userId]
    );
    return result.rows[0];
  }

  // Получить список пользователей с фильтрацией
  static async findAll(filters = {}) {
    let sql = 'SELECT u.*, r.role_name FROM users u JOIN roles r ON u.role_id = r.role_id WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (filters.role_id) {
      sql += ` AND u.role_id = $${paramCount}`;
      params.push(filters.role_id);
      paramCount++;
    }

    if (filters.is_active !== undefined) {
      sql += ` AND u.is_active = $${paramCount}`;
      params.push(filters.is_active);
      paramCount++;
    }

    if (filters.search) {
      sql += ` AND (u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount} OR u.username ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
      paramCount++;
    }

    sql += ' ORDER BY u.created_at DESC';

    const result = await query(sql, params);
    return result.rows;
  }
}

module.exports = User;


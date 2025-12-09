// Модель пользователя
const { query } = require('../../config/database');

class User {
  // Получить пользователя по ID
  static async findById(userId) {
    const result = await query(
      'SELECT u.*, r.role_name FROM users u JOIN roles r ON u.role_id = r.role_id WHERE u.user_id = $1',
      [userId]
    );
    return result.rows[0];
  }

  // Получить пользователя по username (только для пользователей с установленным username)
  static async findByUsername(username) {
    const result = await query(
      'SELECT u.*, r.role_name FROM users u JOIN roles r ON u.role_id = r.role_id WHERE u.username = $1 AND u.username IS NOT NULL',
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
      role_id,
      department,
      student_group,
      sync_1c_id
    } = userData;

    const result = await query(
      `INSERT INTO users (
        username, password_hash, first_name, last_name, middle_name,
        role_id, department, student_group, sync_1c_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        username, password_hash, first_name, last_name, middle_name,
        role_id, department, student_group, sync_1c_id
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

    // По умолчанию показываем только зарегистрированных пользователей (с username)
    // Это нужно для списка контактов - показываем только тех, с кем можно начать чат
    // Если onlyRegistered явно установлен в false, показываем всех (для админки)
    if (filters.onlyRegistered === undefined || filters.onlyRegistered === true) {
      sql += ` AND u.username IS NOT NULL`;
    }

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


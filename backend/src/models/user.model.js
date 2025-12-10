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

  // Получить контакты для студента (только студенты из той же группы или с пересекающимися дисциплинами, и преподаватели по дисциплинам)
  static async findContactsForStudent(studentId, filters = {}) {
    const params = [];
    let paramCount = 1;
    const logger = require('../utils/logger');

    // Получаем данные студента
    const student = await this.findById(studentId);
    if (!student || student.role_name !== 'student') {
      throw new Error('Пользователь не является студентом');
    }

    const studentGroup = student.student_group;
    logger.info(`[findContactsForStudent] Студент ${studentId}: группа="${studentGroup}"`);

    // Проверяем, есть ли у студента дисциплины
    const StudentDiscipline = require('./student-discipline.model');
    const studentDisciplines = await StudentDiscipline.findByStudentId(studentId);
    const hasDisciplines = studentDisciplines && studentDisciplines.length > 0;
    logger.info(`[findContactsForStudent] Студент ${studentId}: дисциплин=${studentDisciplines?.length || 0}, hasDisciplines=${hasDisciplines}`);

    // Базовый SQL для получения контактов
    let sql = `
      SELECT DISTINCT u.*, r.role_name
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      WHERE u.user_id != $${paramCount}
        AND u.username IS NOT NULL
        AND u.is_active = true
    `;
    params.push(studentId);
    paramCount++;

    // Условия фильтрации:
    // 1. Студенты из той же группы
    // 2. Студенты с пересекающимися дисциплинами (только если у студента есть дисциплины)
    // 3. Преподаватели по дисциплинам студента (только если у студента есть дисциплины)
    const conditions = [];

    // Условие 1: Студенты из той же группы
    if (studentGroup) {
      conditions.push(`(r.role_name = 'student' AND u.student_group = $${paramCount})`);
      params.push(studentGroup);
      paramCount++;
    }

    // Условие 2: Студенты с пересекающимися дисциплинами (только если у студента есть дисциплины)
    if (hasDisciplines) {
      conditions.push(`
        (r.role_name = 'student' AND EXISTS (
          SELECT 1
          FROM student_disciplines sd1
          JOIN student_disciplines sd2 ON sd1.discipline_id = sd2.discipline_id
          WHERE sd1.user_id = $${paramCount}
            AND sd2.user_id = u.user_id
        ))
      `);
      params.push(studentId);
      paramCount++;
    }

    // Условие 3: Преподаватели по дисциплинам студента (только если у студента есть дисциплины)
    if (hasDisciplines) {
      conditions.push(`
        (r.role_name = 'teacher' AND EXISTS (
          SELECT 1
          FROM student_disciplines sd
          JOIN teacher_disciplines td ON sd.discipline_id = td.discipline_id
          WHERE sd.user_id = $${paramCount}
            AND td.user_id = u.user_id
        ))
      `);
      params.push(studentId);
      paramCount++;
    }

    // Если нет условий, возвращаем пустой список
    if (conditions.length === 0) {
      return [];
    }

    sql += ` AND (${conditions.join(' OR ')})`;

    // Поиск по имени/фамилии
    if (filters.search) {
      sql += ` AND (u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount} OR u.username ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
      paramCount++;
    }

    sql += ' ORDER BY u.created_at DESC';

    logger.info(`[findContactsForStudent] SQL запрос для студента ${studentId}: ${sql.substring(0, 200)}...`);
    logger.info(`[findContactsForStudent] Параметры: ${JSON.stringify(params)}`);

    const result = await query(sql, params);
    logger.info(`[findContactsForStudent] Найдено контактов для студента ${studentId}: ${result.rows.length}`);
    
    return result.rows;
  }

  // Получить контакты для преподавателя (только студенты с пересекающимися дисциплинами)
  static async findContactsForTeacher(teacherId, filters = {}) {
    const params = [];
    let paramCount = 1;
    const logger = require('../utils/logger');

    // Получаем данные преподавателя
    const teacher = await this.findById(teacherId);
    if (!teacher || teacher.role_name !== 'teacher') {
      throw new Error('Пользователь не является преподавателем');
    }

    // Проверяем, есть ли у преподавателя дисциплины
    const TeacherDiscipline = require('./teacher-discipline.model');
    const teacherDisciplines = await TeacherDiscipline.findByTeacherId(teacherId);
    const hasDisciplines = teacherDisciplines && teacherDisciplines.length > 0;

    logger.info(`[findContactsForTeacher] Преподаватель ${teacherId}: дисциплин=${teacherDisciplines?.length || 0}, hasDisciplines=${hasDisciplines}`);

    // Если у преподавателя нет дисциплин, возвращаем пустой список
    if (!hasDisciplines) {
      logger.info(`[findContactsForTeacher] У преподавателя ${teacherId} нет дисциплин, возвращаем пустой список`);
      return [];
    }

    // Базовый SQL для получения контактов
    let sql = `
      SELECT DISTINCT u.*, r.role_name
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      WHERE u.user_id != $${paramCount}
        AND u.username IS NOT NULL
        AND u.is_active = true
        AND r.role_name = 'student'
    `;
    params.push(teacherId);
    paramCount++;

    // Условие: студенты с пересекающимися дисциплинами
    sql += `
      AND EXISTS (
        SELECT 1
        FROM teacher_disciplines td
        JOIN student_disciplines sd ON td.discipline_id = sd.discipline_id
        WHERE td.user_id = $${paramCount}
          AND sd.user_id = u.user_id
      )
    `;
    params.push(teacherId);
    paramCount++;

    // Поиск по имени/фамилии
    if (filters.search) {
      sql += ` AND (u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount} OR u.username ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
      paramCount++;
    }

    sql += ' ORDER BY u.created_at DESC';

    logger.info(`[findContactsForTeacher] SQL запрос для преподавателя ${teacherId}: ${sql.substring(0, 200)}...`);
    logger.info(`[findContactsForTeacher] Параметры: ${JSON.stringify(params)}`);

    const result = await query(sql, params);
    logger.info(`[findContactsForTeacher] Найдено контактов для преподавателя ${teacherId}: ${result.rows.length}`);
    
    return result.rows;
  }
}

module.exports = User;


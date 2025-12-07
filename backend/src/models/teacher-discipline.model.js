// Модель связи преподаватель-дисциплина
const { query } = require('../../config/database');

class TeacherDiscipline {
  // Получить связь по ID
  static async findById(relationId) {
    const result = await query(
      'SELECT * FROM teacher_disciplines WHERE relation_id = $1',
      [relationId]
    );
    return result.rows[0];
  }

  // Получить все дисциплины преподавателя
  static async findByTeacherId(teacherId) {
    const result = await query(
      `SELECT td.*, d.name as discipline_name, d.sync_1c_code as discipline_code
       FROM teacher_disciplines td
       JOIN disciplines d ON td.discipline_id = d.discipline_id
       WHERE td.user_id = $1`,
      [teacherId]
    );
    return result.rows;
  }

  // Получить всех преподавателей по дисциплине
  static async findByDisciplineId(disciplineId) {
    const result = await query(
      `SELECT td.*, u.first_name, u.last_name, u.middle_name
       FROM teacher_disciplines td
       JOIN users u ON td.user_id = u.user_id
       WHERE td.discipline_id = $1`,
      [disciplineId]
    );
    return result.rows;
  }

  // Проверить существование связи
  static async exists(teacherId, disciplineId) {
    const result = await query(
      'SELECT * FROM teacher_disciplines WHERE user_id = $1 AND discipline_id = $2',
      [teacherId, disciplineId]
    );
    return result.rows[0] || null;
  }

  // Создать связь
  static async create(teacherId, disciplineId) {
    const result = await query(
      `INSERT INTO teacher_disciplines (user_id, discipline_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, discipline_id) DO NOTHING
       RETURNING *`,
      [teacherId, disciplineId]
    );
    return result.rows[0];
  }

  // Удалить связь
  static async delete(teacherId, disciplineId) {
    const result = await query(
      'DELETE FROM teacher_disciplines WHERE user_id = $1 AND discipline_id = $2 RETURNING *',
      [teacherId, disciplineId]
    );
    return result.rows[0];
  }

  // Удалить все связи преподавателя
  static async deleteByTeacherId(teacherId) {
    const result = await query(
      'DELETE FROM teacher_disciplines WHERE user_id = $1 RETURNING *',
      [teacherId]
    );
    return result.rows;
  }

  // Удалить все связи по дисциплине
  static async deleteByDisciplineId(disciplineId) {
    const result = await query(
      'DELETE FROM teacher_disciplines WHERE discipline_id = $1 RETURNING *',
      [disciplineId]
    );
    return result.rows;
  }

  // Обновить связи преподавателя (удалить старые, создать новые)
  static async updateTeacherDisciplines(teacherId, disciplineIds) {
    // Удаляем все старые связи
    await this.deleteByTeacherId(teacherId);

    // Создаём новые связи
    const created = [];
    for (const disciplineId of disciplineIds) {
      const relation = await this.create(teacherId, disciplineId);
      if (relation) {
        created.push(relation);
      }
    }

    return created;
  }
}

module.exports = TeacherDiscipline;


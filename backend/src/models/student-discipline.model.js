// Модель связи студент-дисциплина
const { query } = require('../../config/database');

class StudentDiscipline {
  // Получить связь по ID
  static async findById(relationId) {
    const result = await query(
      'SELECT * FROM student_disciplines WHERE relation_id = $1',
      [relationId]
    );
    return result.rows[0];
  }

  // Получить все дисциплины студента
  static async findByStudentId(studentId) {
    const result = await query(
      `SELECT sd.*, d.name as discipline_name, d.sync_1c_code as discipline_code
       FROM student_disciplines sd
       JOIN disciplines d ON sd.discipline_id = d.discipline_id
       WHERE sd.user_id = $1`,
      [studentId]
    );
    return result.rows;
  }

  // Получить всех студентов по дисциплине
  static async findByDisciplineId(disciplineId) {
    const result = await query(
      `SELECT sd.*, u.first_name, u.last_name, u.middle_name, u.student_group
       FROM student_disciplines sd
       JOIN users u ON sd.user_id = u.user_id
       WHERE sd.discipline_id = $1`,
      [disciplineId]
    );
    return result.rows;
  }

  // Проверить существование связи
  static async exists(studentId, disciplineId) {
    const result = await query(
      'SELECT * FROM student_disciplines WHERE user_id = $1 AND discipline_id = $2',
      [studentId, disciplineId]
    );
    return result.rows[0] || null;
  }

  // Создать связь
  static async create(studentId, disciplineId) {
    const result = await query(
      `INSERT INTO student_disciplines (user_id, discipline_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, discipline_id) DO NOTHING
       RETURNING *`,
      [studentId, disciplineId]
    );
    return result.rows[0];
  }

  // Удалить связь
  static async delete(studentId, disciplineId) {
    const result = await query(
      'DELETE FROM student_disciplines WHERE user_id = $1 AND discipline_id = $2 RETURNING *',
      [studentId, disciplineId]
    );
    return result.rows[0];
  }

  // Удалить все связи студента
  static async deleteByStudentId(studentId) {
    const result = await query(
      'DELETE FROM student_disciplines WHERE user_id = $1 RETURNING *',
      [studentId]
    );
    return result.rows;
  }

  // Удалить все связи по дисциплине
  static async deleteByDisciplineId(disciplineId) {
    const result = await query(
      'DELETE FROM student_disciplines WHERE discipline_id = $1 RETURNING *',
      [disciplineId]
    );
    return result.rows;
  }

  // Обновить связи студента (удалить старые, создать новые)
  static async updateStudentDisciplines(studentId, disciplineIds) {
    // Удаляем все старые связи
    await this.deleteByStudentId(studentId);

    // Создаём новые связи
    const created = [];
    for (const disciplineId of disciplineIds) {
      const relation = await this.create(studentId, disciplineId);
      if (relation) {
        created.push(relation);
      }
    }

    return created;
  }
}

module.exports = StudentDiscipline;


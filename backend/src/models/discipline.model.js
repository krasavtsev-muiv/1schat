// Модель дисциплины
const { query } = require('../../config/database');

class Discipline {
  // Получить дисциплину по ID
  static async findById(disciplineId) {
    const result = await query(
      'SELECT * FROM disciplines WHERE discipline_id = $1',
      [disciplineId]
    );
    return result.rows[0];
  }

  // Получить дисциплину по названию
  static async findByName(name) {
    const result = await query(
      'SELECT * FROM disciplines WHERE name = $1',
      [name]
    );
    return result.rows[0];
  }

  // Получить дисциплину по коду из 1С
  static async findBy1CCode(code) {
    const result = await query(
      'SELECT * FROM disciplines WHERE sync_1c_code = $1',
      [code]
    );
    return result.rows[0];
  }

  // Получить дисциплины по кафедре
  static async findByDepartment(departmentId) {
    const result = await query(
      'SELECT * FROM disciplines WHERE department_id = $1 ORDER BY name',
      [departmentId]
    );
    return result.rows;
  }

  // Создать новую дисциплину
  static async create(disciplineData) {
    const {
      name,
      department_id,
      sync_1c_code,
      description,
    } = disciplineData;

    const result = await query(
      `INSERT INTO disciplines (name, department_id, sync_1c_code, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, department_id, sync_1c_code, description]
    );
    return result.rows[0];
  }

  // Обновить дисциплину
  static async update(disciplineId, disciplineData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(disciplineData).forEach((key) => {
      if (disciplineData[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(disciplineData[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return await this.findById(disciplineId);
    }

    values.push(disciplineId);
    const result = await query(
      `UPDATE disciplines SET ${fields.join(', ')} WHERE discipline_id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  // Получить все дисциплины
  static async findAll() {
    const result = await query(
      'SELECT d.*, dep.name as department_name FROM disciplines d LEFT JOIN departments dep ON d.department_id = dep.department_id ORDER BY d.name'
    );
    return result.rows;
  }

  // Создать или получить существующую дисциплину
  static async findOrCreate(disciplineData) {
    const { name, sync_1c_code, department_id } = disciplineData;

    // Сначала ищем по коду 1С
    if (sync_1c_code) {
      const existing = await this.findBy1CCode(sync_1c_code);
      if (existing) {
        return existing;
      }
    }

    // Затем ищем по названию и кафедре
    if (name && department_id) {
      const result = await query(
        'SELECT * FROM disciplines WHERE name = $1 AND department_id = $2',
        [name, department_id]
      );
      if (result.rows[0]) {
        return result.rows[0];
      }
    }

    // Создаём новую
    return await this.create(disciplineData);
  }
}

module.exports = Discipline;


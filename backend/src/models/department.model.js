// Модель кафедры
const { query } = require('../../config/database');

class Department {
  // Получить кафедру по ID
  static async findById(departmentId) {
    const result = await query(
      'SELECT * FROM departments WHERE department_id = $1',
      [departmentId]
    );
    return result.rows[0];
  }

  // Получить кафедру по названию
  static async findByName(name) {
    const result = await query(
      'SELECT * FROM departments WHERE name = $1',
      [name]
    );
    return result.rows[0];
  }

  // Получить кафедру по коду из 1С
  static async findBy1CCode(code) {
    const result = await query(
      'SELECT * FROM departments WHERE sync_1c_code = $1',
      [code]
    );
    return result.rows[0];
  }

  // Создать новую кафедру
  static async create(departmentData) {
    const {
      name,
      sync_1c_code,
      description,
    } = departmentData;

    const result = await query(
      `INSERT INTO departments (name, sync_1c_code, description)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, sync_1c_code, description]
    );
    return result.rows[0];
  }

  // Обновить кафедру
  static async update(departmentId, departmentData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(departmentData).forEach((key) => {
      if (departmentData[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(departmentData[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return await this.findById(departmentId);
    }

    values.push(departmentId);
    const result = await query(
      `UPDATE departments SET ${fields.join(', ')} WHERE department_id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  // Получить все кафедры
  static async findAll() {
    const result = await query(
      'SELECT * FROM departments ORDER BY name'
    );
    return result.rows;
  }

  // Создать или получить существующую кафедру
  static async findOrCreate(departmentData) {
    const { name, sync_1c_code } = departmentData;

    // Сначала ищем по коду 1С
    if (sync_1c_code) {
      const existing = await this.findBy1CCode(sync_1c_code);
      if (existing) {
        return existing;
      }
    }

    // Затем ищем по названию
    if (name) {
      const existing = await this.findByName(name);
      if (existing) {
        return existing;
      }
    }

    // Создаём новую
    return await this.create(departmentData);
  }
}

module.exports = Department;


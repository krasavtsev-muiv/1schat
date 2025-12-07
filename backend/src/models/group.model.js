// Модель группы
const { query } = require('../../config/database');

class Group {
  // Получить группу по ID
  static async findById(groupId) {
    const result = await query(
      'SELECT * FROM groups WHERE group_id = $1',
      [groupId]
    );
    return result.rows[0];
  }

  // Получить группу по названию
  static async findByName(name) {
    const result = await query(
      'SELECT * FROM groups WHERE name = $1',
      [name]
    );
    return result.rows[0];
  }

  // Получить группу по коду из 1С
  static async findBy1CCode(code) {
    const result = await query(
      'SELECT * FROM groups WHERE sync_1c_code = $1',
      [code]
    );
    return result.rows[0];
  }

  // Получить группы по кафедре
  static async findByDepartment(departmentId) {
    const result = await query(
      'SELECT * FROM groups WHERE department_id = $1 ORDER BY name',
      [departmentId]
    );
    return result.rows;
  }

  // Создать новую группу
  static async create(groupData) {
    const {
      name,
      department_id,
      sync_1c_code,
      description,
    } = groupData;

    const result = await query(
      `INSERT INTO groups (name, department_id, sync_1c_code, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, department_id, sync_1c_code, description]
    );
    return result.rows[0];
  }

  // Обновить группу
  static async update(groupId, groupData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(groupData).forEach((key) => {
      if (groupData[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(groupData[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return await this.findById(groupId);
    }

    values.push(groupId);
    const result = await query(
      `UPDATE groups SET ${fields.join(', ')} WHERE group_id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  // Получить все группы
  static async findAll() {
    const result = await query(
      'SELECT g.*, d.name as department_name FROM groups g LEFT JOIN departments d ON g.department_id = d.department_id ORDER BY g.name'
    );
    return result.rows;
  }

  // Создать или получить существующую группу
  static async findOrCreate(groupData) {
    const { name, sync_1c_code, department_id } = groupData;

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
        'SELECT * FROM groups WHERE name = $1 AND department_id = $2',
        [name, department_id]
      );
      if (result.rows[0]) {
        return result.rows[0];
      }
    }

    // Создаём новую
    return await this.create(groupData);
  }
}

module.exports = Group;


// Модель файлов сообщений
const { query } = require('../../config/database');

class MessageFile {
  // Создание записи о файле
  static async create(fileData) {
    const {
      message_id,
      file_name,
      file_path,
      file_type,
      file_size,
      thumbnail_path
    } = fileData;

    const result = await query(
      `INSERT INTO message_files (
        message_id, file_name, file_path, file_type, file_size, thumbnail_path
      ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [message_id, file_name, file_path, file_type, file_size, thumbnail_path]
    );
    return result.rows[0];
  }

  // Получение файлов сообщения
  static async findByMessageId(messageId) {
    const result = await query(
      'SELECT * FROM message_files WHERE message_id = $1',
      [messageId]
    );
    return result.rows;
  }

  // Получение файла по ID
  static async findById(fileId) {
    const result = await query(
      'SELECT * FROM message_files WHERE file_id = $1',
      [fileId]
    );
    return result.rows[0];
  }

  // Удаление файла
  static async delete(fileId) {
    const result = await query(
      'DELETE FROM message_files WHERE file_id = $1 RETURNING *',
      [fileId]
    );
    return result.rows[0];
  }
}

module.exports = MessageFile;


// Сервис для экспорта истории чатов
const { query } = require('../../config/database');
const fs = require('fs');
const path = require('path');

class ExportService {
  // Экспорт в CSV
  async exportToCSV(chatIds, dateFrom, dateTo, userId) {
    try {
      let sql = `
        SELECT 
          m.message_id,
          m.created_at,
          u.username,
          u.first_name,
          u.last_name,
          c.chat_name,
          m.message_text
        FROM messages m
        JOIN users u ON m.sender_id = u.user_id
        JOIN chats c ON m.chat_id = c.chat_id
        WHERE m.is_deleted = FALSE
      `;

      const params = [];
      let paramCount = 1;

      if (chatIds && chatIds.length > 0) {
        sql += ` AND m.chat_id = ANY($${paramCount}::int[])`;
        params.push(chatIds);
        paramCount++;
      }

      if (dateFrom) {
        sql += ` AND m.created_at >= $${paramCount}`;
        params.push(dateFrom);
        paramCount++;
      }

      if (dateTo) {
        sql += ` AND m.created_at <= $${paramCount}`;
        params.push(dateTo);
        paramCount++;
      }

      sql += ` ORDER BY m.created_at`;

      const result = await query(sql, params);

      // Формирование CSV
      let csv = 'ID,Дата,Отправитель,Имя,Фамилия,Чат,Сообщение\n';
      result.rows.forEach(row => {
        const date = new Date(row.created_at).toLocaleString('ru-RU');
        const message = (row.message_text || '').replace(/"/g, '""');
        csv += `${row.message_id},"${date}","${row.username}","${row.first_name}","${row.last_name}","${row.chat_name}","${message}"\n`;
      });

      return csv;
    } catch (error) {
      console.error('Ошибка экспорта в CSV:', error);
      throw error;
    }
  }

  // Экспорт в JSON
  async exportToJSON(chatIds, dateFrom, dateTo, userId) {
    try {
      let sql = `
        SELECT 
          m.*,
          u.username,
          u.first_name,
          u.last_name,
          u.avatar_url,
          c.chat_name,
          c.chat_type
        FROM messages m
        JOIN users u ON m.sender_id = u.user_id
        JOIN chats c ON m.chat_id = c.chat_id
        WHERE m.is_deleted = FALSE
      `;

      const params = [];
      let paramCount = 1;

      if (chatIds && chatIds.length > 0) {
        sql += ` AND m.chat_id = ANY($${paramCount}::int[])`;
        params.push(chatIds);
        paramCount++;
      }

      if (dateFrom) {
        sql += ` AND m.created_at >= $${paramCount}`;
        params.push(dateFrom);
        paramCount++;
      }

      if (dateTo) {
        sql += ` AND m.created_at <= $${paramCount}`;
        params.push(dateTo);
        paramCount++;
      }

      sql += ` ORDER BY m.created_at`;

      const result = await query(sql, params);
      return JSON.stringify(result.rows, null, 2);
    } catch (error) {
      console.error('Ошибка экспорта в JSON:', error);
      throw error;
    }
  }

  // Сохранение экспортированного файла
  async saveExportFile(userId, exportType, content, chatIds, dateFrom, dateTo) {
    try {
      const exportDir = path.join(__dirname, '../../../exports');
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }

      const timestamp = Date.now();
      const extension = exportType === 'csv' ? 'csv' : 'json';
      const fileName = `export_${userId}_${timestamp}.${extension}`;
      const filePath = path.join(exportDir, fileName);

      fs.writeFileSync(filePath, content, 'utf8');
      const fileSize = fs.statSync(filePath).size;

      // Сохранение записи об экспорте в БД
      const result = await query(
        `INSERT INTO export_history (
          user_id, export_type, chat_ids, date_from, date_to, file_path, file_size, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'completed')
        RETURNING *`,
        [userId, exportType, JSON.stringify(chatIds), dateFrom, dateTo, filePath, fileSize]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Ошибка сохранения экспорта:', error);
      throw error;
    }
  }
}

module.exports = new ExportService();


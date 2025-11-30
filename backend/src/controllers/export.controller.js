// Контроллер для экспорта данных
const exportService = require('../services/export.service');
const { query } = require('../../config/database');

// Экспорт истории чатов
const exportChatHistory = async (req, res) => {
  try {
    const { chat_ids, date_from, date_to, export_type } = req.body;
    const userId = req.userId;

    // Валидация
    if (!export_type || !['csv', 'json'].includes(export_type)) {
      return res.status(400).json({ error: 'Недопустимый тип экспорта' });
    }

    // Проверка прав доступа к чатам (только свои чаты)
    if (chat_ids && chat_ids.length > 0) {
      const result = await query(
        `SELECT chat_id FROM chat_participants 
         WHERE chat_id = ANY($1::int[]) AND user_id = $2 AND left_at IS NULL`,
        [chat_ids, userId]
      );
      
      if (result.rows.length !== chat_ids.length) {
        return res.status(403).json({ error: 'Нет доступа к одному или нескольким чатам' });
      }
    }

    // Экспорт данных
    let content;
    if (export_type === 'csv') {
      content = await exportService.exportToCSV(chat_ids, date_from, date_to, userId);
    } else {
      content = await exportService.exportToJSON(chat_ids, date_from, date_to, userId);
    }

    // Сохранение файла
    const exportRecord = await exportService.saveExportFile(
      userId,
      export_type,
      content,
      chat_ids,
      date_from,
      date_to
    );

    res.json({
      message: 'Экспорт успешно выполнен',
      export: exportRecord
    });
  } catch (error) {
    console.error('Ошибка экспорта:', error);
    res.status(500).json({ error: 'Ошибка при выполнении экспорта' });
  }
};

// Получение истории экспортов пользователя
const getExportHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const result = await query(
      'SELECT * FROM export_history WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.json({ exports: result.rows });
  } catch (error) {
    console.error('Ошибка получения истории экспортов:', error);
    res.status(500).json({ error: 'Ошибка при получении истории экспортов' });
  }
};

module.exports = {
  exportChatHistory,
  getExportHistory,
};


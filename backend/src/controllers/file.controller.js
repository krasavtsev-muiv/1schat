// Контроллер для работы с файлами
const { query } = require('../../config/database');
const path = require('path');
const fs = require('fs');

// Загрузка файла
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не был загружен' });
    }

    const { messageId } = req.body;
    if (!messageId) {
      // Удаляем файл, если нет messageId
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'ID сообщения обязателен' });
    }

    // Сохранение информации о файле в БД
    const result = await query(
      `INSERT INTO message_files (message_id, file_name, file_path, file_type, file_size)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        messageId,
        req.file.originalname,
        req.file.path,
        req.file.mimetype,
        req.file.size
      ]
    );

    res.status(201).json({
      message: 'Файл успешно загружен',
      file: result.rows[0]
    });
  } catch (error) {
    console.error('Ошибка загрузки файла:', error);
    // Удаляем файл при ошибке
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Ошибка при загрузке файла' });
  }
};

// Скачивание файла
const downloadFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    const result = await query(
      'SELECT * FROM message_files WHERE file_id = $1',
      [fileId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Файл не найден' });
    }

    const file = result.rows[0];
    const filePath = path.join(__dirname, '../../..', file.file_path);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Файл не найден на диске' });
    }

    res.download(filePath, file.file_name);
  } catch (error) {
    console.error('Ошибка скачивания файла:', error);
    res.status(500).json({ error: 'Ошибка при скачивании файла' });
  }
};

// Получение информации о файле
const getFileInfo = async (req, res) => {
  try {
    const { fileId } = req.params;

    const result = await query(
      'SELECT * FROM message_files WHERE file_id = $1',
      [fileId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Файл не найден' });
    }

    res.json({ file: result.rows[0] });
  } catch (error) {
    console.error('Ошибка получения информации о файле:', error);
    res.status(500).json({ error: 'Ошибка при получении информации о файле' });
  }
};

module.exports = {
  uploadFile,
  downloadFile,
  getFileInfo,
};


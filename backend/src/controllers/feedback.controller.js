// Контроллер для обратной связи
const { query } = require('../../config/database');

// Создание обращения обратной связи
const createFeedback = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    const userId = req.userId || null; // Может быть null для анонимных обращений

    const result = await query(
      `INSERT INTO feedback (user_id, name, email, subject, message)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, name, email, subject, message]
    );

    res.status(201).json({
      message: 'Обращение успешно отправлено',
      feedback: result.rows[0]
    });
  } catch (error) {
    console.error('Ошибка создания обращения:', error);
    res.status(500).json({ error: 'Ошибка при отправке обращения' });
  }
};

// Получение обращений (только для администраторов)
const getFeedbackList = async (req, res) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT * FROM feedback WHERE 1=1';
    const params = [];

    if (status) {
      sql += ' AND status = $1';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);
    res.json({ feedback: result.rows });
  } catch (error) {
    console.error('Ошибка получения обращений:', error);
    res.status(500).json({ error: 'Ошибка при получении обращений' });
  }
};

// Ответ на обращение
const respondToFeedback = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const { admin_response } = req.body;
    const userId = req.userId;

    const result = await query(
      `UPDATE feedback 
       SET admin_response = $1, responded_by = $2, responded_at = CURRENT_TIMESTAMP, status = 'resolved'
       WHERE feedback_id = $3 RETURNING *`,
      [admin_response, userId, feedbackId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Обращение не найдено' });
    }

    res.json({
      message: 'Ответ успешно добавлен',
      feedback: result.rows[0]
    });
  } catch (error) {
    console.error('Ошибка ответа на обращение:', error);
    res.status(500).json({ error: 'Ошибка при добавлении ответа' });
  }
};

module.exports = {
  createFeedback,
  getFeedbackList,
  respondToFeedback,
};


// Контроллер для обратной связи
const { query } = require('../../config/database');
const emailService = require('../services/email.service');
const User = require('../models/user.model');

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
    let sql = `SELECT f.*, 
                      u.username, u.first_name, u.last_name,
                      r.first_name as responder_first_name, r.last_name as responder_last_name
               FROM feedback f
               LEFT JOIN users u ON f.user_id = u.user_id
               LEFT JOIN users r ON f.responded_by = r.user_id
               WHERE 1=1`;
    const params = [];
    let paramCount = 1;

    if (status) {
      sql += ` AND f.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    sql += ' ORDER BY f.created_at DESC';

    const result = await query(sql, params);
    res.json({ feedback: result.rows });
  } catch (error) {
    console.error('Ошибка получения обращений:', error);
    res.status(500).json({ error: 'Ошибка при получении обращений' });
  }
};

// Получение обращения по ID (только для администраторов)
const getFeedbackById = async (req, res) => {
  try {
    const { feedbackId } = req.params;

    const result = await query(
      `SELECT f.*, 
              u.username, u.first_name, u.last_name,
              r.role_name as responder_role
       FROM feedback f
       LEFT JOIN users u ON f.user_id = u.user_id
       LEFT JOIN users r ON f.responded_by = r.user_id
       LEFT JOIN roles ro ON r.role_id = ro.role_id
       WHERE f.feedback_id = $1`,
      [feedbackId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Обращение не найдено' });
    }

    res.json({ feedback: result.rows[0] });
  } catch (error) {
    console.error('Ошибка получения обращения:', error);
    res.status(500).json({ error: 'Ошибка при получении обращения' });
  }
};

// Обновление статуса обращения (только для администраторов)
const updateFeedbackStatus = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const { status } = req.body;

    const validStatuses = ['new', 'in_progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Недопустимый статус' });
    }

    const result = await query(
      `UPDATE feedback 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE feedback_id = $2 RETURNING *`,
      [status, feedbackId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Обращение не найдено' });
    }

    res.json({
      message: 'Статус успешно обновлен',
      feedback: result.rows[0]
    });
  } catch (error) {
    console.error('Ошибка обновления статуса:', error);
    res.status(500).json({ error: 'Ошибка при обновлении статуса' });
  }
};

// Ответ на обращение
const respondToFeedback = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const { admin_response, status } = req.body;
    const userId = req.userId;

    // Получаем информацию об обращении перед обновлением
    const feedbackResult = await query(
      'SELECT * FROM feedback WHERE feedback_id = $1',
      [feedbackId]
    );

    if (feedbackResult.rows.length === 0) {
      return res.status(404).json({ error: 'Обращение не найдено' });
    }

    const feedback = feedbackResult.rows[0];
    const updateStatus = status || 'resolved';

    // Обновляем обращение
    const result = await query(
      `UPDATE feedback 
       SET admin_response = $1, responded_by = $2, responded_at = CURRENT_TIMESTAMP, 
           status = $3, updated_at = CURRENT_TIMESTAMP
       WHERE feedback_id = $4 RETURNING *`,
      [admin_response, userId, updateStatus, feedbackId]
    );

    // Получаем информацию об администраторе для email
    let adminName = null;
    if (userId) {
      try {
        const admin = await User.findById(userId);
        if (admin) {
          adminName = `${admin.first_name} ${admin.last_name}`.trim();
        }
      } catch (err) {
        console.error('Ошибка получения информации об администраторе:', err);
      }
    }

    // Отправляем email с ответом
    try {
      await emailService.sendFeedbackResponse({
        email: feedback.email,
        name: feedback.name,
        subject: feedback.subject,
        admin_response: admin_response,
        admin_name: adminName,
      });
    } catch (emailError) {
      // Логируем ошибку, но не прерываем выполнение
      console.error('Ошибка отправки email (ответ все равно сохранен):', emailError);
    }

    res.json({
      message: 'Ответ успешно добавлен и отправлен на email',
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
  getFeedbackById,
  updateFeedbackStatus,
  respondToFeedback,
};


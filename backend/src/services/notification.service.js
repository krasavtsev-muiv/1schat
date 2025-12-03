// Сервис для работы с уведомлениями
const Notification = require('../models/notification.model');
const { getSocket } = require('../../server');

// Создание уведомления о новом сообщении
const createMessageNotification = async (message, chat, recipientId) => {
  try {
    const notification = await Notification.create({
      user_id: recipientId,
      notification_type: 'message',
      title: 'Новое сообщение',
      message: `Новое сообщение в чате "${chat.chat_name || 'Без названия'}"`,
      related_chat_id: chat.chat_id,
      related_message_id: message.message_id,
    });

    // Отправка уведомления через WebSocket
    const io = getSocket();
    if (io) {
      io.to(`user_${recipientId}`).emit('new_notification', notification);
    }

    return notification;
  } catch (error) {
    console.error('Ошибка создания уведомления:', error);
    throw error;
  }
};

// Создание системного уведомления
const createSystemNotification = async (userId, title, message, relatedData = {}) => {
  try {
    const notification = await Notification.create({
      user_id: userId,
      notification_type: 'system',
      title,
      message,
      related_chat_id: relatedData.chat_id,
      related_message_id: relatedData.message_id,
    });

    // Отправка через WebSocket
    const io = getSocket();
    if (io) {
      io.to(`user_${userId}`).emit('new_notification', notification);
    }

    return notification;
  } catch (error) {
    console.error('Ошибка создания системного уведомления:', error);
    throw error;
  }
};

module.exports = {
  createMessageNotification,
  createSystemNotification,
};


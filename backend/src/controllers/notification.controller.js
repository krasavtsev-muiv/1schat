// Контроллер для уведомлений
const Notification = require('../models/notification.model');

// Получение уведомлений пользователя
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.userId;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const notifications = await Notification.findByUserId(userId, limit, offset);
    res.json({ notifications });
  } catch (error) {
    console.error('Ошибка получения уведомлений:', error);
    res.status(500).json({ error: 'Ошибка при получении уведомлений' });
  }
};

// Получение непрочитанных уведомлений
const getUnreadNotifications = async (req, res) => {
  try {
    const userId = req.userId;
    const notifications = await Notification.findUnreadByUserId(userId);
    const count = await Notification.countUnread(userId);
    
    res.json({ notifications, unreadCount: count });
  } catch (error) {
    console.error('Ошибка получения непрочитанных уведомлений:', error);
    res.status(500).json({ error: 'Ошибка при получении уведомлений' });
  }
};

// Отметить уведомление как прочитанное
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.userId;

    const notification = await Notification.markAsRead(notificationId, userId);
    if (!notification) {
      return res.status(404).json({ error: 'Уведомление не найдено' });
    }

    res.json({ message: 'Уведомление отмечено как прочитанное', notification });
  } catch (error) {
    console.error('Ошибка отметки уведомления:', error);
    res.status(500).json({ error: 'Ошибка при отметке уведомления' });
  }
};

// Отметить все уведомления как прочитанные
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.userId;
    const notifications = await Notification.markAllAsRead(userId);
    
    res.json({ message: 'Все уведомления отмечены как прочитанные', count: notifications.length });
  } catch (error) {
    console.error('Ошибка отметки всех уведомлений:', error);
    res.status(500).json({ error: 'Ошибка при отметке уведомлений' });
  }
};

module.exports = {
  getUserNotifications,
  getUnreadNotifications,
  markAsRead,
  markAllAsRead,
};


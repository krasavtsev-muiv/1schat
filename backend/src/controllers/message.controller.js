// Контроллер для работы с сообщениями
const Message = require('../models/message.model');
const Chat = require('../models/chat.model');

// Отправка сообщения
const sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { message_text, message_type, forwarded_from_message_id, forwarded_from_user_id } = req.body;
    const senderId = req.userId;

    // Проверка существования чата
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Чат не найден' });
    }

    // Создание сообщения
    const message = await Message.create({
      chat_id: chatId,
      sender_id: senderId,
      message_text,
      message_type: message_type || 'text',
      forwarded_from_message_id,
      forwarded_from_user_id
    });

    res.status(201).json({
      message: 'Сообщение успешно отправлено',
      message: message
    });
  } catch (error) {
    console.error('Ошибка отправки сообщения:', error);
    res.status(500).json({ error: 'Ошибка при отправке сообщения' });
  }
};

// Получение сообщений чата
const getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const messages = await Message.findByChatId(chatId, limit, offset);
    const total = await Message.countByChatId(chatId);

    res.json({
      messages,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    console.error('Ошибка получения сообщений:', error);
    res.status(500).json({ error: 'Ошибка при получении сообщений' });
  }
};

// Редактирование сообщения
const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { message_text } = req.body;
    const userId = req.userId;

    // Проверка, что сообщение принадлежит пользователю
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Сообщение не найдено' });
    }

    if (message.sender_id !== userId) {
      return res.status(403).json({ error: 'Вы можете редактировать только свои сообщения' });
    }

    const updatedMessage = await Message.update(messageId, { message_text });

    res.json({
      message: 'Сообщение успешно отредактировано',
      message: updatedMessage
    });
  } catch (error) {
    console.error('Ошибка редактирования сообщения:', error);
    res.status(500).json({ error: 'Ошибка при редактировании сообщения' });
  }
};

// Удаление сообщения
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId;

    // Проверка, что сообщение принадлежит пользователю
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Сообщение не найдено' });
    }

    if (message.sender_id !== userId) {
      return res.status(403).json({ error: 'Вы можете удалять только свои сообщения' });
    }

    await Message.delete(messageId);

    res.json({ message: 'Сообщение успешно удалено' });
  } catch (error) {
    console.error('Ошибка удаления сообщения:', error);
    res.status(500).json({ error: 'Ошибка при удалении сообщения' });
  }
};

// Поиск сообщений
const searchMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Параметр поиска обязателен' });
    }

    const messages = await Message.search(chatId, q);
    res.json({ messages });
  } catch (error) {
    console.error('Ошибка поиска сообщений:', error);
    res.status(500).json({ error: 'Ошибка при поиске сообщений' });
  }
};

module.exports = {
  sendMessage,
  getChatMessages,
  editMessage,
  deleteMessage,
  searchMessages,
};


// Контроллер для работы с чатами
const Chat = require('../models/chat.model');
const Message = require('../models/message.model');
const User = require('../models/user.model');

// Создание нового чата
const createChat = async (req, res) => {
  try {
    const { chat_name, chat_type, description, participant_ids } = req.body;
    const userId = req.userId;

    // Создание чата
    const chat = await Chat.create({
      chat_name,
      chat_type: chat_type || 'private',
      created_by: userId,
      description
    });

    // Добавление создателя в участники
    await Chat.addParticipant(chat.chat_id, userId, 'owner');

    // Добавление других участников
    if (participant_ids && Array.isArray(participant_ids)) {
      for (const participantId of participant_ids) {
        if (participantId !== userId) {
          await Chat.addParticipant(chat.chat_id, participantId);
        }
      }
    }

    res.status(201).json({
      message: 'Чат успешно создан',
      chat
    });
  } catch (error) {
    console.error('Ошибка создания чата:', error);
    res.status(500).json({ error: 'Ошибка при создании чата' });
  }
};

// Получение списка чатов пользователя
const getUserChats = async (req, res) => {
  try {
    const userId = req.userId;
    const chats = await Chat.findByUserId(userId);
    res.json({ chats });
  } catch (error) {
    console.error('Ошибка получения чатов:', error);
    res.status(500).json({ error: 'Ошибка при получении списка чатов' });
  }
};

// Получение информации о чате
const getChatById = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return res.status(404).json({ error: 'Чат не найден' });
    }

    const participants = await Chat.getParticipants(chatId);
    
    res.json({
      chat,
      participants
    });
  } catch (error) {
    console.error('Ошибка получения чата:', error);
    res.status(500).json({ error: 'Ошибка при получении информации о чате' });
  }
};

// Добавление участника в чат
const addParticipant = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId, roleInChat } = req.body;

    await Chat.addParticipant(chatId, userId, roleInChat || 'member');
    
    res.json({ message: 'Участник успешно добавлен в чат' });
  } catch (error) {
    console.error('Ошибка добавления участника:', error);
    res.status(500).json({ error: 'Ошибка при добавлении участника' });
  }
};

module.exports = {
  createChat,
  getUserChats,
  getChatById,
  addParticipant,
};


// Контроллер для работы с чатами
const Chat = require('../models/chat.model');
const Message = require('../models/message.model');
const User = require('../models/user.model');

// Создание нового чата
const createChat = async (req, res) => {
  try {
    const { chat_name, chat_type, description, participant_ids } = req.body;
    const userId = req.userId;

    // Получаем информацию о текущем пользователе
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Проверка прав: не-администраторы не могут создавать чаты с администраторами
    if (participant_ids && Array.isArray(participant_ids) && currentUser.role_name !== 'admin') {
      for (const participantId of participant_ids) {
        const participant = await User.findById(participantId);
        if (participant && participant.role_name === 'admin') {
          return res.status(403).json({ 
            error: 'Вы не можете создать чат с администратором. Только администратор может инициировать чат с другими администраторами.' 
          });
        }
      }
    }

    // Для приватных чатов проверяем, не существует ли уже чат с этим пользователем
    if (chat_type === 'private' && participant_ids && participant_ids.length === 1) {
      const existingChat = await Chat.findPrivateChatBetweenUsers(userId, participant_ids[0]);
      if (existingChat) {
        // Возвращаем существующий чат с информацией о собеседнике
        const participants = await Chat.getParticipants(existingChat.chat_id);
        const otherParticipant = participants.find(p => p.user_id !== userId);
        
        // Формируем объект чата с информацией о собеседнике (как в getUserChats)
        const chatWithParticipant = {
          ...existingChat,
          other_participant: otherParticipant ? {
            user_id: otherParticipant.user_id,
            first_name: otherParticipant.first_name,
            last_name: otherParticipant.last_name,
            middle_name: otherParticipant.middle_name,
            username: otherParticipant.username,
            avatar_url: otherParticipant.avatar_url,
            role_name: otherParticipant.role_name
          } : null
        };
        
        return res.json({
          message: 'Чат уже существует',
          chat: chatWithParticipant,
          participants
        });
      }
    }

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

    // Для приватных чатов добавляем информацию о собеседнике
    let chatWithParticipant = chat;
    if (chat.chat_type === 'private' && participant_ids && participant_ids.length === 1) {
      const participants = await Chat.getParticipants(chat.chat_id);
      const otherParticipant = participants.find(p => p.user_id !== userId);
      
      if (otherParticipant) {
        chatWithParticipant = {
          ...chat,
          other_participant: {
            user_id: otherParticipant.user_id,
            first_name: otherParticipant.first_name,
            last_name: otherParticipant.last_name,
            middle_name: otherParticipant.middle_name,
            username: otherParticipant.username,
            avatar_url: otherParticipant.avatar_url,
            role_name: otherParticipant.role_name
          }
        };
      }
    }

    res.status(201).json({
      message: 'Чат успешно создан',
      chat: chatWithParticipant
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
    const userId = req.userId;
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return res.status(404).json({ error: 'Чат не найден' });
    }

    const participants = await Chat.getParticipants(chatId);
    
    // Для приватных чатов добавляем информацию о собеседнике (как в getUserChats)
    let chatWithParticipant = chat;
    if (chat.chat_type === 'private') {
      const otherParticipant = participants.find(p => p.user_id !== userId);
      if (otherParticipant) {
        chatWithParticipant = {
          ...chat,
          other_participant: {
            user_id: otherParticipant.user_id,
            first_name: otherParticipant.first_name,
            last_name: otherParticipant.last_name,
            middle_name: otherParticipant.middle_name,
            username: otherParticipant.username,
            avatar_url: otherParticipant.avatar_url,
            role_name: otherParticipant.role_name
          }
        };
      }
    }
    
    res.json({
      chat: chatWithParticipant,
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


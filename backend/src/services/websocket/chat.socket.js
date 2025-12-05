// WebSocket обработчик для чата
const Message = require('../../models/message.model');
const Chat = require('../../models/chat.model');
const User = require('../../models/user.model');
const { verifyToken } = require('../../utils/jwt.util');

// Подключение пользователя к WebSocket
const handleConnection = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Токен аутентификации отсутствует'));
      }

      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId);
      
      if (!user || !user.is_active) {
        return next(new Error('Пользователь не найден или неактивен'));
      }

      socket.userId = user.user_id;
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Ошибка аутентификации'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Пользователь ${socket.userId} подключился к WebSocket`);

    // Обновление статуса онлайн
    User.updateLastOnline(socket.userId);

    // Присоединение к комнатам чатов пользователя
    socket.on('join_chats', async () => {
      try {
        const chats = await Chat.findByUserId(socket.userId);
        chats.forEach(chat => {
          socket.join(`chat_${chat.chat_id}`);
        });
        console.log(`Пользователь ${socket.userId} присоединился к ${chats.length} чатам`);
      } catch (error) {
        console.error('Ошибка присоединения к чатам:', error);
      }
    });

    // Присоединение к конкретному чату
    socket.on('join_chat', async (chatId) => {
      try {
        socket.join(`chat_${chatId}`);
        socket.emit('joined_chat', { chatId });
      } catch (error) {
        socket.emit('error', { message: 'Ошибка присоединения к чату' });
      }
    });

    // Отправка сообщения через WebSocket
    socket.on('send_message', async (data) => {
      try {
        const { chat_id, message_text, message_type } = data;

        // Создание сообщения в БД
        const message = await Message.create({
          chat_id,
          sender_id: socket.userId,
          message_text,
          message_type: message_type || 'text'
        });

        // Получение данных отправителя
        const sender = await User.findById(socket.userId);

        // Отправка сообщения всем участникам чата в том же формате, что и API
        io.to(`chat_${chat_id}`).emit('new_message', {
          ...message,
          username: sender.username,
          first_name: sender.first_name,
          last_name: sender.last_name,
          avatar_url: sender.avatar_url
        });
      } catch (error) {
        console.error('Ошибка отправки сообщения через WebSocket:', error);
        socket.emit('error', { message: 'Ошибка отправки сообщения' });
      }
    });

    // Отключение
    socket.on('disconnect', () => {
      console.log(`Пользователь ${socket.userId} отключился от WebSocket`);
    });
  });
};

module.exports = { handleConnection };


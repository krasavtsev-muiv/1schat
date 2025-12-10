// Компонент окна чата
'use client';

import { useState, useEffect, useRef } from 'react';
import { messageAPI } from '@/lib/api';
import { getSocket } from '@/lib/socket';

export default function ChatWindow({ chat, onChatCreated }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentChatId, setCurrentChatId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (chat && chat.chat_id) {
      // Загружаем сообщения только если чат уже создан (есть chat_id)
      const chatId = chat.chat_id;
      setCurrentChatId(chatId);
      loadMessages();
      const socket = getSocket();
      if (socket) {
        const handleNewMessage = (message) => {
          // Проверяем, что сообщение относится к текущему чату
          if (message.chat_id === chatId) {
            // Проверяем, нет ли уже такого сообщения (избегаем дублирования)
            setMessages((prev) => {
              const exists = prev.some(m => m.message_id === message.message_id);
              if (exists) {
                return prev;
              }
              return [...prev, message];
            });
          }
        };
        socket.on('new_message', handleNewMessage);
        socket.emit('join_chat', chatId);
        
        return () => {
          socket.off('new_message', handleNewMessage);
        };
      }
    } else {
      // Если чат временный, просто очищаем сообщения
      setCurrentChatId(null);
      setMessages([]);
      setLoading(false);
    }
  }, [chat?.chat_id]); // Зависимость только от chat_id, чтобы не пересоздавать при изменении других полей

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async (chatIdToLoad = null) => {
    const targetChatId = chatIdToLoad || (chat && chat.chat_id);
    if (!targetChatId) {
      setLoading(false);
      return;
    }
    try {
      const response = await messageAPI.getChatMessages(targetChatId);
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    const messageText = newMessage.trim();
    if (!messageText) return;

    let chatId = chat.chat_id;
    
    // Если чат временный (без chat_id), создаем его перед отправкой сообщения
    if (!chatId || chat.is_temp) {
      try {
        const { chatAPI } = await import('@/lib/api');
        const createResponse = await chatAPI.createChat({
          chat_type: 'private',
          participant_ids: chat.other_participant ? [chat.other_participant.user_id] : [],
        });
        
        if (!createResponse.data || !createResponse.data.chat) {
          throw new Error('Не удалось создать чат: нет данных в ответе');
        }
        
        chatId = createResponse.data.chat.chat_id;
        
        // Получаем полную информацию о созданном чате
        const chatResponse = await chatAPI.getChatById(chatId);
        if (!chatResponse.data || !chatResponse.data.chat) {
          throw new Error('Не удалось получить данные созданного чата');
        }
        
        const createdChat = chatResponse.data.chat;
        
        // Обновляем родительский компонент через callback
        if (onChatCreated) {
          onChatCreated(createdChat);
        }
        
        // Обновляем текущий chat_id
        setCurrentChatId(chatId);
        
        // Присоединяемся к комнате чата через WebSocket
        const socket = getSocket();
        if (!socket) {
          throw new Error('WebSocket недоступен');
        }
        
        socket.emit('join_chat', chatId);
        
        // Загружаем сообщения для созданного чата
        await loadMessages(chatId);
        
        // Очищаем поле ввода только после успешного создания чата
        setNewMessage('');
        
        // Отправляем сообщение после создания чата
        // Обработчик new_message уже установлен в useEffect, не нужно добавлять еще один
        socket.emit('send_message', {
          chat_id: chatId,
          message_text: messageText,
        });
        
        return; // Успешно завершаем выполнение
      } catch (createError) {
        console.error('Ошибка создания чата:', createError);
        alert(`Ошибка создания чата: ${createError.message || 'Неизвестная ошибка'}`);
        return; // Прерываем выполнение при ошибке
      }
    }
    
    // Чат уже существует, просто отправляем сообщение
    try {
      setNewMessage(''); // Очищаем поле ввода
      const socket = getSocket();
      if (!socket) {
        throw new Error('WebSocket недоступен');
      }
      
      socket.emit('send_message', {
        chat_id: chatId,
        message_text: messageText,
      });
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
      alert(`Ошибка отправки сообщения: ${error.message || 'Неизвестная ошибка'}`);
      setNewMessage(messageText); // Возвращаем текст сообщения в поле ввода
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Функция для получения отображаемого имени чата (такая же как в ChatList)
  const getChatDisplayName = (chat) => {
    if (chat.chat_type === 'private' && chat.other_participant) {
      // Для приватных чатов показываем имя собеседника
      const other = chat.other_participant;
      return `${other.first_name} ${other.last_name}`.trim();
    }
    // Для групповых чатов показываем название чата
    return chat.chat_name || 'Без названия';
  };

  if (!chat) return <div>Выберите чат</div>;
  if (loading && chat.chat_id) return <div>Загрузка сообщений...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '1rem', borderBottom: '1px solid #dee2e6' }}>
        <h3>{getChatDisplayName(chat)}</h3>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        {messages.map((msg) => {
          // Формируем имя отправителя: сначала пробуем имя и фамилию, потом username
          const senderName = `${msg.first_name || ''} ${msg.last_name || ''}`.trim() || msg.username || 'Пользователь';
          
          return (
            <div key={msg.message_id} style={{ marginBottom: '1rem' }}>
              <strong>{senderName}</strong>
              <p>{msg.message_text}</p>
              <small>{new Date(msg.created_at).toLocaleString('ru-RU')}</small>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} style={{ padding: '1rem', borderTop: '1px solid #dee2e6' }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Введите сообщение..."
          style={{ width: '100%', padding: '0.5rem' }}
        />
      </form>
    </div>
  );
}


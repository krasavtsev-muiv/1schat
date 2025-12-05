// Компонент окна чата
'use client';

import { useState, useEffect, useRef } from 'react';
import { messageAPI } from '@/lib/api';
import { getSocket } from '@/lib/socket';

export default function ChatWindow({ chat }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (chat) {
      loadMessages();
      const socket = getSocket();
      if (socket) {
        socket.on('new_message', (message) => {
          if (message.chat_id === chat.chat_id) {
            setMessages((prev) => [...prev, message]);
          }
        });
        socket.emit('join_chat', chat.chat_id);
      }
    }
    return () => {
      const socket = getSocket();
      if (socket) {
        socket.off('new_message');
      }
    };
  }, [chat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const response = await messageAPI.getChatMessages(chat.chat_id);
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const socket = getSocket();
      if (socket) {
        socket.emit('send_message', {
          chat_id: chat.chat_id,
          message_text: newMessage,
        });
        setNewMessage('');
      }
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!chat) return <div>Выберите чат</div>;
  if (loading) return <div>Загрузка сообщений...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '1rem', borderBottom: '1px solid #dee2e6' }}>
        <h3>{chat.chat_name || 'Чат'}</h3>
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


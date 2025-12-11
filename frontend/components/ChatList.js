// Компонент списка чатов
'use client';

import { useState, useEffect } from 'react';
import { chatAPI } from '@/lib/api';
import { getSocket } from '@/lib/socket';

export default function ChatList({ onSelectChat, refreshKey }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadChats = async () => {
    try {
      setLoading(true);
      const response = await chatAPI.getUserChats();
      setChats(response.data.chats);
      setError('');
    } catch (err) {
      setError('Ошибка загрузки чатов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  // Подписываемся на события WebSocket для обновления списка чатов
  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      // Подписываемся на событие создания чата
      const handleChatCreated = () => {
        // Обновляем список чатов
        loadChats();
      };
      
      socket.on('chat_created', handleChatCreated);
      
      return () => {
        socket.off('chat_created', handleChatCreated);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <div style={{ padding: '1rem', color: '#666' }}>Загрузка чатов...</div>;
  if (error) return <div style={{ color: 'red', padding: '1rem' }}>{error}</div>;

  // Функция для получения отображаемого имени чата
  const getChatDisplayName = (chat) => {
    if (chat.chat_type === 'private' && chat.other_participant) {
      // Для приватных чатов показываем имя собеседника
      const other = chat.other_participant;
      return `${other.first_name} ${other.last_name}`.trim();
    }
    // Для групповых чатов показываем название чата
    return chat.chat_name || 'Без названия';
  };

  return (
    <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {chats.length === 0 ? (
        <p style={{ padding: '1rem', color: '#666', fontSize: '0.9rem' }}>Нет чатов</p>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {chats.map((chat) => (
            <div
              key={chat.chat_id}
              onClick={() => onSelectChat(chat)}
              style={{
                padding: '0.75rem',
                marginBottom: '0.5rem',
                background: '#f8f9fa',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#e9ecef'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#f8f9fa'}
            >
              <div style={{ fontWeight: '500', fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                {getChatDisplayName(chat)}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                {chat.chat_type === 'group' ? '👥 Групповой' : '💬 Личный'}
              </div>
              {chat.last_message_at && (
                <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.25rem' }}>
                  {new Date(chat.last_message_at).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


// Компонент списка чатов
'use client';

import { useState, useEffect } from 'react';
import { chatAPI } from '@/lib/api';

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

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div style={{ border: '1px solid #dee2e6', borderRadius: '4px', padding: '1rem' }}>
      <h2>Чаты</h2>
      {chats.length === 0 ? (
        <p>Нет чатов</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {chats.map((chat) => (
            <li
              key={chat.chat_id}
              onClick={() => onSelectChat(chat)}
              style={{
                padding: '0.75rem',
                marginBottom: '0.5rem',
                background: '#f8f9fa',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              <strong>{chat.chat_name || 'Без названия'}</strong>
              <br />
              <small>{chat.chat_type === 'group' ? 'Групповой' : 'Личный'}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


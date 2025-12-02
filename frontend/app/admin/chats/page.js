// Страница управления чатами (админка)
'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function AdminChatsPage() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      const response = await api.get('/api/admin/chats');
      setChats(response.data.chats || []);
    } catch (error) {
      console.error('Ошибка загрузки чатов:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Управление чатами</h1>
      <div style={{ marginTop: '2rem' }}>
        {chats.length === 0 ? (
          <p>Чаты не найдены</p>
        ) : (
          <ul>
            {chats.map((chat) => (
              <li key={chat.chat_id} style={{ marginBottom: '1rem', padding: '1rem', background: '#f8f9fa', borderRadius: '4px' }}>
                <strong>{chat.chat_name || 'Без названия'}</strong>
                <br />
                <small>Тип: {chat.chat_type === 'group' ? 'Групповой' : 'Личный'}</small>
                <br />
                <small>Создан: {new Date(chat.created_at).toLocaleDateString('ru-RU')}</small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}


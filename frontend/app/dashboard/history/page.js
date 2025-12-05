// Страница истории сообщений
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { messageAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';

function HistoryContent() {
  const searchParams = useSearchParams();
  const chatId = searchParams.get('chatId');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (chatId) {
      loadMessages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  const loadMessages = async () => {
    try {
      const response = await messageAPI.getChatMessages(chatId);
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Ошибка загрузки истории:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!chatId) {
    return <div style={{ padding: '2rem' }}>Выберите чат для просмотра истории</div>;
  }

  if (loading) return <div>Загрузка...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '2rem' }}>
      <h1>История сообщений</h1>
      <div style={{ marginTop: '2rem' }}>
        {messages.length === 0 ? (
          <p>Нет сообщений</p>
        ) : (
          <div>
            {messages.map((msg) => (
              <div key={msg.message_id} style={{ marginBottom: '1rem', padding: '1rem', background: '#f8f9fa', borderRadius: '4px' }}>
                <strong>{msg.first_name} {msg.last_name}</strong>
                <p>{msg.message_text}</p>
                <small>{formatDate(msg.created_at)}</small>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<div>Загрузка...</div>}>
      <HistoryContent />
    </Suspense>
  );
}


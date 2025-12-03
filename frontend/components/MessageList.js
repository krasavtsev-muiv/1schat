// Компонент списка сообщений
'use client';

import { useEffect, useRef } from 'react';
import { formatDate } from '@/lib/utils';

export default function MessageList({ messages, currentUserId }) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
      {messages.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#6c757d', marginTop: '2rem' }}>
          Нет сообщений. Начните общение!
        </div>
      ) : (
        messages.map((message) => {
          const isOwnMessage = message.sender_id === currentUserId;
          return (
            <div
              key={message.message_id}
              style={{
                marginBottom: '1rem',
                display: 'flex',
                justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '70%',
                  padding: '0.75rem',
                  background: isOwnMessage ? '#0070f3' : '#f8f9fa',
                  color: isOwnMessage ? 'white' : 'black',
                  borderRadius: '8px',
                }}
              >
                {!isOwnMessage && (
                  <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                    {message.first_name} {message.last_name}
                  </div>
                )}
                <div>{message.message_text}</div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    marginTop: '0.25rem',
                    opacity: 0.8,
                  }}
                >
                  {formatDate(message.created_at)}
                </div>
              </div>
            </div>
          );
        })
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}


// Страница уведомлений пользователя
'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await api.get('/api/notifications');
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Ошибка загрузки уведомлений:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/api/notifications/${notificationId}/read`);
      loadNotifications();
    } catch (error) {
      console.error('Ошибка отметки уведомления:', error);
    }
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '2rem' }}>
      <h1>Уведомления</h1>
      {notifications.length === 0 ? (
        <p style={{ marginTop: '2rem' }}>Нет уведомлений</p>
      ) : (
        <div style={{ marginTop: '2rem' }}>
          {notifications.map((notification) => (
            <div
              key={notification.notification_id}
              style={{
                padding: '1rem',
                marginBottom: '1rem',
                background: notification.is_read ? '#f8f9fa' : '#e7f3ff',
                borderRadius: '4px',
                borderLeft: notification.is_read ? 'none' : '4px solid #0070f3',
              }}
            >
              <h3>{notification.title}</h3>
              <p>{notification.message}</p>
              <small>{new Date(notification.created_at).toLocaleString('ru-RU')}</small>
              {!notification.is_read && (
                <button
                  onClick={() => markAsRead(notification.notification_id)}
                  style={{ marginTop: '0.5rem', padding: '0.25rem 0.5rem', background: '#0070f3', color: 'white', borderRadius: '4px' }}
                >
                  Отметить как прочитанное
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


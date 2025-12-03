// Компонент иконки уведомлений
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000); // Обновление каждые 30 секунд
    return () => clearInterval(interval);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const response = await api.get('/api/notifications/unread');
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Ошибка загрузки уведомлений:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link href="/dashboard/notifications" style={{ position: 'relative', textDecoration: 'none', color: 'inherit' }}>
      <span style={{ fontSize: '1.5rem' }}>🔔</span>
      {unreadCount > 0 && (
        <span
          style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            background: '#dc3545',
            color: 'white',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 'bold',
          }}
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
}


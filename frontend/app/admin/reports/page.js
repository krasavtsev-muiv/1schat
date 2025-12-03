// Страница отчетов (админка)
'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function AdminReportsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.get('/api/admin/stats');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Загрузка...</div>;
  if (!stats) return <div>Ошибка загрузки данных</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Отчеты и статистика</h1>
      <div style={{ marginTop: '2rem' }}>
        <h2>Общая статистика</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginTop: '1rem' }}>
          <div style={{ padding: '1.5rem', background: '#f8f9fa', borderRadius: '4px' }}>
            <h3>Всего пользователей</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalUsers}</p>
          </div>
          <div style={{ padding: '1.5rem', background: '#f8f9fa', borderRadius: '4px' }}>
            <h3>Всего чатов</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalChats}</p>
          </div>
          <div style={{ padding: '1.5rem', background: '#f8f9fa', borderRadius: '4px' }}>
            <h3>Всего сообщений</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalMessages}</p>
          </div>
          <div style={{ padding: '1.5rem', background: '#f8f9fa', borderRadius: '4px' }}>
            <h3>Активных за 24ч</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.activeUsers24h}</p>
          </div>
        </div>
      </div>
    </div>
  );
}


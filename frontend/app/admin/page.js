// Страница административной панели
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Cookies from 'js-cookie';

export default function AdminPage() {
  const router = useRouter();
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
      if (error.response?.status === 403) {
        router.push('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Загрузка...</div>;
  if (!stats) return <div>Ошибка загрузки данных</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '2rem' }}>
      <h1>Административная панель</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
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
  );
}


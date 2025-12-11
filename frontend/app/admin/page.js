// Страница административной панели
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
        router.push('/chats');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Загрузка...</div>;
  if (!stats) return <div>Ошибка загрузки данных</div>;

  const adminLinks = [
    { href: '/admin/users', label: 'Пользователи', description: 'Управление пользователями системы' },
    { href: '/admin/chats', label: 'Чаты', description: 'Просмотр и управление чатами' },
    { href: '/admin/feedback', label: 'Обращения', description: 'Обращения обратной связи' },
    { href: '/admin/1c', label: 'Интеграция с 1С', description: 'Синхронизация данных с 1С' },
    { href: '/admin/reports', label: 'Отчеты', description: 'Статистика и отчеты' },
    { href: '/admin/settings', label: 'Настройки', description: 'Настройки системы' },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '2rem' }}>
      <h1>Административная панель</h1>
      
      {/* Статистика */}
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

      {/* Навигация по разделам */}
      <div style={{ marginTop: '3rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Разделы администрирования</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                display: 'block',
                padding: '1.5rem',
                background: 'white',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'all 0.2s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#007bff';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#dee2e6';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#007bff' }}>{link.label}</h3>
              <p style={{ margin: 0, color: '#6c757d', fontSize: '0.9rem' }}>{link.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}


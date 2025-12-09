// Главная страница
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { authAPI } from '@/lib/api';

export default function Home() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const isAuth = isAuthenticated();
    setAuthenticated(isAuth);
    
    if (isAuth) {
      try {
        const response = await authAPI.getCurrentUser();
        setUser(response.data.user);
      } catch (error) {
        setAuthenticated(false);
        setUser(null);
      }
    }
    
    setLoading(false);
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Добро пожаловать в веб-сервис чата</h1>
      <p>Система коммуникации со студентами с интеграцией 1С:Предприятие</p>
      
      {authenticated && user ? (
        <div style={{ marginTop: '2rem' }}>
          <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
            Привет, <strong>{user.first_name} {user.last_name}</strong>!
          </p>
          <div>
            <Link 
              href="/chats" 
              style={{ 
                marginRight: '1rem', 
                padding: '0.75rem 1.5rem', 
                background: '#0070f3', 
                color: 'white', 
                borderRadius: '4px',
                textDecoration: 'none',
                display: 'inline-block',
                fontWeight: 'bold',
              }}
            >
              Перейти в чаты
            </Link>
            {user.role_id === 1 && (
              <Link 
                href="/admin" 
                style={{ 
                  padding: '0.75rem 1.5rem', 
                  background: '#6c757d', 
                  color: 'white', 
                  borderRadius: '4px',
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                Админ-панель
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div style={{ marginTop: '2rem' }}>
          <Link 
            href="/login" 
            style={{ 
              marginRight: '1rem', 
              padding: '0.75rem 1.5rem', 
              background: '#0070f3', 
              color: 'white', 
              borderRadius: '4px',
              textDecoration: 'none',
              display: 'inline-block',
              fontWeight: 'bold',
            }}
          >
            Войти
          </Link>
          <Link 
            href="/register" 
            style={{ 
              padding: '0.75rem 1.5rem', 
              background: '#6c757d', 
              color: 'white', 
              borderRadius: '4px',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Регистрация
          </Link>
        </div>
      )}
    </div>
  );
}


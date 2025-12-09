// Страница профиля пользователя
'use client';

import { useState, useEffect } from 'react';
import { authAPI } from '@/lib/api';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      setUser(response.data.user);
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Загрузка...</div>;
  if (!user) return <div>Ошибка загрузки профиля</div>;

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '2rem' }}>
      <h1>Мой профиль</h1>
      <div style={{ marginTop: '2rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <strong>Имя:</strong> {user.first_name} {user.last_name}
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <strong>Имя пользователя:</strong> {user.username}
        </div>
        {user.department && (
          <div style={{ marginBottom: '1rem' }}>
            <strong>Кафедра:</strong> {user.department}
          </div>
        )}
        {user.student_group && (
          <div style={{ marginBottom: '1rem' }}>
            <strong>Группа:</strong> {user.student_group}
          </div>
        )}
      </div>
    </div>
  );
}


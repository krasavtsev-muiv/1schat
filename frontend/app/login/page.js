// Страница входа
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import Cookies from 'js-cookie';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login({ username, password });
      const { token, user } = response.data;

      // Сохранение токена
      Cookies.set('token', token, { expires: 7 });
      
      // Перенаправление на дашборд
      router.push('/chats');
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка входа в систему');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '2rem auto', padding: '2rem' }}>
      <h1>Вход в систему</h1>
      <form onSubmit={handleSubmit} style={{ marginTop: '2rem' }}>
        {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
        <div style={{ marginBottom: '1rem' }}>
          <label>Логин:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Группа@Фамилия или Код@Фамилия (например: ИТ-21@Иванов)"
            required
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
          />
          <small style={{ display: 'block', marginTop: '0.25rem', color: '#666', fontSize: '0.875rem' }}>
            Для студентов: группа@фамилия, для преподавателей: код@фамилия
          </small>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Пароль:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: '0.75rem', background: '#0070f3', color: 'white', borderRadius: '4px' }}
        >
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </form>
    </div>
  );
}


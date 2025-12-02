// Страница управления пользователями (админка)
'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await api.get('/api/admin/users');
      setUsers(response.data.users);
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId) => {
    try {
      await api.put(`/api/admin/users/${userId}/toggle-status`);
      loadUsers();
    } catch (error) {
      console.error('Ошибка изменения статуса:', error);
    }
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Управление пользователями</h1>
      <table style={{ width: '100%', marginTop: '2rem', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f8f9fa' }}>
            <th style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>ID</th>
            <th style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>Имя</th>
            <th style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>Email</th>
            <th style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>Роль</th>
            <th style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>Статус</th>
            <th style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>Действия</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.user_id}>
              <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>{user.user_id}</td>
              <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>
                {user.first_name} {user.last_name}
              </td>
              <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>{user.email}</td>
              <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>{user.role_name}</td>
              <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>
                {user.is_active ? 'Активен' : 'Заблокирован'}
              </td>
              <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>
                <button
                  onClick={() => toggleUserStatus(user.user_id)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    background: user.is_active ? '#dc3545' : '#28a745',
                    color: 'white',
                    borderRadius: '4px',
                  }}
                >
                  {user.is_active ? 'Заблокировать' : 'Активировать'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


// Страница интеграции с 1С (админка)
'use client';

import { useState } from 'react';
import api from '@/lib/api';

export default function Admin1CPage() {
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  const checkConnection = async () => {
    try {
      const response = await api.get('/api/1c/check-connection');
      setConnectionStatus(response.data);
    } catch (error) {
      setConnectionStatus({ connected: false, error: 'Ошибка проверки подключения' });
    }
  };

  const syncUsers = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const response = await api.post('/api/1c/sync-users');
      setSyncResult(response.data);
    } catch (error) {
      setSyncResult({ error: 'Ошибка синхронизации' });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Интеграция с 1С:Предприятие</h1>
      
      <div style={{ marginTop: '2rem' }}>
        <h2>Проверка подключения</h2>
        <button
          onClick={checkConnection}
          style={{ padding: '0.75rem 1.5rem', background: '#0070f3', color: 'white', borderRadius: '4px', marginRight: '1rem' }}
        >
          Проверить подключение
        </button>
        {connectionStatus && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: connectionStatus.connected ? '#d4edda' : '#f8d7da', borderRadius: '4px' }}>
            {connectionStatus.connected ? '✅ Подключение установлено' : '❌ Подключение не установлено'}
            {connectionStatus.error && <p>{connectionStatus.error}</p>}
          </div>
        )}
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2>Синхронизация пользователей</h2>
        <button
          onClick={syncUsers}
          disabled={syncing}
          style={{ padding: '0.75rem 1.5rem', background: '#28a745', color: 'white', borderRadius: '4px' }}
        >
          {syncing ? 'Синхронизация...' : 'Синхронизировать пользователей'}
        </button>
        {syncResult && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: '#d4edda', borderRadius: '4px' }}>
            <p>Синхронизировано: {syncResult.synced}</p>
            <p>Создано: {syncResult.created}</p>
            <p>Обновлено: {syncResult.updated}</p>
          </div>
        )}
      </div>
    </div>
  );
}


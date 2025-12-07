// Страница интеграции с 1С (админка)
'use client';

import { useState } from 'react';
import api from '@/lib/api';

export default function Admin1CPage() {
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [dataType, setDataType] = useState(null);
  const [error, setError] = useState('');

  const checkConnection = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/1c/check-connection');
      setConnectionStatus(response.data);
    } catch (err) {
      setConnectionStatus({ 
        connected: false, 
        error: err.response?.data?.error || 'Ошибка проверки подключения' 
      });
    } finally {
      setLoading(false);
    }
  };

  const loadData = async (type) => {
    setLoading(true);
    setError('');
    setDataType(type);
    try {
      const response = await api.get(`/api/1c/${type}`);
      if (response.data.success) {
        setData(response.data.data || []);
      } else {
        setError(response.data.error || 'Ошибка загрузки данных');
        setData(null);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка загрузки данных');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const getDataTypeLabel = (type) => {
    const labels = {
      departments: 'Кафедры',
      groups: 'Группы',
      disciplines: 'Дисциплины',
      teachers: 'Преподаватели',
      students: 'Студенты',
    };
    return labels[type] || type;
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Интеграция с 1С:Предприятие</h1>
      
      <div style={{ 
        marginTop: '2rem', 
        padding: '1rem', 
        background: '#fff3cd', 
        borderRadius: '4px',
        border: '1px solid #ffc107'
      }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>⚠️ Важно:</p>
        <p style={{ margin: '0.5rem 0 0 0' }}>
          Учебная версия 1С имеет ограничение: 1 запрос в 10 секунд. 
          При ошибке лимита система автоматически ждёт 10 секунд и повторяет запрос.
        </p>
      </div>
      
      <div style={{ marginTop: '2rem' }}>
        <h2>Проверка подключения</h2>
        <button
          onClick={checkConnection}
          disabled={loading}
          style={{ 
            padding: '0.75rem 1.5rem', 
            background: '#0070f3', 
            color: 'white', 
            borderRadius: '4px', 
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Проверка...' : 'Проверить подключение'}
        </button>
        {connectionStatus && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            background: connectionStatus.connected ? '#d4edda' : '#f8d7da', 
            borderRadius: '4px',
            border: `1px solid ${connectionStatus.connected ? '#28a745' : '#dc3545'}`
          }}>
            <p style={{ margin: 0, fontWeight: 'bold' }}>
              {connectionStatus.connected ? '✅ Подключение установлено' : '❌ Подключение не установлено'}
            </p>
            {connectionStatus.message && (
              <p style={{ margin: '0.5rem 0 0 0' }}>{connectionStatus.message}</p>
            )}
            {connectionStatus.error && (
              <p style={{ margin: '0.5rem 0 0 0', color: '#721c24' }}>{connectionStatus.error}</p>
            )}
          </div>
        )}
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2>Просмотр данных из 1С</h2>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          <button
            onClick={() => loadData('departments')}
            disabled={loading}
            style={{ 
              padding: '0.5rem 1rem', 
              background: '#6c757d', 
              color: 'white', 
              borderRadius: '4px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            Кафедры
          </button>
          <button
            onClick={() => loadData('groups')}
            disabled={loading}
            style={{ 
              padding: '0.5rem 1rem', 
              background: '#6c757d', 
              color: 'white', 
              borderRadius: '4px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            Группы
          </button>
          <button
            onClick={() => loadData('disciplines')}
            disabled={loading}
            style={{ 
              padding: '0.5rem 1rem', 
              background: '#6c757d', 
              color: 'white', 
              borderRadius: '4px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            Дисциплины
          </button>
          <button
            onClick={() => loadData('teachers')}
            disabled={loading}
            style={{ 
              padding: '0.5rem 1rem', 
              background: '#6c757d', 
              color: 'white', 
              borderRadius: '4px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            Преподаватели
          </button>
          <button
            onClick={() => loadData('students')}
            disabled={loading}
            style={{ 
              padding: '0.5rem 1rem', 
              background: '#6c757d', 
              color: 'white', 
              borderRadius: '4px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            Студенты
          </button>
        </div>

        {error && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            background: '#f8d7da', 
            borderRadius: '4px',
            color: '#721c24'
          }}>
            {error}
          </div>
        )}

        {loading && dataType && (
          <div style={{ marginTop: '1rem', padding: '1rem', color: '#666' }}>
            Загрузка {getDataTypeLabel(dataType).toLowerCase()}...
          </div>
        )}

        {data && data.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <h3>{getDataTypeLabel(dataType)} ({data.length})</h3>
            <div style={{ 
              overflowX: 'auto',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    {Object.keys(data[0]).map((key) => (
                      <th 
                        key={key}
                        style={{ 
                          padding: '0.75rem', 
                          textAlign: 'left',
                          borderBottom: '2px solid #dee2e6',
                          fontWeight: 'bold'
                        }}
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #dee2e6' }}>
                      {Object.keys(data[0]).map((key) => (
                        <td 
                          key={key}
                          style={{ padding: '0.75rem' }}
                        >
                          {Array.isArray(item[key]) 
                            ? item[key].join(', ') 
                            : typeof item[key] === 'object' 
                            ? JSON.stringify(item[key])
                            : item[key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {data && data.length === 0 && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            background: '#fff3cd', 
            borderRadius: '4px'
          }}>
            Данные не найдены
          </div>
        )}
      </div>
    </div>
  );
}

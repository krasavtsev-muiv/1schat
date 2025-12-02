// Страница настроек системы (админка)
'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get('/api/admin/settings');
      setSettings(response.data.settings || []);
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Настройки системы</h1>
      <div style={{ marginTop: '2rem' }}>
        {settings.length === 0 ? (
          <p>Настройки не найдены</p>
        ) : (
          <ul>
            {settings.map((setting) => (
              <li key={setting.setting_id} style={{ marginBottom: '1rem', padding: '1rem', background: '#f8f9fa', borderRadius: '4px' }}>
                <strong>{setting.setting_key}:</strong> {setting.setting_value}
                <br />
                <small>{setting.description}</small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}


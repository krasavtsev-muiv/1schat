// Страница настроек пользователя
'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sound: false,
  });

  const handleToggle = (key) => {
    setNotifications({ ...notifications, [key]: !notifications[key] });
  };

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '2rem' }}>
      <h1>Настройки</h1>
      <div style={{ marginTop: '2rem' }}>
        <h2>Уведомления</h2>
        <div style={{ marginTop: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <input
              type="checkbox"
              checked={notifications.email}
              onChange={() => handleToggle('email')}
              style={{ marginRight: '0.5rem' }}
            />
            Email уведомления
          </label>
          <label style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <input
              type="checkbox"
              checked={notifications.push}
              onChange={() => handleToggle('push')}
              style={{ marginRight: '0.5rem' }}
            />
            Push уведомления
          </label>
          <label style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <input
              type="checkbox"
              checked={notifications.sound}
              onChange={() => handleToggle('sound')}
              style={{ marginRight: '0.5rem' }}
            />
            Звуковые уведомления
          </label>
        </div>
      </div>
    </div>
  );
}


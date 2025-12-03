// Страница восстановления пароля
'use client';

import { useState } from 'react';

export default function PasswordResetPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Здесь должен быть вызов API для восстановления пароля
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess(true);
    } catch (err) {
      setError('Ошибка отправки запроса на восстановление пароля');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '2rem auto', padding: '2rem' }}>
      <h1>Восстановление пароля</h1>
      {success ? (
        <div style={{ marginTop: '2rem', padding: '1rem', background: '#d4edda', borderRadius: '4px' }}>
          <p>Инструкции по восстановлению пароля отправлены на ваш email.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ marginTop: '2rem' }}>
          {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
          <div style={{ marginBottom: '1rem' }}>
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '0.75rem', background: '#0070f3', color: 'white', borderRadius: '4px' }}
          >
            {loading ? 'Отправка...' : 'Отправить'}
          </button>
        </form>
      )}
    </div>
  );
}


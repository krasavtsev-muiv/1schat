// Страница обратной связи
'use client';

import { useState } from 'react';
import api from '@/lib/api';

export default function FeedbackPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      await api.post('/api/feedback', formData);
      setSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка отправки обращения. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '700px', margin: '2rem auto', padding: '2rem', lineHeight: '1.6' }}>
      <h1 style={{ color: '#0070f3', marginBottom: '0.5rem' }}>Обратная связь</h1>
      <p style={{ fontSize: '1.1rem', color: '#6c757d', marginBottom: '2rem' }}>
        Мы ценим ваше мнение! Если у вас есть вопросы, предложения или вы столкнулись с проблемой, 
        пожалуйста, заполните форму ниже. Мы постараемся ответить в течение 24 часов.
      </p>

      {success && (
        <div style={{
          padding: '1rem',
          background: '#d4edda',
          color: '#155724',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          border: '1px solid #c3e6cb'
        }}>
          <strong>✓</strong> Ваше обращение успешно отправлено! Мы свяжемся с вами в ближайшее время.
        </div>
      )}
      
      {error && (
        <div style={{
          padding: '1rem',
          background: '#f8d7da',
          color: '#721c24',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          border: '1px solid #f5c6cb'
        }}>
          <strong>✗</strong> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ background: '#f8f9fa', padding: '2rem', borderRadius: '8px' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#495057' }}>
            Имя <span style={{ color: '#dc3545' }}>*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Введите ваше имя"
            style={{
              width: '100%',
              padding: '0.75rem',
              marginTop: '0.5rem',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#495057' }}>
            Email <span style={{ color: '#dc3545' }}>*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="your.email@example.com"
            style={{
              width: '100%',
              padding: '0.75rem',
              marginTop: '0.5rem',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#495057' }}>
            Тема <span style={{ color: '#dc3545' }}>*</span>
          </label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            required
            placeholder="Кратко опишите тему обращения"
            style={{
              width: '100%',
              padding: '0.75rem',
              marginTop: '0.5rem',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#495057' }}>
            Сообщение <span style={{ color: '#dc3545' }}>*</span>
          </label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            rows="6"
            placeholder="Опишите ваш вопрос или проблему подробно..."
            style={{
              width: '100%',
              padding: '0.75rem',
              marginTop: '0.5rem',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              fontSize: '1rem',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '0.75rem 2rem',
            background: loading ? '#6c757d' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s'
          }}
        >
          {loading ? 'Отправка...' : 'Отправить обращение'}
        </button>
      </form>

      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        background: '#e7f3ff',
        borderRadius: '8px',
        borderLeft: '4px solid #0070f3'
      }}>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#495057' }}>
          <strong>Примечание:</strong> Если ваш вопрос срочный, рекомендуем связаться с нами по телефону 
          или через раздел <a href="/contacts" style={{ color: '#0070f3', textDecoration: 'none' }}>Контакты</a>.
        </p>
      </div>
    </div>
  );
}


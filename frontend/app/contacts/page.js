// Страница контактов
'use client';

import Link from 'next/link';

export default function ContactsPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '2rem', lineHeight: '1.6' }}>
      <h1 style={{ color: '#0070f3', marginBottom: '1.5rem' }}>Контакты</h1>
      
      <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>
        Если у вас возникли вопросы, проблемы с использованием системы или нужна техническая поддержка, 
        пожалуйста, свяжитесь с нами любым удобным способом:
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
        <div style={{ padding: '1.5rem', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
          <h2 style={{ color: '#0070f3', fontSize: '1.3rem', marginTop: 0, marginBottom: '1rem' }}>📧 Электронная почта</h2>
          <p style={{ margin: '0.5rem 0', fontSize: '1.05rem' }}>
            <strong>Техническая поддержка:</strong><br />
            <a href="mailto:support@chat.university.ru" style={{ color: '#0070f3', textDecoration: 'none' }}>
              support@chat.university.ru
            </a>
          </p>
          <p style={{ margin: '0.5rem 0', fontSize: '1.05rem' }}>
            <strong>Общие вопросы:</strong><br />
            <a href="mailto:info@chat.university.ru" style={{ color: '#0070f3', textDecoration: 'none' }}>
              info@chat.university.ru
            </a>
          </p>
        </div>

        <div style={{ padding: '1.5rem', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
          <h2 style={{ color: '#0070f3', fontSize: '1.3rem', marginTop: 0, marginBottom: '1rem' }}>📞 Телефон</h2>
          <p style={{ margin: '0.5rem 0', fontSize: '1.05rem' }}>
            <strong>Техническая поддержка:</strong><br />
            <a href="tel:+74951234567" style={{ color: '#0070f3', textDecoration: 'none' }}>
              +7 (495) 123-45-67
            </a>
          </p>
          <p style={{ margin: '0.5rem 0', fontSize: '0.9rem', color: '#6c757d' }}>
            Пн-Пт: 9:00 - 18:00 (МСК)
          </p>
        </div>
      </div>

      <div style={{ padding: '1.5rem', background: '#e7f3ff', borderRadius: '8px', borderLeft: '4px solid #0070f3', marginBottom: '2rem' }}>
        <h2 style={{ color: '#0070f3', fontSize: '1.2rem', marginTop: 0, marginBottom: '0.5rem' }}>📍 Адрес</h2>
        <p style={{ margin: 0, fontSize: '1.05rem' }}>
          Москва, ул. Примерная, д. 1<br />
          Кабинет технической поддержки: 205
        </p>
      </div>

      <div style={{ padding: '1.5rem', background: '#fff3cd', borderRadius: '8px', borderLeft: '4px solid #ffc107' }}>
        <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>💡 Совет</h3>
        <p style={{ margin: 0 }}>
          Для быстрого решения вопросов рекомендуем использовать форму{' '}
          <Link href="/feedback" style={{ color: '#0070f3', textDecoration: 'none', fontWeight: 'bold' }}>
            обратной связи
          </Link>. 
          Мы отвечаем на обращения в течение 24 часов в рабочие дни.
        </p>
      </div>
    </div>
  );
}


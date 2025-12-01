// Главная страница
import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Добро пожаловать в веб-сервис чата</h1>
      <p>Система коммуникации со студентами с интеграцией 1С:Предприятие</p>
      <div style={{ marginTop: '2rem' }}>
        <Link href="/login" style={{ marginRight: '1rem', padding: '0.5rem 1rem', background: '#0070f3', color: 'white', borderRadius: '4px' }}>
          Войти
        </Link>
        <Link href="/register" style={{ padding: '0.5rem 1rem', background: '#6c757d', color: 'white', borderRadius: '4px' }}>
          Регистрация
        </Link>
      </div>
    </div>
  );
}


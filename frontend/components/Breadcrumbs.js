// Компонент "хлебных крошек"
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Breadcrumbs() {
  const pathname = usePathname();
  const paths = pathname.split('/').filter(Boolean);

  const breadcrumbMap = {
    '': 'Главная',
    'about': 'О системе',
    'contacts': 'Контакты',
    'feedback': 'Обратная связь',
    'faq': 'FAQ',
    'privacy': 'Конфиденциальность',
    'terms': 'Правила',
    'login': 'Вход',
    'register': 'Регистрация',
    'dashboard': 'Дашборд',
    'chats': 'Чаты',
    'admin': 'Административная панель',
    'profile': 'Профиль',
    'settings': 'Настройки',
    'export': 'Экспорт',
    'users': 'Пользователи',
    'chats': 'Чаты',
    '1c': 'Интеграция с 1С',
  };

  return (
    <nav style={{ padding: '1rem', background: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
      <ol style={{ display: 'flex', listStyle: 'none', margin: 0, padding: 0, gap: '0.5rem' }}>
        <li>
          <Link href="/" style={{ color: '#0070f3', textDecoration: 'none' }}>
            Главная
          </Link>
        </li>
        {paths.map((path, index) => {
          const href = '/' + paths.slice(0, index + 1).join('/');
          const label = breadcrumbMap[path] || path;
          const isLast = index === paths.length - 1;

          return (
            <li key={href} style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ margin: '0 0.5rem' }}>/</span>
              {isLast ? (
                <span>{label}</span>
              ) : (
                <Link href={href} style={{ color: '#0070f3', textDecoration: 'none' }}>
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}


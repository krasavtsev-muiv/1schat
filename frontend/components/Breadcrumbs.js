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
    'features': 'Возможности',
    'getting-started': 'Быстрый старт',
    'security': 'Безопасность',
    'contacts': 'Контакты',
    'feedback': 'Обратная связь',
    'faq': 'FAQ',
    'privacy': 'Конфиденциальность',
    'terms': 'Правила',
    'login': 'Вход',
    'register': 'Регистрация',
    'chats': 'Чаты',
    'admin': 'Административная панель',
    'profile': 'Профиль',
    'settings': 'Настройки',
    'users': 'Пользователи',
    '1c': 'Интеграция с 1С',
  };

  // Специальная обработка для страницы безопасности - добавляем "Политика безопасности"
  const getBreadcrumbLabel = (path, index, allPaths) => {
    // Для страницы безопасности добавляем "Политика безопасности" в конце
    if (path === 'security' && index === allPaths.length - 1) {
      return 'Политика безопасности';
    }
    return breadcrumbMap[path] || path;
  };

  // Фильтруем paths, убирая dashboard
  const visiblePaths = paths.filter(p => p !== 'dashboard');

  return (
    <nav style={{ padding: '1rem', background: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
      <ol style={{ display: 'flex', listStyle: 'none', margin: 0, padding: 0, gap: '0.5rem' }}>
        <li>
          <Link href="/" style={{ color: '#0070f3', textDecoration: 'none' }}>
            Главная
          </Link>
        </li>
        {visiblePaths.map((path, index) => {
            const href = '/' + visiblePaths.slice(0, index + 1).join('/');
            // Находим оригинальный индекс в paths для правильной проверки isLast
            const originalIndex = paths.indexOf(path);
            const label = getBreadcrumbLabel(path, originalIndex, paths);
            const isLast = index === visiblePaths.length - 1;

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

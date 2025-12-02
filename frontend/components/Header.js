// Компонент шапки сайта
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();

  const menuItems = [
    { href: '/', label: 'Главная' },
    { href: '/about', label: 'О системе' },
    { href: '/contacts', label: 'Контакты' },
    { href: '/feedback', label: 'Обратная связь' },
    { href: '/faq', label: 'FAQ' },
    { href: '/privacy', label: 'Конфиденциальность' },
    { href: '/terms', label: 'Правила' },
    { href: '/login', label: 'Вход' },
    { href: '/register', label: 'Регистрация' },
    { href: '/dashboard', label: 'Дашборд' },
  ];

  return (
    <header style={{ background: '#343a40', color: 'white', padding: '1rem' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
          Веб-сервис чата
        </Link>
        <ul style={{ display: 'flex', listStyle: 'none', gap: '1rem', margin: 0, padding: 0 }}>
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                style={{
                  color: pathname === item.href ? '#ffc107' : 'white',
                  textDecoration: 'none',
                  padding: '0.5rem',
                }}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}


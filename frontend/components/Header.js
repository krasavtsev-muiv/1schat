// Компонент шапки сайта
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import Cookies from 'js-cookie';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAuth();
  }, [pathname]);

  const checkAuth = async () => {
    const isAuth = isAuthenticated();
    setAuthenticated(isAuth);
    
    if (isAuth) {
      try {
        const { authAPI } = await import('@/lib/api');
        const response = await authAPI.getCurrentUser();
        setUser(response.data.user);
      } catch (error) {
        setAuthenticated(false);
        setUser(null);
      }
    }
  };

  const handleLogout = () => {
    Cookies.remove('token');
    setAuthenticated(false);
    setUser(null);
    router.push('/login');
  };

  const publicMenuItems = [
    { href: '/', label: 'Главная' },
    { href: '/about', label: 'О системе' },
    { href: '/contacts', label: 'Контакты' },
    { href: '/feedback', label: 'Обратная связь' },
    { href: '/faq', label: 'FAQ' },
  ];

  const authMenuItems = [
    { href: '/chats', label: 'Чаты' },
    { href: '/dashboard/profile', label: 'Профиль' },
    { href: '/dashboard/notifications', label: 'Уведомления' },
  ];

  const adminMenuItems = [
    { href: '/admin', label: 'Админ-панель' },
  ];

  const menuItems = authenticated 
    ? [...publicMenuItems, ...authMenuItems, ...(user?.role_id === 1 ? adminMenuItems : [])]
    : [...publicMenuItems, { href: '/login', label: 'Вход' }, { href: '/register', label: 'Регистрация' }];

  return (
    <header style={{ background: '#343a40', color: 'white', padding: '1rem' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ fontSize: '1.5rem', fontWeight: 'bold', textDecoration: 'none', color: 'white' }}>
          Веб-сервис чата
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
          {authenticated && user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: '1rem' }}>
              <span style={{ fontSize: '0.9rem' }}>
                {user.first_name} {user.last_name}
              </span>
              <button
                onClick={handleLogout}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Выйти
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}


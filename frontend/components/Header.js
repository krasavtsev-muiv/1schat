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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    checkAuth();
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [pathname]);

  const checkMobile = () => {
    // Мобильное меню включается на планшетных разрешениях (до 1024px)
    setIsMobile(window.innerWidth < 1024);
    if (window.innerWidth >= 1024) {
      setMobileMenuOpen(false);
    }
  };

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

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Функция для проверки, активен ли пункт меню или его подменю
  const isMenuItemActive = (item) => {
    if (item.href) {
      return pathname === item.href;
    }
    if (item.items) {
      return item.items.some(subItem => pathname === subItem.href);
    }
    return false;
  };

  // Компонент пункта меню с подменю для десктопа
  const MenuItemWithDropdown = ({ item, index }) => {
    const [isOpen, setIsOpen] = useState(false);
    const isActive = isMenuItemActive(item);

    return (
      <li 
        key={index}
        style={{ 
          position: 'relative',
          flexShrink: 0
        }}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        <div
          style={{
            color: isActive ? '#ffc107' : 'white',
            textDecoration: 'none',
            padding: '0.5rem 0.75rem',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: '0.9rem',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'background 0.2s',
            background: isOpen || isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
          }}
        >
          <span>{item.label}</span>
          <span style={{ fontSize: '0.7rem' }}>▼</span>
        </div>
        {isOpen && item.items && (
          <ul style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            background: '#343a40',
            listStyle: 'none',
            margin: 0,
            padding: '0.5rem 0',
            minWidth: '200px',
            borderRadius: '4px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            zIndex: 1001,
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            {item.items.map((subItem, subIndex) => (
              <li key={subIndex}>
                <Link
                  href={subItem.href}
                  style={{
                    display: 'block',
                    color: pathname === subItem.href ? '#ffc107' : 'white',
                    textDecoration: 'none',
                    padding: '0.75rem 1rem',
                    fontSize: '0.9rem',
                    transition: 'background 0.2s',
                    background: pathname === subItem.href ? 'rgba(255, 193, 7, 0.1)' : 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (pathname !== subItem.href) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = pathname === subItem.href ? 'rgba(255, 193, 7, 0.1)' : 'transparent';
                  }}
                >
                  {subItem.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  };

  // Компонент мобильного пункта меню с подменю
  const MobileMenuItemWithSubmenu = ({ item, pathname, closeMobileMenu }) => {
    const [isOpen, setIsOpen] = useState(false);
    const isActive = isMenuItemActive(item);

    return (
      <li>
        <div
          onClick={() => setIsOpen(!isOpen)}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: isActive ? '#ffc107' : 'white',
            padding: '1rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            background: isActive ? 'rgba(255, 193, 7, 0.1)' : 'transparent',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
        >
          <span>{item.label}</span>
          <span style={{ fontSize: '0.8rem', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
        </div>
        {isOpen && item.items && (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, background: 'rgba(0, 0, 0, 0.2)' }}>
            {item.items.map((subItem, subIndex) => (
              <li key={subIndex}>
                <Link
                  href={subItem.href}
                  onClick={closeMobileMenu}
                  style={{
                    display: 'block',
                    color: pathname === subItem.href ? '#ffc107' : 'white',
                    textDecoration: 'none',
                    padding: '0.75rem 1rem 0.75rem 2rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    background: pathname === subItem.href ? 'rgba(255, 193, 7, 0.1)' : 'transparent',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (pathname !== subItem.href) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = pathname === subItem.href ? 'rgba(255, 193, 7, 0.1)' : 'transparent';
                  }}
                >
                  {subItem.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  };

  // Структура меню с поддержкой подменю
  const menuStructure = authenticated 
    ? [
        { href: '/', label: 'Главная' },
        {
          label: 'О системе',
          items: [
            { href: '/about', label: 'О системе' },
            { href: '/features', label: 'Возможности' },
            { href: '/getting-started', label: 'Быстрый старт' },
            { href: '/security', label: 'Безопасность' },
          ]
        },
        {
          label: 'Помощь',
          items: [
            { href: '/contacts', label: 'Контакты' },
            { href: '/feedback', label: 'Обратная связь' },
            { href: '/faq', label: 'FAQ' },
          ]
        },
        { href: '/chats', label: 'Чаты' },
        { href: '/profile', label: 'Профиль' },
        ...(user?.role_id === 1 ? [{ href: '/admin', label: 'Админ-панель' }] : [])
      ]
    : [
        { href: '/', label: 'Главная' },
        {
          label: 'О системе',
          items: [
            { href: '/about', label: 'О системе' },
            { href: '/features', label: 'Возможности' },
            { href: '/getting-started', label: 'Быстрый старт' },
            { href: '/security', label: 'Безопасность' },
          ]
        },
        {
          label: 'Помощь',
          items: [
            { href: '/contacts', label: 'Контакты' },
            { href: '/feedback', label: 'Обратная связь' },
            { href: '/faq', label: 'FAQ' },
          ]
        },
        { href: '/login', label: 'Вход' },
        { href: '/register', label: 'Регистрация' },
      ];

  return (
    <>
      <header style={{ background: '#343a40', color: 'white', padding: '0.75rem 1rem', position: 'relative', zIndex: 1000 }}>
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'nowrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
            {/* Гамбургер-меню для мобильных и планшетов */}
            {isMobile && (
              <button
                onClick={toggleMobileMenu}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
                aria-label="Открыть меню"
              >
                {mobileMenuOpen ? '✕' : '☰'}
              </button>
            )}
            
            <Link 
              href="/" 
              onClick={closeMobileMenu}
              style={{ fontSize: isMobile ? '1.1rem' : '1.3rem', fontWeight: 'bold', textDecoration: 'none', color: 'white', whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              Веб-сервис чата
            </Link>
          </div>

          {/* Десктопное меню */}
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1', minWidth: 0, justifyContent: 'center' }}>
              <ul style={{ 
                display: 'flex', 
                listStyle: 'none', 
                gap: '0.4rem', 
                margin: 0, 
                padding: 0,
                flexWrap: 'nowrap'
              }}>
                {menuStructure.map((item, index) => {
                  if (item.items) {
                    // Пункт меню с подменю
                    return <MenuItemWithDropdown key={index} item={item} index={index} />;
                  } else {
                    // Обычный пункт меню
                    return (
                      <li key={item.href || index} style={{ flexShrink: 0 }}>
                        <Link
                          href={item.href}
                          style={{
                            color: pathname === item.href ? '#ffc107' : 'white',
                            textDecoration: 'none',
                            padding: '0.5rem 0.65rem',
                            whiteSpace: 'nowrap',
                            display: 'block',
                            fontSize: '0.85rem',
                            borderRadius: '4px',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            if (pathname !== item.href) {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          {item.label}
                        </Link>
                      </li>
                    );
                  }
                })}
              </ul>
            </div>
          )}

          {/* Информация о пользователе и кнопка выхода */}
          {authenticated && user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
              {!isMobile && (
                <span style={{ 
                  fontSize: '0.75rem', 
                  whiteSpace: 'nowrap',
                  maxWidth: '120px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'block'
                }}>
                  {user.first_name} {user.last_name}
                </span>
              )}
              <button
                onClick={handleLogout}
                style={{
                  padding: isMobile ? '0.4rem 0.8rem' : '0.5rem 0.9rem',
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: isMobile ? '0.8rem' : '0.8rem',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                Выйти
              </button>
            </div>
          )}
        </nav>
      </header>

      {/* Мобильное выпадающее меню */}
      {isMobile && mobileMenuOpen && (
        <>
          {/* Overlay для закрытия меню */}
          <div
            onClick={closeMobileMenu}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 999
            }}
          />
          
          {/* Мобильное меню */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '280px',
            height: '100vh',
            background: '#343a40',
            zIndex: 1000,
            overflowY: 'auto',
            boxShadow: '2px 0 10px rgba(0, 0, 0, 0.3)',
            transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s ease'
          }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Меню</span>
                <button
                  onClick={closeMobileMenu}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'white',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    padding: '0.25rem'
                  }}
                >
                  ✕
                </button>
              </div>
              {authenticated && user && (
                <div style={{ padding: '0.75rem', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                    {user.first_name} {user.last_name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#adb5bd', marginTop: '0.25rem' }}>
                    {user.role_name === 'admin' ? 'Администратор' : user.role_name === 'teacher' ? 'Преподаватель' : 'Студент'}
                  </div>
                </div>
              )}
            </div>
            
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {menuStructure.map((item, index) => {
                if (item.items) {
                  // Пункт меню с подменю для мобильных
                  return (
                    <MobileMenuItemWithSubmenu 
                      key={index} 
                      item={item} 
                      pathname={pathname}
                      closeMobileMenu={closeMobileMenu}
                    />
                  );
                } else {
                  // Обычный пункт меню
                  return (
                    <li key={item.href || index}>
                      <Link
                        href={item.href}
                        onClick={closeMobileMenu}
                        style={{
                          display: 'block',
                          color: pathname === item.href ? '#ffc107' : 'white',
                          textDecoration: 'none',
                          padding: '1rem',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                          background: pathname === item.href ? 'rgba(255, 193, 7, 0.1)' : 'transparent',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (pathname !== item.href) {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = pathname === item.href ? 'rgba(255, 193, 7, 0.1)' : 'transparent';
                        }}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                }
              })}
            </ul>
          </div>
        </>
      )}
    </>
  );
}


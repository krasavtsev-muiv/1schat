// Страница дашборда
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { initSocket } from '@/lib/socket';
import ChatList from '@/components/ChatList';
import ChatWindow from '@/components/ChatWindow';
import Cookies from 'js-cookie';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
    initSocket();
  }, []);

  const loadUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      setUser(response.data.user);
    } catch (error) {
      Cookies.remove('token');
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Cookies.remove('token');
    router.push('/login');
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ width: '300px', borderRight: '1px solid #dee2e6', padding: '1rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <h2>Дашборд</h2>
          <p>Привет, {user?.first_name}!</p>
          <button onClick={handleLogout}>Выйти</button>
        </div>
        <ChatList onSelectChat={setSelectedChat} />
      </div>
      <div style={{ flex: 1 }}>
        <ChatWindow chat={selectedChat} />
      </div>
    </div>
  );
}


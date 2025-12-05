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
  const [showCreateChat, setShowCreateChat] = useState(false);
  const [chatListKey, setChatListKey] = useState(0);

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

  const handleChatCreated = () => {
    setShowCreateChat(false);
    setChatListKey(prev => prev + 1); // Обновляем список чатов
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ width: '300px', borderRight: '1px solid #dee2e6', padding: '1rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <h2>Дашборд</h2>
          <p>Привет, {user?.first_name}!</p>
          <button 
            onClick={() => setShowCreateChat(true)}
            style={{
              width: '100%',
              padding: '0.75rem',
              marginBottom: '0.5rem',
              background: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            + Создать чат
          </button>
        </div>
        <ChatList refreshKey={chatListKey} onSelectChat={setSelectedChat} />
      </div>
      <div style={{ flex: 1 }}>
        <ChatWindow chat={selectedChat} />
      </div>
      {showCreateChat && (
        <CreateChatModal 
          onClose={() => setShowCreateChat(false)} 
          onSuccess={handleChatCreated}
        />
      )}
    </div>
  );
}

// Компонент модального окна создания чата
function CreateChatModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    chat_name: '',
    chat_type: 'private',
    description: '',
    participant_ids: [],
  });
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const { authAPI } = await import('@/lib/api');
      const response = await authAPI.getUsers({ search: searchQuery });
      setUsers(response.data.users);
    } catch (err) {
      console.error('Ошибка загрузки пользователей:', err);
      setError('Ошибка загрузки списка пользователей');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadUsers();
    }, 300);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { chatAPI } = await import('@/lib/api');
      await chatAPI.createChat({
        ...formData,
        participant_ids: selectedUsers,
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка создания чата');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '8px',
          maxWidth: '500px',
          width: '90%',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginTop: 0 }}>Создать чат</h2>
        {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label>Название чата:</label>
            <input
              type="text"
              name="chat_name"
              value={formData.chat_name}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label>Тип чата:</label>
            <select
              name="chat_type"
              value={formData.chat_type}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
            >
              <option value="private">Личный</option>
              <option value="group">Групповой</option>
            </select>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label>Описание:</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label>Выберите собеседников:</label>
            <input
              type="text"
              placeholder="Поиск пользователей..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}
            />
            <div style={{ 
              maxHeight: '200px', 
              overflowY: 'auto', 
              border: '1px solid #dee2e6', 
              borderRadius: '4px',
              padding: '0.5rem'
            }}>
              {loadingUsers ? (
                <div>Загрузка пользователей...</div>
              ) : users.length === 0 ? (
                <div>Пользователи не найдены</div>
              ) : (
                users.map((user) => (
                  <div
                    key={user.user_id}
                    onClick={() => toggleUserSelection(user.user_id)}
                    style={{
                      padding: '0.5rem',
                      marginBottom: '0.25rem',
                      background: selectedUsers.includes(user.user_id) ? '#0070f3' : '#f8f9fa',
                      color: selectedUsers.includes(user.user_id) ? 'white' : 'black',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.user_id)}
                      onChange={() => toggleUserSelection(user.user_id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span>
                      {user.first_name} {user.last_name} ({user.username})
                    </span>
                  </div>
                ))
              )}
            </div>
            {selectedUsers.length > 0 && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#6c757d' }}>
                Выбрано: {selectedUsers.length} пользователь(ей)
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.5rem 1rem',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.5rem 1rem',
                background: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              {loading ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


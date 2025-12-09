// Страница чатов
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, chatAPI } from '@/lib/api';
import { initSocket } from '@/lib/socket';
import ChatList from '@/components/ChatList';
import ContactList from '@/components/ContactList';
import ChatWindow from '@/components/ChatWindow';
import Cookies from 'js-cookie';

export default function ChatsPage() {
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

  const handleChatCreated = () => {
    setShowCreateChat(false);
    setChatListKey(prev => prev + 1); // Обновляем список чатов
  };

  const handleStartChatWithContact = async (contactIdOrChat) => {
    try {
      // Если передан объект чата (существующий чат), просто открываем его
      if (contactIdOrChat && typeof contactIdOrChat === 'object' && contactIdOrChat.chat_id) {
        // Получаем полную информацию о чате с участниками
        const chatResponse = await chatAPI.getChatById(contactIdOrChat.chat_id);
        setSelectedChat(chatResponse.data.chat);
        setChatListKey(prev => prev + 1); // Обновляем список чатов
        return;
      }
      
      // Если передан ID контакта, создаем новый приватный чат
      const response = await chatAPI.createChat({
        chat_type: 'private',
        participant_ids: [contactIdOrChat],
      });
      
      if (response.data.chat) {
        // Получаем полную информацию о созданном чате с участниками
        const chatResponse = await chatAPI.getChatById(response.data.chat.chat_id);
        setSelectedChat(chatResponse.data.chat);
        setChatListKey(prev => prev + 1); // Обновляем список чатов
      }
    } catch (err) {
      console.error('Ошибка создания чата:', err);
      alert(err.response?.data?.error || 'Ошибка создания чата');
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Загрузка...</div>;

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ width: '350px', borderRight: '1px solid #dee2e6', display: 'flex', flexDirection: 'column' }}>
        {/* Заголовок */}
        <div style={{ padding: '1rem', borderBottom: '1px solid #dee2e6', background: '#f8f9fa' }}>
          <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>Чаты</h2>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#6c757d' }}>
            Привет, {user?.first_name}!
          </p>
          <button 
            onClick={() => setShowCreateChat(true)}
            style={{
              width: '100%',
              padding: '0.75rem',
              marginTop: '0.75rem',
              background: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '0.9rem',
            }}
          >
            + Создать групповой чат
          </button>
        </div>

        {/* Панель с чатами и контактами */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Секция: Чаты */}
          <div style={{ flex: 1, padding: '1rem', borderBottom: '1px solid #dee2e6', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: '600', color: '#495057' }}>
              Мои чаты
            </h3>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <ChatList 
                refreshKey={chatListKey} 
                onSelectChat={async (chat) => {
                  // Получаем полную информацию о чате с участниками
                  try {
                    const { chatAPI } = await import('@/lib/api');
                    const chatResponse = await chatAPI.getChatById(chat.chat_id);
                    setSelectedChat(chatResponse.data.chat);
                  } catch (err) {
                    console.error('Ошибка загрузки чата:', err);
                    setSelectedChat(chat); // Используем данные из списка как fallback
                  }
                }} 
              />
            </div>
          </div>

          {/* Секция: Контакты */}
          <div style={{ flex: 1, padding: '1rem', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: '600', color: '#495057' }}>
              Контакты
            </h3>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <ContactList refreshKey={chatListKey} onStartChat={handleStartChatWithContact} currentUserId={user?.user_id} />
            </div>
          </div>
        </div>
      </div>

      {/* Окно чата */}
      <div style={{ flex: 1 }}>
        <ChatWindow chat={selectedChat} />
      </div>

      {/* Модальное окно создания чата */}
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
    chat_type: 'group',
    description: '',
    participant_ids: [],
  });
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadCurrentUser();
    loadUsers();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const { authAPI } = await import('@/lib/api');
      const response = await authAPI.getCurrentUser();
      setCurrentUser(response.data.user);
    } catch (err) {
      console.error('Ошибка загрузки текущего пользователя:', err);
    }
  };

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const { authAPI } = await import('@/lib/api');
      const response = await authAPI.getUsers({ search: searchQuery });
      let filteredUsers = response.data.users || [];
      
      // Фильтруем: не-администраторы не могут добавлять администраторов в групповой чат
      if (currentUser && currentUser.role_name !== 'admin') {
        filteredUsers = filteredUsers.filter(user => user.role_name !== 'admin');
      }
      
      // Исключаем текущего пользователя
      filteredUsers = filteredUsers.filter(user => user.user_id !== currentUser?.user_id);
      
      setUsers(filteredUsers);
    } catch (err) {
      console.error('Ошибка загрузки пользователей:', err);
      setError('Ошибка загрузки списка пользователей');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      const timeoutId = setTimeout(() => {
        loadUsers();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, currentUser]);

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
        <h2 style={{ marginTop: 0 }}>Создать групповой чат</h2>
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
            <label>Выберите участников:</label>
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
                      {user.first_name} {user.last_name} {user.username && `(@${user.username})`}
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
              disabled={loading || selectedUsers.length === 0}
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

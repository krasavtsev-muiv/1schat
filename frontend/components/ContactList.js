// Компонент списка контактов (люди, с которыми можно начать чат)
'use client';

import { useState, useEffect } from 'react';
import { authAPI, chatAPI } from '@/lib/api';

export default function ContactList({ onStartChat, refreshKey, currentUserId }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  const loadContacts = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Получаем текущего пользователя
      const currentUserResponse = await authAPI.getCurrentUser();
      const currentUserData = currentUserResponse.data.user;
      setCurrentUser(currentUserData);
      
      // Получаем всех пользователей (только зарегистрированных с username)
      const usersResponse = await authAPI.getUsers({ search: searchQuery });
      const allUsers = usersResponse.data.users || [];
      
      // Получаем чаты пользователя
      const chatsResponse = await chatAPI.getUserChats();
      const userChats = chatsResponse.data.chats || [];
      
      // Создаем Set из user_id участников приватных чатов
      const usersInPrivateChats = new Set();
      userChats.forEach(chat => {
        if (chat.chat_type === 'private' && chat.other_participant) {
          usersInPrivateChats.add(chat.other_participant.user_id);
        }
      });
      
      // Фильтруем контакты:
      // 1. Исключаем текущего пользователя
      // 2. Исключаем тех, с кем уже есть приватный чат
      // 3. Для не-администраторов исключаем администраторов
      // 4. Только активные пользователи
      // 5. Только пользователи с установленным username (зарегистрированные) - уже фильтруется на backend
      const contactsList = allUsers.filter(user => {
        // Исключаем текущего пользователя
        if (user.user_id === currentUserData.user_id) return false;
        
        // Исключаем тех, с кем уже есть приватный чат
        if (usersInPrivateChats.has(user.user_id)) return false;
        
        // Только активные пользователи
        if (!user.is_active) return false;
        
        // Дополнительная проверка username (на всякий случай)
        if (!user.username) return false;
        
        // Не-администраторы не могут видеть администраторов в списке контактов
        if (currentUserData.role_name !== 'admin' && user.role_name === 'admin') return false;
        
        return true;
      });
      
      setContacts(contactsList);
    } catch (err) {
      // Не показываем ошибку, просто устанавливаем пустой список контактов
      // Пользователь увидит сообщение "Не нашли подходящих контактов"
      console.error('Ошибка загрузки контактов:', err);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadContacts();
    }, 300);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, searchQuery]);

  const handleStartChat = async (contactId) => {
    if (!onStartChat || !currentUser) return;
    
    try {
      // Проверяем, не существует ли уже чат с этим пользователем
      const chatsResponse = await chatAPI.getUserChats();
      const existingChat = chatsResponse.data.chats?.find(chat => 
        chat.chat_type === 'private' && 
        chat.other_participant?.user_id === contactId
      );
      
      if (existingChat) {
        // Если чат существует, открываем его
        onStartChat(existingChat);
      } else {
        // Если чата нет, создаем новый
        onStartChat(contactId);
      }
    } catch (err) {
      console.error('Ошибка проверки чата:', err);
      // В случае ошибки все равно пытаемся создать чат
      onStartChat(contactId);
    }
  };

  if (loading) return <div style={{ padding: '1rem', color: '#666' }}>Загрузка контактов...</div>;

  return (
    <div>
      <div style={{ marginBottom: '0.75rem' }}>
        <input
          type="text"
          placeholder="Поиск контактов..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '0.5rem',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            fontSize: '0.9rem',
          }}
        />
      </div>
      {contacts.length === 0 ? (
        <p style={{ padding: '1rem', color: '#666', fontSize: '0.9rem' }}>
          {searchQuery ? 'Контакты не найдены' : 'Не нашли подходящих контактов'}
        </p>
      ) : (
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {contacts.map((contact) => (
            <div
              key={contact.user_id}
              onClick={() => handleStartChat(contact.user_id)}
              style={{
                padding: '0.75rem',
                marginBottom: '0.5rem',
                background: '#f8f9fa',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'background 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#e9ecef'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#f8f9fa'}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#0070f3',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                }}
              >
                {contact.first_name?.[0]?.toUpperCase() || '?'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '500', fontSize: '0.95rem' }}>
                  {contact.first_name} {contact.last_name}
                </div>
                {contact.username && (
                  <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                    @{contact.username}
                  </div>
                )}
                {contact.role_name && (
                  <div style={{ fontSize: '0.8rem', color: '#6c757d', marginTop: '0.25rem' }}>
                    {contact.role_name === 'student' ? 'Студент' : 
                     contact.role_name === 'teacher' ? 'Преподаватель' : 
                     contact.role_name === 'admin' ? 'Администратор' : contact.role_name}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

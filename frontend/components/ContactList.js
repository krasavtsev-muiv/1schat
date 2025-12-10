// Компонент списка контактов (люди, с которыми можно начать чат)
'use client';

import { useState, useEffect } from 'react';
import { authAPI, chatAPI } from '@/lib/api';
import { getSocket } from '@/lib/socket';

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
        if (user.user_id === currentUserData.user_id) {
          console.log(`[ContactList] Исключен: текущий пользователь ${user.user_id}`);
          return false;
        }
        
        // Исключаем тех, с кем уже есть приватный чат
        if (usersInPrivateChats.has(user.user_id)) {
          console.log(`[ContactList] Исключен: есть приватный чат ${user.user_id}`);
          return false;
        }
        
        // Только активные пользователи
        if (!user.is_active) {
          console.log(`[ContactList] Исключен: неактивен ${user.user_id} (${user.first_name} ${user.last_name})`);
          return false;
        }
        
        // Дополнительная проверка username (на всякий случай)
        if (!user.username) {
          console.log(`[ContactList] Исключен: нет username ${user.user_id} (${user.first_name} ${user.last_name})`);
          return false;
        }
        
        // Не-администраторы не могут видеть администраторов в списке контактов
        if (currentUserData.role_name !== 'admin' && user.role_name === 'admin') {
          console.log(`[ContactList] Исключен: администратор ${user.user_id}`);
          return false;
        }
        
        return true;
      });
      
      console.log('[ContactList] Загружено контактов:', contactsList.length);
      console.log('[ContactList] Список контактов:', contactsList.map(c => ({
        id: c.user_id,
        name: `${c.first_name} ${c.last_name}`,
        username: c.username,
        role: c.role_name,
        active: c.is_active,
        group: c.student_group
      })));
      
      setContacts(contactsList);
    } catch (err) {
      // Не показываем ошибку, просто устанавливаем пустой список контактов
      // Пользователь увидит сообщение "Не нашли подходящих контактов"
      console.error('[ContactList] Ошибка загрузки контактов:', err);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Используем debounce для поиска и обновления при изменении refreshKey
    const timeoutId = setTimeout(() => {
      loadContacts();
    }, 300);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, searchQuery]);

  // Подписываемся на события WebSocket для обновления контактов
  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      let updateTimeout = null;
      let isUpdating = false; // Флаг для предотвращения параллельных обновлений
      
      // Подписываемся на событие регистрации нового пользователя
      const handleUserRegistered = (userData) => {
        console.log('[ContactList] Получено событие user_registered:', userData);
        
        // Если уже идет обновление, пропускаем
        if (isUpdating) {
          console.log('[ContactList] Обновление уже выполняется, пропускаем');
          return;
        }
        
        // Очищаем предыдущий таймер, если он есть (debounce)
        if (updateTimeout) {
          clearTimeout(updateTimeout);
        }
        
        // Небольшая задержка перед обновлением, чтобы дать время БД обновиться
        // и избежать множественных обновлений при нескольких событиях
        updateTimeout = setTimeout(() => {
          if (!isUpdating) {
            isUpdating = true;
            console.log('[ContactList] Обновление списка контактов после регистрации нового пользователя');
            loadContacts().finally(() => {
              isUpdating = false;
              updateTimeout = null;
            });
          }
        }, 800); // Увеличиваем задержку для лучшего debounce
      };
      
      socket.on('user_registered', handleUserRegistered);
      console.log('[ContactList] Подписка на событие user_registered установлена');
      
      return () => {
        if (updateTimeout) {
          clearTimeout(updateTimeout);
        }
        socket.off('user_registered', handleUserRegistered);
      };
    } else {
      console.warn('[ContactList] WebSocket недоступен для подписки на события');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        // Если чата нет, создаем временный объект чата без chat_id
        // Чат будет создан только при отправке первого сообщения
        const contact = contacts.find(c => c.user_id === contactId);
        if (contact) {
          const tempChat = {
            chat_id: null, // Временный чат без ID
            chat_type: 'private',
            chat_name: null,
            other_participant: {
              user_id: contact.user_id,
              first_name: contact.first_name,
              last_name: contact.last_name,
              middle_name: contact.middle_name,
              username: contact.username,
              avatar_url: contact.avatar_url,
              role_name: contact.role_name
            },
            is_temp: true // Флаг временного чата
          };
          onStartChat(tempChat);
        }
      }
    } catch (err) {
      console.error('Ошибка проверки чата:', err);
      // В случае ошибки создаем временный чат
      const contact = contacts.find(c => c.user_id === contactId);
      if (contact) {
        const tempChat = {
          chat_id: null,
          chat_type: 'private',
          chat_name: null,
          other_participant: {
            user_id: contact.user_id,
            first_name: contact.first_name,
            last_name: contact.last_name,
            middle_name: contact.middle_name,
            username: contact.username,
            avatar_url: contact.avatar_url,
            role_name: contact.role_name
          },
          is_temp: true
        };
        onStartChat(tempChat);
      }
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
                  {contact.first_name} {contact.last_name} {contact.middle_name || ''}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#6c757d', marginTop: '0.25rem' }}>
                  {contact.role_name === 'student' ? 'Студент' : 
                   contact.role_name === 'teacher' ? 'Преподаватель' : 
                   contact.role_name === 'admin' ? 'Администратор' : contact.role_name}
                  {contact.student_group && ` • ${contact.student_group}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

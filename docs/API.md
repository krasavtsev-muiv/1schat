# API Документация

## Базовый URL
```
http://localhost:3001/api
```

## Аутентификация

Большинство endpoints требуют JWT токен в заголовке:
```
Authorization: Bearer <token>
```

## Endpoints

### Аутентификация

#### POST /auth/register
Регистрация нового пользователя

**Тело запроса:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "first_name": "string",
  "last_name": "string"
}
```

#### POST /auth/login
Вход в систему

**Тело запроса:**
```json
{
  "email": "string",
  "password": "string"
}
```

#### GET /auth/me
Получение текущего пользователя (требует аутентификации)

### Чаты

#### GET /chats
Получение списка чатов пользователя

#### POST /chats
Создание нового чата

#### GET /chats/:chatId
Получение информации о чате

### Сообщения

#### GET /messages/:chatId
Получение сообщений чата

#### POST /messages/:chatId
Отправка сообщения

## Автор

Красавцев Сергей Сергеевич


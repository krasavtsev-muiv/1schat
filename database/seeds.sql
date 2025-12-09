-- Начальные данные для базы данных
-- Выполнить после создания схемы (schema.sql)
-- 
-- ВАЖНО: 
-- - Этот файл содержит только минимально необходимые данные для развертывания новой БД с нуля
-- - Схема schema.sql уже содержит все необходимые таблицы (включая таблицы для интеграции с 1С)
-- - Миграции не требуются, так как schema.sql актуальна
-- Все остальные данные (пользователи, кафедры, группы, дисциплины) будут создаваться через:
-- 1. Регистрацию пользователей через форму регистрации
-- 2. Создание сущностей администратором через панель управления

-- Вставка ролей
INSERT INTO roles (role_name, role_description, permissions) VALUES
('admin', 'Администратор', '{"all": true, "users": {"create": true, "read": true, "update": true, "delete": true}, "chats": {"create": true, "read": true, "update": true, "delete": true, "moderate": true}, "1c": {"create": true, "read": true, "update": true, "delete": true}, "settings": {"read": true, "update": true}, "feedback": {"read": true, "respond": true}, "export": {"create": true, "read": true}}'::jsonb),
('teacher', 'Преподаватель', '{"chats": {"create": true, "read": true, "update": true, "moderate": true}, "users": {"read": true}, "messages": {"create": true, "read": true, "update": true, "delete": true}, "files": {"upload": true, "download": true}}'::jsonb),
('student', 'Студент', '{"chats": {"read": true, "create": true}, "messages": {"create": true, "read": true, "update": true, "delete": true}, "files": {"upload": true, "download": true}}'::jsonb)
ON CONFLICT (role_name) DO UPDATE SET 
  role_description = EXCLUDED.role_description,
  permissions = EXCLUDED.permissions;

-- Вставка администратора
-- Пароль должен быть захеширован с помощью bcrypt
-- Пример хеша (для тестирования):
-- admin123 -> $2b$10$.ngFVHS3/6mAbAoq0e2dO.Bty9wSCrPvBYGSjeU4cPZSRBJ4YlJDG
-- 
-- ВАЖНО: 
-- - email полностью удален из системы (колонка удалена)
-- - Администратор не синхронизируется с 1С (sync_1c_id остается NULL)
-- - У администратора уникальное значение для department чтобы отличать от обычных пользователей
-- - role_id получается через подзапрос для надежности

INSERT INTO users (username, password_hash, first_name, last_name, role_id, department, student_group, sync_1c_id) 
SELECT 
  'admin',
  '$2b$10$.ngFVHS3/6mAbAoq0e2dO.Bty9wSCrPvBYGSjeU4cPZSRBJ4YlJDG',
  'Администратор',
  'Системы',
  (SELECT role_id FROM roles WHERE role_name = 'admin'),
  'SYSTEM_ADMIN',
  NULL,
  NULL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin')
ON CONFLICT (username) DO NOTHING;


-- Вставка настроек системы
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('max_file_size', '10485760', 'number', 'Максимальный размер файла в байтах (10MB)'),
('max_chat_participants', '100', 'number', 'Максимальное количество участников в групповом чате'),
('message_history_days', '365', 'number', 'Сколько дней хранить историю сообщений')
ON CONFLICT (setting_key) DO NOTHING;

-- Примечания:
-- 1. Таблицы departments, groups, disciplines будут заполняться автоматически при:
--    - Регистрации пользователей (студентов и преподавателей)
--    - Создании сущностей администратором через панель управления
--
-- 2. Таблицы student_disciplines и teacher_disciplines будут заполняться автоматически при:
--    - Регистрации студентов (связи с их дисциплинами)
--    - Регистрации преподавателей (связи с их дисциплинами)
--    - Авторизации пользователей (обновление связей при изменении данных в 1С)
--
-- 3. Контакты пользователей реализованы через приватные чаты (таблица chats с chat_type='private')
--    и автоматически создаются при регистрации студентов и преподавателей
--
-- 4. Групповые чаты создаются автоматически при регистрации студентов (по группам)

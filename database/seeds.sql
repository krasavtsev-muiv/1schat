-- Начальные данные для базы данных
-- Выполнить после создания схемы (schema.sql) и миграций:
-- - 001_add_1c_tables.sql
-- - 002_update_users_email_nullable.sql (если БД создавалась до удаления email)
-- - 003_remove_email_column.sql (удаление колонки email)
-- 
-- ВАЖНО: Этот файл содержит только минимально необходимые данные для развертывания новой БД с нуля
-- Все остальные данные (пользователи, кафедры, группы, дисциплины) будут создаваться через:
-- 1. Регистрацию пользователей через форму регистрации
-- 2. Создание сущностей администратором через панель управления

-- Вставка ролей
INSERT INTO roles (role_name, role_description, permissions) VALUES
('admin', 'Администратор системы', '{"all": true}'::jsonb),
('manager', 'Менеджер/Преподаватель', '{"chats": true, "users": true, "moderate": true}'::jsonb),
('student', 'Студент', '{"chats": true, "read": true, "write": true}'::jsonb)
ON CONFLICT (role_name) DO NOTHING;

-- Вставка администратора
-- Пароль должен быть захеширован с помощью bcrypt
-- Пример хеша (для тестирования):
-- admin123 -> $2b$10$.ngFVHS3/6mAbAoq0e2dO.Bty9wSCrPvBYGSjeU4cPZSRBJ4YlJDG
-- 
-- ВАЖНО: email полностью удален из системы (колонка удалена)
-- Администратор не синхронизируется с 1С (sync_1c_id и sync_1c_date остаются NULL)

INSERT INTO users (username, password_hash, first_name, last_name, role_id, faculty, department, position, sync_1c_id, sync_1c_date) VALUES
('admin', '$2b$10$.ngFVHS3/6mAbAoq0e2dO.Bty9wSCrPvBYGSjeU4cPZSRBJ4YlJDG', 'Администратор', 'Системы', 1, 'ИТ', 'Кафедра ИС', 'Администратор', NULL, NULL)
ON CONFLICT (username) DO NOTHING;

-- Вставка тегов чатов
INSERT INTO chat_tags (tag_name, tag_color, description) VALUES
('Учебный', '#3498db', 'Чаты связанные с учебным процессом'),
('Административный', '#e74c3c', 'Административные вопросы'),
('Общий', '#95a5a6', 'Общие обсуждения'),
('Проект', '#9b59b6', 'Обсуждение проектов')
ON CONFLICT (tag_name) DO NOTHING;

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

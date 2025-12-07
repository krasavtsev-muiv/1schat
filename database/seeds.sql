-- Начальные данные для базы данных
-- Выполнить после создания схемы (schema.sql)

-- Вставка ролей
INSERT INTO roles (role_name, role_description, permissions) VALUES
('admin', 'Администратор системы', '{"all": true}'::jsonb),
('manager', 'Менеджер/Преподаватель', '{"chats": true, "users": true, "moderate": true}'::jsonb),
('student', 'Студент', '{"chats": true, "read": true, "write": true}'::jsonb);

-- Вставка администратора
-- Пароль должен быть захеширован с помощью bcrypt
-- Пример хеша (для тестирования):
-- admin123 -> $2b$10$.ngFVHS3/6mAbAoq0e2dO.Bty9wSCrPvBYGSjeU4cPZSRBJ4YlJDG

INSERT INTO users (username, email, password_hash, first_name, last_name, role_id, faculty, department, position) VALUES
('admin', 'admin@university.ru', '$2b$10$.ngFVHS3/6mAbAoq0e2dO.Bty9wSCrPvBYGSjeU4cPZSRBJ4YlJDG', 'Администратор', 'Системы', 1, 'ИТ', 'Кафедра ИС', 'Администратор');

-- Вставка тегов чатов
INSERT INTO chat_tags (tag_name, tag_color, description) VALUES
('Учебный', '#3498db', 'Чаты связанные с учебным процессом'),
('Административный', '#e74c3c', 'Административные вопросы'),
('Общий', '#95a5a6', 'Общие обсуждения'),
('Проект', '#9b59b6', 'Обсуждение проектов');

-- Вставка настроек системы
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('max_file_size', '10485760', 'number', 'Максимальный размер файла в байтах (10MB)'),
('max_chat_participants', '100', 'number', 'Максимальное количество участников в групповом чате'),
('message_history_days', '365', 'number', 'Сколько дней хранить историю сообщений');

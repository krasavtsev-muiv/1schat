-- Схема базы данных для веб-сервиса чата
-- PostgreSQL

-- Создание базы данных (выполнить отдельно)
-- CREATE DATABASE chat_service_db;

-- Подключение к базе данных
-- \c chat_service_db;

-- Расширения PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Таблица ролей
CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    role_description TEXT,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица пользователей
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    avatar_url VARCHAR(500),
    role_id INTEGER NOT NULL REFERENCES roles(role_id) ON DELETE RESTRICT,
    department VARCHAR(200),
    student_group VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    last_online TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sync_1c_id VARCHAR(100) UNIQUE
);

-- Таблица чатов
CREATE TYPE chat_type_enum AS ENUM ('private', 'group');

CREATE TABLE chats (
    chat_id SERIAL PRIMARY KEY,
    chat_name VARCHAR(255),
    chat_type chat_type_enum NOT NULL,
    created_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP
);

-- Таблица участников чатов
CREATE TYPE chat_role_enum AS ENUM ('owner', 'admin', 'member');

CREATE TABLE chat_participants (
    participant_id SERIAL PRIMARY KEY,
    chat_id INTEGER NOT NULL REFERENCES chats(chat_id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    role_in_chat chat_role_enum DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP,
    last_read_at TIMESTAMP,
    is_muted BOOLEAN DEFAULT FALSE,
    UNIQUE(chat_id, user_id)
);

-- Таблица сообщений
CREATE TYPE message_type_enum AS ENUM ('text', 'file', 'forwarded', 'system');

CREATE TABLE messages (
    message_id SERIAL PRIMARY KEY,
    chat_id INTEGER NOT NULL REFERENCES chats(chat_id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    message_text TEXT,
    message_type message_type_enum DEFAULT 'text',
    forwarded_from_message_id INTEGER REFERENCES messages(message_id) ON DELETE SET NULL,
    forwarded_from_user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица файлов сообщений
CREATE TABLE message_files (
    file_id SERIAL PRIMARY KEY,
    message_id INTEGER NOT NULL REFERENCES messages(message_id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    thumbnail_path VARCHAR(500),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица уведомлений
CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    related_chat_id INTEGER REFERENCES chats(chat_id) ON DELETE CASCADE,
    related_message_id INTEGER REFERENCES messages(message_id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица сессий пользователей
CREATE TABLE user_sessions (
    session_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица обратной связи
CREATE TYPE feedback_status_enum AS ENUM ('new', 'in_progress', 'resolved', 'closed');

CREATE TABLE feedback (
    feedback_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status feedback_status_enum DEFAULT 'new',
    admin_response TEXT,
    responded_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    responded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица настроек системы
CREATE TABLE system_settings (
    setting_id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(50),
    description TEXT,
    updated_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица истории экспортов
CREATE TYPE export_status_enum AS ENUM ('pending', 'processing', 'completed', 'failed');

CREATE TABLE export_history (
    export_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    export_type VARCHAR(50) NOT NULL,
    chat_ids JSONB DEFAULT '[]',
    date_from TIMESTAMP,
    date_to TIMESTAMP,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    status export_status_enum DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);


-- Таблица шаблонов сообщений
CREATE TABLE message_templates (
    template_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    template_name VARCHAR(255) NOT NULL,
    template_text TEXT NOT NULL,
    category VARCHAR(100),
    is_public BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблицы для интеграции с 1С

-- Таблица кафедр
CREATE TABLE departments (
    department_id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    sync_1c_code VARCHAR(100) UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица групп
CREATE TABLE groups (
    group_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department_id INTEGER REFERENCES departments(department_id) ON DELETE SET NULL,
    sync_1c_code VARCHAR(100) UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, department_id)
);

-- Таблица дисциплин
CREATE TABLE disciplines (
    discipline_id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    department_id INTEGER REFERENCES departments(department_id) ON DELETE SET NULL,
    sync_1c_code VARCHAR(100) UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, department_id)
);

-- Таблица связей студент-дисциплина
CREATE TABLE student_disciplines (
    relation_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    discipline_id INTEGER NOT NULL REFERENCES disciplines(discipline_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, discipline_id)
);

-- Таблица связей преподаватель-дисциплина
CREATE TABLE teacher_disciplines (
    relation_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    discipline_id INTEGER NOT NULL REFERENCES disciplines(discipline_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, discipline_id)
);

-- Индексы для оптимизации запросов

-- Индексы для таблицы users
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_sync_1c_id ON users(sync_1c_id) WHERE sync_1c_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_last_online ON users(last_online);

-- Индексы для таблицы chats
CREATE INDEX IF NOT EXISTS idx_chats_created_by ON chats(created_by);
CREATE INDEX IF NOT EXISTS idx_chats_chat_type ON chats(chat_type);
CREATE INDEX IF NOT EXISTS idx_chats_last_message_at ON chats(last_message_at);
CREATE INDEX IF NOT EXISTS idx_chats_is_active ON chats(is_active);

-- Индексы для таблицы chat_participants
CREATE INDEX IF NOT EXISTS idx_chat_participants_chat_id ON chat_participants(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_last_read_at ON chat_participants(last_read_at);

-- Индексы для таблицы messages
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_chat_created ON messages(chat_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_forwarded_from ON messages(forwarded_from_message_id);

-- Индексы для таблицы message_files
CREATE INDEX IF NOT EXISTS idx_message_files_message_id ON message_files(message_id);
CREATE INDEX IF NOT EXISTS idx_message_files_file_type ON message_files(file_type);

-- Индексы для таблицы notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);

-- Индексы для таблицы user_sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Индексы для таблицы feedback
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);

-- Индексы для таблицы export_history
CREATE INDEX IF NOT EXISTS idx_export_history_user_id ON export_history(user_id);
CREATE INDEX IF NOT EXISTS idx_export_history_status ON export_history(status);
CREATE INDEX IF NOT EXISTS idx_export_history_created_at ON export_history(created_at);


-- Индексы для таблицы message_templates
CREATE INDEX IF NOT EXISTS idx_message_templates_user_id ON message_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_message_templates_is_public ON message_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_message_templates_category ON message_templates(category);

-- Индексы для таблиц интеграции с 1С
CREATE INDEX IF NOT EXISTS idx_departments_sync_1c_code ON departments(sync_1c_code);
CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);

CREATE INDEX IF NOT EXISTS idx_groups_sync_1c_code ON groups(sync_1c_code);
CREATE INDEX IF NOT EXISTS idx_groups_department_id ON groups(department_id);
CREATE INDEX IF NOT EXISTS idx_groups_name ON groups(name);

CREATE INDEX IF NOT EXISTS idx_disciplines_sync_1c_code ON disciplines(sync_1c_code);
CREATE INDEX IF NOT EXISTS idx_disciplines_department_id ON disciplines(department_id);
CREATE INDEX IF NOT EXISTS idx_disciplines_name ON disciplines(name);

CREATE INDEX IF NOT EXISTS idx_student_disciplines_user_id ON student_disciplines(user_id);
CREATE INDEX IF NOT EXISTS idx_student_disciplines_discipline_id ON student_disciplines(discipline_id);

CREATE INDEX IF NOT EXISTS idx_teacher_disciplines_user_id ON teacher_disciplines(user_id);
CREATE INDEX IF NOT EXISTS idx_teacher_disciplines_discipline_id ON teacher_disciplines(discipline_id);

-- Триггеры для автоматического обновления updated_at

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON chats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON feedback
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_templates_updated_at BEFORE UPDATE ON message_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disciplines_updated_at BEFORE UPDATE ON disciplines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Триггер для обновления last_message_at в чате
CREATE OR REPLACE FUNCTION update_chat_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chats SET last_message_at = NEW.created_at WHERE chat_id = NEW.chat_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_chat_last_message_trigger AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION update_chat_last_message();


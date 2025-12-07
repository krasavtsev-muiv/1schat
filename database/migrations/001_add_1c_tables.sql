-- Миграция: Добавление таблиц для интеграции с 1С
-- Выполнить после schema.sql

-- Таблица кафедр
CREATE TABLE IF NOT EXISTS departments (
    department_id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    sync_1c_code VARCHAR(100) UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица групп
CREATE TABLE IF NOT EXISTS groups (
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
CREATE TABLE IF NOT EXISTS disciplines (
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
CREATE TABLE IF NOT EXISTS student_disciplines (
    relation_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    discipline_id INTEGER NOT NULL REFERENCES disciplines(discipline_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, discipline_id)
);

-- Таблица связей преподаватель-дисциплина
CREATE TABLE IF NOT EXISTS teacher_disciplines (
    relation_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    discipline_id INTEGER NOT NULL REFERENCES disciplines(discipline_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, discipline_id)
);

-- Индексы для оптимизации запросов
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
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disciplines_updated_at BEFORE UPDATE ON disciplines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


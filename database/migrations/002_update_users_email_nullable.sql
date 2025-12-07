-- Миграция: Изменение поля email в таблице users для поддержки NULL
-- Email больше не используется в системе, но оставляем поле для совместимости

-- Удаляем ограничение NOT NULL с поля email
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

-- Удаляем уникальное ограничение с email (так как может быть NULL)
-- Сначала удаляем индекс, если он существует
DROP INDEX IF EXISTS idx_users_email;

-- Удаляем уникальное ограничение
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;

-- Создаём новый индекс только для не-NULL значений
CREATE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL;


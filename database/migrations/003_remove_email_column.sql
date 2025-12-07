-- Миграция: Полное удаление колонки email из таблицы users
-- Email больше не используется в системе, полностью удаляем колонку

-- Удаляем индекс для email (если существует)
DROP INDEX IF EXISTS idx_users_email;

-- Удаляем уникальное ограничение с email (если существует)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;

-- Удаляем колонку email
ALTER TABLE users DROP COLUMN IF EXISTS email;


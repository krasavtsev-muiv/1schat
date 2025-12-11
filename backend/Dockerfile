# Dockerfile для бэкенда
FROM node:18-alpine

WORKDIR /app

# Копируем package.json и package-lock.json (если есть)
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --only=production

# Копируем остальные файлы
COPY . .

# Создаем директорию для загруженных файлов
RUN mkdir -p uploads

# Открываем порт
EXPOSE 3001

# Запускаем приложение
CMD ["node", "server.js"]

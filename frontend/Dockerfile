# Dockerfile для фронтенда (Next.js)
FROM node:18-alpine AS builder

WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем все зависимости (нужны для сборки)
# Используем npm install вместо npm ci для большей гибкости
RUN npm install

# Копируем остальные файлы
COPY . .

# Собираем приложение
RUN npm run build

# Продакшн образ
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=80
ENV HOSTNAME="0.0.0.0"
ENV BACKEND_URL=http://backend:3001

# Копируем package.json и package-lock.json для установки production зависимостей
COPY --from=builder /app/package*.json ./

# Устанавливаем только production зависимости
# Используем npm install вместо npm ci для большей гибкости
RUN npm install --omit=dev

# Копируем собранное приложение и исходники
COPY --from=builder /app/.next ./.next
# Создаем директорию public (она может отсутствовать в проекте, Next.js работает без неё)
RUN mkdir -p ./public
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/next.config.js ./next.config.js

# Открываем порт 80
EXPOSE 80

# Запускаем custom server
CMD ["node", "server.js"]

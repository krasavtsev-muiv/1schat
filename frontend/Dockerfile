# Dockerfile для фронтенда (Next.js)
FROM node:18-alpine AS builder

WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем все зависимости (нужны для сборки)
RUN npm ci

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

# Копируем package.json для установки production зависимостей
COPY package*.json ./

# Устанавливаем только production зависимости
RUN npm ci --only=production

# Копируем собранное приложение и исходники
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/next.config.js ./next.config.js

# Открываем порт 80
EXPOSE 80

# Запускаем custom server
CMD ["node", "server.js"]

#!/bin/bash

# Скрипт для полного сброса базы данных
# ВНИМАНИЕ: Этот скрипт удалит ВСЕ данные из базы данных!
# Использование: ./reset-db.sh [--force] - флаг --force пропускает подтверждение

set -e

FORCE=false
if [ "$1" == "--force" ]; then
    FORCE=true
fi

if [ "$FORCE" != "true" ]; then
    echo "⚠️  ВНИМАНИЕ: Этот скрипт удалит ВСЕ данные из базы данных!"
    echo ""
    read -p "Вы уверены, что хотите продолжить? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        echo "❌ Операция отменена"
        exit 0
    fi
fi

# Определяем команду для docker compose
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

echo ""
echo "🛑 Остановка всех контейнеров и удаление volumes..."
$DOCKER_COMPOSE down -v

echo ""
echo "🗑️  Удаление контейнера базы данных (если остался)..."
docker rm -f chat_db 2>/dev/null || echo "Контейнер chat_db не найден"

echo ""
echo "🗑️  Проверка и удаление volume с данными базы данных (если остался)..."

# Определяем имя volume через docker compose config
VOLUME_NAME=$($DOCKER_COMPOSE config --volumes 2>/dev/null | grep postgres_data | head -1 || true)

if [ -z "$VOLUME_NAME" ]; then
    # Если docker-compose не помог, определяем имя проекта
    PROJECT_NAME=$(basename "$(pwd)" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]//g')
    VOLUME_NAME="${PROJECT_NAME}_postgres_data"
fi

# Проверяем и удаляем volume если он еще существует
if docker volume inspect "$VOLUME_NAME" >/dev/null 2>&1; then
    docker volume rm "$VOLUME_NAME"
    echo "✅ Volume $VOLUME_NAME удален"
else
    # Ищем все volumes с postgres_data на всякий случай
    VOLUMES=$(docker volume ls -q | grep postgres_data || true)
    if [ -n "$VOLUMES" ]; then
        for vol in $VOLUMES; do
            docker volume rm "$vol" 2>/dev/null && echo "✅ Volume $vol удален" || echo "⚠️  Не удалось удалить volume $vol"
        done
    else
        echo "✅ Volume с данными базы данных удален"
    fi
fi

echo ""
echo "🔨 Запуск контейнеров с чистой базой данных..."
$DOCKER_COMPOSE up -d

echo ""
echo "⏳ Ожидание готовности базы данных..."
sleep 10

echo ""
echo "📊 Статус контейнеров:"
$DOCKER_COMPOSE ps

echo ""
echo "✅ База данных успешно сброшена!"
echo ""
echo "База данных была полностью очищена и пересоздана с начальными данными из schema.sql и seeds.sql"

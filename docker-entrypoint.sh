#!/bin/sh
set -e

echo "Waiting for database..."
i=0
until node -e "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.\$queryRaw\`SELECT 1\`.then(async()=>{await p.\$disconnect();process.exit(0)}).catch(async()=>{await p.\$disconnect();process.exit(1)})" >/dev/null 2>&1; do
  i=$((i + 1))
  if [ "$i" -ge 60 ]; then
    echo "Database not ready after 60s"
    exit 1
  fi
  sleep 1
done

if [ -z "$DIRECT_URL" ]; then
  echo "DIRECT_URL is unset; using DATABASE_URL for migrations."
  export DIRECT_URL="$DATABASE_URL"
fi

echo "Running migrations..."
npx prisma migrate deploy

echo "Seeding exercise library..."
npx tsx prisma/seed.ts

echo "Starting app..."
exec "$@"

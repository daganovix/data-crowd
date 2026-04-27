#!/bin/sh

echo ">>> DATABASE_URL is set: $([ -n "$DATABASE_URL" ] && echo yes || echo NO - MISSING)"

echo ">>> Running database migrations..."
cd server
npx prisma migrate deploy 2>&1 || echo "Warning: migration had issues, continuing anyway"
cd ..

echo ">>> Starting server..."
exec NODE_ENV=production node server/dist/index.js

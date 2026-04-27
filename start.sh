#!/bin/sh
set -e

echo ">>> Running database migrations..."
cd server
npx prisma migrate deploy
cd ..

echo ">>> Starting server..."
NODE_ENV=production node server/dist/index.js

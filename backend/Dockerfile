FROM node:20-slim

# postgresql-client provides pg_dump/pg_restore, used by the Backup & Recovery feature.
RUN apt-get update && apt-get install -y --no-install-recommends postgresql-client \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

RUN mkdir -p uploads/complaints backups

EXPOSE 5000

# Applies any pending migrations on every deploy, then starts the API.
CMD npx prisma migrate deploy && node src/server.js

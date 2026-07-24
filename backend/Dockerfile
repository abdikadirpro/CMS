FROM node:20-slim

# postgresql-client provides pg_dump/pg_restore, used by the Backup & Recovery feature. pg_dump
# refuses to dump from a server newer than itself, and Debian bookworm's default apt repo only
# ships client v15 — too old for a v16+ managed Postgres (Render, Neon, etc.), so pull the matching
# major version from the official PGDG apt repo instead. Bump PG_CLIENT_MAJOR if the DB provider
# upgrades its Postgres major version (check the real version with `SELECT version();`).
ARG PG_CLIENT_MAJOR=16
RUN apt-get update && apt-get install -y --no-install-recommends wget gnupg lsb-release ca-certificates \
    && wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /usr/share/keyrings/postgresql.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/postgresql.gpg] http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list \
    && apt-get update && apt-get install -y --no-install-recommends "postgresql-client-${PG_CLIENT_MAJOR}" \
    && apt-get purge -y --auto-remove wget gnupg lsb-release \
    && rm -rf /var/lib/apt/lists/*

# Fail the build loudly (with the actual version printed) rather than silently shipping a
# mismatched pg_dump that only surfaces as a runtime error when someone clicks "Create Backup".
RUN pg_dump --version && pg_dump --version | grep -q "(PostgreSQL) ${PG_CLIENT_MAJOR}\." \
    || (echo "ERROR: installed pg_dump is not major version ${PG_CLIENT_MAJOR}" && exit 1)

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

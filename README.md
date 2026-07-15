# Complaint Management System (CMS)

Enterprise-grade Complaint Management System with a 4-tier admin hierarchy (Super Admin, Zone Admin, Town Administration Admin, District Admin, Office Admin), full complaint lifecycle + transfer workflow, real-time notifications, and analytics dashboards.

## Stack

- **Frontend:** React 18, Vite, Tailwind CSS, React Router v6, Redux Toolkit + RTK Query, Framer Motion, Recharts, Socket.io client
- **Backend:** Node.js, Express, PostgreSQL, Prisma ORM, JWT auth, Socket.io
- **Database:** PostgreSQL 16+

## Prerequisites

- Node.js 18+
- PostgreSQL 16+ installed locally and running (e.g. via the official Windows installer). Create a database:

  ```sql
  CREATE DATABASE cms_db;
  ```

## Backend Setup

```bash
cd backend
npm install                 # already run in this workspace
```

A `backend/.env` already exists with random JWT secrets generated for local dev — you only need to edit `DATABASE_URL` to match your local PostgreSQL user/password (default assumes `postgres`/`postgres` on `localhost:5432`, database `cms_db`).

```bash
npx prisma migrate dev --name init
node prisma/seed.js
npm run dev                 # starts API on http://localhost:5000
```

## Frontend Setup

```bash
cd frontend
npm install                 # already run in this workspace
npm run dev                 # starts app on http://localhost:5173
```

No `.env` is required for local dev — Vite proxies `/api` and `/socket.io` to the backend (see `vite.config.js`).

## Seeded Accounts

All seeded accounts (2 Super Admins, 22 Zone Admins, 12 Town Admins, 190 District Admins, sample Office Admins, and demo citizen users) share the dev password documented in `backend/prisma/seed.js` (`Passw0rd!123`). Emails follow the pattern printed to the console when you run the seed script — check the terminal output after seeding for a full login table, or query the `Admin`/`User` tables directly.

Zone/District/Town names are placeholders (`Zone 1`, `District 1`, …) — rename them for real via the Zone/District/Town Management pages once logged in as Super Admin, or edit `backend/prisma/seed.js` directly before seeding.

## Deferred / Future Features

Per project scope, these are stubbed or not yet wired to a real provider: email notifications (Nodemailer), SMS notifications (Twilio), AI complaint categorization, real-time chat, multi-language (i18n), GIS complaint heatmap. OTP verification is simulated (code is logged to the backend console / returned in the dev API response instead of sent via SMS/email).

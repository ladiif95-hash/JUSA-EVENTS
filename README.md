# JUSA Seminar & Event Registration System

Full specification: [docs/JUSA-Events-SRS.md](docs/JUSA-Events-SRS.md) (SRS, frontend, backend, Tailwind, MongoDB).

This repository is separated into two applications:

- `frontend/` — React, Vite, TypeScript, and Tailwind user interface.
- `backend/` — Express, TypeScript, MongoDB API, and supporting services.

## Run locally

```bash
npm install
npm run db:up
npm run dev:frontend
npm run dev:backend
```

For a local database, copy `backend/.env.local.example` to `backend/.env.local`. Docker Desktop must be running before `npm run db:up`. This starts MongoDB on `127.0.0.1:27017` and keeps data in a Docker volume.

Alternatively, copy `backend/.env.example` to `backend/.env` and configure MongoDB Atlas, JWT, SMTP, and Google OAuth before using the live authentication, email, QR, and registration features. Never commit `.env` or `.env.local` files.

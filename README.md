# Vacation Management App

A full-stack vacation management system with user authentication, admin vacation management, AI recommendation support, and an MCP natural language chat interface.

## Project Structure

- `server.ts` - Backend entrypoint for Express and TypeScript
- `controllers/` - Request handlers for auth, vacations, and MCP
- `routes/` - Route definitions for API endpoints
- `db/schema.sql` - MySQL schema for database tables
- `frontend/` - React + Vite frontend application
- `Dockerfile` - Backend Docker image definition
- `docker-compose.yml` - Local development stack with backend, frontend, MySQL, and phpMyAdmin

## Features

- User registration and login with JWT
- Vacation browsing, filtering, and liking
- Admin dashboard for creating and editing vacations
- Image upload and display for vacation cards
- AI recommendation page for travel suggestions
- MCP chat page for querying the database in natural language
- Docker Compose support for local development

## Requirements

- Node.js 20+ and npm
- MySQL 8+
- Docker & Docker Compose (optional)

## Setup

1. Copy environment variables:
   ```bash
   copy .env.example .env
   ```
2. Update `.env` with your database and JWT settings.
3. Create the database schema:
   ```bash
   mysql -u <DB_USER> -p <DB_NAME> < db/schema.sql
   ```
4. Install backend dependencies:
   ```bash
   npm install
   ```
5. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   cd ..
   ```

## Running the App

### Backend

```bash
npm run build
node dist/server.js
```

### Frontend

```bash
cd frontend
npm run dev
```

### Full Stack with Docker

```bash
docker compose up -d --build
```

After Docker starts, open:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- phpMyAdmin: `http://localhost:8080`

## API Overview

### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`

### Vacations
- `GET /api/vacations`
- `GET /api/vacations/:id`
- `POST /api/vacations`
- `PUT /api/vacations/:id`
- `DELETE /api/vacations/:id`
- `POST /api/vacations/:id/like`

### MCP / AI
- `POST /api/mcp/ask`
- `POST /api/mcp/recommend`

## Environment Variables

Update `.env` with:

- `PORT` - backend server port
- `DB_HOST` - MySQL host
- `DB_USER` - MySQL username
- `DB_PASSWORD` - MySQL password
- `DB_NAME` - MySQL database name
- `JWT_SECRET` - secret key for JWT signing
- `JWT_EXPIRES_IN` - JWT expiration duration
- `UPLOAD_DIR` - directory for uploaded images
- `API_KEY` - AI provider key if required

## Notes

- Admin access is required for the vacation management page.
- Uploads are stored in the configured `UPLOAD_DIR`.
- Date fields are shown in `YYYY-MM-DD` format.
- The MCP page depends on a working backend AI/chat integration.

## Troubleshooting

- If the frontend can't reach the backend, confirm the backend is running and CORS is configured.
- For Docker issues, check service logs with `docker compose logs`.
- If image uploads fail, verify `UPLOAD_DIR` exists and the backend has write permissions.

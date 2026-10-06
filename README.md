# EVEGE — Events · People · Memories

A full-stack college event manager: discover events, register, and pay via UPI QR —
built with **Spring Boot 3 + PostgreSQL + JWT** (backend) and **React + Vite + Bootstrap 5** (frontend).

## Project structure

```
evege/
├── backend/                  # Spring Boot REST API (port 8082)
│   └── src/main/java/com/evege/eventmanager/
│       ├── controller/       # AuthController, EventController, RegistrationController
│       ├── dto/              # RegisterRequest, LoginRequest, AuthResponse, ...
│       ├── model/            # User, Event, Registration (JPA entities)
│       ├── repository/       # Spring Data JPA repositories
│       ├── security/         # JWT utils, filter, SecurityConfig
│       └── config/           # DataSeeder (sample events)
├── frontend/                 # React + Vite app (port 5173)
│   └── src/
│       ├── components/       # Logo, Navbar, StatCards, EventCard
│       ├── context/          # AuthContext (token + profile in localStorage)
│       ├── pages/            # Landing, Login, Home, Events, EventDetail, MyRegistrations
│       └── services/         # axios apiService (attaches Bearer token)
├── .github/workflows/        # CI: builds both Docker images
└── docker-compose.yml        # PostgreSQL + backend + frontend
```

## 1. Manual step: connect the database

This is the only step you do by hand.

1. Install/start PostgreSQL, then create the application database:
   ```sql
   CREATE DATABASE evege_db;
   ```
2. Set the connection values in `backend/src/main/resources/application.properties`:
   ```properties
   spring.datasource.url=${SPRING_DATASOURCE_URL:jdbc:postgresql://localhost:5432/evege_db}
   spring.datasource.username=${SPRING_DATASOURCE_USERNAME:postgres}
   spring.datasource.password=${SPRING_DATASOURCE_PASSWORD:rootpass}
   ```
   Set `SPRING_DATASOURCE_PASSWORD` to your PostgreSQL password.
3. Start the backend. Hibernate `ddl-auto=update` creates or updates the `events` and
   `registrations` tables automatically.
4. You can edit the same database manually in pgAdmin or with `psql`:
   ```bash
   psql -h localhost -p 5432 -U postgres -d evege_db
   ```
   Back up the database before structural changes.

## 2. Run locally (no Docker)

Backend (needs JDK 17 + Maven):
```bash
cd backend
mvn clean spring-boot:run        # http://localhost:8082
```

Frontend (needs Node 18+):
```bash
cd frontend
npm install
npm run dev                      # http://localhost:5173
```
The Vite dev proxy forwards `/api` → `http://localhost:8082`.

## 3. Run with Docker (single command)

```bash
docker compose up --build -d
docker compose ps
```
- Frontend (UI + QR scanner): http://localhost
- Backend API: http://localhost:8082/api/events

PostgreSQL is started by Compose with database `evege_db` already created, so no manual DB
step is needed in this mode. pgAdmin can connect using host `localhost`, port `5432`,
database `evege_db`, user `postgres`, and password `postgres`.

## 4. Deploying to Render & Vercel

### Backend on Render (Web Service):
1. **Repository:** Connect your GitHub repository `EVEGE`.
2. **Root Directory:** `backend` (or build from root using Dockerfile).
3. **Build Command:** `mvn clean package -DskipTests`
4. **Start Command:** `java -jar target/*.jar`
5. **Environment Variables:**
   - `DATABASE_URL`: Your Render PostgreSQL database connection string (auto-detected and formatted by `DatabaseConfig`).
   - `APP_JWT_SECRET`: Random 256-bit secret key.
   - `PORT`: (Automatically assigned by Render).

### Frontend on Vercel:
1. **Repository:** Connect your GitHub repository `EVEGE`.
2. **Framework Preset:** `Vite`
3. **Root Directory:** `frontend`
4. **Build Command:** `npm run build`
5. **Output Directory:** `dist`
6. **Environment Variables:**
   - `VITE_API_BASE_URL`: URL of your deployed Render backend (e.g. `https://evege-backend.onrender.com`).
   *(The app automatically handles appending `/api` and single-page routing via `vercel.json`)*.

## Features

- **Landing / Sign up** — EVEGE hero panel + full student registration form (branch, roll no, year, gender, T&C).
- **Login** — JWT issued by `POST /api/auth/login`, stored in `localStorage`.
- **Dashboard** — stat cards (events, registrations, fees collected, technical tracks) + event grid.
- **Events** — search + category filter.
- **Event detail** — 3-step flow: *Event Details → Payment → Confirmation* with a **real dynamic UPI QR**
  (`upi://pay?pa=…&am=…`), UTR entry, and a 10-minute payment countdown.
- **My Registrations** — per-user history with confirmed/pending status.

## API reference

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | – | Create account, returns JWT |
| POST | `/api/auth/login` | – | Login, returns JWT |
| GET | `/api/auth/me` | Bearer | Current profile |
| GET | `/api/events` | – | List events |
| GET | `/api/events/{id}` | – | Event detail |
| GET | `/api/events/stats` | – | Dashboard stats |
| POST | `/api/events` | – | Create event |
| POST | `/api/registrations` | Bearer | Register + record payment |
| GET | `/api/registrations` | Bearer | My registrations |

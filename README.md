# Investment Portfolio Management System

Full-stack portfolio app: **FastAPI** + **PostgreSQL** + **SQLAlchemy** backend, **React (Vite)** + **Tailwind CSS** + **shadcn-style UI** + **Chart.js** + **Axios** frontend. Authentication uses **JWT** and **bcrypt** password hashing.

## Prerequisites

- Python 3.11+ (with `pip`)
- Node.js 18+ and npm
- PostgreSQL running locally

## PostgreSQL (local)

Default connection string (also the fallback if `DATABASE_URL` is unset):

`postgresql://postgres:password@localhost:5432/portfolio_db`

### Option A: Docker (recommended for quick setup)

From the project root, with [Docker Desktop](https://www.docker.com/products/docker-desktop/) running:

```bash
docker compose up -d
```

This starts PostgreSQL 16 on port **5432**, user **`postgres`**, password **`password`**, database **`portfolio_db`** already created. Tables are still created by the API on startup.

Stop/remove (data kept in volume until you remove it):

```bash
docker compose down
```

### Option B: Windows installer (EDB)

1. Install from [PostgreSQL Windows downloads](https://www.postgresql.org/download/windows/). Use port **5432** unless you have a conflict.
2. Set the **`postgres`** superuser password to **`password`** for zero-config, or use your own password and set `DATABASE_URL` (see below).
3. Create the database (e.g. in **SQL Shell (psql)** or **pgAdmin**):

```sql
CREATE DATABASE portfolio_db;
```

You can also run the script [scripts/create_database.sql](scripts/create_database.sql) as a superuser.

### Backend environment

Copy [backend/.env.example](backend/.env.example) to `backend/.env` and edit if your password or host differs:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/portfolio_db
```

URL-encode special characters in the password (e.g. `@` → `%40`).

Tables are created automatically on API startup via `Base.metadata.create_all()`.

### Verify database before starting the API

From the `backend/` folder (after PostgreSQL is running and `DATABASE_URL` is correct):

```bash
python scripts/check_db.py
```

You should see `Database connection OK`. Then start Uvicorn and open http://127.0.0.1:8000/docs .

If you see **password authentication failed**, set the real password in `backend/.env` as `DATABASE_URL=...` (see [backend/.env.example](backend/.env.example)).

## Backend

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

- API docs: http://127.0.0.1:8000/docs  
- Health: http://127.0.0.1:8000/health  

On first startup, a default **admin** user is created if missing:

- Email: `admin@portfolio.local`  
- Password: `admin123`  

Register additional users via `POST /auth/register` (role `user`). Promote users to admin by updating the `users.role` column in PostgreSQL if needed.

### API summary

| Method | Path | Notes |
|--------|------|--------|
| POST | `/auth/register` | name, email, password |
| POST | `/auth/login` | JWT |
| GET | `/auth/me` | current user (Bearer token) |
| POST | `/portfolio/add` | add investment |
| GET | `/portfolio` | summary + holdings |
| GET | `/portfolio/report` | report payload |
| PUT | `/portfolio/update/{id}` | update qty / prices |
| DELETE | `/portfolio/delete/{id}` | remove holding |
| GET | `/analytics` | chart data + risk + top performer |
| GET | `/admin/users` | admin only |
| PATCH | `/admin/users/{id}/block` | body `{"blocked": true}` |
| DELETE | `/admin/users/{id}` | admin only |
| GET | `/admin/investments` | admin only |
| GET | `/admin/stats` | admin only |

### Schema note

Investments include an optional **`current_price`** column (defaults to buy price) so profit/loss and charts are meaningful. Cost basis remains `total_value = quantity * buy_price` as specified.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

The Vite dev server proxies `/api` to `http://127.0.0.1:8000`, so the Axios client uses `baseURL` `/api` by default. For a production build pointing at a separate API host, set:

`frontend/.env.production`

```env
VITE_API_URL=https://your-api-host
```

Then rebuild: `npm run build`.

## Features

- JWT stored in `localStorage`, protected routes, admin vs user roles  
- Portfolio CRUD, totals, P/L per asset, snapshots in `portfolio_history` for the growth line chart  
- Chart.js: line (growth), doughnut (allocation by type), bar (P/L per asset)  
- Report download: JSON and print/PDF via browser print  
- Admin: user list, block/unblock, delete users, all investments, aggregate stats  
- UI: sidebar, top bar, cards, tables, toasts (Sonner), auto-refresh on dashboard  

## Project layout

```
backend/
  main.py
  database.py
  models/
  schemas/
  routes/
  services/
  utils/
frontend/
  src/
    api/
    components/
    context/
    pages/
```

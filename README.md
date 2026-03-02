# Malta Real Estate CRM v2 — Golden Key Realty

Malta's luxury AI-powered real estate CRM platform, built with React + Vite (frontend) and Node.js + Express + PostgreSQL (backend).

---

## Prerequisites

- Node.js ≥ 18
- PostgreSQL ≥ 14
- npm ≥ 9

---

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/Patrick31214/malta-real-estate-crm-v2.git
cd malta-real-estate-crm-v2
```

### 2. Install dependencies

```bash
npm install          # root (backend + dev tools)
npm install --prefix client  # frontend
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your PostgreSQL credentials:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=malta_crm_v2
DB_USER=postgres
DB_PASSWORD=your_password_here
```

### 4. Create the database

```bash
createdb malta_crm_v2
```

### 5. Run database migrations

```bash
npm run db:migrate
```

### 6. Start the development servers

```bash
npm run dev
```

This starts:
- **Backend** on `http://localhost:5000` (nodemon)
- **Frontend** on `http://localhost:3000` (Vite)

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Run backend + frontend concurrently |
| `npm run server` | Run backend only (nodemon) |
| `npm run client` | Run frontend only (Vite) |
| `npm run db:migrate` | Run Sequelize migrations |
| `npm run db:seed` | Run Sequelize seeders |
| `npm run db:reset` | Drop, migrate, and seed the database |

---

## API

| Route | Method | Description |
|---|---|---|
| `/api/health` | GET | Health check — returns `{ status: 'ok', timestamp }` |

---

## Project Structure

```
malta-real-estate-crm-v2/
├── client/                    # React + Vite frontend
│   ├── src/
│   │   ├── components/ui/     # Reusable UI components
│   │   ├── pages/             # Page components
│   │   ├── services/          # Axios API service
│   │   └── styles/            # CSS design system
│   └── vite.config.js
├── src/                       # Express backend
│   ├── config/database.js     # Sequelize config
│   ├── models/                # Sequelize models
│   ├── routes/                # Express routes
│   └── server.js              # App entry point
├── .env.example
├── .sequelizerc
└── package.json
```

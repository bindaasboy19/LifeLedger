# LifeLedger - Smart Blood Bank Management System

Full-stack production-structured prototype with real backend logic, realtime Firestore updates, MongoDB historical storage, and Python AI forecasting microservice.

## Monorepo Structure

```text
Project LifeLedger/
  frontend/                  # React + Vite + Tailwind + Redux Toolkit
    src/
      app/
      components/
      features/
        auth/
        stock/
        sos/
        camps/
        notifications/
        dashboard/
      pages/
      routes/
      lib/
      hooks/
      styles/
    .env
    package.json
    vercel.json
  backend/                   # Node + Express + Firebase Admin + MongoDB
    src/
      config/
      controllers/
      middleware/
      routes/
      services/
      models/
      jobs/
      scripts/
      utils/
      app.js
      server.js
    .env
    package.json
  ai-service/                # FastAPI + scikit-learn + pandas + numpy
    app/main.py
    requirements.txt
    .env
  render.yaml
  README.md
```

## Features Implemented

- Firebase Authentication with role-aware profile provisioning.
- JWT verification on backend via Firebase Admin `verifyIdToken`.
- Role-based API access control (`user`, `donor`, `hospital`, `blood_bank`, `admin`).
- Realtime blood stock management using Firestore listeners.
- Expiry warning indicators.
- Blood search by group + location + radius + sort by distance/availability.
- SOS emergency workflow with donor matching and lifecycle transitions.
- Donor availability + 90-day cooldown enforcement.
- Donation camp creation/discovery with map markers and reminder scheduler.
- Realtime in-app notifications + email notification pipeline.
- AI 7-day demand prediction and shortage-risk scoring via FastAPI microservice.
- Admin governance: verification queue, SOS logs, analytics, user blocking.
- MongoDB historical collections: `sos_history`, `donation_history`, `audit_logs`, `ai_training_data`.
- Firestore collections: `users`, `blood_stock`, `sos_requests`, `donation_camps`, `notifications`.

## Prerequisites

- Node.js 20+
- npm 10+
- Python 3.10+
- MongoDB Atlas cluster
- Firebase project
- Google Maps JavaScript API key

## 1) Firebase Setup

1. Create a Firebase project.
2. Enable **Authentication -> Email/Password** provider.
3. Enable **Firestore Database** (Native mode).
4. Generate a service account key from **Project Settings -> Service Accounts**.
5. Fill backend `.env` with service account fields:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY` (keep `\n` escaped)
6. Fill frontend `.env` with web app config:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
7. If App Check enforcement is enabled, also configure:
   - `VITE_FIREBASE_APP_CHECK_SITE_KEY` (Web reCAPTCHA v3 site key from Firebase App Check)
   - Optional provider selector: `VITE_FIREBASE_APP_CHECK_PROVIDER` (`v3` or `enterprise`)
   - Optional local debug: `VITE_FIREBASE_APP_CHECK_DEBUG_TOKEN=true`
8. In Firebase Console:
   - App Check -> register your web app.
   - Add `localhost` and your deployed domain in allowed reCAPTCHA domains.
   - If debug token is used, add generated debug token in App Check Debug tokens.

## 2) MongoDB Setup

1. Create MongoDB Atlas cluster.
2. Create database user and network access rules.
3. Set `MONGODB_URI` in backend `.env`.

## 3) Environment Files

### Backend

```bash
cp backend/.env.example backend/.env
```

Required values:

- `MONGODB_URI`
- Firebase service account vars (`FIREBASE_*`)
- `AI_SERVICE_URL`
- Optional SMTP vars for production email delivery (`EMAIL_*`)

### Frontend

```bash
cp frontend/.env.example frontend/.env
```

Required values:

- `VITE_API_BASE_URL` (default local: `http://localhost:5000/api`)
- Firebase web config values
- `VITE_FIREBASE_APP_CHECK_SITE_KEY` when App Check is enforced
- `VITE_GOOGLE_MAPS_API_KEY`

### AI Service

```bash
cp ai-service/.env.example ai-service/.env
```

## 4) Install Dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
cd ../ai-service && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
```

## 5) Seed Demo Data

From `backend/`:

```bash
npm run seed -- --reset
```

For fresh interactive prototype activity at any time:

```bash
npm run seed:prototype
```

Seed includes:

- 3 hospitals
- 2 blood banks
- 10 donors (mixed blood groups)
- 5 SOS history records
- 3 upcoming camps
- AI training dataset (historical multi-region records)
- Firestore + Mongo + Firebase Auth demo users
- Additional prototype seeding script for live stock/SOS/camp activity generation

Default demo password for seeded Firebase Auth users:

```text
Demo@12345
```

Sample seeded login emails:

- `admin@lifeledger.demo`
- `user@lifeledger.demo`
- `hospital1@lifeledger.demo`
- `bloodbank1@lifeledger.demo`
- `donor1@lifeledger.demo`

## 6) Run Locally

Terminal 1 (AI service):

```bash
cd ai-service
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

Terminal 2 (backend):

```bash
cd backend
npm run dev
```

Terminal 3 (frontend):

```bash
cd frontend
npm run dev
```

App URLs:

- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:5000/api/health`
- AI health: `http://localhost:8000/health`

## 7) Deployment

### Frontend to Vercel

1. Import `frontend/` as a Vercel project.
2. Framework preset: **Vite**.
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add frontend env vars from `.env`.
6. Deploy.

### Backend to Render

1. Create new **Web Service**.
2. Root directory: `backend`
3. Build command: `npm install`
4. Start command: `npm start`
5. Add backend env vars from `.env`.
6. Set `CLIENT_URL` to deployed Vercel URL.
7. Deploy.

### AI Service to Render

1. Create new **Web Service**.
2. Root directory: `ai-service`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add `ALLOWED_ORIGINS` including frontend URL and backend URL.
6. Deploy.

### Update Backend AI URL

After AI deploy, set backend `AI_SERVICE_URL` to Render AI service URL and redeploy backend.

## AI Service Resilience

- Backend now falls back to internal forecast generation when AI microservice is unavailable.
- Admin and hospital dashboards still render forecast charts with a warning and `source` indicator.
- AI panel supports region filtering and manual refresh.

## Security Controls Implemented

- JWT validation (Firebase ID tokens) on all protected routes.
- Role-based authorization middleware.
- Input validation via `zod`.
- SOS route rate-limited (`express-rate-limit`).
- Account block enforcement in auth middleware.
- Helmet + CORS hardening.

## API Surface (Key Endpoints)

- `GET /api/health`
- `POST /api/auth/profile`
- `GET /api/auth/me`
- `GET /api/stock`
- `POST /api/stock`
- `PATCH /api/stock/:id`
- `DELETE /api/stock/:id`
- `GET /api/stock/search`
- `POST /api/sos`
- `GET /api/sos`
- `PATCH /api/sos/:id/status`
- `PATCH /api/donor/profile`
- `GET /api/donor/history/:uid?`
- `POST /api/donor/history/:uid?`
- `GET /api/camps`
- `POST /api/camps`
- `PATCH /api/camps/:id`
- `DELETE /api/camps/:id`
- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`
- `GET /api/admin/verification-queue`
- `PATCH /api/admin/verify/:uid`
- `PATCH /api/admin/block/:uid`
- `GET /api/admin/sos-logs`
- `GET /api/admin/analytics`
- `POST /api/admin/prototype-seed`
- `POST /api/ai/predict`

## Notes for Demo Recording

- Use seeded accounts with `Demo@12345`.
- Open two browser windows with different roles to show realtime Firestore updates.
- Trigger SOS from a user account and accept from donor account to demonstrate lifecycle transitions.
- Show admin dashboard analytics and AI shortage risk chart.
- Show camp creation and map markers in camp finder.
- Use `Generate Prototype Activity` button in Admin dashboard (or `npm run seed:prototype`) to create live demo data instantly.

# LifeLedger - Smart Blood Bank Management System

LifeLedger is a full-stack blood bank and emergency SOS platform built as a production-structured prototype. The current repo contains a Vite React frontend, an Express backend, a FastAPI AI microservice, and a Firebase Cloud Functions worker for queued email delivery.

## Current Monorepo Structure

```text
Project LifeLedger/
  .github/
    ISSUE_TEMPLATE/
  frontend/                  # React + Vite + Tailwind + Redux Toolkit
    src/
      App.jsx
      main.jsx
      app/
      components/
        common/
        layout/
        maps/
      features/
        auth/
        camps/
        dashboard/
        notifications/
        sos/
        stock/
      hooks/
      lib/
      pages/
        auth/
        dashboards/
      routes/
      styles/
    .env
    index.html
    package.json
    package-lock.json
    postcss.config.js
    tailwind.config.js
    vite.config.js
    vercel.json
  backend/                   # Node + Express + Firebase Admin + MongoDB
    src/
      app.js
      server.js
      config/
      controllers/
      jobs/
      middleware/
      models/
      mongo/
      routes/
      scripts/
      services/
      utils/
    .env
    package.json
    package-lock.json
  ai-service/                # FastAPI + scikit-learn + pandas + numpy
    app/
      main.py
    .env
    requirements.txt
  functions/                 # Firebase Cloud Functions email worker
    src/
      index.js
    package.json
    package-lock.json
  .gitignore
  package-lock.json
  render.yaml
  README.md
```

## Current Stack

### Frontend
- React 19
- Vite 8
- Tailwind CSS
- Redux Toolkit
- React Router DOM
- Recharts
- Firebase Web SDK

### Backend
- Node.js
- Express
- Firebase Admin SDK
- MongoDB + Mongoose
- Nodemailer
- PDFKit
- node-cron
- zod

### AI Service
- FastAPI
- pandas
- numpy
- scikit-learn

### Realtime / Infra
- Firebase Authentication
- Firestore realtime listeners
- Firebase Storage
- Firebase Cloud Functions for queued email delivery
- MongoDB Atlas for historical and analytics data
- Google Maps JavaScript API and Directions API

## What Each Service Does

### `frontend/`
- Handles authentication UI, dashboards, SOS screens, stock, camps, notifications, AI charts, and map rendering.
- Connects to Firebase client SDK for Auth and Firestore listeners.
- Calls backend REST APIs through `VITE_API_BASE_URL`.

### `backend/`
- Main API server under `/api`.
- Verifies Firebase tokens.
- Owns sensitive business logic:
  - profile upsert/update
  - stock CRUD
  - SOS creation, dispatch, lock-safe accept/reject/cancel
  - camp creation/application/completion
  - certificate generation
  - analytics and admin controls
- Uses Firestore for live operational state and MongoDB for history/logging.

### `ai-service/`
- Serves blood demand prediction under `/predict`.
- Returns demo fallback prediction if no training records are supplied.
- Backend can still degrade gracefully if this service is unavailable.

### `functions/`
- Optional queued email worker.
- Processes `email_jobs` documents and sends mail using Nodemailer.
- Only required if backend `EMAIL_DELIVERY_MODE=queue`.
- Not required for normal local development if backend uses `EMAIL_DELIVERY_MODE=direct`.

## Data Model Used Right Now

### Firestore collections
- `users`
- `blood_stock`
- `stock_flow`
- `sos_requests`
- `sos_dispatch_offers`
- `sos_tracking`
- `donation_camps`
- `camp_applications`
- `notifications`
- `email_jobs`
- `notification_failures`

### MongoDB collections
- `sos_history`
- `donation_history`
- `donation_certificates`
- `audit_logs`
- `ai_training_data`

## Current Features Implemented

- Firebase Authentication with profile provisioning.
- Public individual role is `user`; organization roles are `ngo`, `hospital`, `blood_bank`; `admin` is private.
- Realtime Firestore-based stock updates.
- Blood search by group, city/radius, and distance/availability.
- SOS dispatch with:
  - compatibility filtering
  - availability and cooldown checks
  - phased radius expansion
  - Firestore offer documents
  - lock-safe acceptance
  - donor live tracking
- Camp creation, application, approval, and donation completion.
- Donation certificate generation and Firebase Storage upload.
- Realtime notifications and optional queued email delivery.
- AI prediction dashboards with backend fallback behavior.
- Admin verification queue, blocking, analytics, and SOS logs.

## Prerequisites

- Node.js 20+
- npm 10+
- Python 3.10+
- MongoDB Atlas database
- Firebase project
- Google Maps API key
- Google Cloud billing enabled for Maps

## Firebase / Google Cloud Setup

### Firebase project
1. Create a Firebase project.
2. Enable **Authentication -> Email/Password**.
3. Enable **Firestore Database** in Native mode.
4. Enable **Storage**.
5. Create a **Web App** for frontend config.
6. Generate a **Service Account** key from **Project Settings -> Service Accounts**.

### App Check
If App Check is enforced in Firebase, configure frontend with:
- `VITE_FIREBASE_APP_CHECK_SITE_KEY`
- optional `VITE_FIREBASE_APP_CHECK_PROVIDER=v3` or `enterprise`
- optional local debug `VITE_FIREBASE_APP_CHECK_DEBUG_TOKEN=true`

### Google Maps
Enable these APIs in Google Cloud for the same project:
- Maps JavaScript API
- Directions API

Also make sure:
- billing is enabled
- localhost and deployed domains are allowed in API key restrictions

## Environment Files

This repo currently does **not** rely on committed `.env.example` files. Create and maintain the env files manually for each service.

### `backend/.env`

```env
NODE_ENV=development
HOST=127.0.0.1
PORT=5000
CLIENT_URL=http://localhost:5173

MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority
AI_SERVICE_URL=http://localhost:8000
REMINDER_CRON=*/30 * * * *
SOS_RATE_WINDOW_MS=60000
SOS_RATE_MAX=5

FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_DATABASE_URL=

EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-smtp-user
EMAIL_PASS=your-smtp-password
EMAIL_FROM=LifeLedger <noreply@lifeledger.app>
EMAIL_DELIVERY_MODE=direct
```

### Backend env notes
- `CLIENT_URL` can be a comma-separated list of full frontend origins.
- `EMAIL_DELIVERY_MODE=direct` means backend sends email itself.
- `EMAIL_DELIVERY_MODE=queue` means backend writes to Firestore `email_jobs`, and Firebase Functions must be deployed.
- `FIREBASE_PRIVATE_KEY` must keep newline escapes as `\n` if stored on one line.

### `frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:5000/api

VITE_FIREBASE_API_KEY=your-web-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

VITE_FIREBASE_APP_CHECK_SITE_KEY=
VITE_FIREBASE_APP_CHECK_PROVIDER=v3
VITE_FIREBASE_APP_CHECK_DEBUG_TOKEN=true

VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### Frontend env notes
- `VITE_API_BASE_URL` can be either:
  - `http://localhost:5000`
  - `http://localhost:5000/api`
  - deployed backend root URL
  - deployed backend `/api` URL
- The frontend normalizes the URL to `/api` automatically.

### `ai-service/.env`

```env
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:5000,http://127.0.0.1:5000
```

### `functions/.env`

Use this only if you are running the Firebase Functions worker locally or want per-project Firebase Functions env management.

```env
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-smtp-user
EMAIL_PASS=your-smtp-password
EMAIL_FROM=LifeLedger <noreply@lifeledger.app>
FUNCTION_REGION=asia-south1
```

### Functions env notes
- The current `functions/src/index.js` expects plain runtime env vars.
- `functions/` is only needed when `backend/.env` sets `EMAIL_DELIVERY_MODE=queue`.
- For normal local development, keep backend on `EMAIL_DELIVERY_MODE=direct` and skip Functions.

## Install Dependencies

Run these once:

```bash
cd backend && npm install
cd ../frontend && npm install
cd ../functions && npm install
cd ../ai-service
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

## Current Project Scripts

### Backend
```bash
npm run dev
npm start
npm run seed
npm run seed:prototype
```

### Frontend
```bash
npm run dev
npm run build
npm run preview
```

### Functions
```bash
npm run serve
npm run deploy
```

## Seed Demo Data

From `backend/`:

```bash
npm run seed -- --reset
```

To generate additional live demo activity:

```bash
npm run seed:prototype
```

Seeded demo data includes:
- hospitals
- blood banks
- NGO organizer account
- individual user accounts with multiple blood groups
- stock entries
- SOS records
- camps
- camp applications
- AI training data
- donation certificate sample records

### Seeded demo login password

```text
Demo@12345
```

### Sample public demo accounts
- `user@lifeledger.demo`
- `ngo1@lifeledger.demo`
- `hospital1@lifeledger.demo`
- `bloodbank1@lifeledger.demo`

### Admin account note
Admin registration is private. Do not expose admin signup publicly. Create or maintain admin users directly through backend/data operations.

## Run Locally

Recommended local mode:
- backend email mode = `direct`
- Functions worker = optional / skipped

### 1. Start AI service

```bash
cd ai-service
source .venv/bin/activate
python3 -m uvicorn app.main:app --reload --port 8000
```

If `uvicorn --reload` fails, reinstall requirements inside the active venv.

### 2. Start backend

```bash
cd backend
npm run dev
```

Backend runs at:
- `http://127.0.0.1:5000`
- health: `http://127.0.0.1:5000/api/health`

### 3. Start frontend

```bash
cd frontend
npm run dev
```

Frontend runs at:
- `http://localhost:5173`

### 4. Optional: reseed demo data

```bash
cd backend
npm run seed -- --reset
```

## Firebase Functions Setup

The repo contains `functions/`, but the root Firebase CLI config files are not currently committed.

If you want to deploy or emulate Functions, create these files at repo root:

### `firebase.json`

```json
{
  "functions": {
    "source": "functions"
  }
}
```

### `.firebaserc`

```json
{
  "projects": {
    "default": "your-firebase-project-id"
  }
}
```

### Firebase CLI setup

```bash
npm install -g firebase-tools
firebase login
firebase use your-firebase-project-id
```

### Install Functions dependencies

```bash
cd functions
npm install
```

### Deploy Functions

From repo root:

```bash
firebase deploy --only functions
```

### When to use Functions

Use Functions only if backend uses:

```env
EMAIL_DELIVERY_MODE=queue
```

In that mode:
- backend writes email jobs into Firestore `email_jobs`
- Firebase Function `processEmailJob` sends the actual email
- failures are logged to `notification_failures`

If backend uses:

```env
EMAIL_DELIVERY_MODE=direct
```

then Functions are not required for mail delivery.

## Deployment

### Frontend -> Vercel

Current frontend deployment target is Vercel.

### Vercel settings
- Root directory: `frontend`
- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`

### Required Vercel env vars
- `VITE_API_BASE_URL`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_GOOGLE_MAPS_API_KEY`
- optional App Check vars

### Important note
After changing any `VITE_*` env value in Vercel, redeploy frontend. Vite reads env at build time.

### Backend -> Render

Current `render.yaml` already defines backend as:
- service name: `lifeledger-backend`
- rootDir: `backend`
- build command: `npm install`
- start command: `npm start`

### Required backend Render env vars
- `NODE_ENV=production`
- `PORT=5000` or Render-provided port
- `CLIENT_URL=https://your-frontend.vercel.app`
- `MONGODB_URI`
- `AI_SERVICE_URL=https://your-ai-service.onrender.com`
- all required `FIREBASE_*` admin vars
- optional `EMAIL_*`
- optional `EMAIL_DELIVERY_MODE=queue`

### Backend deployment note
- `CLIENT_URL` must include full origin with scheme.
- For multiple frontend domains, separate them with commas.

### AI Service -> Render

Current `render.yaml` already defines AI service as:
- service name: `lifeledger-ai`
- rootDir: `ai-service`
- build command: `pip install -r requirements.txt`
- start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Required AI env vars
- `ALLOWED_ORIGINS`

Recommended value includes:
- Vercel frontend URL
- Render backend URL
- local frontend/backend URLs if you use one config for both local and deployed testing

### Functions -> Firebase

Functions are deployed separately from Render and Vercel.

### Required runtime env for Functions
- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_SECURE`
- `EMAIL_USER`
- `EMAIL_PASS`
- `EMAIL_FROM`
- optional `FUNCTION_REGION`

### Deployment flow
1. Link repo root to your Firebase project.
2. Ensure repo root has `firebase.json` and `.firebaserc`.
3. Install dependencies in `functions/`.
4. Deploy with `firebase deploy --only functions`.
5. Set backend `EMAIL_DELIVERY_MODE=queue` only after Functions are deployed and email env is configured.

## Post-Deployment Wiring Checklist

### After frontend deploy
Set backend `CLIENT_URL` to the frontend origin and redeploy backend.

### After backend deploy
Set frontend `VITE_API_BASE_URL` to the backend URL and redeploy frontend.

### After AI deploy
Set backend `AI_SERVICE_URL` to the AI service URL and redeploy backend.

### After Functions deploy
If you want queued email delivery:
- set backend `EMAIL_DELIVERY_MODE=queue`
- redeploy backend

## Current API Surface

### Health
- `GET /api/health`
- `GET /api/ai/health`

### Auth
- `GET /api/auth/me`
- `POST /api/auth/profile`
- `PATCH /api/auth/profile`

### Stock
- `GET /api/stock`
- `GET /api/stock/flow`
- `GET /api/stock/search`
- `POST /api/stock`
- `PATCH /api/stock/:id`
- `DELETE /api/stock/:id`

### SOS
- `GET /api/sos`
- `POST /api/sos`
- `PATCH /api/sos/:id/status`

### Donor / community donation records
- `PATCH /api/donor/profile`
- `GET /api/donor/registry`
- `GET /api/donor/certificates/:uid?`
- `GET /api/donor/history/:uid?`
- `POST /api/donor/history/:uid?`

### Camps
- `GET /api/camps`
- `POST /api/camps`
- `PATCH /api/camps/:id`
- `DELETE /api/camps/:id`
- `GET /api/camps/applications/me`
- `POST /api/camps/:id/applications`
- `GET /api/camps/:id/applications`
- `PATCH /api/camps/:id/applications/:applicationId`

### Notifications
- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`

### Admin
- `GET /api/admin/verification-queue`
- `PATCH /api/admin/verify/:uid`
- `PATCH /api/admin/block/:uid`
- `GET /api/admin/sos-logs`
- `GET /api/admin/analytics`
- `POST /api/admin/prototype-seed`

### AI
- `POST /api/ai/predict`

## Common Troubleshooting

### `Network error` on login / API calls
Check:
- backend is running
- frontend `VITE_API_BASE_URL` points to correct backend
- backend `CLIENT_URL` includes the real frontend origin
- redeploy frontend after changing `VITE_*` vars

### `auth/firebase-app-check-token-is-invalid`
Check:
- `VITE_FIREBASE_APP_CHECK_SITE_KEY`
- correct App Check provider
- debug token registration if testing locally
- App Check enforcement settings in Firebase Console

### `[firebase] Invalid service account values in environment`
Check backend `FIREBASE_*` vars:
- project id
- client email
- private key formatting
- storage bucket

### `MongoDB connection failed bad auth : authentication failed`
Check:
- username/password in `MONGODB_URI`
- URL-encode special characters in password
- Atlas user permissions
- Atlas IP/network allowlist

### `Map preview unavailable`
Check:
- `VITE_GOOGLE_MAPS_API_KEY`
- Maps JavaScript API enabled
- Directions API enabled
- billing enabled
- referrer restrictions include localhost and deployed domains

### AI panel shows unavailable
Check:
- AI service is running
- backend `AI_SERVICE_URL` is correct
- Render AI service is deployed
- `ALLOWED_ORIGINS` includes frontend/backend origins

### Email not sending
If backend uses `EMAIL_DELIVERY_MODE=direct`:
- verify backend `EMAIL_*` vars

If backend uses `EMAIL_DELIVERY_MODE=queue`:
- verify Firebase Functions are deployed
- verify Functions `EMAIL_*` vars
- check Firestore `email_jobs`
- check Firestore `notification_failures`

## Demo Recording Notes

- Use seeded accounts with `Demo@12345`.
- Show two browser sessions for realtime behavior.
- Trigger SOS from one account and accept from a compatible matched account.
- Show stock flow updates from an organization account.
- Show camp creation and application approval.
- Show completed donation certificate link.
- Use Admin -> `Generate Prototype Activity` or run `npm run seed:prototype` from backend for fresh live demo data.

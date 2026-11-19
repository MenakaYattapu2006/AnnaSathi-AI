# AnnaSathi AI – Production Deployment & Operations Guide

This guide describes how to configure, deploy, and monitor the complete AnnaSathi AI platform across its three tiers:
1. **Frontend:** React 18 + Vite + TypeScript SPA
2. **Backend:** Node.js + Express.js API & Socket.IO server
3. **AI Microservice:** Python FastAPI predictive analytics service
4. **Data Tier:** Supabase PostgreSQL & Supabase Storage

---

## 1. Prerequisites & Environment Setup

| Component | Minimum Version | Recommended Service |
| :--- | :--- | :--- |
| Node.js | v18.0.0+ (Tested on v24) | Node.js Runtime |
| Python | v3.10+ (Tested on v3.15) | Python Runtime |
| Database | PostgreSQL 15+ | Supabase PostgreSQL |
| Storage | Object Storage | Supabase Storage (`annasathi-media`) |
| Email Service | Transactional SMTP/API | Brevo (Sendinblue) |

---

## 2. Local Development Quickstart

### Step 1: Environment Variables
Create `backend/.env` based on `backend/.env.example`:
```bash
cp backend/.env.example backend/.env
```

Key variables in `backend/.env`:
```ini
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Supabase PostgreSQL Connection String
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres

# Brevo Transactional Email
BREVO_API_KEY=xkeysib-...
BREVO_SENDER_EMAIL=verify@annasathi.org

# Supabase Storage
SUPABASE_URL=https://[PROJECT_ID].supabase.co
SUPABASE_SERVICE_ROLE_KEY=ey...
SUPABASE_STORAGE_BUCKET=annasathi-media

# Session Secrets (Generate with `openssl rand -hex 32`)
SESSION_SECRET=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
OTP_HMAC_SECRET=fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210
CSRF_SECRET=aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899

# AI Provider Configuration
AI_PROVIDER=gemini
GEMINI_API_KEY=AIzaSy...
AI_SERVICE_URL=http://localhost:8000
```

### Step 2: Database Migration & Seeding
```bash
# Run PostgreSQL schema migrations
cd backend
node database/migrate.js

# Seed initial roles and test credentials with Argon2id password hashes
node database/seeds/seed.js
```

### Step 3: Start Services
In three separate terminal windows:

**1. Start Backend Server:**
```bash
cd backend
npm run dev
# Running on http://localhost:5000
```

**2. Start Python AI Microservice:**
```bash
cd ai-service
python app/main.py
# Running on http://localhost:8000
```

**3. Start Frontend Development Server:**
```bash
cd frontend
npm run dev
# Running on http://localhost:5173
```

---

## 3. Production Deployment Architecture

```
[Users / Browsers]
        │
        ├───> [Vercel / Netlify / Cloudflare Pages] (Frontend SPA)
        │            │
        │            ▼ HTTPS / WSS
        ├───> [Railway / Render / AWS ECS] (Express Backend & Socket.IO)
        │            │
        │            ├───> [Internal HTTP] ───> [FastAPI AI Microservice]
        │            │
        │            ├───> [PostgreSQL Pool] ─> [Supabase PostgreSQL 15]
        │            │
        │            ├───> [HTTPS REST] ─────> [Supabase Storage Bucket]
        │            │
        │            └───> [HTTPS REST] ─────> [Brevo Transactional API]
```

### A. Deploying Frontend (Vercel / Netlify)
- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Environment Variables:**
  - `VITE_API_URL`: `https://api.yourdomain.com/api/v1`

### B. Deploying Node.js Backend (Railway / Render / Docker)
- **Root Directory:** `backend`
- **Start Command:** `node src/server.js`
- Set `NODE_ENV=production`
- Set `FRONTEND_URL=https://yourdomain.com`
- Configure cookie settings: `COOKIE_DOMAIN=.yourdomain.com`

### C. Deploying Python AI Microservice
- **Root Directory:** `ai-service`
- **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port 8000`
- Set `AI_SERVICE_SECRET` matching the backend configuration.

---

## 4. Security Checklist for Production

- [x] Passwords hashed using Argon2id with recommended memory/iteration cost.
- [x] OTP verification hashed via HMAC-SHA256 with timing-safe comparison.
- [x] Sessions issued as HttpOnly, Secure, SameSite=Lax/None cookies.
- [x] Row-level locking (`SELECT ... FOR UPDATE`) prevents concurrent double-acceptance race conditions.
- [x] Role-Based Access Control enforced strictly on backend routes.
- [x] Expired food creation blocked at both validator and service layers.
- [x] Document uploads restricted to authorized MIME types (`image/*`, `application/pdf`) and maximum size limits.
- [x] Rate limiting active on auth endpoints to prevent brute-force attacks.

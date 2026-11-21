# AnnaSathi AI – Food Donation & Hunger Prevention Network

> **A real-time, AI-driven surplus food redistribution platform connecting commercial donors, verified NGOs, and volunteer delivery networks to eliminate hunger and reduce food waste.**

---

## Architecture Overview

AnnaSathi AI is built on a modern, decoupled three-tier architecture:

```
[ Frontend: React 18 + Vite + TypeScript + Tailwind CSS ]
                         │
                         ▼ HTTPS (Session Cookies) & WebSockets
[ Backend: Node.js + Express (ES Modules) + Socket.IO (Port 5000) ]
       │                         │                         │
       ▼                         ▼                         ▼
[ Supabase PostgreSQL 15 ]   [ Brevo Email / OTP ]   [ Python FastAPI Microservice ]
(22 Relational Tables,       (6-Digit HMAC OTPs,      (Pandas & Scikit-learn
 Row-Level Locks)             Transactional Alerts)    Demand Forecasting, Port 8000)
```

---

## Key Modules & Features

### 1. Multi-Role Portals & Dashboards
- **Donor Portal:** Surplus food donation creation, AI urgency prediction (0-100), real-time delivery tracking, impact analytics (meals rescued, CO₂ and water savings).
- **NGO Dashboard:** NGO verification workflow (DARPAN ID & 80G document upload), smart surplus matching, race-condition safe acceptance (`SELECT ... FOR UPDATE`), delivery receipt confirmation.
- **Volunteer Delivery Network:** Available assignment discovery, acceptance, pickup and delivery verification, consent-based live GPS location tracking.
- **Admin Command Center:** Systemwide statistics, user role & status management, NGO verification review, real-time delivery telemetry, and immutable audit logs.

### 2. Security & Authentication (Strict Non-Bypass Architecture)
- **Custom Authentication:** Argon2id password hashing, 6-digit Brevo email OTP with HMAC-SHA256 timing-safe verification, server-managed sessions with HttpOnly cookies, and CSRF protection. (No third-party auth dependencies).
- **Role-Based Access Control (RBAC):** Every endpoint protected at the HTTP controller level against unauthorized roles.
- **Race Condition Prevention:** Database row-level locks prevent concurrent claims on donations and delivery tasks.

### 3. Artificial Intelligence & Analytics
- **Food Urgency Engine:** Safety-prioritized perishable food urgency scoring algorithm based on category, elapsed preparation time, expiry deadline, and ambient conditions.
- **NGO Matching Engine:** Haversine distance-based ranking matching food categories, cold storage capacity, and NGO availability.
- **Demand Prediction Microservice:** Python FastAPI microservice utilizing historical trends, day-of-week multipliers, and regional hunger indices.
- **Multimodal Chatbot Assistant:** Context-aware assistant supporting Google Gemini, NVIDIA NIM, and local knowledge fallback.

### 4. Real-Time Maps & Telemetry
- **Leaflet & OpenStreetMap:** Embedded interactive delivery route maps displaying donor pickup pins, NGO destination pins, and live volunteer movement.

---

## Directory Structure

```
AnnaSathi AI/
├── backend/                # Node.js + Express backend
│   ├── src/                # API source code
│   └── database/           # SQL schema (schema.sql)
├── ai-service/             # Python FastAPI AI microservice
├── frontend/               # React + Vite UI
│   └── src/                # Frontend source code
└── docs/                   # Documentation
```

---

## Quickstart Guide

### 1. Backend Setup
```bash
cd backend
cp .env.example .env
npm install
npm test            # Run 18/18 integration tests
npm run dev         # Starts backend on http://localhost:5000
```

### 2. Python AI Service Setup
```bash
cd ai-service
pip install -r requirements.txt
python tests/test_demand.py   # Run demand predictor tests
python app/main.py            # Starts AI service on http://localhost:8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run build       # Verify production Vite build
npm run dev         # Starts frontend on http://localhost:5173
```

---

## Documentation Links
- [API Documentation](docs/API_DOCUMENTATION.md)
- [Database Documentation](docs/DATABASE_DOCUMENTATION.md)
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md)
- [Phase 1 Completion Report](PHASE_1_COMPLETION_REPORT.md)
- [Phase 2 Completion Report](PHASE_2_COMPLETION_REPORT.md)

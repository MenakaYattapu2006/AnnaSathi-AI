# AnnaSathi AI – REST API Documentation

**Version:** 1.0.0  
**Base URL:** `/api/v1` (Default: `http://localhost:5000/api/v1`)  
**Protocol:** HTTPS / HTTP (Dev)  
**Authentication:** HttpOnly Secure Session Cookies (`annasathi_session`) + CSRF token header (`X-CSRF-Token`) for state-changing operations.

---

## 1. Authentication & Session Management

### `POST /auth/register`
Initiates self-registration for donors, NGOs, or volunteers. Emits a 6-digit Brevo email verification OTP (10-minute expiry). Self-registration as `admin` is strictly forbidden.

**Request Body:**
```json
{
  "name": "Aarav Sharma",
  "email": "aarav.sharma@example.com",
  "phone": "+919876543210",
  "password": "StrongPassword123!",
  "role": "donor",
  "organizationName": "ITC Grand Chola" // Optional (required for NGO)
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Registration initiated. Verification code sent to your registered email address.",
  "data": {
    "userId": "d7b97779-1144-4281-9bfe-f26ec89d6e4d",
    "email": "aarav.sharma@example.com",
    "role": "donor",
    "requiresOtp": true
  }
}
```

---

### `POST /auth/verify-otp`
Verifies registration OTP using HMAC-SHA256 validation. Activates user account and returns an authenticated session.

**Request Body:**
```json
{
  "email": "aarav.sharma@example.com",
  "otp": "482910"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Email verified and account activated successfully.",
  "user": {
    "id": "d7b97779-1144-4281-9bfe-f26ec89d6e4d",
    "name": "Aarav Sharma",
    "email": "aarav.sharma@example.com",
    "role": "donor"
  }
}
```

---

### `POST /auth/login`
Authenticates email and Argon2id password. Initiates 2FA OTP verification.

**Request Body:**
```json
{
  "email": "donor@example.com",
  "password": "DemoPassword123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Two-factor verification code dispatched to email.",
  "requiresOtp": true,
  "email": "donor@example.com"
}
```

---

### `POST /auth/verify-login-otp`
Validates 2FA login OTP. Sets `annasathi_session` HttpOnly cookie.

**Request Body:**
```json
{
  "email": "donor@example.com",
  "otp": "619482"
}
```

---

### `POST /auth/logout`
Destroys session in database and clears session cookies.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully."
}
```

---

### `GET /auth/me`
Retrieves currently authenticated user and active session metadata.

---

## 2. Donation Lifecycle & Management

### `POST /donations`
Creates a surplus food donation record. Automatically calculates AI urgency score (0-100) and triggers nearest NGO matching notifications.

**Authorization:** Requires `donor` or `admin` role.

**Request Body:**
```json
{
  "foodName": "Fresh Vegetable Biryani",
  "category": "cooked_meals",
  "quantity": 50,
  "unit": "meals",
  "dietaryType": "veg",
  "preparationTime": "2026-11-20T12:00:00Z",
  "expiryTime": "2026-11-20T17:00:00Z",
  "pickupAddress": {
    "street": "14 Road No. 36, Jubilee Hills",
    "city": "Hyderabad",
    "state": "Telangana",
    "pincode": "500033",
    "latitude": 17.4319,
    "longitude": 78.4074
  },
  "specialInstructions": "Packed in sterile thermal containers. Ground floor entrance."
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "e0a78635-f2d4-4b53-9a11-042898c608f1",
    "status": "CREATED",
    "urgencyScore": 86,
    "urgencyLevel": "critical",
    "foodName": "Fresh Vegetable Biryani",
    "matchedNgosCount": 4
  }
}
```

---

### `GET /donations`
Lists donations filtered by status, category, donor, or page limits.

---

### `GET /donations/:id`
Retrieves single donation record with full tracking lifecycle timestamps.

---

### `PATCH /donations/:id/cancel`
Cancels an active donation before pickup. Strictly rejected if donation is `PICKED_UP`, `DELIVERED`, or `RECEIPT_CONFIRMED`.

---

## 3. NGO Acceptance & Verification

### `GET /ngo/available-donations`
Returns available donations within NGO operational radius matching accepted food categories.

---

### `POST /ngo/accept/:id`
Concurrency-safe donation acceptance using PostgreSQL row-level locks (`SELECT ... FOR UPDATE`). Prevents race conditions when multiple NGOs claim the same surplus lot.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Donation accepted successfully. Volunteer pickup request dispatched.",
  "status": "NGO_ACCEPTED"
}
```

---

### `POST /ngo/confirm-receipt/:id`
Confirms food receipt at destination facility. Strictly gated behind prerequisite status `DELIVERED`.

---

## 4. Volunteer Dispatch & Telemetry

### `GET /volunteer/available-tasks`
Returns unassigned tasks within volunteer coverage radius.

---

### `POST /volunteer/accept/:assignmentId`
Row-level locked assignment acceptance preventing duplicate volunteer claims. Status changes from `available` to `assigned`.

---

### `POST /volunteer/pickup/:assignmentId`
Records food collection from donor facility. Updates status to `picked_up` and donation status to `PICKED_UP`.

---

### `POST /volunteer/deliver/:assignmentId`
Records successful handover to NGO. Updates status to `delivered` and donation status to `DELIVERED`.

---

### `POST /volunteer/location`
Real-time GPS telemetry ingestion endpoint (consent-based). Broadcasts live coordinates to Socket.IO tracking rooms.

**Request Body:**
```json
{
  "latitude": 17.4325,
  "longitude": 78.4091,
  "heading": 85.2,
  "speed": 24.5,
  "donationId": "e0a78635-f2d4-4b53-9a11-042898c608f1"
}
```

---

## 5. AI Services & Analytics

### `POST /ai/urgency/predict`
Calculates perishable food urgency score (0-100) using food safety prioritization.

### `POST /ai/demand/predict`
Proxies demand forecasting request to Python FastAPI microservice.

### `POST /ai/chat`
Conversational assistant supporting Google Gemini, NVIDIA NIM, or built-in contextual knowledge fallback.

---

## 6. Admin Platform Telemetry & Audit Logs

### `GET /admin/stats`
Consolidated platform metrics: meals rescued, active deliveries, verified NGOs, user counts.

### `PATCH /admin/ngos/:id/verify`
Approves or rejects NGO registration with official DARPAN / 80G audit notes.

### `GET /admin/telemetry`
Live location telemetry for active volunteer transit routes.

### `GET /admin/audit-logs`
Immutable audit trail records for compliance, dispute resolution, and security oversight.

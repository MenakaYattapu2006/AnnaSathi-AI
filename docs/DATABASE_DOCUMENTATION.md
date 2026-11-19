# AnnaSathi AI – Database Architecture & Schema Documentation

**Database Engine:** PostgreSQL 15+ (Supabase Managed PostgreSQL)  
**Schema File:** `backend/database/schema.sql`  
**Migration Runner:** `backend/database/migrate.js`  
**Seed Runner:** `backend/database/seeds/seed.js`

---

## 1. Relational Entity Overview

The schema is composed of 22 strongly-typed relational tables with foreign key constraints, ENUM validations, indexes on high-cardinality search fields, and optimistic/pessimistic concurrency locking support.

```
                           +------------------+
                           |      users       |
                           +--------+---------+
                                    |
          +-------------------------+-------------------------+
          |                         |                         |
+---------v---------+     +---------v---------+     +---------v---------+
|     donors        |     |      ngos         |     |    volunteers     |
+---------+---------+     +---------+---------+     +---------+---------+
          |                         |                         |
          |               +---------v---------+     +---------v---------+
          |               |   ngo_documents   |     | volunteer_locations
          |               +-------------------+     +---------+---------+
          |                                                   |
+---------v---------+                               +---------v---------+
|    donations      +-------------------------------> volunteer_        |
+---------+---------+                               |   assignments     |
          |                                         +-------------------+
          |
+---------v---------+
|   ai_matches      |
+-------------------+
```

---

## 2. Table Specifications

### 2.1 Core Authentication & Session Entities
- `users`: Core identity table storing user role (`donor`, `ngo`, `volunteer`, `admin`), Argon2id password hash, email, phone, status, and verification state.
- `sessions`: Server-managed sessions storing SHA-256 hashed session token, user ID, IP address, user agent, expiration timestamp, and last activity.
- `otp_codes`: Ephemeral 6-digit verification codes hashed via keyed HMAC-SHA256, associated with user email and action (`REGISTRATION`, `LOGIN_2FA`, `PASSWORD_RESET`). Includes attempts counter and 10-minute expiry.

### 2.2 Organizations & Documents
- `ngos`: NGO profiles including DARPAN registration ID, 80G tax exemption number, operational radius (km), food categories handled, cold storage capacity, and verification status (`PENDING`, `VERIFIED`, `REJECTED`).
- `ngo_documents`: Verification documents uploaded to Supabase Storage (`storage_path`, `mime_type`, `file_size`, `document_type`, `verification_status`).

### 2.3 Surplus Food Donations
- `donations`: Food donation lots with food category, quantity, unit, preparation timestamp, expiry deadline, pickup address with GPS coordinates (`latitude`, `longitude`), AI urgency score (0-100), urgency level, and state machine status:
  `CREATED` → `NGO_MATCHED` → `NGO_ACCEPTED` → `VOLUNTEER_ASSIGNED` → `PICKED_UP` → `DELIVERED` → `RECEIPT_CONFIRMED` (or `CANCELLED`).

### 2.4 Logistics, Volunteers & Telemetry
- `volunteers`: Volunteer profile with transport mode (`bicycle`, `motorcycle`, `car`, `van`), availability status, max travel radius, and current coverage zone.
- `volunteer_locations`: Real-time GPS location records (`latitude`, `longitude`, `heading`, `speed`, `updated_at`).
- `volunteer_assignments`: Delivery tasks linking a volunteer, donation, and destination NGO with lifecycle stages (`available`, `assigned`, `in_transit_to_pickup`, `picked_up`, `in_transit_to_drop`, `delivered`, `cancelled`).

### 2.5 Intelligence, Notifications & Audit
- `ai_matches`: Pre-computed AI ranking recommendations pairing donations with NGOs based on Haversine distance, capacity, and category matching.
- `ai_demand_predictions`: Regional hunger demand forecasts produced by the Python FastAPI microservice.
- `notifications`: User alert notifications with delivery channel (`IN_APP`, `EMAIL`, `PUSH`), read status, and payload.
- `audit_logs`: Immutable security and administrative audit log tracking user actions (`action`, `resource_type`, `resource_id`, `metadata`, `created_at`).
- `chatbot_sessions` & `chatbot_messages`: Conversation transcripts and session state for the AI Assistant.

---

## 3. Concurrency Safety & Race Condition Prevention

### Row-Level Locking (`SELECT ... FOR UPDATE`)
When an NGO accepts a donation or a volunteer accepts an assignment, concurrent transactions are serialized using row-level locking:

```sql
-- Safe NGO Acceptance Transaction
BEGIN;
SELECT id, status, matched_ngo_id FROM donations WHERE id = $1 FOR UPDATE;
-- Verify status is eligible ('CREATED' or 'NGO_MATCHED')
UPDATE donations SET status = 'NGO_ACCEPTED', matched_ngo_id = $2, updated_at = NOW() WHERE id = $1;
INSERT INTO volunteer_assignments (donation_id, ngo_id, status) VALUES ($1, $2, 'available');
COMMIT;
```

If multiple NGOs attempt to accept the same surplus food lot simultaneously, only the first transaction acquires the lock; subsequent transactions find the status has changed to `NGO_ACCEPTED` and are safely rejected with HTTP 409 Conflict without data corruption.

---

## 4. Performance Indexes

High-performance B-tree indexes are established on critical query patterns:
- `idx_users_email` on `users(email)`
- `idx_donations_status` on `donations(status)`
- `idx_donations_donor` on `donations(donor_id)`
- `idx_donations_urgency` on `donations(urgency_score DESC)`
- `idx_assignments_volunteer` on `volunteer_assignments(volunteer_id)`
- `idx_notifications_user_unread` on `notifications(user_id, is_read)`

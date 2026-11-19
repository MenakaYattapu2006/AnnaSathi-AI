-- AnnaSathi AI Database Schema
-- Supabase PostgreSQL Relational Schema
-- Version 1.0.0

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. AUTHENTICATION & USERS
-- ============================================================================

CREATE TYPE user_role AS ENUM ('donor', 'ngo', 'volunteer', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'donor',
  status user_status NOT NULL DEFAULT 'active',
  profile_image TEXT,
  bio TEXT,
  organization_name VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(20),
  email_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- Server-managed sessions (HttpOnly cookie identifier hash)
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token_hash VARCHAR(128) NOT NULL UNIQUE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_token_hash ON user_sessions(session_token_hash);
CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON user_sessions(expires_at);

-- Brevo Email OTP Challenges (Hashed HMAC storage with 10-minute validity)
CREATE TYPE otp_purpose AS ENUM ('register', 'login', 'reset_password');

CREATE TABLE IF NOT EXISTS email_otp_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  otp_hmac VARCHAR(128) NOT NULL,
  purpose otp_purpose NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_otp_email_purpose ON email_otp_challenges(email, purpose);
CREATE INDEX idx_otp_expires_at ON email_otp_challenges(expires_at);

-- Password Reset Requests
CREATE TABLE IF NOT EXISTS password_reset_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reset_token_hash VARCHAR(128) NOT NULL UNIQUE,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. NGO MANAGEMENT
-- ============================================================================

CREATE TYPE ngo_verification_status AS ENUM ('pending', 'verified', 'rejected');

CREATE TABLE IF NOT EXISTS ngos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  organization_name VARCHAR(255) NOT NULL,
  registration_number VARCHAR(100) NOT NULL UNIQUE,
  contact_person VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  description TEXT,
  street TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  pincode VARCHAR(20) NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  service_areas TEXT[] DEFAULT '{}',
  verification_status ngo_verification_status NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ngos_user_id ON ngos(user_id);
CREATE INDEX idx_ngos_status ON ngos(verification_status);
CREATE INDEX idx_ngos_city ON ngos(city);

-- NGO Registration & Compliance Documents (Private bucket storage references)
CREATE TABLE IF NOT EXISTS ngo_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_id UUID NOT NULL REFERENCES ngos(id) ON DELETE CASCADE,
  document_type VARCHAR(100) NOT NULL, -- e.g. 12A, 80G, CSR-1, Govt Registration
  document_name VARCHAR(255) NOT NULL,
  storage_path TEXT NOT NULL,
  file_size INT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  verification_status VARCHAR(50) NOT NULL DEFAULT 'submitted',
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ngo_docs_ngo_id ON ngo_documents(ngo_id);

-- NGO Food Requirements
CREATE TABLE IF NOT EXISTS ngo_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_id UUID NOT NULL REFERENCES ngos(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  daily_capacity_meals INT NOT NULL DEFAULT 50,
  dietary_preference VARCHAR(20) NOT NULL DEFAULT 'both', -- 'veg', 'non-veg', 'both'
  preferred_time_slots TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ngo_requirements_ngo_id ON ngo_requirements(ngo_id);

-- NGO Capacity Configuration
CREATE TABLE IF NOT EXISTS ngo_capacity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_id UUID NOT NULL UNIQUE REFERENCES ngos(id) ON DELETE CASCADE,
  max_daily_meals INT NOT NULL DEFAULT 100,
  current_available_capacity INT NOT NULL DEFAULT 100,
  has_cold_storage BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. FOOD DONATIONS
-- ============================================================================

CREATE TYPE food_category AS ENUM (
  'cooked_meals',
  'raw_groceries',
  'bakery_items',
  'packaged_food',
  'fruits_vegetables',
  'dairy_products'
);

CREATE TYPE donation_status AS ENUM (
  'CREATED',
  'NGO_MATCHED',
  'NGO_ACCEPTED',
  'VOLUNTEER_ASSIGNED',
  'PICKED_UP',
  'DELIVERED',
  'RECEIPT_CONFIRMED',
  'CANCELLED'
);

CREATE TYPE dietary_type AS ENUM ('veg', 'non-veg');
CREATE TYPE urgency_level AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  food_name VARCHAR(255) NOT NULL,
  category food_category NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL,
  unit VARCHAR(50) NOT NULL, -- kg, meals, packets, liters, boxes
  number_of_servings INT,
  dietary_type dietary_type NOT NULL DEFAULT 'veg',
  preparation_time TIMESTAMPTZ NOT NULL,
  expiry_time TIMESTAMPTZ NOT NULL,
  street TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  pincode VARCHAR(20) NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  landmark TEXT,
  matched_ngo_id UUID REFERENCES ngos(id) ON DELETE SET NULL,
  urgency_score INT NOT NULL CHECK (urgency_score >= 0 AND urgency_score <= 100),
  urgency_level urgency_level NOT NULL,
  status donation_status NOT NULL DEFAULT 'CREATED',
  special_instructions TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_donations_donor_id ON donations(donor_id);
CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_donations_matched_ngo_id ON donations(matched_ngo_id);
CREATE INDEX idx_donations_category ON donations(category);
CREATE INDEX idx_donations_expiry_time ON donations(expiry_time);

-- Donation Images Metadata
CREATE TABLE IF NOT EXISTS donation_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  mime_type VARCHAR(100),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Donation Audit / Status Transition History
CREATE TABLE IF NOT EXISTS donation_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  from_status donation_status,
  to_status donation_status NOT NULL,
  changed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_donation_history_donation_id ON donation_status_history(donation_id);

-- ============================================================================
-- 4. VOLUNTEER & LOGISTICS
-- ============================================================================

CREATE TYPE volunteer_availability AS ENUM ('available', 'busy', 'offline');
CREATE TYPE volunteer_status AS ENUM ('active', 'inactive');
CREATE TYPE vehicle_type AS ENUM ('two_wheeler', 'four_wheeler', 'van', 'none');

CREATE TABLE IF NOT EXISTS volunteers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  vehicle_type vehicle_type NOT NULL DEFAULT 'two_wheeler',
  service_areas TEXT[] DEFAULT '{}',
  availability volunteer_availability NOT NULL DEFAULT 'available',
  status volunteer_status NOT NULL DEFAULT 'active',
  current_latitude DOUBLE PRECISION,
  current_longitude DOUBLE PRECISION,
  location_updated_at TIMESTAMPTZ,
  total_deliveries_completed INT NOT NULL DEFAULT 0,
  rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_volunteers_user_id ON volunteers(user_id);
CREATE INDEX idx_volunteers_status ON volunteers(status);
CREATE INDEX idx_volunteers_availability ON volunteers(availability);

-- Delivery Assignments
CREATE TYPE assignment_status AS ENUM (
  'available',
  'assigned',
  'in_transit_to_pickup',
  'picked_up',
  'in_transit_to_drop',
  'delivered',
  'cancelled'
);

CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID NOT NULL UNIQUE REFERENCES donations(id) ON DELETE RESTRICT,
  volunteer_id UUID REFERENCES volunteers(id) ON DELETE SET NULL,
  ngo_id UUID NOT NULL REFERENCES ngos(id) ON DELETE RESTRICT,
  status assignment_status NOT NULL DEFAULT 'available',
  pickup_address TEXT NOT NULL,
  pickup_contact_person VARCHAR(255) NOT NULL,
  pickup_contact_phone VARCHAR(50) NOT NULL,
  estimated_pickup_time TIMESTAMPTZ NOT NULL,
  actual_pickup_time TIMESTAMPTZ,
  verification_otp VARCHAR(10) NOT NULL DEFAULT '5821',
  delivery_ngo_name VARCHAR(255) NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_contact_person VARCHAR(255) NOT NULL,
  delivery_contact_phone VARCHAR(50) NOT NULL,
  estimated_delivery_time TIMESTAMPTZ NOT NULL,
  actual_delivery_time TIMESTAMPTZ,
  recipient_signature_name VARCHAR(255),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assignments_donation_id ON assignments(donation_id);
CREATE INDEX idx_assignments_volunteer_id ON assignments(volunteer_id);
CREATE INDEX idx_assignments_ngo_id ON assignments(ngo_id);
CREATE INDEX idx_assignments_status ON assignments(status);

-- Delivery Status History
CREATE TABLE IF NOT EXISTS delivery_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  from_status assignment_status,
  to_status assignment_status NOT NULL,
  changed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Consent-Based Volunteer Live Location Updates
CREATE TABLE IF NOT EXISTS volunteer_location_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_id UUID NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  heading DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vol_loc_volunteer ON volunteer_location_updates(volunteer_id);
CREATE INDEX idx_vol_loc_assignment ON volunteer_location_updates(assignment_id);

-- ============================================================================
-- 5. COMMUNICATION & AUDIT LOGS
-- ============================================================================

CREATE TYPE notification_type AS ENUM (
  'donation_alert',
  'donation_accepted',
  'assignment_new',
  'pickup_completed',
  'delivery_completed',
  'verification_status',
  'urgent_requirement',
  'system_alert'
);

CREATE TYPE notification_status AS ENUM ('unread', 'read');

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type notification_type NOT NULL DEFAULT 'system_alert',
  status notification_status NOT NULL DEFAULT 'unread',
  related_entity_id UUID,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX idx_notifications_status ON notifications(status);

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  in_app_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Administrative Audit Logs
CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type VARCHAR(100) NOT NULL,
  target_id UUID,
  target_type VARCHAR(50),
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_logs_admin_id ON admin_activity_logs(admin_id);
CREATE INDEX idx_admin_logs_action ON admin_activity_logs(action_type);
CREATE INDEX idx_admin_logs_created_at ON admin_activity_logs(created_at);

-- ============================================================================
-- 6. AI, CHATBOT & ANALYTICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS chatbot_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL DEFAULT 'New Food Rescue Inquiry',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_conv_user ON chatbot_conversations(user_id);

CREATE TABLE IF NOT EXISTS chatbot_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chatbot_conversations(id) ON DELETE CASCADE,
  sender VARCHAR(20) NOT NULL CHECK (sender IN ('user', 'assistant')),
  content TEXT NOT NULL,
  provider VARCHAR(50) DEFAULT 'gemini', -- 'gemini' | 'nvidia_nim' | 'rule_fallback'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_msg_conv ON chatbot_messages(conversation_id);

-- Demand Predictions (Generated by Python AI microservice)
CREATE TABLE IF NOT EXISTS demand_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category food_category NOT NULL,
  region VARCHAR(100) NOT NULL,
  predicted_demand_meals INT NOT NULL,
  predicted_quantity NUMERIC(10, 2),
  time_period VARCHAR(50) NOT NULL, -- e.g. 'next_24_hours', 'weekly_trend'
  confidence_score NUMERIC(4, 3) NOT NULL,
  model_version VARCHAR(50) NOT NULL DEFAULT 'v1.0.0-scikit',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI Matching Engine Results
CREATE TABLE IF NOT EXISTS ai_match_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  ngo_id UUID NOT NULL REFERENCES ngos(id) ON DELETE CASCADE,
  match_score INT NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  distance_km NUMERIC(6, 2),
  explanation TEXT NOT NULL,
  rank INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_match_donation ON ai_match_results(donation_id);

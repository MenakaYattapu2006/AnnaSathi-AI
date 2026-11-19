-- Migration: 001_initial_schema.sql
-- Description: Creates initial relational tables for users, ngos, donations, volunteers, assignments, notifications, and AI tables.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('donor', 'ngo', 'volunteer', 'admin');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE otp_purpose AS ENUM ('register', 'login', 'reset_password');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE ngo_verification_status AS ENUM ('pending', 'verified', 'rejected');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE food_category AS ENUM (
    'cooked_meals',
    'raw_groceries',
    'bakery_items',
    'packaged_food',
    'fruits_vegetables',
    'dairy_products'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
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
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE dietary_type AS ENUM ('veg', 'non-veg');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE urgency_level AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE volunteer_availability AS ENUM ('available', 'busy', 'offline');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE volunteer_status AS ENUM ('active', 'inactive');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE vehicle_type AS ENUM ('two_wheeler', 'four_wheeler', 'van', 'none');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE assignment_status AS ENUM (
    'available',
    'assigned',
    'in_transit_to_pickup',
    'picked_up',
    'in_transit_to_drop',
    'delivered',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
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
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_status AS ENUM ('unread', 'read');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 1. Users
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

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. User Sessions
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

CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON user_sessions(session_token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);

-- 3. Email OTP Challenges
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

CREATE INDEX IF NOT EXISTS idx_otp_email_purpose ON email_otp_challenges(email, purpose);

-- 4. Password Reset Requests
CREATE TABLE IF NOT EXISTS password_reset_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reset_token_hash VARCHAR(128) NOT NULL UNIQUE,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. NGOs
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

CREATE INDEX IF NOT EXISTS idx_ngos_user_id ON ngos(user_id);
CREATE INDEX IF NOT EXISTS idx_ngos_status ON ngos(verification_status);

-- 6. NGO Documents
CREATE TABLE IF NOT EXISTS ngo_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_id UUID NOT NULL REFERENCES ngos(id) ON DELETE CASCADE,
  document_type VARCHAR(100) NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  storage_path TEXT NOT NULL,
  file_size INT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  verification_status VARCHAR(50) NOT NULL DEFAULT 'submitted',
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. NGO Requirements
CREATE TABLE IF NOT EXISTS ngo_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_id UUID NOT NULL REFERENCES ngos(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  daily_capacity_meals INT NOT NULL DEFAULT 50,
  dietary_preference VARCHAR(20) NOT NULL DEFAULT 'both',
  preferred_time_slots TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. NGO Capacity
CREATE TABLE IF NOT EXISTS ngo_capacity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_id UUID NOT NULL UNIQUE REFERENCES ngos(id) ON DELETE CASCADE,
  max_daily_meals INT NOT NULL DEFAULT 100,
  current_available_capacity INT NOT NULL DEFAULT 100,
  has_cold_storage BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Donations
CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  food_name VARCHAR(255) NOT NULL,
  category food_category NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_donations_donor_id ON donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
CREATE INDEX IF NOT EXISTS idx_donations_matched_ngo_id ON donations(matched_ngo_id);

-- 10. Donation Images
CREATE TABLE IF NOT EXISTS donation_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  mime_type VARCHAR(100),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Donation Status History
CREATE TABLE IF NOT EXISTS donation_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  from_status donation_status,
  to_status donation_status NOT NULL,
  changed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Volunteers
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

CREATE INDEX IF NOT EXISTS idx_volunteers_user_id ON volunteers(user_id);
CREATE INDEX IF NOT EXISTS idx_volunteers_status ON volunteers(status);

-- 13. Assignments
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

CREATE INDEX IF NOT EXISTS idx_assignments_donation_id ON assignments(donation_id);
CREATE INDEX IF NOT EXISTS idx_assignments_volunteer_id ON assignments(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);

-- 14. Delivery Status History
CREATE TABLE IF NOT EXISTS delivery_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  from_status assignment_status,
  to_status assignment_status NOT NULL,
  changed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Volunteer Location Updates
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

-- 16. Notifications
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

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);

-- 17. Notification Preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  in_app_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. Admin Activity Logs
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

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_activity_logs(admin_id);

-- 19. Chatbot Conversations
CREATE TABLE IF NOT EXISTS chatbot_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL DEFAULT 'New Food Rescue Inquiry',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. Chatbot Messages
CREATE TABLE IF NOT EXISTS chatbot_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chatbot_conversations(id) ON DELETE CASCADE,
  sender VARCHAR(20) NOT NULL CHECK (sender IN ('user', 'assistant')),
  content TEXT NOT NULL,
  provider VARCHAR(50) DEFAULT 'gemini',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 21. Demand Predictions
CREATE TABLE IF NOT EXISTS demand_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category food_category NOT NULL,
  region VARCHAR(100) NOT NULL,
  predicted_demand_meals INT NOT NULL,
  predicted_quantity NUMERIC(10, 2),
  time_period VARCHAR(50) NOT NULL,
  confidence_score NUMERIC(4, 3) NOT NULL,
  model_version VARCHAR(50) NOT NULL DEFAULT 'v1.0.0-scikit',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 22. AI Match Results
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

CREATE INDEX IF NOT EXISTS idx_ai_match_donation ON ai_match_results(donation_id);

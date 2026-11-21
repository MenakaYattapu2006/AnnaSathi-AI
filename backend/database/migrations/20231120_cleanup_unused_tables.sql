-- ------------------------------------------------------------
-- Migration: 20231120_cleanup_unused_tables
-- Purpose: Drop tables that are not used by the application.
-- ------------------------------------------------------------
BEGIN;

DROP TABLE IF EXISTS password_reset_requests CASCADE;
DROP TABLE IF EXISTS chatbot_conversations CASCADE;
DROP TABLE IF EXISTS ngo_documents CASCADE;
DROP TABLE IF EXISTS ngo_requirements CASCADE;
DROP TABLE IF EXISTS delivery_status_history CASCADE;
DROP TABLE IF EXISTS volunteer_location_updates CASCADE;

COMMIT;

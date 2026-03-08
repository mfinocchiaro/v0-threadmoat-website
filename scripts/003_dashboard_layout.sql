-- Add dashboard_layout JSONB column to profiles
-- Stores per-scenario widget visibility: { "startup_founder": ["network","landscape",...], ... }
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dashboard_layout JSONB DEFAULT NULL;

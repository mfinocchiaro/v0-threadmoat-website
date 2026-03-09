-- Add GDPR marketing consent flag to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN NOT NULL DEFAULT false;

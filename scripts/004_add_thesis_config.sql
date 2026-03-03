-- Add thesis configuration to profiles (JSONB stores VC/ISV/OEM thesis + active type)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS thesis_config JSONB DEFAULT NULL;

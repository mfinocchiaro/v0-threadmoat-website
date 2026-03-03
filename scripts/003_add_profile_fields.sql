-- Add profile fields to the profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS company TEXT,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS company_size TEXT CHECK (
    company_size IN ('1-10', '11-50', '51-200', '201-500', '500+')
  ),
  ADD COLUMN IF NOT EXISTS profile_type TEXT CHECK (
    profile_type IN ('startup_founder', 'vc_investor', 'oem_enterprise', 'isv_platform')
  );

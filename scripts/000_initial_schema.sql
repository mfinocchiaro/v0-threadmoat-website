-- ============================================================
-- ThreadMoat — Initial schema for Neon Postgres + NextAuth
-- Run this first, before any other migration scripts.
-- ============================================================

-- Users (credentials managed by NextAuth, not Supabase)
CREATE TABLE IF NOT EXISTS users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT        UNIQUE NOT NULL,
  password_hash TEXT        NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Profiles (one row per user)
CREATE TABLE IF NOT EXISTS profiles (
  id               UUID        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  is_admin         BOOLEAN     DEFAULT false,
  full_name        TEXT,
  company          TEXT,
  title            TEXT,
  phone            TEXT,
  linkedin_url     TEXT,
  company_size     TEXT        CHECK (company_size IN ('1-10','11-50','51-200','201-500','500+')),
  profile_type     TEXT        CHECK (profile_type IN ('startup_founder','vc_investor','oem_enterprise','isv_platform')),
  stripe_customer_id TEXT      UNIQUE,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- Subscriptions (Stripe + coupon trials)
CREATE TABLE IF NOT EXISTS subscriptions (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id     VARCHAR,
  stripe_subscription_id VARCHAR,
  product_id             VARCHAR     NOT NULL DEFAULT 'none',
  status                 VARCHAR     NOT NULL DEFAULT 'active'
                           CHECK (status IN ('active','trialing','inactive','canceled','expired','past_due')),
  current_period_start   TIMESTAMPTZ,
  current_period_end     TIMESTAMPTZ,
  created_at             TIMESTAMPTZ DEFAULT now(),
  updated_at             TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status  ON subscriptions(status);

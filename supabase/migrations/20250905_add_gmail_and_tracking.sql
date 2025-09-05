-- Migration: Add Gmail integration columns and tracking tables

-- 1. Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS gmail_access_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gmail_refresh_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gmail_connected_at TIMESTAMPTZ;

-- 2. Create usage tracking table
CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

-- 3. Create email scan results table
CREATE TABLE IF NOT EXISTS email_scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  gmail_message_id TEXT NOT NULL,
  subject TEXT,
  sender TEXT,
  category TEXT,
  is_newsletter BOOLEAN DEFAULT FALSE,
  is_deletable BOOLEAN DEFAULT FALSE,
  unsubscribe_url TEXT,
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, gmail_message_id)
);

-- 4. Enable RLS and add policies
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage logs" ON usage_logs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own email scans" ON email_scans
  FOR ALL USING (auth.uid() = user_id);

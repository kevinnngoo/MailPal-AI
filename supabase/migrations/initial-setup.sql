-- Combined migration file that includes all necessary database setup

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY NOT NULL,
    avatar_url text,
    user_id text UNIQUE,
    token_identifier text NOT NULL,
    subscription text,
    credits text,
    image text,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone,
    email text,
    name text,
    full_name text,
    email_provider text CHECK (email_provider IN ('gmail', 'outlook')),
    email_connected boolean DEFAULT false,
    last_cleanup_at timestamp with time zone,
    total_emails_cleaned integer DEFAULT 0,
    total_unsubscribes integer DEFAULT 0
);

-- User profiles table for extended user data
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text REFERENCES public.users(user_id) ON DELETE CASCADE,
    preferences jsonb DEFAULT '{}',
    cleanup_settings jsonb DEFAULT '{}',
    notification_settings jsonb DEFAULT '{"email_notifications": true, "cleanup_reminders": true}',
    timezone text DEFAULT 'UTC',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Cleanup jobs table
CREATE TABLE IF NOT EXISTS public.cleanup_jobs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text REFERENCES public.users(user_id) ON DELETE CASCADE,
    job_type text NOT NULL CHECK (job_type IN ('manual', 'scheduled', 'auto')),
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    parameters jsonb DEFAULT '{}',
    results jsonb DEFAULT '{}',
    emails_processed integer DEFAULT 0,
    emails_deleted integer DEFAULT 0,
    emails_unsubscribed integer DEFAULT 0,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    error_message text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Email categories table
CREATE TABLE IF NOT EXISTS public.email_categories (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text REFERENCES public.users(user_id) ON DELETE CASCADE,
    category_name text NOT NULL,
    category_type text NOT NULL CHECK (category_type IN ('subscription', 'promotion', 'spam', 'newsletter', 'social', 'other')),
    sender_domain text,
    sender_email text,
    email_count integer DEFAULT 0,
    last_seen_at timestamp with time zone,
    auto_action text CHECK (auto_action IN ('delete', 'unsubscribe', 'archive', 'keep')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Scheduled cleanups table
CREATE TABLE IF NOT EXISTS public.scheduled_cleanups (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text REFERENCES public.users(user_id) ON DELETE CASCADE,
    name text NOT NULL,
    frequency text NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
    parameters jsonb DEFAULT '{}',
    next_run_at timestamp with time zone,
    last_run_at timestamp with time zone,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text REFERENCES public.users(user_id),
    stripe_id text UNIQUE,
    price_id text,
    stripe_price_id text,
    currency text,
    interval text,
    status text,
    current_period_start bigint,
    current_period_end bigint,
    cancel_at_period_end boolean,
    amount bigint,
    started_at bigint,
    ends_at bigint,
    ended_at bigint,
    canceled_at bigint,
    customer_cancellation_reason text,
    customer_cancellation_comment text,
    metadata jsonb,
    custom_field_data jsonb,
    customer_id text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS subscriptions_stripe_id_idx ON public.subscriptions(stripe_id);
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON public.subscriptions(user_id);

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS user_profiles_user_id_idx ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS cleanup_jobs_user_id_idx ON public.cleanup_jobs(user_id);
CREATE INDEX IF NOT EXISTS cleanup_jobs_status_idx ON public.cleanup_jobs(status);
CREATE INDEX IF NOT EXISTS cleanup_jobs_created_at_idx ON public.cleanup_jobs(created_at);
CREATE INDEX IF NOT EXISTS email_categories_user_id_idx ON public.email_categories(user_id);
CREATE INDEX IF NOT EXISTS email_categories_type_idx ON public.email_categories(category_type);
CREATE INDEX IF NOT EXISTS scheduled_cleanups_user_id_idx ON public.scheduled_cleanups(user_id);
CREATE INDEX IF NOT EXISTS scheduled_cleanups_next_run_idx ON public.scheduled_cleanups(next_run_at);

-- Create webhook_events table
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type text NOT NULL,
    type text NOT NULL,
    stripe_event_id text,
    data jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    modified_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS webhook_events_type_idx ON public.webhook_events(type);
CREATE INDEX IF NOT EXISTS webhook_events_stripe_event_id_idx ON public.webhook_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS webhook_events_event_type_idx ON public.webhook_events(event_type);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleanup_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_cleanups ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist
DO $$
BEGIN
    -- Check if the policy for users exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'users' 
        AND policyname = 'Users can view own data'
    ) THEN
        -- Create policy to allow users to see only their own data
        EXECUTE 'CREATE POLICY "Users can view own data" ON public.users
                FOR SELECT USING (auth.uid()::text = user_id)';
    END IF;

    -- Check if the policy for subscriptions exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'subscriptions' 
        AND policyname = 'Users can view own subscriptions'
    ) THEN
        -- Create policy for subscriptions
        EXECUTE 'CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
                FOR SELECT USING (auth.uid()::text = user_id)';
    END IF;

    -- Policies for user_profiles
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_profiles' 
        AND policyname = 'Users can manage own profile'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can manage own profile" ON public.user_profiles
                FOR ALL USING (auth.uid()::text = user_id)';
    END IF;

    -- Policies for cleanup_jobs
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'cleanup_jobs' 
        AND policyname = 'Users can manage own cleanup jobs'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can manage own cleanup jobs" ON public.cleanup_jobs
                FOR ALL USING (auth.uid()::text = user_id)';
    END IF;

    -- Policies for email_categories
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'email_categories' 
        AND policyname = 'Users can manage own email categories'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can manage own email categories" ON public.email_categories
                FOR ALL USING (auth.uid()::text = user_id)';
    END IF;

    -- Policies for scheduled_cleanups
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'scheduled_cleanups' 
        AND policyname = 'Users can manage own scheduled cleanups'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can manage own scheduled cleanups" ON public.scheduled_cleanups
                FOR ALL USING (auth.uid()::text = user_id)';
    END IF;
END
$;

-- Create a function that will be triggered when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    user_id,
    email,
    name,
    full_name,
    avatar_url,
    token_identifier,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.id::text,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email,
    NEW.created_at,
    NEW.updated_at
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call the function when a new user is added to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update the function to handle user updates as well
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET
    email = NEW.email,
    name = NEW.raw_user_meta_data->>'name',
    full_name = NEW.raw_user_meta_data->>'full_name',
    avatar_url = NEW.raw_user_meta_data->>'avatar_url',
    updated_at = NEW.updated_at
  WHERE user_id = NEW.id::text;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call the function when a user is updated in auth.users
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

-- Function to create user profile when user is created
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $
BEGIN
  INSERT INTO public.user_profiles (
    user_id,
    preferences,
    cleanup_settings,
    notification_settings
  ) VALUES (
    NEW.user_id,
    '{}',
    '{"auto_cleanup": false, "cleanup_frequency": "weekly"}',
    '{"email_notifications": true, "cleanup_reminders": true}'
  );
  RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user profile creation
DROP TRIGGER IF EXISTS on_user_profile_created ON public.users;
CREATE TRIGGER on_user_profile_created
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- Enable realtime for all tables
alter publication supabase_realtime add table users;
alter publication supabase_realtime add table user_profiles;
alter publication supabase_realtime add table cleanup_jobs;
alter publication supabase_realtime add table email_categories;
alter publication supabase_realtime add table scheduled_cleanups;
alter publication supabase_realtime add table subscriptions;
alter publication supabase_realtime add table webhook_events; 
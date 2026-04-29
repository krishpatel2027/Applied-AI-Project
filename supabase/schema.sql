-- ==========================================
-- Supabase Schema Initialization
-- Application: AI Vision Dashboard
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. Create Tables
-- ==========================================

-- Table: user_settings
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_email TEXT NOT NULL UNIQUE,
    dark_mode BOOLEAN DEFAULT false,
    auto_analysis BOOLEAN DEFAULT false,
    avatar_url TEXT,
    openai_key_encrypted TEXT,
    anthropic_key_encrypted TEXT,
    email_analysis_complete BOOLEAN DEFAULT false,
    email_weekly_summary BOOLEAN DEFAULT false,
    email_security_alerts BOOLEAN DEFAULT false,
    push_desktop BOOLEAN DEFAULT false,
    push_marketing BOOLEAN DEFAULT false,
    two_factor_enabled BOOLEAN DEFAULT false,
    data_privacy_enabled BOOLEAN DEFAULT false,
    api_usage_count INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: gallery_assets
CREATE TABLE IF NOT EXISTS public.gallery_assets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_email TEXT NOT NULL,
    filename TEXT NOT NULL,
    content_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    caption TEXT,
    tags TEXT[] DEFAULT '{}',
    ocr_text TEXT,
    analysis_mode TEXT,
    size_bytes BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: analysis_history
CREATE TABLE IF NOT EXISTS public.analysis_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_email TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    mode TEXT NOT NULL,
    model TEXT NOT NULL,
    analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
    preview_url TEXT,
    gallery_asset_id UUID REFERENCES public.gallery_assets(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 2. Create Storage Bucket
-- ==========================================

-- Create bucket if it doesn't exist (Supabase specific function)
-- Note: In the SQL editor this might show a warning if it already exists, it is safe to ignore.
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery-images', 'gallery-images', true)
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- 3. Row Level Security (RLS) Policies
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_history ENABLE ROW LEVEL SECURITY;

-- Disable RLS for now for rapid prototyping (as NextAuth email is used directly instead of Supabase Auth)
-- IMPORTANT: If you want to use strict RLS, you must set up Supabase Auth properly. 
-- Since your app passes `userEmail` directly from NextAuth, we allow all operations for anon/authenticated 
-- and trust the application server.

DROP POLICY IF EXISTS "Allow all operations for user_settings" ON public.user_settings;
CREATE POLICY "Allow all operations for user_settings" ON public.user_settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations for gallery_assets" ON public.gallery_assets;
CREATE POLICY "Allow all operations for gallery_assets" ON public.gallery_assets FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations for analysis_history" ON public.analysis_history;
CREATE POLICY "Allow all operations for analysis_history" ON public.analysis_history FOR ALL USING (true) WITH CHECK (true);

-- Storage bucket policies (Allow all for rapid prototyping)
DROP POLICY IF EXISTS "Give full access to storage bucket" ON storage.objects;
CREATE POLICY "Give full access to storage bucket" ON storage.objects FOR ALL USING (bucket_id = 'gallery-images') WITH CHECK (bucket_id = 'gallery-images');

-- ==========================================
-- End of Schema
-- ==========================================

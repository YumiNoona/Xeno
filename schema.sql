-- =========================================
-- XENO SUPABASE SCHEMA (Unified)
-- =========================================

-- =========================================
-- 0. NUKE / RESET
-- WARNING: This will delete all your data!
-- =========================================
DROP TABLE IF EXISTS public.media CASCADE;
DROP TABLE IF EXISTS public.albums CASCADE;
DROP TABLE IF EXISTS public.tours CASCADE;
DROP FUNCTION IF EXISTS handle_updated_at CASCADE;

-- Clear storage buckets
DO $$
BEGIN
    DELETE FROM storage.objects WHERE bucket_id = 'xeno-media';
    DELETE FROM storage.buckets WHERE id = 'xeno-media';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Bucket deletion failed (might already be empty or permissions issue)';
END $$;

-- 1. Helpers
-- Function to automatically update the 'updated_at' timestamp
-- SET search_path = public added to resolve security warning
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- 1. Tours Table
-- Stores the JSON payload representing the entire virtual tour.
CREATE TABLE IF NOT EXISTS public.tours (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    slug text UNIQUE NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id uuid REFERENCES auth.users(id),
    published boolean DEFAULT false,
    data jsonb NOT NULL
);

-- Trigger for tours updated_at
CREATE TRIGGER set_tours_updated_at
BEFORE UPDATE ON public.tours
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

-- 2. Albums Table
-- Represents folders/albums in the Media Manager.
CREATE TABLE IF NOT EXISTS public.albums (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id uuid REFERENCES auth.users(id),
    name text NOT NULL
);

-- 3. Media Table
-- Stores references to the images/videos uploaded to Supabase Storage.
CREATE TABLE IF NOT EXISTS public.media (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id uuid REFERENCES auth.users(id),
    album_id uuid REFERENCES public.albums(id) ON DELETE CASCADE,
    filename text NOT NULL,
    url text NOT NULL,
    type text NOT NULL, -- e.g., 'image/jpeg', 'video/mp4'
    size bigint
);

-- =========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================
-- Note: These policies allow anonymous access for development.
-- To secure: change (true) to (auth.uid() = user_id)

ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

-- Allow public access (Dev mode)
CREATE POLICY "Allow public read tours" ON public.tours FOR SELECT USING (true);
CREATE POLICY "Allow public insert tours" ON public.tours FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update tours" ON public.tours FOR UPDATE USING (true);
CREATE POLICY "Allow public delete tours" ON public.tours FOR DELETE USING (true);

CREATE POLICY "Allow public read albums" ON public.albums FOR SELECT USING (true);
CREATE POLICY "Allow public insert albums" ON public.albums FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update albums" ON public.albums FOR UPDATE USING (true);
CREATE POLICY "Allow public delete albums" ON public.albums FOR DELETE USING (true);

CREATE POLICY "Allow public read media" ON public.media FOR SELECT USING (true);
CREATE POLICY "Allow public insert media" ON public.media FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update media" ON public.media FOR UPDATE USING (true);
CREATE POLICY "Allow public delete media" ON public.media FOR DELETE USING (true);


-- =========================================
-- STORAGE SETUP
-- =========================================
-- We use a single 'xeno-media' bucket to keep things simple.
-- You can organize files into folders (e.g. /panoramas, /floorplans) inside this bucket.

DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('xeno-media', 'xeno-media', true) 
    ON CONFLICT (id) DO NOTHING;
END $$;

-- Storage Policies for 'xeno-media'
-- Fixed 'listing' warning by explicitly allowing select on objects in public buckets
DROP POLICY IF EXISTS "Allow public view media" ON storage.objects;
DROP POLICY IF EXISTS "Allow public insert media" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update media" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete media" ON storage.objects;

-- Note: The 'warning' about listing in the dashboard is common for public buckets.
-- This policy allows reading objects.
CREATE POLICY "Allow public view media" ON storage.objects FOR SELECT USING (bucket_id = 'xeno-media');
CREATE POLICY "Allow public insert media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'xeno-media');
CREATE POLICY "Allow public update media" ON storage.objects FOR UPDATE USING (bucket_id = 'xeno-media');
CREATE POLICY "Allow public delete media" ON storage.objects FOR DELETE USING (bucket_id = 'xeno-media');

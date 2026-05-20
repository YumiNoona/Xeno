-- =========================================
-- XENO SUPABASE SCHEMA
-- =========================================

-- 1. Tours Table
-- Stores the JSON payload representing the entire virtual tour.
CREATE TABLE IF NOT EXISTS public.tours (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id uuid REFERENCES auth.users(id), -- Optional: Link to a user if using Auth
    data jsonb NOT NULL
);

-- 2. Albums Table
-- Represents folders/albums in the Media Manager.
CREATE TABLE IF NOT EXISTS public.albums (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id uuid REFERENCES auth.users(id), -- Optional
    name text NOT NULL
);

-- 3. Media Table
-- Stores references to the images/videos uploaded to Supabase Storage.
CREATE TABLE IF NOT EXISTS public.media (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id uuid REFERENCES auth.users(id), -- Optional
    album_id uuid REFERENCES public.albums(id) ON DELETE CASCADE,
    filename text NOT NULL,
    url text NOT NULL,
    type text NOT NULL, -- e.g., 'image/jpeg', 'video/mp4'
    size bigint
);

-- =========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================
-- Note: These policies currently allow anonymous (public) access for easy local testing. 
-- Before going to production, you should update these to strictly check auth.uid().

ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read, insert, and update tours
CREATE POLICY "Allow public read tours" ON public.tours FOR SELECT USING (true);
CREATE POLICY "Allow public insert tours" ON public.tours FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update tours" ON public.tours FOR UPDATE USING (true);
CREATE POLICY "Allow public delete tours" ON public.tours FOR DELETE USING (true);

-- Allow anyone to manage albums
CREATE POLICY "Allow public read albums" ON public.albums FOR SELECT USING (true);
CREATE POLICY "Allow public insert albums" ON public.albums FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update albums" ON public.albums FOR UPDATE USING (true);
CREATE POLICY "Allow public delete albums" ON public.albums FOR DELETE USING (true);

-- Allow anyone to manage media
CREATE POLICY "Allow public read media" ON public.media FOR SELECT USING (true);
CREATE POLICY "Allow public insert media" ON public.media FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update media" ON public.media FOR UPDATE USING (true);
CREATE POLICY "Allow public delete media" ON public.media FOR DELETE USING (true);


-- =========================================
-- STORAGE SETUP
-- =========================================
-- Run this block if you want to create the storage bucket via SQL.
-- Alternatively, you can create a bucket named 'xeno-media' manually in the Supabase Dashboard.

INSERT INTO storage.buckets (id, name, public) 
VALUES ('xeno-media', 'xeno-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for 'xeno-media' Bucket
CREATE POLICY "Allow public view media" ON storage.objects FOR SELECT USING (bucket_id = 'xeno-media');
CREATE POLICY "Allow public insert media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'xeno-media');
CREATE POLICY "Allow public update media" ON storage.objects FOR UPDATE USING (bucket_id = 'xeno-media');
CREATE POLICY "Allow public delete media" ON storage.objects FOR DELETE USING (bucket_id = 'xeno-media');

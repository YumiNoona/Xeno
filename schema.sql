-- Xeno Supabase Schema
-- Run this in your Supabase SQL Editor

CREATE TABLE tours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  data jsonb NOT NULL,
  published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Note: You also need to create the following public Storage buckets:
-- 1. panoramas
-- 2. floorplans
-- 3. hotspot-media
-- 4. branding

-- Create buckets for centralized storage in Supabase
-- This script consolidates all file storage (currently split between Vercel Blob and Supabase) into Supabase

-- Create pdfs bucket (for budget PDFs and documents)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pdfs',
  'pdfs',
  true,
  52428800, -- 50MB max file size
  '{"application/pdf"}'::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Create logos bucket (for company logos and images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  true,
  10485760, -- 10MB max file size
  '{"image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"}'::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Create avatars bucket (for user profile avatars)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB max file size
  '{"image/png", "image/jpeg", "image/jpg", "image/webp"}'::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Create window-photos bucket (consolidate existing window photos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'window-photos',
  'window-photos',
  true,
  52428800, -- 50MB max file size
  '{"image/png", "image/jpeg", "image/jpg", "image/webp"}'::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for each bucket (public read, authenticated write)

-- PDFs bucket - RLS policies
CREATE POLICY "pdfs bucket - anyone can read" ON storage.objects
  FOR SELECT USING (bucket_id = 'pdfs');

CREATE POLICY "pdfs bucket - authenticated can upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'pdfs' AND auth.role() = 'authenticated');

-- Logos bucket - RLS policies
CREATE POLICY "logos bucket - anyone can read" ON storage.objects
  FOR SELECT USING (bucket_id = 'logos');

CREATE POLICY "logos bucket - authenticated can upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');

-- Avatars bucket - RLS policies
CREATE POLICY "avatars bucket - anyone can read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars bucket - authenticated can upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Window photos bucket - RLS policies
CREATE POLICY "window-photos bucket - anyone can read" ON storage.objects
  FOR SELECT USING (bucket_id = 'window-photos');

CREATE POLICY "window-photos bucket - authenticated can upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'window-photos' AND auth.role() = 'authenticated');

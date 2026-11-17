-- Run ONCE in Supabase SQL Editor before enabling profile photo uploads.
INSERT INTO storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
VALUES ('profile-avatars','profile-avatars',true,3145728,ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET public=true,file_size_limit=3145728,allowed_mime_types=ARRAY['image/jpeg','image/png','image/webp'];
DROP POLICY IF EXISTS "Public can read profile avatars" ON storage.objects;
CREATE POLICY "Public can read profile avatars" ON storage.objects FOR SELECT USING (bucket_id='profile-avatars');
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
CREATE POLICY "Users can upload their own avatars" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id='profile-avatars' AND (storage.foldername(name))[1]=(select auth.uid())::text);
-- Existing profiles RLS must permit authenticated users to UPDATE their own row.

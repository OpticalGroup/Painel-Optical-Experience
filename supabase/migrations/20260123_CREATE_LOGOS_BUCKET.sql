-- Create storage bucket for organization logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('organization-logos', 'organization-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow public access to images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'organization-logos' );

-- Policy to allow authenticated users to upload images
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'organization-logos' );

-- Policy to allow authenticated users to update their uploaded images
CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'organization-logos' );

-- Policy to allow authenticated users to delete their uploaded images
CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'organization-logos' );

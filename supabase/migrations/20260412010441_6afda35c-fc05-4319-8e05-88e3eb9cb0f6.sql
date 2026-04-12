-- Create the uploads bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true);

-- Anyone can read files
CREATE POLICY "Public read uploads"
ON storage.objects FOR SELECT
USING (bucket_id = 'uploads');

-- Authenticated users can upload
CREATE POLICY "Authenticated upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'uploads');

-- Authenticated users can update their uploads
CREATE POLICY "Authenticated update uploads"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'uploads');

-- Authenticated users can delete their uploads
CREATE POLICY "Authenticated delete uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'uploads');
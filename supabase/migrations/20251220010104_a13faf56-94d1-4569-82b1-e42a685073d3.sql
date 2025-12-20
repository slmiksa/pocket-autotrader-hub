-- Create storage bucket for hero slides
INSERT INTO storage.buckets (id, name, public)
VALUES ('hero-slides', 'hero-slides', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view hero slide images
CREATE POLICY "Anyone can view hero slide images"
ON storage.objects FOR SELECT
USING (bucket_id = 'hero-slides');

-- Allow admins to upload hero slide images
CREATE POLICY "Admins can upload hero slide images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'hero-slides' AND has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update hero slide images
CREATE POLICY "Admins can update hero slide images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'hero-slides' AND has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete hero slide images
CREATE POLICY "Admins can delete hero slide images"
ON storage.objects FOR DELETE
USING (bucket_id = 'hero-slides' AND has_role(auth.uid(), 'admin'::app_role));
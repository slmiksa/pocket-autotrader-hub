-- Add image_analysis_enabled column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN image_analysis_enabled boolean DEFAULT false;

-- Update RLS policies to allow admins to update this field
CREATE POLICY "Admins can update image analysis feature"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));
-- Add nickname column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nickname TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_nickname ON public.profiles(nickname);
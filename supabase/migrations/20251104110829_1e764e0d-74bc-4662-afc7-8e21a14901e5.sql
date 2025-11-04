-- Add email and activated_code columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS activated_code text;

-- Update the handle_new_user_profile function to store email
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, subscription_expires_at)
  VALUES (NEW.id, NEW.email, NULL)
  ON CONFLICT (user_id) DO UPDATE
  SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$;

-- Add RLS policy for admins to read all profiles
CREATE POLICY "Admins can read all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update existing profiles with current user emails (this will update all current users)
-- Note: This is a data update, but necessary for the feature to work
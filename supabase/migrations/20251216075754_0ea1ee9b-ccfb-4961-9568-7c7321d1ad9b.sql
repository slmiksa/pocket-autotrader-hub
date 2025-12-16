-- Create banned_users table
CREATE TABLE public.banned_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  user_email TEXT,
  reason TEXT NOT NULL,
  banned_by UUID,
  banned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.banned_users ENABLE ROW LEVEL SECURITY;

-- Admins can manage banned users
CREATE POLICY "Admins can manage banned users"
ON public.banned_users
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can check if they are banned (for login check)
CREATE POLICY "Anyone can check if banned"
ON public.banned_users
FOR SELECT
USING (true);
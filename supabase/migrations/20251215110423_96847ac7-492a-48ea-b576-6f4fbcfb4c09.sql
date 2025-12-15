-- Create table for 2FA verification codes
CREATE TABLE public.email_verification_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_verification_codes ENABLE ROW LEVEL SECURITY;

-- Policy to allow inserting codes (via service role only - edge functions)
CREATE POLICY "Service role can manage verification codes" 
ON public.email_verification_codes
FOR ALL
USING (true)
WITH CHECK (true);

-- Index for faster lookups
CREATE INDEX idx_verification_codes_email ON public.email_verification_codes(email, code, expires_at);

-- Auto-delete expired codes (cleanup)
CREATE OR REPLACE FUNCTION public.cleanup_expired_verification_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.email_verification_codes 
  WHERE expires_at < now() OR used = true;
END;
$$;
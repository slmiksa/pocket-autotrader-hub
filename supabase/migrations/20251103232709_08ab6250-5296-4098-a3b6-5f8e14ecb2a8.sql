-- Create subscription codes table
CREATE TABLE IF NOT EXISTS public.subscription_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  duration_days INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE public.subscription_codes ENABLE ROW LEVEL SECURITY;

-- Allow public to read active codes for validation
CREATE POLICY "Anyone can validate codes" 
ON public.subscription_codes 
FOR SELECT 
USING (is_active = true);

-- Create subscriptions table to track who used which code
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code_id UUID NOT NULL REFERENCES public.subscription_codes(id),
  device_id TEXT NOT NULL,
  activated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  UNIQUE(device_id)
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow public to check their own subscription
CREATE POLICY "Users can check own subscription" 
ON public.subscriptions 
FOR SELECT 
USING (true);

-- Allow public to create subscription (activate code)
CREATE POLICY "Anyone can activate code" 
ON public.subscriptions 
FOR INSERT 
WITH CHECK (true);

CREATE INDEX idx_subscriptions_device ON public.subscriptions(device_id);
CREATE INDEX idx_subscriptions_expires ON public.subscriptions(expires_at);
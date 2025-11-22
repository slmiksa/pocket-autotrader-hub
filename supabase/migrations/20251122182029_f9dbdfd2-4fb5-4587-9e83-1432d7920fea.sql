-- Create professional_signals table for expert recommendations
CREATE TABLE IF NOT EXISTS public.professional_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('CALL', 'PUT', 'BUY', 'SELL')),
  entry_price TEXT,
  target_price TEXT,
  stop_loss TEXT,
  timeframe TEXT NOT NULL,
  confidence_level TEXT CHECK (confidence_level IN ('high', 'medium', 'low')),
  analysis TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  result TEXT CHECK (result IN ('pending', 'win', 'loss', 'breakeven')),
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Add professional_signals_enabled to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS professional_signals_enabled BOOLEAN DEFAULT false;

-- Enable RLS on professional_signals
ALTER TABLE public.professional_signals ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can manage all professional signals
CREATE POLICY "Admins can manage professional signals"
ON public.professional_signals
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Policy: Users with enabled feature can view active signals
CREATE POLICY "Users can view active professional signals if enabled"
ON public.professional_signals
FOR SELECT
TO authenticated
USING (
  is_active = true 
  AND expires_at > now()
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.professional_signals_enabled = true
  )
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_professional_signals_active 
ON public.professional_signals(is_active, expires_at) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_professional_signals_created_at 
ON public.professional_signals(created_at DESC);
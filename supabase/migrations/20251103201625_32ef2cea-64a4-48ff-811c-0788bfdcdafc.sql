-- Add result column to signals table
ALTER TABLE public.signals 
ADD COLUMN IF NOT EXISTS result TEXT;

-- Add comment
COMMENT ON COLUMN public.signals.result IS 'Trade result: win, loss, or null if not completed yet';

-- Update status values for better tracking
-- Status can be: pending, processing, executed, completed, failed
COMMENT ON COLUMN public.signals.status IS 'pending=waiting, processing=executing, executed=trade placed, completed=finished with result, failed=error';
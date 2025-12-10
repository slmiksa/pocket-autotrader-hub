-- Create table for user economic event alerts
CREATE TABLE public.user_economic_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_id UUID NOT NULL REFERENCES public.economic_events(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notified_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  UNIQUE(user_id, event_id)
);

-- Enable RLS
ALTER TABLE public.user_economic_alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own alerts" ON public.user_economic_alerts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own alerts" ON public.user_economic_alerts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts" ON public.user_economic_alerts
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts" ON public.user_economic_alerts
  FOR UPDATE USING (auth.uid() = user_id);
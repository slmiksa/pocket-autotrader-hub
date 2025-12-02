-- Create trading goals table for monthly planning
CREATE TABLE IF NOT EXISTS public.trading_goals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  initial_capital numeric NOT NULL,
  target_amount numeric NOT NULL,
  duration_days integer NOT NULL,
  market_type text NOT NULL, -- 'forex', 'crypto', 'stocks', 'metals'
  loss_compensation_rate numeric DEFAULT 2.0, -- نسبة تعويض الخسارة
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Enable RLS
ALTER TABLE public.trading_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own goals"
  ON public.trading_goals
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
  ON public.trading_goals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON public.trading_goals
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON public.trading_goals
  FOR DELETE
  USING (auth.uid() = user_id);

-- Index for better performance
CREATE INDEX idx_trading_goals_user_id ON public.trading_goals(user_id);
CREATE INDEX idx_trading_goals_active ON public.trading_goals(user_id, is_active);

-- Trigger for updated_at
CREATE TRIGGER update_trading_goals_updated_at
  BEFORE UPDATE ON public.trading_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
-- Create user_trade_results table to store manual trade results
CREATE TABLE IF NOT EXISTS public.user_trade_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  signal_id UUID NOT NULL REFERENCES public.signals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_result TEXT NOT NULL CHECK (user_result IN ('win', 'loss')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(signal_id, user_id)
);

-- Enable RLS
ALTER TABLE public.user_trade_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own results"
  ON public.user_trade_results
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own results"
  ON public.user_trade_results
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own results"
  ON public.user_trade_results
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own results"
  ON public.user_trade_results
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_user_trade_results_user_id ON public.user_trade_results(user_id);
CREATE INDEX idx_user_trade_results_signal_id ON public.user_trade_results(signal_id);
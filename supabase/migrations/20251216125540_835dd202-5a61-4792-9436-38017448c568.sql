-- Create smart recovery trades table
CREATE TABLE public.smart_recovery_trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('BUY', 'SELL')),
  entry_price NUMERIC NOT NULL,
  exit_price NUMERIC,
  entry_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  exit_time TIMESTAMP WITH TIME ZONE,
  lot_size NUMERIC NOT NULL DEFAULT 0.01,
  was_reinforced BOOLEAN DEFAULT false,
  reinforcement_price NUMERIC,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  result TEXT CHECK (result IN ('capital_recovery', 'profit', 'no_result', 'loss')),
  profit_loss NUMERIC,
  entry_reason TEXT,
  cvd_status TEXT,
  ema_status TEXT,
  vwap_status TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.smart_recovery_trades ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own trades" ON public.smart_recovery_trades
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trades" ON public.smart_recovery_trades
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trades" ON public.smart_recovery_trades
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trades" ON public.smart_recovery_trades
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_smart_recovery_trades_updated_at
  BEFORE UPDATE ON public.smart_recovery_trades
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
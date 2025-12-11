-- Create virtual wallets table
CREATE TABLE public.virtual_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  balance NUMERIC NOT NULL DEFAULT 1000.00,
  initial_balance NUMERIC NOT NULL DEFAULT 1000.00,
  total_profit_loss NUMERIC NOT NULL DEFAULT 0,
  total_trades INTEGER NOT NULL DEFAULT 0,
  winning_trades INTEGER NOT NULL DEFAULT 0,
  losing_trades INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create virtual trades table
CREATE TABLE public.virtual_trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  wallet_id UUID NOT NULL REFERENCES public.virtual_wallets(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  symbol_name_ar TEXT NOT NULL,
  trade_type TEXT NOT NULL CHECK (trade_type IN ('buy', 'sell')),
  order_type TEXT NOT NULL CHECK (order_type IN ('market', 'limit', 'stop')),
  amount NUMERIC NOT NULL,
  quantity NUMERIC NOT NULL,
  entry_price NUMERIC NOT NULL,
  exit_price NUMERIC,
  stop_loss NUMERIC,
  take_profit NUMERIC,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'pending', 'closed', 'cancelled')),
  profit_loss NUMERIC,
  opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.virtual_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_trades ENABLE ROW LEVEL SECURITY;

-- RLS policies for virtual_wallets
CREATE POLICY "Users can view own wallet" ON public.virtual_wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallet" ON public.virtual_wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet" ON public.virtual_wallets
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for virtual_trades
CREATE POLICY "Users can view own trades" ON public.virtual_trades
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trades" ON public.virtual_trades
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trades" ON public.virtual_trades
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trades" ON public.virtual_trades
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_virtual_wallets_updated_at
  BEFORE UPDATE ON public.virtual_wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_virtual_trades_updated_at
  BEFORE UPDATE ON public.virtual_trades
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
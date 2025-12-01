-- Create favorites table for users to save their favorite markets
CREATE TABLE public.user_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  symbol_name_ar TEXT NOT NULL,
  symbol_name_en TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, symbol)
);

-- Enable RLS
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for favorites
CREATE POLICY "Users can view own favorites" 
ON public.user_favorites 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites" 
ON public.user_favorites 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorites" 
ON public.user_favorites 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create daily trades and goals table
CREATE TABLE public.user_daily_journal (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trade_date DATE NOT NULL DEFAULT CURRENT_DATE,
  symbol TEXT,
  direction TEXT CHECK (direction IN ('buy', 'sell', 'call', 'put')),
  entry_price DECIMAL(20, 8),
  exit_price DECIMAL(20, 8),
  profit_loss DECIMAL(20, 8),
  result TEXT CHECK (result IN ('win', 'loss', 'pending', 'breakeven')),
  notes TEXT,
  daily_goal DECIMAL(20, 2),
  daily_achieved DECIMAL(20, 2),
  lessons_learned TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_daily_journal ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily journal
CREATE POLICY "Users can view own journal" 
ON public.user_daily_journal 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can add journal entries" 
ON public.user_daily_journal 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal" 
ON public.user_daily_journal 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal entries" 
ON public.user_daily_journal 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_daily_journal_updated_at
BEFORE UPDATE ON public.user_daily_journal
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
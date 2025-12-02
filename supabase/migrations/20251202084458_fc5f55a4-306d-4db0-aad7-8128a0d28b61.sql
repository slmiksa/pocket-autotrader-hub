-- Create table for tracking daily trading goal progress
CREATE TABLE IF NOT EXISTS public.trading_goal_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL,
  user_id UUID NOT NULL,
  day_number INTEGER NOT NULL,
  achieved_amount NUMERIC DEFAULT 0,
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(goal_id, day_number)
);

-- Enable Row Level Security
ALTER TABLE public.trading_goal_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view own progress"
ON public.trading_goal_progress
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
ON public.trading_goal_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
ON public.trading_goal_progress
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress"
ON public.trading_goal_progress
FOR DELETE
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_trading_goal_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_trading_goal_progress_updated_at
BEFORE UPDATE ON public.trading_goal_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_trading_goal_progress_updated_at();

-- Create index for better performance
CREATE INDEX idx_trading_goal_progress_goal_id ON public.trading_goal_progress(goal_id);
CREATE INDEX idx_trading_goal_progress_user_id ON public.trading_goal_progress(user_id);
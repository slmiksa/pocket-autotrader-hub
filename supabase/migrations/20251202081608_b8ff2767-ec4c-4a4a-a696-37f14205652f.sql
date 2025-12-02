-- Create table for saved chart analyses
CREATE TABLE public.saved_chart_analyses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  symbol text NOT NULL,
  analysis_text text NOT NULL,
  annotated_image_url text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.saved_chart_analyses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own saved analyses"
  ON public.saved_chart_analyses
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved analyses"
  ON public.saved_chart_analyses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved analyses"
  ON public.saved_chart_analyses
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_saved_analyses_user_id ON public.saved_chart_analyses(user_id);
CREATE INDEX idx_saved_analyses_created_at ON public.saved_chart_analyses(created_at DESC);
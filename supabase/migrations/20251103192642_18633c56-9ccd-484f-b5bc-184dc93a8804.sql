-- Add entry_time column to signals table
ALTER TABLE public.signals 
ADD COLUMN IF NOT EXISTS entry_time TEXT;
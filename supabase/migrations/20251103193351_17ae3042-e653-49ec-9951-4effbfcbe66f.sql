-- Change telegram_message_id to text to handle large IDs
ALTER TABLE public.signals 
ALTER COLUMN telegram_message_id TYPE text USING telegram_message_id::text;
-- Update existing profiles with emails from auth.users
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN 
        SELECT id, email FROM auth.users
    LOOP
        UPDATE public.profiles 
        SET email = user_record.email
        WHERE user_id = user_record.id AND (email IS NULL OR email = '');
    END LOOP;
END $$;
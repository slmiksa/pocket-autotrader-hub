-- Create profiles for existing users who don't have one
INSERT INTO public.profiles (user_id, created_at, updated_at)
SELECT id, NOW(), NOW()
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE user_id = auth.users.id
)
ON CONFLICT (user_id) DO NOTHING;
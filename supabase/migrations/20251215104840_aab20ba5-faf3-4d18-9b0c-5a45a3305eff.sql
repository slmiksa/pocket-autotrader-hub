-- إضافة عمود تفعيل إشعارات الإيميل
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_notifications_enabled boolean DEFAULT false;
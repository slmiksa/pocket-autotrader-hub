-- Add WhatsApp and website link fields to announcement_banner
ALTER TABLE public.announcement_banner
ADD COLUMN whatsapp_number TEXT,
ADD COLUMN whatsapp_text TEXT DEFAULT 'تواصل معنا',
ADD COLUMN website_url TEXT,
ADD COLUMN website_text TEXT DEFAULT 'زيارة الموقع';
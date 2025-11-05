-- Create announcement_banner table
CREATE TABLE public.announcement_banner (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  background_color TEXT NOT NULL DEFAULT '#1a1a1a',
  text_color TEXT NOT NULL DEFAULT '#ffffff',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.announcement_banner ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read active announcements
CREATE POLICY "Anyone can view active announcements"
ON public.announcement_banner
FOR SELECT
USING (is_active = true);

-- Only admins can manage announcements
CREATE POLICY "Admins can insert announcements"
ON public.announcement_banner
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update announcements"
ON public.announcement_banner
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete announcements"
ON public.announcement_banner
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_announcement_banner_updated_at
BEFORE UPDATE ON public.announcement_banner
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
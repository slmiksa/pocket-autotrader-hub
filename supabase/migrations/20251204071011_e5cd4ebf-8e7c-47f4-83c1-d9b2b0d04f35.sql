-- Create hero_slides table for admin-controlled slider
CREATE TABLE public.hero_slides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  button_text TEXT NOT NULL DEFAULT 'ابدأ الآن',
  button_link TEXT NOT NULL DEFAULT '/binary-options',
  image_url TEXT,
  gradient_color TEXT NOT NULL DEFAULT 'primary',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

-- Anyone can view active slides
CREATE POLICY "Anyone can view active slides"
ON public.hero_slides
FOR SELECT
USING (is_active = true);

-- Admins can manage slides
CREATE POLICY "Admins can manage slides"
ON public.hero_slides
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default slides
INSERT INTO public.hero_slides (title, subtitle, button_text, button_link, gradient_color, display_order) VALUES
('منصة التوصيات الذكية', 'احصل على توصيات تداول احترافية بالذكاء الاصطناعي', 'ابدأ التداول', '/binary-options', 'primary', 1),
('تحليل العرض والطلب', 'اكتشف مناطق الدعم والمقاومة القوية بدقة عالية', 'حلل الآن', '/supply-demand', 'blue', 2),
('أخبار الأسواق المباشرة', 'تابع أحدث الأخبار المؤثرة على تداولاتك', 'تصفح الأخبار', '/news', 'purple', 3);
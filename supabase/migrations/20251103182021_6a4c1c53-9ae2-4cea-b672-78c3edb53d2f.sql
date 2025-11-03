-- إنشاء جدول التوصيات
CREATE TABLE public.signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_message_id BIGINT,
  asset TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('CALL', 'PUT')),
  amount DECIMAL(10,2) NOT NULL DEFAULT 5.00,
  raw_message TEXT,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'failed', 'skipped')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول الصفقات المنفذة
CREATE TABLE public.trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  signal_id UUID REFERENCES public.signals(id) ON DELETE CASCADE,
  asset TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('CALL', 'PUT')),
  amount DECIMAL(10,2) NOT NULL,
  entry_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expiry_time TIMESTAMP WITH TIME ZONE,
  result TEXT CHECK (result IN ('win', 'loss', 'pending')),
  profit DECIMAL(10,2),
  pocket_trade_id TEXT,
  execution_method TEXT CHECK (execution_method IN ('auto', 'manual')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول الإعدادات
CREATE TABLE public.settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إدراج إعدادات افتراضية
INSERT INTO public.settings (key, value) VALUES
  ('auto_trade_enabled', 'false'),
  ('default_amount', '5'),
  ('max_per_trade', '500'),
  ('account_mode', '"demo"'),
  ('daily_limit', '50'),
  ('stop_loss_enabled', 'false'),
  ('stop_loss_amount', '100');

-- تفعيل RLS
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- سياسات للقراءة العامة (لأن النظام لا يحتاج authentication حالياً)
CREATE POLICY "Allow public read signals" ON public.signals FOR SELECT USING (true);
CREATE POLICY "Allow public insert signals" ON public.signals FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update signals" ON public.signals FOR UPDATE USING (true);

CREATE POLICY "Allow public read trades" ON public.trades FOR SELECT USING (true);
CREATE POLICY "Allow public insert trades" ON public.trades FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update trades" ON public.trades FOR UPDATE USING (true);

CREATE POLICY "Allow public read settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Allow public update settings" ON public.settings FOR UPDATE USING (true);

-- إنشاء فهارس للأداء
CREATE INDEX idx_signals_received_at ON public.signals(received_at DESC);
CREATE INDEX idx_signals_status ON public.signals(status);
CREATE INDEX idx_trades_signal_id ON public.trades(signal_id);
CREATE INDEX idx_trades_created_at ON public.trades(created_at DESC);

-- تفعيل Real-time للجداول
ALTER TABLE public.signals REPLICA IDENTITY FULL;
ALTER TABLE public.trades REPLICA IDENTITY FULL;

-- إضافة الجداول لـ supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.signals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trades;

-- دالة لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- تفعيل trigger للـ trades
CREATE TRIGGER update_trades_updated_at
  BEFORE UPDATE ON public.trades
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- تفعيل trigger للـ settings
CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
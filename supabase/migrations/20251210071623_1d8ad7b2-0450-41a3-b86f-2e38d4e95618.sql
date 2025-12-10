
-- Add notification preferences columns to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS economic_alerts_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS market_alerts_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS alert_before_minutes integer DEFAULT 15;

-- Create economic_events table
CREATE TABLE IF NOT EXISTS economic_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  title_ar text NOT NULL,
  country text NOT NULL,
  currency text NOT NULL,
  impact text NOT NULL CHECK (impact IN ('low', 'medium', 'high')),
  event_time timestamptz NOT NULL,
  actual_value text,
  forecast_value text,
  previous_value text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on economic_events
ALTER TABLE economic_events ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read economic events
CREATE POLICY "Anyone can view economic events"
ON economic_events FOR SELECT
USING (true);

-- Only admins can manage economic events
CREATE POLICY "Admins can manage economic events"
ON economic_events FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create market_schedules table
CREATE TABLE IF NOT EXISTS market_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_name text NOT NULL,
  market_name_ar text NOT NULL,
  open_time time NOT NULL,
  close_time time NOT NULL,
  timezone text NOT NULL DEFAULT 'UTC',
  is_active boolean DEFAULT true,
  days_active text[] DEFAULT ARRAY['Mon','Tue','Wed','Thu','Fri'],
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on market_schedules
ALTER TABLE market_schedules ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read market schedules
CREATE POLICY "Anyone can view market schedules"
ON market_schedules FOR SELECT
USING (true);

-- Only admins can manage market schedules
CREATE POLICY "Admins can manage market schedules"
ON market_schedules FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default market schedules
INSERT INTO market_schedules (market_name, market_name_ar, open_time, close_time, timezone, days_active) VALUES
('New York Stock Exchange', 'بورصة نيويورك', '14:30:00', '21:00:00', 'UTC', ARRAY['Mon','Tue','Wed','Thu','Fri']),
('London Stock Exchange', 'بورصة لندن', '08:00:00', '16:30:00', 'UTC', ARRAY['Mon','Tue','Wed','Thu','Fri']),
('Tokyo Stock Exchange', 'بورصة طوكيو', '00:00:00', '06:00:00', 'UTC', ARRAY['Mon','Tue','Wed','Thu','Fri']),
('Forex Market', 'سوق الفوركس', '22:00:00', '22:00:00', 'UTC', ARRAY['Sun','Mon','Tue','Wed','Thu','Fri']),
('Crypto Market', 'سوق العملات الرقمية', '00:00:00', '23:59:59', 'UTC', ARRAY['Sun','Mon','Tue','Wed','Thu','Fri','Sat'])
ON CONFLICT DO NOTHING;

-- Create table for user market preferences
CREATE TABLE IF NOT EXISTS user_market_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  market_id uuid REFERENCES market_schedules(id) ON DELETE CASCADE,
  is_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, market_id)
);

-- Enable RLS on user_market_preferences
ALTER TABLE user_market_preferences ENABLE ROW LEVEL SECURITY;

-- Users can manage their own preferences
CREATE POLICY "Users can manage own market preferences"
ON user_market_preferences FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

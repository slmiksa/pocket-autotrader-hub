import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Bell, BellRing, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

interface NotificationSettingsProps {
  userId: string;
}

interface MarketSchedule {
  id: string;
  market_name: string;
  market_name_ar: string;
  open_time: string;
  close_time: string;
  is_active: boolean;
}

interface UserPreferences {
  economic_alerts_enabled: boolean;
  market_alerts_enabled: boolean;
  alert_before_minutes: number;
  email_notifications_enabled: boolean;
}

export const NotificationSettings = ({ userId }: NotificationSettingsProps) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({
    economic_alerts_enabled: false,
    market_alerts_enabled: false,
    alert_before_minutes: 15,
    email_notifications_enabled: false
  });
  const [markets, setMarkets] = useState<MarketSchedule[]>([]);
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);

  useEffect(() => {
    fetchSettings();
  }, [userId]);

  const fetchSettings = async () => {
    try {
      // Fetch user preferences
      const { data: profile } = await supabase
        .from('profiles')
        .select('economic_alerts_enabled, market_alerts_enabled, alert_before_minutes, email_notifications_enabled')
        .eq('user_id', userId)
        .single();

      if (profile) {
        setPreferences({
          economic_alerts_enabled: profile.economic_alerts_enabled || false,
          market_alerts_enabled: profile.market_alerts_enabled || false,
          alert_before_minutes: profile.alert_before_minutes || 15,
          email_notifications_enabled: (profile as any).email_notifications_enabled || false
        });
      }

      // Fetch markets
      const { data: marketData } = await supabase
        .from('market_schedules')
        .select('*')
        .eq('is_active', true);

      if (marketData) {
        setMarkets(marketData);
      }

      // Fetch user market preferences
      const { data: userMarkets } = await supabase
        .from('user_market_preferences')
        .select('market_id')
        .eq('user_id', userId)
        .eq('is_enabled', true);

      if (userMarkets) {
        setSelectedMarkets(userMarkets.map(m => m.market_id));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update profile preferences
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          economic_alerts_enabled: preferences.economic_alerts_enabled,
          market_alerts_enabled: preferences.market_alerts_enabled,
          alert_before_minutes: preferences.alert_before_minutes,
          email_notifications_enabled: preferences.email_notifications_enabled
        } as any)
        .eq('user_id', userId);

      if (profileError) throw profileError;

      // Update market preferences
      // First, delete all existing preferences
      await supabase
        .from('user_market_preferences')
        .delete()
        .eq('user_id', userId);

      // Then insert new preferences
      if (selectedMarkets.length > 0) {
        const marketPrefs = selectedMarkets.map(marketId => ({
          user_id: userId,
          market_id: marketId,
          is_enabled: true
        }));

        await supabase
          .from('user_market_preferences')
          .insert(marketPrefs);
      }

      toast.success('تم حفظ الإعدادات بنجاح');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const toggleMarket = (marketId: string) => {
    setSelectedMarkets(prev => 
      prev.includes(marketId) 
        ? prev.filter(id => id !== marketId)
        : [...prev, marketId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card className="p-5 border-[hsl(217,33%,17%)] bg-[hsl(217,33%,12%)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Bell className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <Label className="text-[hsl(210,40%,98%)] font-semibold">إشعارات البريد الإلكتروني</Label>
              <p className="text-xs text-[hsl(215,20%,65%)] mt-1">
                استلم جميع الإشعارات عبر البريد الإلكتروني أيضاً
              </p>
            </div>
          </div>
          <Switch
            checked={preferences.email_notifications_enabled}
            onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, email_notifications_enabled: checked }))}
          />
        </div>
      </Card>

      {/* Economic Calendar Alerts */}
      <Card className="p-5 border-[hsl(217,33%,17%)] bg-[hsl(217,33%,12%)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Calendar className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <Label className="text-[hsl(210,40%,98%)] font-semibold">تنبيهات التقويم الاقتصادي</Label>
              <p className="text-xs text-[hsl(215,20%,65%)] mt-1">
                احصل على إشعارات قبل صدور الأخبار الاقتصادية المهمة
              </p>
            </div>
          </div>
          <Switch
            checked={preferences.economic_alerts_enabled}
            onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, economic_alerts_enabled: checked }))}
          />
        </div>
      </Card>

      {/* Market Open/Close Alerts */}
      <Card className="p-5 border-[hsl(217,33%,17%)] bg-[hsl(217,33%,12%)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <BellRing className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <Label className="text-[hsl(210,40%,98%)] font-semibold">تنبيهات افتتاح/إغلاق الأسواق</Label>
              <p className="text-xs text-[hsl(215,20%,65%)] mt-1">
                احصل على إشعارات عند افتتاح وإغلاق الأسواق
              </p>
            </div>
          </div>
          <Switch
            checked={preferences.market_alerts_enabled}
            onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, market_alerts_enabled: checked }))}
          />
        </div>

        {preferences.market_alerts_enabled && (
          <div className="mt-4 pt-4 border-t border-[hsl(217,33%,17%)]">
            <p className="text-sm text-[hsl(215,20%,65%)] mb-3">اختر الأسواق التي تريد تلقي تنبيهات عنها:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {markets.map(market => (
                <button
                  key={market.id}
                  onClick={() => toggleMarket(market.id)}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    selectedMarkets.includes(market.id)
                      ? 'border-emerald-500/50 bg-emerald-500/10'
                      : 'border-[hsl(217,33%,17%)] bg-[hsl(217,33%,10%)] hover:border-[hsl(217,33%,25%)]'
                  }`}
                >
                  <span className="text-sm text-[hsl(210,40%,98%)]">{market.market_name_ar}</span>
                  {selectedMarkets.includes(market.id) && (
                    <Check className="h-4 w-4 text-emerald-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Alert Timing */}
      <Card className="p-5 border-[hsl(217,33%,17%)] bg-[hsl(217,33%,12%)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-amber-500/20">
            <Clock className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <Label className="text-[hsl(210,40%,98%)] font-semibold">وقت التنبيه المسبق</Label>
            <p className="text-xs text-[hsl(215,20%,65%)] mt-1">
              متى تريد استلام التنبيه قبل الحدث
            </p>
          </div>
        </div>
        
        <Select
          value={String(preferences.alert_before_minutes)}
          onValueChange={(value) => setPreferences(prev => ({ ...prev, alert_before_minutes: parseInt(value) }))}
        >
          <SelectTrigger className="bg-[hsl(217,33%,10%)] border-[hsl(217,33%,17%)] text-[hsl(210,40%,98%)]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[hsl(217,33%,10%)] border-[hsl(217,33%,17%)]">
            <SelectItem value="5">5 دقائق قبل</SelectItem>
            <SelectItem value="10">10 دقائق قبل</SelectItem>
            <SelectItem value="15">15 دقيقة قبل</SelectItem>
            <SelectItem value="30">30 دقيقة قبل</SelectItem>
            <SelectItem value="60">ساعة قبل</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      {/* Save Button */}
      <Button 
        onClick={handleSave} 
        disabled={saving}
        className="w-full bg-primary hover:bg-primary/90"
      >
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin ml-2" />
            جاري الحفظ...
          </>
        ) : (
          <>
            <Check className="h-4 w-4 ml-2" />
            حفظ الإعدادات
          </>
        )}
      </Button>
    </div>
  );
};

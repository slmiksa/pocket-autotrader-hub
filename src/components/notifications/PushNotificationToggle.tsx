import { useState } from 'react';
import { Bell, BellOff, TestTube, Loader2, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const PushNotificationToggle = () => {
  const [isTestingServer, setIsTestingServer] = useState(false);
  const {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe,
    testNotification,
  } = usePushNotifications();

  const testServerNotification = async () => {
    setIsTestingServer(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('يرجى تسجيل الدخول أولاً');
        return;
      }

      const { data, error } = await supabase.functions.invoke('test-push-notification', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success(data.message || 'تم إرسال الإشعار من الخادم');
      } else {
        toast.error(data.message || 'فشل إرسال الإشعار');
      }
    } catch (error: any) {
      console.error('Server test error:', error);
      toast.error(error.message || 'حدث خطأ في إرسال الإشعار من الخادم');
    } finally {
      setIsTestingServer(false);
    }
  };

  if (!isSupported) {
    return (
      <Card className="p-4 bg-destructive/10 border-destructive/20">
        <div className="flex items-center gap-3">
          <BellOff className="h-5 w-5 text-destructive" />
          <div>
            <p className="font-medium text-foreground">الإشعارات غير مدعومة</p>
            <p className="text-sm text-muted-foreground">
              متصفحك لا يدعم إشعارات Push
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  return (
    <Card className="p-4 bg-card border-border">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {isSubscribed ? (
            <Bell className="h-5 w-5 text-primary" />
          ) : (
            <BellOff className="h-5 w-5 text-muted-foreground" />
          )}
          <div>
            <p className="font-medium text-foreground">إشعارات Push</p>
            <p className="text-sm text-muted-foreground">
              {isSubscribed 
                ? 'ستصلك الإشعارات حتى خارج التطبيق'
                : 'فعّل الإشعارات لتصلك التنبيهات'
              }
            </p>
            {permission === 'denied' && (
              <p className="text-xs text-destructive mt-1">
                تم حظر الإشعارات. يرجى السماح من إعدادات المتصفح
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isSubscribed && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={testNotification}
                className="gap-1"
                title="اختبار محلي"
              >
                <TestTube className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={testServerNotification}
                disabled={isTestingServer}
                className="gap-1"
                title="اختبار من الخادم"
              >
                {isTestingServer ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Server className="h-4 w-4" />
                )}
              </Button>
            </>
          )}
          
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <Switch
              checked={isSubscribed}
              onCheckedChange={handleToggle}
              disabled={permission === 'denied'}
            />
          )}
        </div>
      </div>
    </Card>
  );
};

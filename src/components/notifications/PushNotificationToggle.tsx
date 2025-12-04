import { Bell, BellOff, TestTube, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export const PushNotificationToggle = () => {
  const {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe,
    testNotification,
  } = usePushNotifications();

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
            <Button
              variant="outline"
              size="sm"
              onClick={testNotification}
              className="gap-1"
            >
              <TestTube className="h-4 w-4" />
              <span className="hidden sm:inline">اختبار</span>
            </Button>
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

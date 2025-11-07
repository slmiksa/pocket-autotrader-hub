import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { playCallNotificationSound, playPutNotificationSound, playNotificationSound } from '@/utils/soundNotification';

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async (silent = false) => {
    if (!isSupported) {
      if (!silent) toast.error('المتصفح لا يدعم الإشعارات');
      return false;
    }

    if (permission === 'granted') {
      return true;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        if (!silent) toast.success('تم تفعيل الإشعارات بنجاح');
        return true;
      }
      // Don't show error toast when denied, just log it
      console.log('Notification permission:', result);
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      if (!silent) toast.error('فشل طلب إذن الإشعارات');
      return false;
    }
    
    return false;
  };

  const sendNotification = (title: string, options?: NotificationOptions & { soundType?: 'call' | 'put' | 'default' }) => {
    if (!isSupported) {
      console.log('Notifications not supported');
      return;
    }

    if (permission !== 'granted') {
      console.log('Notification permission not granted');
      return;
    }

    try {
      // Play appropriate sound based on signal type
      const soundType = options?.soundType || 'default';
      if (soundType === 'call') {
        playCallNotificationSound();
      } else if (soundType === 'put') {
        playPutNotificationSound();
      } else {
        playNotificationSound();
      }
      
      // Remove soundType from options before passing to Notification API
      const { soundType: _, ...notificationOptions } = options || {};
      
      const notification = new Notification(title, {
        icon: '/favicon.png',
        badge: '/favicon.png',
        dir: 'rtl',
        lang: 'ar',
        ...notificationOptions,
      });

      // Auto-close after 10 seconds
      setTimeout(() => {
        notification.close();
      }, 10000);

      // Handle click to focus window
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  return {
    permission,
    isSupported,
    requestPermission,
    sendNotification,
  };
};

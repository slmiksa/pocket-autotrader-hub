import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { playNotificationSound } from '@/utils/soundNotification';

export interface UserNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

export const useUserNotifications = () => {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  const requestBrowserNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  const sendBrowserNotification = useCallback((title: string, body: string) => {
    // Try to send via Service Worker first (works even when app is in background)
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        title,
        body,
        data: { url: '/' }
      });
      return;
    }
    
    // Fallback to regular Notification API
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.png',
        tag: 'admin-notification',
        requireInteraction: true,
      });
      
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const notificationsList = (data || []) as UserNotification[];
      setNotifications(notificationsList);
      setUnreadCount(notificationsList.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('تم تحديد الكل كمقروء');
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      const notification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_notifications')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setNotifications([]);
      setUnreadCount(0);
      toast.success('تم حذف جميع الإشعارات');
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    requestBrowserNotificationPermission();

    // Set up real-time subscription
    const channel = supabase
      .channel('user-notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_notifications'
        },
        (payload) => {
          const newNotification = payload.new as UserNotification;
          
          // Only process if it's for the current user
          if (userId && newNotification.user_id === userId) {
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            // Play sound
            playNotificationSound();
            
            // Show toast notification
            toast.info(newNotification.title, {
              description: newNotification.body,
              duration: 10000,
            });
            
            // Send browser notification
            sendBrowserNotification(newNotification.title, newNotification.body);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, requestBrowserNotificationPermission, sendBrowserNotification]);

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    refetch: fetchNotifications,
    sendBrowserNotification
  };
};

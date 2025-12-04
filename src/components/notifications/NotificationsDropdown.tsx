import { useState } from 'react';
import { Bell, Check, Trash2, CheckCheck, X, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUserNotifications, UserNotification } from '@/hooks/useUserNotifications';
import { useNavigate } from 'react-router-dom';

export const NotificationsDropdown = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { 
    notifications, 
    loading, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    clearAllNotifications 
  } = useUserNotifications();

  const handleNotificationClick = (notification: UserNotification) => {
    markAsRead(notification.id);
    
    // Navigate based on notification type
    if (notification.type === 'price_alert' && notification.data?.symbol) {
      navigate(`/live-chart?symbol=${notification.data.symbol}`);
      setOpen(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    return `منذ ${days} يوم`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative text-[hsl(215,20%,65%)] hover:text-[hsl(210,40%,98%)] hover:bg-[hsl(217,33%,17%)]"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 bg-[hsl(224,47%,9%)] border-[hsl(217,33%,17%)]" 
        align="end"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[hsl(217,33%,17%)]">
          <h3 className="font-bold text-[hsl(210,40%,98%)]">الإشعارات</h3>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-xs text-[hsl(215,20%,65%)] hover:text-primary hover:bg-primary/10"
                onClick={markAllAsRead}
              >
                <CheckCheck className="h-3 w-3 ml-1" />
                قراءة الكل
              </Button>
            )}
            {notifications.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-xs text-red-400/60 hover:text-red-400 hover:bg-red-500/10"
                onClick={clearAllNotifications}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-80">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[hsl(215,20%,50%)]">
              <Bell className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">لا توجد إشعارات</p>
            </div>
          ) : (
            <div className="divide-y divide-[hsl(217,33%,17%)]">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 cursor-pointer transition-colors hover:bg-[hsl(217,33%,15%)] ${
                    !notification.is_read ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`p-2 rounded-lg ${
                      notification.data?.condition === 'above' 
                        ? 'bg-emerald-500/20' 
                        : 'bg-red-500/20'
                    }`}>
                      {notification.data?.condition === 'above' ? (
                        <TrendingUp className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-400" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium ${
                          notification.is_read 
                            ? 'text-[hsl(215,20%,65%)]' 
                            : 'text-[hsl(210,40%,98%)]'
                        }`}>
                          {notification.title}
                        </p>
                        {!notification.is_read && (
                          <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-[hsl(215,20%,50%)] mt-0.5 line-clamp-2">
                        {notification.body}
                      </p>
                      <p className="text-[10px] text-[hsl(215,20%,40%)] mt-1">
                        {formatTime(notification.created_at)}
                      </p>
                    </div>

                    {/* Delete button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-[hsl(215,20%,40%)] hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-2 border-t border-[hsl(217,33%,17%)]">
            <Button 
              variant="ghost" 
              className="w-full text-xs text-[hsl(215,20%,65%)] hover:text-primary hover:bg-primary/10"
              onClick={() => {
                navigate('/profile');
                setOpen(false);
              }}
            >
              عرض كل الإشعارات
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

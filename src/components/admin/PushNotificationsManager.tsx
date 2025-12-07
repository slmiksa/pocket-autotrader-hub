import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Send, Users, Loader2, User } from "lucide-react";
import { toast } from "sonner";

interface UserProfile {
  user_id: string;
  email: string | null;
  nickname: string | null;
}

export const PushNotificationsManager = () => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [subscribersCount, setSubscribersCount] = useState(0);
  const [loadingCount, setLoadingCount] = useState(true);
  const [targetType, setTargetType] = useState<"all" | "selected">("all");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [subscribedUserIds, setSubscribedUserIds] = useState<string[]>([]);

  useEffect(() => {
    loadSubscribersCount();
    loadUsers();
  }, []);

  const loadSubscribersCount = async () => {
    setLoadingCount(true);
    try {
      const { data, error } = await supabase
        .from("push_subscriptions")
        .select("user_id");

      if (error) throw error;
      
      const uniqueUserIds = [...new Set(data?.map(s => s.user_id) || [])];
      setSubscribersCount(uniqueUserIds.length);
      setSubscribedUserIds(uniqueUserIds);
    } catch (error) {
      console.error("Error loading subscribers count:", error);
    } finally {
      setLoadingCount(false);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, email, nickname")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllSubscribed = () => {
    setSelectedUserIds(subscribedUserIds);
  };

  const clearSelection = () => {
    setSelectedUserIds([]);
  };

  const handleSendNotification = async () => {
    if (!title.trim()) {
      toast.error("يرجى إدخال عنوان الإشعار");
      return;
    }

    if (!body.trim()) {
      toast.error("يرجى إدخال نص الإشعار");
      return;
    }

    if (targetType === "selected" && selectedUserIds.length === 0) {
      toast.error("يرجى اختيار مستخدم واحد على الأقل");
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-admin-push-notification", {
        body: {
          title: title.trim(),
          body: body.trim(),
          targetUserIds: targetType === "selected" ? selectedUserIds : null,
        },
      });

      if (error) throw error;

      toast.success(`تم إرسال الإشعار إلى ${data?.sentCount || 0} مستخدم`);
      setTitle("");
      setBody("");
      setSelectedUserIds([]);
      loadSubscribersCount();
    } catch (error: any) {
      console.error("Error sending notification:", error);
      toast.error(error.message || "فشل إرسال الإشعار");
    } finally {
      setSending(false);
    }
  };

  const subscribedUsers = users.filter(u => subscribedUserIds.includes(u.user_id));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          إرسال إشعارات Push
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          {loadingCount ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <span>{subscribersCount} مشترك في الإشعارات</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="notificationTitle">عنوان الإشعار</Label>
          <Input
            id="notificationTitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: عرض خاص! 🎉"
            dir="rtl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notificationBody">نص الإشعار</Label>
          <Textarea
            id="notificationBody"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="مثال: احصل على خصم 50% على جميع الباقات - العرض ساري لمدة 24 ساعة فقط!"
            rows={3}
            dir="rtl"
          />
        </div>

        <div className="space-y-2">
          <Label>إرسال إلى</Label>
          <Select value={targetType} onValueChange={(v: "all" | "selected") => setTargetType(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  جميع المشتركين ({subscribersCount})
                </div>
              </SelectItem>
              <SelectItem value="selected">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  مستخدمين محددين
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {targetType === "selected" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>اختر المستخدمين ({selectedUserIds.length} محدد)</Label>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={selectAllSubscribed}
                  disabled={subscribedUsers.length === 0}
                >
                  تحديد الكل
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearSelection}
                  disabled={selectedUserIds.length === 0}
                >
                  إلغاء التحديد
                </Button>
              </div>
            </div>
            
            {loadingUsers ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : subscribedUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center p-4">
                لا يوجد مستخدمين مشتركين في الإشعارات
              </p>
            ) : (
              <ScrollArea className="h-48 border rounded-lg p-2">
                <div className="space-y-2">
                  {subscribedUsers.map((user) => (
                    <div
                      key={user.user_id}
                      className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg cursor-pointer"
                      onClick={() => toggleUserSelection(user.user_id)}
                    >
                      <Checkbox
                        checked={selectedUserIds.includes(user.user_id)}
                        onCheckedChange={() => toggleUserSelection(user.user_id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {user.nickname || user.email || "مستخدم غير معروف"}
                        </p>
                        {user.nickname && user.email && (
                          <p className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}

        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">معاينة الإشعار:</h4>
          <div className="bg-card border border-border rounded-lg p-3 space-y-1">
            <p className="font-bold text-foreground">{title || "عنوان الإشعار"}</p>
            <p className="text-sm text-muted-foreground">{body || "نص الإشعار سيظهر هنا..."}</p>
          </div>
        </div>

        <Button
          onClick={handleSendNotification}
          disabled={
            sending || 
            !title.trim() || 
            !body.trim() || 
            (targetType === "all" && subscribersCount === 0) ||
            (targetType === "selected" && selectedUserIds.length === 0)
          }
          className="w-full"
        >
          {sending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
              جاري الإرسال...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 ml-2" />
              إرسال الإشعار ({targetType === "all" ? subscribersCount : selectedUserIds.length} مستخدم)
            </>
          )}
        </Button>

        {subscribersCount === 0 && (
          <p className="text-sm text-amber-500 text-center">
            لا يوجد مشتركين في الإشعارات حالياً
          </p>
        )}
      </CardContent>
    </Card>
  );
};

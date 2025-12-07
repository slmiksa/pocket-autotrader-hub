import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Bell, Send, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const PushNotificationsManager = () => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [subscribersCount, setSubscribersCount] = useState(0);
  const [loadingCount, setLoadingCount] = useState(true);

  useEffect(() => {
    loadSubscribersCount();
  }, []);

  const loadSubscribersCount = async () => {
    setLoadingCount(true);
    try {
      const { count, error } = await supabase
        .from("push_subscriptions")
        .select("*", { count: "exact", head: true });

      if (error) throw error;
      setSubscribersCount(count || 0);
    } catch (error) {
      console.error("Error loading subscribers count:", error);
    } finally {
      setLoadingCount(false);
    }
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

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-admin-push-notification", {
        body: {
          title: title.trim(),
          body: body.trim(),
        },
      });

      if (error) throw error;

      toast.success(`تم إرسال الإشعار إلى ${data?.sentCount || 0} مستخدم`);
      setTitle("");
      setBody("");
      loadSubscribersCount();
    } catch (error: any) {
      console.error("Error sending notification:", error);
      toast.error(error.message || "فشل إرسال الإشعار");
    } finally {
      setSending(false);
    }
  };

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

        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">معاينة الإشعار:</h4>
          <div className="bg-card border border-border rounded-lg p-3 space-y-1">
            <p className="font-bold text-foreground">{title || "عنوان الإشعار"}</p>
            <p className="text-sm text-muted-foreground">{body || "نص الإشعار سيظهر هنا..."}</p>
          </div>
        </div>

        <Button
          onClick={handleSendNotification}
          disabled={sending || !title.trim() || !body.trim() || subscribersCount === 0}
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
              إرسال الإشعار ({subscribersCount} مشترك)
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

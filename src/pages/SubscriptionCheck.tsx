import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, Key, Shield } from "lucide-react";
import { toast } from "sonner";

const SubscriptionCheck = () => {
  const navigate = useNavigate();
  const [subscriptionCode, setSubscriptionCode] = useState("");
  const [loading, setLoading] = useState(false);

  const generateDeviceId = () => {
    let deviceId = localStorage.getItem("device_id");
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      localStorage.setItem("device_id", deviceId);
    }
    return deviceId;
  };

  const checkExistingSubscription = async (deviceId: string) => {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("device_id", deviceId)
      .order("expires_at", { ascending: false })
      .limit(1);

    if (error) throw error;

    if (data && data.length > 0) {
      const subscription = data[0];
      const expiresAt = new Date(subscription.expires_at);
      const now = new Date();

      if (expiresAt > now) {
        return true;
      }
    }
    return false;
  };

  const handleActivateCode = async () => {
    if (!subscriptionCode.trim()) {
      toast.error("يرجى إدخال كود الاشتراك");
      return;
    }

    setLoading(true);
    try {
      const deviceId = generateDeviceId();

      // Check if device already has active subscription
      const hasActiveSubscription = await checkExistingSubscription(deviceId);
      if (hasActiveSubscription) {
        toast.success("لديك اشتراك نشط بالفعل!");
        navigate("/");
        return;
      }

      // Validate the code
      const { data: codeData, error: codeError } = await supabase
        .from("subscription_codes")
        .select("*")
        .eq("code", subscriptionCode.toUpperCase())
        .eq("is_active", true)
        .single();

      if (codeError || !codeData) {
        toast.error("كود الاشتراك غير صحيح أو منتهي الصلاحية");
        return;
      }

      // Check if code is expired
      if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
        toast.error("هذا الكود منتهي الصلاحية");
        return;
      }

      // Check if code reached max uses
      if (codeData.max_uses && codeData.current_uses >= codeData.max_uses) {
        toast.error("تم استخدام هذا الكود بالكامل");
        return;
      }

      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + codeData.duration_days);

      // Create subscription
      const { error: subError } = await supabase
        .from("subscriptions")
        .insert({
          device_id: deviceId,
          code_id: codeData.id,
          expires_at: expiresAt.toISOString(),
        });

      if (subError) throw subError;

      // Update code usage count
      await supabase
        .from("subscription_codes")
        .update({ current_uses: (codeData.current_uses || 0) + 1 })
        .eq("id", codeData.id);

      toast.success("تم تفعيل الاشتراك بنجاح!");
      navigate("/");
    } catch (error: any) {
      console.error("Error activating code:", error);
      toast.error(error.message || "فشل تفعيل الكود");
    } finally {
      setLoading(false);
    }
  };

  const checkSubscription = async () => {
    setLoading(true);
    try {
      const deviceId = generateDeviceId();
      const hasActiveSubscription = await checkExistingSubscription(deviceId);

      if (hasActiveSubscription) {
        toast.success("لديك اشتراك نشط!");
        navigate("/");
      } else {
        toast.error("لا يوجد اشتراك نشط");
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
      toast.error("فشل التحقق من الاشتراك");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background dark flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">PocketOption Auto Trader</CardTitle>
          <CardDescription>أدخل كود الاشتراك للوصول إلى التوصيات</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              كود الاشتراك
            </Label>
            <Input
              id="code"
              value={subscriptionCode}
              onChange={(e) => setSubscriptionCode(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === "Enter" && handleActivateCode()}
              placeholder="XXXX-XXXX-XXXX"
              className="font-mono text-center text-lg"
              maxLength={14}
            />
          </div>

          <Button
            onClick={handleActivateCode}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            تفعيل الاشتراك
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">أو</span>
            </div>
          </div>

          <Button
            onClick={checkSubscription}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            التحقق من الاشتراك
          </Button>

          <div className="flex gap-2">
            <Button
              onClick={() => navigate("/auth")}
              variant="outline"
              className="flex-1"
            >
              تسجيل الدخول
            </Button>
            <Button
              onClick={() => navigate("/admin-login")}
              variant="ghost"
              size="sm"
              className="flex-1 text-muted-foreground"
            >
              <Shield className="h-4 w-4 ml-2" />
              مسؤول
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionCheck;

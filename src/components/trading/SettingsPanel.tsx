import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Save, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const SettingsPanel = () => {
  const [settings, setSettings] = useState({
    defaultAmount: "5",
    maxPerTrade: "500",
    accountMode: "demo",
    autoRetry: true,
    stopLossEnabled: false,
    stopLossAmount: "100",
    dailyLimit: "50",
  });

  const handleSave = () => {
    toast.success("تم حفظ الإعدادات بنجاح");
  };

  return (
    <div className="space-y-6">
      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle>إعدادات الحساب</CardTitle>
          <CardDescription>إعدادات الاتصال بحساب PocketOption</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accountMode">وضع الحساب</Label>
            <Select 
              value={settings.accountMode}
              onValueChange={(value) => setSettings({...settings, accountMode: value})}
            >
              <SelectTrigger id="accountMode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="demo">تجريبي (Demo)</SelectItem>
                <SelectItem value="live">حقيقي (Live)</SelectItem>
              </SelectContent>
            </Select>
            {settings.accountMode === "live" && (
              <div className="flex items-center gap-2 rounded-md bg-danger/10 p-3 text-sm text-danger">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>تحذير: أنت على وشك استخدام حساب حقيقي! تأكد من اختبار النظام جيداً.</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Risk Management */}
      <Card>
        <CardHeader>
          <CardTitle>إدارة المخاطر</CardTitle>
          <CardDescription>ضبط حدود الخسارة والمكسب</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="defaultAmount">المبلغ الافتراضي للصفقة ($)</Label>
              <Input
                id="defaultAmount"
                type="number"
                value={settings.defaultAmount}
                onChange={(e) => setSettings({...settings, defaultAmount: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxPerTrade">الحد الأقصى للصفقة الواحدة ($)</Label>
              <Input
                id="maxPerTrade"
                type="number"
                value={settings.maxPerTrade}
                onChange={(e) => setSettings({...settings, maxPerTrade: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dailyLimit">الحد اليومي للصفقات</Label>
            <Input
              id="dailyLimit"
              type="number"
              value={settings.dailyLimit}
              onChange={(e) => setSettings({...settings, dailyLimit: e.target.value})}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="stopLoss">وقف الخسارة التلقائي</Label>
              <p className="text-sm text-muted-foreground">
                إيقاف التداول عند الوصول لحد خسارة معين
              </p>
            </div>
            <Switch
              id="stopLoss"
              checked={settings.stopLossEnabled}
              onCheckedChange={(checked) => setSettings({...settings, stopLossEnabled: checked})}
            />
          </div>

          {settings.stopLossEnabled && (
            <div className="space-y-2">
              <Label htmlFor="stopLossAmount">حد وقف الخسارة ($)</Label>
              <Input
                id="stopLossAmount"
                type="number"
                value={settings.stopLossAmount}
                onChange={(e) => setSettings({...settings, stopLossAmount: e.target.value})}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Execution Settings */}
      <Card>
        <CardHeader>
          <CardTitle>إعدادات التنفيذ</CardTitle>
          <CardDescription>خيارات تنفيذ الصفقات</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="autoRetry">إعادة المحاولة التلقائية</Label>
              <p className="text-sm text-muted-foreground">
                إعادة محاولة التنفيذ في حالة الفشل
              </p>
            </div>
            <Switch
              id="autoRetry"
              checked={settings.autoRetry}
              onCheckedChange={(checked) => setSettings({...settings, autoRetry: checked})}
            />
          </div>
        </CardContent>
      </Card>

      {/* Telegram Settings */}
      <Card>
        <CardHeader>
          <CardTitle>إعدادات تيليجرام</CardTitle>
          <CardDescription>ربط البوت بالقناة المصدر</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>رابط البوت الحالي</Label>
            <div className="flex items-center gap-2">
              <Input 
                value="https://t.me/EyadTraderBot2" 
                readOnly 
                className="bg-muted"
              />
              <Button variant="outline" size="icon">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <h4 className="font-medium mb-2">حالة الاتصال</h4>
            <div className="flex items-center gap-2">
              <div className="flex h-2 w-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm text-muted-foreground">متصل ويستقبل التوصيات</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-2">
        <Button variant="outline">إلغاء</Button>
        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" />
          حفظ الإعدادات
        </Button>
      </div>
    </div>
  );
};

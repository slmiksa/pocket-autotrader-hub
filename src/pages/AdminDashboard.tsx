import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, Plus, Trash2, Copy, Check, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form state
  const [newCode, setNewCode] = useState("");
  const [durationDays, setDurationDays] = useState("30");
  const [maxUses, setMaxUses] = useState("1");
  const [codeExpiresAt, setCodeExpiresAt] = useState("");

  useEffect(() => {
    // Check if already authenticated
    const adminAuth = localStorage.getItem("admin_auth");
    if (adminAuth === "true") {
      setIsAuthenticated(true);
      loadCodes();
    }
  }, []);

  const handleLogin = () => {
    // Simple password check - في التطبيق الحقيقي يجب استخدام backend authentication
    if (password === "admin123") {
      localStorage.setItem("admin_auth", "true");
      setIsAuthenticated(true);
      loadCodes();
      toast.success("تم تسجيل الدخول بنجاح");
    } else {
      toast.error("كلمة المرور غير صحيحة");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_auth");
    setIsAuthenticated(false);
    navigate("/");
  };

  const loadCodes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("subscription_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCodes(data || []);
    } catch (error) {
      console.error("Error loading codes:", error);
      toast.error("فشل تحميل الأكواد");
    } finally {
      setLoading(false);
    }
  };

  const generateRandomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 12; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
      if ((i + 1) % 4 === 0 && i < 11) code += "-";
    }
    setNewCode(code);
  };

  const handleCreateCode = async () => {
    if (!newCode || !durationDays) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    setLoading(true);
    try {
      const codeData: any = {
        code: newCode.toUpperCase(),
        duration_days: parseInt(durationDays),
        max_uses: maxUses ? parseInt(maxUses) : null,
        expires_at: codeExpiresAt ? new Date(codeExpiresAt).toISOString() : null,
      };

      const { error } = await supabase
        .from("subscription_codes")
        .insert(codeData);

      if (error) throw error;

      toast.success("تم إنشاء الكود بنجاح");
      setNewCode("");
      setDurationDays("30");
      setMaxUses("1");
      setCodeExpiresAt("");
      loadCodes();
    } catch (error: any) {
      console.error("Error creating code:", error);
      toast.error(error.message || "فشل إنشاء الكود");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCode = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الكود؟")) return;

    try {
      const { error } = await supabase
        .from("subscription_codes")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("تم حذف الكود بنجاح");
      loadCodes();
    } catch (error: any) {
      console.error("Error deleting code:", error);
      toast.error("فشل حذف الكود");
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("تم نسخ الكود");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background dark flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>لوحة تحكم المسؤول</CardTitle>
            <CardDescription>يرجى إدخال كلمة المرور للوصول</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                placeholder="أدخل كلمة المرور"
              />
            </div>
            <Button onClick={handleLogin} className="w-full">
              تسجيل الدخول
            </Button>
            <Button onClick={() => navigate("/")} variant="outline" className="w-full">
              العودة للصفحة الرئيسية
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary p-2">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">لوحة تحكم المسؤول</h1>
                <p className="text-sm text-muted-foreground">إدارة أكواد الاشتراك</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => navigate("/")} variant="outline" size="sm">
                <ArrowRight className="h-4 w-4 ml-2" />
                الصفحة الرئيسية
              </Button>
              <Button onClick={handleLogout} variant="outline" size="sm">
                تسجيل الخروج
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Create New Code */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              إنشاء كود اشتراك جديد
            </CardTitle>
            <CardDescription>
              قم بإنشاء كود اشتراك جديد للمشتركين
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">الكود</Label>
                <div className="flex gap-2">
                  <Input
                    id="code"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="XXXX-XXXX-XXXX"
                    className="flex-1"
                  />
                  <Button onClick={generateRandomCode} variant="outline" type="button">
                    توليد
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">مدة الاشتراك (بالأيام)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  placeholder="30"
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxUses">عدد مرات الاستخدام (اختياري)</Label>
                <Input
                  id="maxUses"
                  type="number"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  placeholder="1"
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiresAt">تاريخ انتهاء الكود (اختياري)</Label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={codeExpiresAt}
                  onChange={(e) => setCodeExpiresAt(e.target.value)}
                />
              </div>
            </div>

            <Button onClick={handleCreateCode} disabled={loading} className="w-full md:w-auto">
              <Plus className="h-4 w-4 ml-2" />
              إنشاء الكود
            </Button>
          </CardContent>
        </Card>

        {/* Existing Codes */}
        <Card>
          <CardHeader>
            <CardTitle>الأكواد الحالية</CardTitle>
            <CardDescription>
              جميع أكواد الاشتراك المنشأة
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
            ) : codes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">لا توجد أكواد</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الكود</TableHead>
                      <TableHead>المدة (أيام)</TableHead>
                      <TableHead>الاستخدامات</TableHead>
                      <TableHead>صلاحية الكود</TableHead>
                      <TableHead>تاريخ الإنشاء</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {codes.map((code) => (
                      <TableRow key={code.id}>
                        <TableCell className="font-mono font-semibold">
                          <div className="flex items-center gap-2">
                            {code.code}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(code.code)}
                              className="h-6 w-6 p-0"
                            >
                              {copiedCode === code.code ? (
                                <Check className="h-3 w-3 text-success" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>{code.duration_days}</TableCell>
                        <TableCell>
                          {code.current_uses || 0} / {code.max_uses || "∞"}
                        </TableCell>
                        <TableCell>
                          {code.expires_at
                            ? format(new Date(code.expires_at), "yyyy-MM-dd")
                            : "بدون انتهاء"}
                        </TableCell>
                        <TableCell>
                          {format(new Date(code.created_at), "yyyy-MM-dd HH:mm")}
                        </TableCell>
                        <TableCell>
                          {code.is_active ? (
                            <Badge variant="default" className="bg-success">
                              نشط
                            </Badge>
                          ) : (
                            <Badge variant="secondary">غير نشط</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteCode(code.id)}
                            className="h-8 w-8 p-0 text-danger hover:text-danger"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminDashboard;

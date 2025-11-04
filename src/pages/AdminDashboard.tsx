import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, Plus, Trash2, Copy, Check, ArrowRight, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form state
  const [newCode, setNewCode] = useState("");
  const [durationDays, setDurationDays] = useState("30");
  const [maxUses, setMaxUses] = useState("1");
  const [codeExpiresAt, setCodeExpiresAt] = useState("");
  
  // Admin account settings state
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const checkAdmin = async (userId: string) => {
      try {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin")
          .single();

        if (data) {
          setIsAdmin(true);
          loadCodes();
        } else {
          setIsAdmin(false);
          setLoading(false);
          toast.error("ليس لديك صلاحيات المسؤول");
          navigate("/admin-login");
        }
      } catch (error) {
        console.error("Error checking admin:", error);
        setIsAdmin(false);
        setLoading(false);
        navigate("/admin-login");
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => {
            checkAdmin(session.user.id);
          }, 0);
        } else {
          setLoading(false);
          navigate("/admin-login");
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        checkAdmin(session.user.id);
      } else {
        setLoading(false);
        navigate("/admin-login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("تم تسجيل الخروج بنجاح");
      navigate("/admin-login");
    } catch (error: any) {
      console.error("Error logging out:", error);
      toast.error("فشل تسجيل الخروج");
    }
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

  const handleUpdateEmail = async () => {
    if (!newEmail) {
      toast.error("يرجى إدخال البريد الإلكتروني الجديد");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) throw error;

      toast.success("تم تحديث البريد الإلكتروني بنجاح");
      setNewEmail("");
    } catch (error: any) {
      console.error("Error updating email:", error);
      toast.error(error.message || "فشل تحديث البريد الإلكتروني");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("يرجى إدخال كلمة المرور وتأكيدها");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("كلمات المرور غير متطابقة");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success("تم تحديث كلمة المرور بنجاح");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Error updating password:", error);
      toast.error(error.message || "فشل تحديث كلمة المرور");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !isAdmin || !user || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                <LogOut className="h-4 w-4 ml-2" />
                تسجيل الخروج
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Admin Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              إعدادات حساب المسؤول
            </CardTitle>
            <CardDescription>
              تغيير البريد الإلكتروني وكلمة المرور للحساب
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email Section */}
            <div className="space-y-4 pb-6 border-b border-border">
              <h3 className="text-lg font-semibold">تغيير البريد الإلكتروني</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentEmail">البريد الحالي</Label>
                  <Input
                    id="currentEmail"
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newEmail">البريد الجديد</Label>
                  <Input
                    id="newEmail"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="admin@example.com"
                  />
                </div>
              </div>
              <Button onClick={handleUpdateEmail} disabled={loading || !newEmail}>
                تحديث البريد الإلكتروني
              </Button>
            </div>

            {/* Password Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">تغيير كلمة المرور</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <Button onClick={handleUpdatePassword} disabled={loading || !newPassword || !confirmPassword}>
                تحديث كلمة المرور
              </Button>
            </div>
          </CardContent>
        </Card>

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

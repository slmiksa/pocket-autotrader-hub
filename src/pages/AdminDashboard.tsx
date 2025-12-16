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
import { Shield, Plus, Trash2, Copy, Check, ArrowRight, LogOut, Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ProfessionalSignalsManager } from "@/components/admin/ProfessionalSignalsManager";
import { ReportsManager } from "@/components/admin/ReportsManager";
import { HeroSlidesManager } from "@/components/admin/HeroSlidesManager";
import { PushNotificationsManager } from "@/components/admin/PushNotificationsManager";
import { EmailManager } from "@/components/admin/EmailManager";
import { ResetPasswordDialog } from "@/components/admin/ResetPasswordDialog";
import { BannedUsersManager } from "@/components/admin/BannedUsersManager";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  // Reset password dialog state
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState<{ email: string; userId: string } | null>(null);

  // Form state
  const [newCode, setNewCode] = useState("");
  const [durationDays, setDurationDays] = useState("30");
  const [maxUses, setMaxUses] = useState("1");
  const [codeExpiresAt, setCodeExpiresAt] = useState("");
  
  // Admin account settings state
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Announcement state
  const [announcementContent, setAnnouncementContent] = useState("");
  const [announcementBgColor, setAnnouncementBgColor] = useState("#1a1a1a");
  const [announcementTextColor, setAnnouncementTextColor] = useState("#ffffff");
  const [announcementWhatsApp, setAnnouncementWhatsApp] = useState("");
  const [announcementWhatsAppText, setAnnouncementWhatsAppText] = useState("تواصل معنا");
  const [announcementWebsite, setAnnouncementWebsite] = useState("");
  const [announcementWebsiteText, setAnnouncementWebsiteText] = useState("زيارة الموقع");

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
          loadUsers();
          loadAnnouncements();
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

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, email, subscription_expires_at, image_analysis_enabled, professional_signals_enabled, supply_demand_enabled, activated_code, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setUsers(data || []);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("فشل تحميل المستخدمين");
    }
  };

  const loadAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from("announcement_banner")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error("Error loading announcements:", error);
      toast.error("فشل تحميل الإعلانات");
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!announcementContent) {
      toast.error("يرجى إدخال محتوى الإعلان");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("announcement_banner")
        .insert({
          content: announcementContent,
          background_color: announcementBgColor,
          text_color: announcementTextColor,
          whatsapp_number: announcementWhatsApp || null,
          whatsapp_text: announcementWhatsApp ? announcementWhatsAppText : null,
          website_url: announcementWebsite || null,
          website_text: announcementWebsite ? announcementWebsiteText : null,
          is_active: true
        });

      if (error) throw error;

      toast.success("تم إنشاء الإعلان بنجاح");
      setAnnouncementContent("");
      setAnnouncementBgColor("#1a1a1a");
      setAnnouncementTextColor("#ffffff");
      setAnnouncementWhatsApp("");
      setAnnouncementWhatsAppText("تواصل معنا");
      setAnnouncementWebsite("");
      setAnnouncementWebsiteText("زيارة الموقع");
      loadAnnouncements();
    } catch (error: any) {
      console.error("Error creating announcement:", error);
      toast.error("فشل إنشاء الإعلان");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAnnouncement = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("announcement_banner")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      toast.success("تم تحديث حالة الإعلان");
      loadAnnouncements();
    } catch (error: any) {
      console.error("Error toggling announcement:", error);
      toast.error("فشل تحديث الإعلان");
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الإعلان؟")) return;

    try {
      const { error } = await supabase
        .from("announcement_banner")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("تم حذف الإعلان بنجاح");
      loadAnnouncements();
    } catch (error: any) {
      console.error("Error deleting announcement:", error);
      toast.error("فشل حذف الإعلان");
    }
  };

  const toggleImageAnalysis = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ image_analysis_enabled: !currentStatus })
        .eq("user_id", userId);

      if (error) throw error;

      toast.success(`تم ${!currentStatus ? 'تفعيل' : 'تعطيل'} تحليل الصورة`);
      loadUsers();
    } catch (error: any) {
      console.error("Error toggling image analysis:", error);
      toast.error("فشل تحديث حالة تحليل الصورة");
    }
  };

  const toggleProfessionalSignals = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ professional_signals_enabled: !currentStatus })
        .eq("user_id", userId);

      if (error) throw error;

      toast.success(`تم ${!currentStatus ? 'تفعيل' : 'تعطيل'} توصيات المحترفين`);
      loadUsers();
    } catch (error: any) {
      console.error("Error toggling professional signals:", error);
      toast.error("فشل تحديث حالة توصيات المحترفين");
    }
  };

  const toggleSupplyDemand = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ supply_demand_enabled: !currentStatus })
        .eq("user_id", userId);

      if (error) throw error;

      toast.success(`تم ${!currentStatus ? 'تفعيل' : 'تعطيل'} محلل العرض والطلب`);
      loadUsers();
    } catch (error: any) {
      console.error("Error toggling supply demand analyzer:", error);
      toast.error("فشل تحديث حالة محلل العرض والطلب");
    }
  };

  const handleResetPassword = (userEmail: string, userId: string) => {
    if (!userEmail) {
      toast.error("لا يوجد بريد إلكتروني لهذا المستخدم");
      return;
    }
    setSelectedUserForReset({ email: userEmail, userId });
    setResetPasswordOpen(true);
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
        {/* Push Notifications Manager */}
        <PushNotificationsManager />

        {/* Email Manager */}
        <EmailManager />

        {/* Announcement Banner Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              إدارة الشريط الإعلاني
            </CardTitle>
            <CardDescription>
              إنشاء وإدارة الشريط الإعلاني المتحرك في الصفحة الرئيسية
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="announcementContent">محتوى الإعلان</Label>
                <Input
                  id="announcementContent"
                  value={announcementContent}
                  onChange={(e) => setAnnouncementContent(e.target.value)}
                  placeholder="مثال: احصل على خصم 50% على جميع الباقات - العرض ساري حتى نهاية الشهر!"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bgColor">لون الخلفية</Label>
                <div className="flex gap-2">
                  <Input
                    id="bgColor"
                    type="color"
                    value={announcementBgColor}
                    onChange={(e) => setAnnouncementBgColor(e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    value={announcementBgColor}
                    onChange={(e) => setAnnouncementBgColor(e.target.value)}
                    placeholder="#1a1a1a"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="textColor">لون النص</Label>
                <div className="flex gap-2">
                  <Input
                    id="textColor"
                    type="color"
                    value={announcementTextColor}
                    onChange={(e) => setAnnouncementTextColor(e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    value={announcementTextColor}
                    onChange={(e) => setAnnouncementTextColor(e.target.value)}
                    placeholder="#ffffff"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="md:col-span-2 pt-4 border-t border-border">
                <h3 className="text-sm font-semibold mb-3">أزرار الإجراءات (اختياري)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="whatsappNumber">رقم واتساب (مع رمز الدولة)</Label>
                    <Input
                      id="whatsappNumber"
                      value={announcementWhatsApp}
                      onChange={(e) => setAnnouncementWhatsApp(e.target.value)}
                      placeholder="966575594911"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="whatsappText">نص زر الواتساب</Label>
                    <Input
                      id="whatsappText"
                      value={announcementWhatsAppText}
                      onChange={(e) => setAnnouncementWhatsAppText(e.target.value)}
                      placeholder="تواصل معنا"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="websiteUrl">رابط الموقع</Label>
                    <Input
                      id="websiteUrl"
                      value={announcementWebsite}
                      onChange={(e) => setAnnouncementWebsite(e.target.value)}
                      placeholder="https://example.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="websiteText">نص زر الموقع</Label>
                    <Input
                      id="websiteText"
                      value={announcementWebsiteText}
                      onChange={(e) => setAnnouncementWebsiteText(e.target.value)}
                      placeholder="زيارة الموقع"
                    />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 flex items-end">
                <Button onClick={handleCreateAnnouncement} disabled={loading} className="w-full">
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة الإعلان
                </Button>
              </div>
            </div>

            {/* Preview */}
            {announcementContent && (
              <div className="space-y-2">
                <Label>معاينة</Label>
                <div 
                  className="overflow-hidden rounded-lg py-2 px-4"
                  style={{ 
                    backgroundColor: announcementBgColor,
                    color: announcementTextColor
                  }}
                >
                  <div className="animate-marquee whitespace-nowrap">
                    <span className="mx-4 text-sm font-medium inline-block">
                      {announcementContent}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Existing Announcements */}
            {announcements.length > 0 && (
              <div className="space-y-2 pt-4 border-t border-border">
                <Label>الإعلانات الحالية</Label>
                <div className="space-y-2">
                  {announcements.map((announcement) => (
                    <div 
                      key={announcement.id}
                      className="flex items-center gap-2 p-3 rounded-lg border border-border"
                    >
                      <div 
                        className="flex-1 px-3 py-1 rounded text-sm truncate"
                        style={{
                          backgroundColor: announcement.background_color,
                          color: announcement.text_color
                        }}
                      >
                        {announcement.content}
                      </div>
                      <Badge variant={announcement.is_active ? "default" : "secondary"}>
                        {announcement.is_active ? "نشط" : "معطل"}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleAnnouncement(announcement.id, announcement.is_active)}
                      >
                        {announcement.is_active ? "تعطيل" : "تفعيل"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteAnnouncement(announcement.id)}
                        className="text-danger hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Users Management */}
        <Card>
          <CardHeader>
            <CardTitle>إدارة المستخدمين</CardTitle>
            <CardDescription>
              عرض وتعديل صلاحيات المستخدمين
            </CardDescription>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">لا يوجد مستخدمين</div>
            ) : (
              <div className="overflow-x-auto">
                  <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>البريد الإلكتروني</TableHead>
                      <TableHead>تاريخ التسجيل</TableHead>
                      <TableHead>حالة الاشتراك</TableHead>
                      <TableHead>تاريخ انتهاء الاشتراك</TableHead>
                      <TableHead>الكود المستخدم</TableHead>
                      <TableHead>تحليل الصورة</TableHead>
                      <TableHead>محلل العرض والطلب</TableHead>
                      <TableHead>توصيات المحترفين</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => {
                      const isActive = user.subscription_expires_at && new Date(user.subscription_expires_at) > new Date();
                      return (
                        <TableRow key={user.user_id}>
                          <TableCell className="font-medium">{user.email || "لا يوجد"}</TableCell>
                          <TableCell>
                            {format(new Date(user.created_at), "yyyy-MM-dd")}
                          </TableCell>
                          <TableCell>
                            {isActive ? (
                              <Badge className="bg-success">نشط</Badge>
                            ) : (
                              <Badge variant="destructive">منتهي</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.subscription_expires_at ? (
                              <span className={isActive ? "text-success" : "text-destructive"}>
                                {format(new Date(user.subscription_expires_at), "yyyy-MM-dd")}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">غير مفعل</span>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {user.activated_code || "لا يوجد"}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant={user.image_analysis_enabled ? "default" : "outline"}
                              size="sm"
                              onClick={() => toggleImageAnalysis(user.user_id, user.image_analysis_enabled)}
                              className={user.image_analysis_enabled ? "bg-success hover:bg-success/90" : ""}
                            >
                              {user.image_analysis_enabled ? "مفعل" : "معطل"}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant={user.supply_demand_enabled ? "default" : "outline"}
                              size="sm"
                              onClick={() => toggleSupplyDemand(user.user_id, user.supply_demand_enabled)}
                              className={user.supply_demand_enabled ? "bg-info hover:bg-info/90" : ""}
                            >
                              {user.supply_demand_enabled ? "مفعل" : "معطل"}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant={user.professional_signals_enabled ? "default" : "outline"}
                              size="sm"
                              onClick={() => toggleProfessionalSignals(user.user_id, user.professional_signals_enabled)}
                              className={user.professional_signals_enabled ? "bg-primary hover:bg-primary/90" : "border-muted-foreground/30"}
                            >
                              {user.professional_signals_enabled ? "مفعل" : "معطل"}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResetPassword(user.email, user.user_id)}
                              disabled={!user.email}
                              className="gap-1"
                            >
                              <KeyRound className="h-3 w-3" />
                              إعادة تعيين
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hero Slides Management */}
        <HeroSlidesManager />

        {/* Professional Signals Management */}
        <ProfessionalSignalsManager />

        {/* Community Reports Management */}
        <ReportsManager />

        {/* Banned Users Management */}
        <BannedUsersManager />

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

        {/* Reset Password Dialog */}
        {selectedUserForReset && (
          <ResetPasswordDialog
            open={resetPasswordOpen}
            onOpenChange={setResetPasswordOpen}
            userEmail={selectedUserForReset.email}
            userId={selectedUserForReset.userId}
          />
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;

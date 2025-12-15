import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Mail, Send, Users, Search, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface User {
  user_id: string;
  email: string | null;
  nickname?: string | null;
  created_at: string;
}

export const EmailManager = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Email form
  const [subject, setSubject] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const [useTemplate, setUseTemplate] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, email, nickname, created_at")
        .not("email", "is", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("فشل تحميل المستخدمين");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.nickname?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.user_id));
    }
  };

  const getSelectedEmails = () => {
    return users
      .filter(u => selectedUsers.includes(u.user_id) && u.email)
      .map(u => u.email as string);
  };

  const templates = [
    {
      id: "welcome",
      name: "رسالة ترحيب",
      subject: "مرحباً بك في Arabot! 🎉",
      content: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">مرحباً بك في Arabot! 🎉</h1>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 18px; color: #333;">أهلاً بك،</p>
            <p style="color: #666; line-height: 1.8;">شكراً لانضمامك إلى منصة Arabot! نحن سعداء بوجودك معنا.</p>
            <p style="color: #666; line-height: 1.8;">استمتع بميزات المنصة:</p>
            <ul style="color: #666; line-height: 2;">
              <li>تحليل الشارتات بالذكاء الاصطناعي</li>
              <li>إشارات تداول احترافية</li>
              <li>تنبيهات الأسعار الفورية</li>
              <li>التقويم الاقتصادي</li>
            </ul>
          </div>
        </div>
      `
    },
    {
      id: "promo",
      name: "عرض خاص",
      subject: "🔥 عرض حصري لك!",
      content: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">🔥 عرض خاص لك!</h1>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 18px; color: #333;">عميلنا العزيز،</p>
            <p style="color: #666; line-height: 1.8;">لدينا عرض حصري لك! احصل على خصم خاص على اشتراكاتنا.</p>
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://arabot.lovable.app" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 15px 40px; border-radius: 25px; text-decoration: none; font-weight: bold;">
                احصل على العرض الآن
              </a>
            </div>
          </div>
        </div>
      `
    },
    {
      id: "update",
      name: "تحديث جديد",
      subject: "✨ تحديث جديد في المنصة!",
      content: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">✨ تحديث جديد!</h1>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 18px; color: #333;">مرحباً،</p>
            <p style="color: #666; line-height: 1.8;">يسعدنا إعلامك بإضافة ميزات جديدة رائعة إلى المنصة!</p>
            <p style="color: #666; line-height: 1.8;">اكتشف الميزات الجديدة الآن.</p>
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://arabot.lovable.app" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 15px 40px; border-radius: 25px; text-decoration: none; font-weight: bold;">
                اكتشف الآن
              </a>
            </div>
          </div>
        </div>
      `
    }
  ];

  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setEmailContent(template.content);
      setUseTemplate(templateId);
    }
  };

  const sendEmails = async () => {
    const emails = getSelectedEmails();
    if (emails.length === 0) {
      toast.error("يرجى اختيار مستخدم واحد على الأقل");
      return;
    }
    if (!subject || !emailContent) {
      toast.error("يرجى إدخال العنوان والمحتوى");
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: emails,
          subject,
          html: emailContent
        }
      });

      if (error) throw error;

      toast.success(`تم إرسال الإيميل إلى ${emails.length} مستخدم بنجاح`);
      setSelectedUsers([]);
      setSubject("");
      setEmailContent("");
      setUseTemplate(null);
    } catch (error: any) {
      console.error("Error sending emails:", error);
      toast.error("فشل إرسال الإيميلات");
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          إدارة البريد الإلكتروني
        </CardTitle>
        <CardDescription>
          إرسال رسائل بريد إلكتروني للأعضاء المحددين
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Load Users Button */}
        {users.length === 0 && (
          <Button onClick={loadUsers} disabled={loading} className="w-full">
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Users className="h-4 w-4 mr-2" />
            )}
            تحميل قائمة الأعضاء
          </Button>
        )}

        {users.length > 0 && (
          <>
            {/* Templates */}
            <div className="space-y-2">
              <Label>قوالب جاهزة</Label>
              <div className="flex flex-wrap gap-2">
                {templates.map(template => (
                  <Button
                    key={template.id}
                    variant={useTemplate === template.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => applyTemplate(template.id)}
                  >
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Email Form */}
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject">عنوان الإيميل</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="أدخل عنوان الرسالة"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">محتوى الإيميل (HTML)</Label>
                <Textarea
                  id="content"
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  placeholder="أدخل محتوى الرسالة بصيغة HTML"
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>
            </div>

            {/* User Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>اختر الأعضاء ({selectedUsers.length} مختار)</Label>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="بحث..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-9 w-48"
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={selectAllUsers}>
                    {selectedUsers.length === filteredUsers.length ? "إلغاء الكل" : "تحديد الكل"}
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg max-h-64 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>البريد الإلكتروني</TableHead>
                      <TableHead>الاسم</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map(user => (
                      <TableRow 
                        key={user.user_id}
                        className="cursor-pointer"
                        onClick={() => toggleUserSelection(user.user_id)}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedUsers.includes(user.user_id)}
                            onCheckedChange={() => toggleUserSelection(user.user_id)}
                          />
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.nickname || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Send Button */}
            <Button 
              onClick={sendEmails} 
              disabled={sending || selectedUsers.length === 0}
              className="w-full"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              إرسال إلى {selectedUsers.length} عضو
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

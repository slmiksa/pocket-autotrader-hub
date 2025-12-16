import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mail, Send, Users, Search, CheckCircle2, Loader2, UserCheck, UserX, Eye, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface User {
  user_id: string;
  email: string | null;
  nickname?: string | null;
  created_at: string;
  subscription_expires_at: string | null;
}

type FilterType = "all" | "active" | "inactive";

export const EmailManager = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  
  // Email form
  const [subject, setSubject] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const [useTemplate, setUseTemplate] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, email, nickname, created_at, subscription_expires_at")
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

  const isUserActive = (user: User): boolean => {
    if (!user.subscription_expires_at) return false;
    return new Date(user.subscription_expires_at) > new Date();
  };

  const getFilteredByStatus = () => {
    switch (filterType) {
      case "active":
        return users.filter(isUserActive);
      case "inactive":
        return users.filter(user => !isUserActive(user));
      default:
        return users;
    }
  };

  const filteredUsers = getFilteredByStatus().filter(user => 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.nickname?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = users.filter(isUserActive).length;
  const inactiveCount = users.filter(user => !isUserActive(user)).length;

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
      subject: "مرحباً بك في TIFUE SA! 🎉",
      content: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; border-radius: 15px 15px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">مرحباً بك في TIFUE SA! 🎉</h1>
          </div>
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 15px 15px;">
            <p style="font-size: 20px; color: #333;">أهلاً بك،</p>
            <p style="color: #555; line-height: 1.8;">شكراً لانضمامك إلى منصة TIFUE SA! نحن سعداء بوجودك معنا.</p>
            <p style="color: #555; line-height: 1.8;"><strong>استمتع بجميع مميزات المنصة:</strong></p>
            <div style="background: #f0f9ff; padding: 20px; border-radius: 12px; margin: 20px 0; border-right: 4px solid #0ea5e9;">
              <p style="color: #0369a1; font-weight: bold; margin: 0 0 15px 0;">📋 الميزات الأساسية:</p>
              <ul style="color: #555; line-height: 2; margin: 0; padding-right: 20px;">
                <li>✅ توصيات تداول مباشرة</li>
                <li>✅ سجل خاص لإحصاء صفقاتك</li>
                <li>✅ دعم فني متواصل</li>
              </ul>
            </div>
            <div style="background: #fef3c7; padding: 20px; border-radius: 12px; margin: 20px 0; border-right: 4px solid #f59e0b;">
              <p style="color: #92400e; font-weight: bold; margin: 0 0 15px 0;">📊 محلل العرض والطلب:</p>
              <ul style="color: #555; line-height: 2; margin: 0; padding-right: 20px;">
                <li>⭐ تحديد مناطق العرض والطلب</li>
                <li>⭐ إعداد صفقات مقترحة آلياً</li>
                <li>⭐ تحليل قوة المناطق</li>
              </ul>
            </div>
            <div style="background: #ecfdf5; padding: 20px; border-radius: 12px; margin: 20px 0; border-right: 4px solid #10b981;">
              <p style="color: #065f46; font-weight: bold; margin: 0 0 15px 0;">📈 تحليل الشارت المباشر:</p>
              <ul style="color: #555; line-height: 2; margin: 0; padding-right: 20px;">
                <li>⭐ شارت TradingView مباشر</li>
                <li>⭐ تحليل بالذكاء الاصطناعي</li>
                <li>⭐ توصيات CALL/PUT من الشارت</li>
              </ul>
            </div>
          </div>
          <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA. جميع الحقوق محفوظة.</p>
        </div>
      `
    },
    {
      id: "activation",
      name: "تفعيل الباقة",
      subject: "✅ تم تفعيل حسابك - مرحباً بك في TIFUE SA!",
      content: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; border-radius: 15px 15px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">تم تفعيل حسابك بنجاح! ✅</h1>
          </div>
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 15px 15px;">
            <p style="font-size: 20px; color: #333;">مبارك! 🎊</p>
            <p style="color: #555; line-height: 1.8;">تم تفعيل باقتك بنجاح! يمكنك الآن الاستمتاع بجميع الخدمات.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://tifue.com" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 15px 40px; border-radius: 25px; text-decoration: none; font-weight: bold;">ابدأ التداول الآن</a>
            </div>
          </div>
          <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA. جميع الحقوق محفوظة.</p>
        </div>
      `
    },
    {
      id: "promo",
      name: "عرض خاص",
      subject: "🔥 عرض حصري لك!",
      content: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; border-radius: 15px 15px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🔥 عرض خاص لك!</h1>
          </div>
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 15px 15px;">
            <p style="font-size: 18px; color: #333;">عميلنا العزيز،</p>
            <p style="color: #555; line-height: 1.8;">لدينا عرض حصري لك! احصل على خصم خاص على اشتراكاتنا.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://tifue.com/subscription" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 15px 40px; border-radius: 25px; text-decoration: none; font-weight: bold;">احصل على العرض الآن</a>
            </div>
          </div>
          <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA. جميع الحقوق محفوظة.</p>
        </div>
      `
    },
    {
      id: "update",
      name: "تحديث جديد",
      subject: "✨ تحديث جديد في المنصة!",
      content: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; border-radius: 15px 15px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">✨ تحديث جديد!</h1>
          </div>
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 15px 15px;">
            <p style="font-size: 18px; color: #333;">مرحباً،</p>
            <p style="color: #555; line-height: 1.8;">يسعدنا إعلامك بإضافة ميزات جديدة رائعة إلى المنصة!</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://tifue.com" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; border-radius: 25px; text-decoration: none; font-weight: bold;">اكتشف الآن</a>
            </div>
          </div>
          <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA. جميع الحقوق محفوظة.</p>
        </div>
      `
    },
    {
      id: "reminder",
      name: "تذكير التجديد",
      subject: "⏰ تذكير: اشتراكك ينتهي قريباً",
      content: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 30px; border-radius: 15px 15px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">⏰ اشتراكك ينتهي قريباً!</h1>
          </div>
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 15px 15px;">
            <p style="font-size: 18px; color: #333;">عميلنا العزيز،</p>
            <p style="color: #555; line-height: 1.8;">نود تذكيرك بأن اشتراكك في TIFUE SA سينتهي قريباً.</p>
            <div style="background: #fef2f2; padding: 20px; border-radius: 12px; margin: 20px 0; border-right: 4px solid #ef4444;">
              <p style="color: #991b1b; font-weight: bold; margin: 0;">⚠️ لا تفوّت توصياتنا الحصرية!</p>
            </div>
            <p style="color: #555; line-height: 1.8;">جدد اشتراكك الآن للاستمرار في الاستفادة من:</p>
            <ul style="color: #555; line-height: 2; padding-right: 20px;">
              <li>📊 توصيات التداول المباشرة</li>
              <li>🤖 تحليل الذكاء الاصطناعي</li>
              <li>👑 توصيات المحترفين</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://tifue.com" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 15px 40px; border-radius: 25px; text-decoration: none; font-weight: bold;">جدد الآن</a>
            </div>
          </div>
          <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA. جميع الحقوق محفوظة.</p>
        </div>
      `
    },
    {
      id: "signal",
      name: "توصية جديدة",
      subject: "🎯 توصية تداول جديدة متاحة الآن!",
      content: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 40px 30px; border-radius: 15px 15px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎯 توصية جديدة!</h1>
          </div>
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 15px 15px;">
            <p style="font-size: 18px; color: #333;">مرحباً،</p>
            <p style="color: #555; line-height: 1.8;">لدينا توصية تداول جديدة متاحة الآن على المنصة!</p>
            <div style="background: #eff6ff; padding: 20px; border-radius: 12px; margin: 20px 0; border-right: 4px solid #2563eb;">
              <p style="color: #1e40af; font-weight: bold; margin: 0 0 10px 0;">📈 تفاصيل التوصية:</p>
              <p style="color: #555; margin: 0;">سارع بالدخول إلى المنصة لمشاهدة التفاصيل الكاملة!</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://tifue.com" style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 15px 40px; border-radius: 25px; text-decoration: none; font-weight: bold;">شاهد التوصية</a>
            </div>
          </div>
          <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA. جميع الحقوق محفوظة.</p>
        </div>
      `
    },
    {
      id: "maintenance",
      name: "صيانة مجدولة",
      subject: "🔧 إشعار صيانة مجدولة",
      content: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); padding: 40px 30px; border-radius: 15px 15px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🔧 صيانة مجدولة</h1>
          </div>
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 15px 15px;">
            <p style="font-size: 18px; color: #333;">عميلنا العزيز،</p>
            <p style="color: #555; line-height: 1.8;">نود إعلامك بأننا سنقوم بإجراء صيانة مجدولة للمنصة لتحسين الأداء.</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 12px; margin: 20px 0; border-right: 4px solid #6b7280;">
              <p style="color: #374151; font-weight: bold; margin: 0 0 10px 0;">📅 موعد الصيانة:</p>
              <p style="color: #555; margin: 0;">[سيتم تحديد الموعد]</p>
            </div>
            <p style="color: #555; line-height: 1.8;">نعتذر عن أي إزعاج قد يحصل. شكراً لتفهمكم!</p>
          </div>
          <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA. جميع الحقوق محفوظة.</p>
        </div>
      `
    },
    {
      id: "tips",
      name: "نصائح تداول",
      subject: "💡 نصائح ذهبية للتداول الناجح",
      content: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%); padding: 40px 30px; border-radius: 15px 15px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">💡 نصائح ذهبية للتداول</h1>
          </div>
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 15px 15px;">
            <p style="font-size: 18px; color: #333;">مرحباً،</p>
            <p style="color: #555; line-height: 1.8;">إليك بعض النصائح الذهبية لتحسين أدائك في التداول:</p>
            <div style="background: #fefce8; padding: 20px; border-radius: 12px; margin: 20px 0; border-right: 4px solid #eab308;">
              <ul style="color: #555; line-height: 2.2; margin: 0; padding-right: 20px;">
                <li>📌 <strong>إدارة رأس المال:</strong> لا تخاطر بأكثر من 2% في صفقة واحدة</li>
                <li>📌 <strong>الصبر:</strong> انتظر الفرص المناسبة ولا تتسرع</li>
                <li>📌 <strong>التحليل:</strong> اعتمد على التحليل الفني والأساسي معاً</li>
                <li>📌 <strong>السيطرة:</strong> تحكم في عواطفك أثناء التداول</li>
                <li>📌 <strong>التعلم:</strong> راجع صفقاتك وتعلم من أخطائك</li>
              </ul>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://tifue.com" style="background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%); color: white; padding: 15px 40px; border-radius: 25px; text-decoration: none; font-weight: bold;">ابدأ التداول</a>
            </div>
          </div>
          <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA. جميع الحقوق محفوظة.</p>
        </div>
      `
    },
    {
      id: "feedback",
      name: "طلب رأيك",
      subject: "📝 نريد سماع رأيك!",
      content: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 40px 30px; border-radius: 15px 15px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">📝 نريد سماع رأيك!</h1>
          </div>
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 15px 15px;">
            <p style="font-size: 18px; color: #333;">عميلنا العزيز،</p>
            <p style="color: #555; line-height: 1.8;">رأيك يهمنا! نسعى دائماً لتحسين خدماتنا لتلبية احتياجاتك.</p>
            <div style="background: #f5f3ff; padding: 20px; border-radius: 12px; margin: 20px 0; border-right: 4px solid #8b5cf6;">
              <p style="color: #5b21b6; font-weight: bold; margin: 0;">🌟 شاركنا تجربتك:</p>
              <p style="color: #555; margin: 10px 0 0 0;">ما الذي يعجبك في المنصة؟ وما الذي يمكننا تحسينه؟</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://tifue.com" style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 15px 40px; border-radius: 25px; text-decoration: none; font-weight: bold;">شارك رأيك</a>
            </div>
          </div>
          <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA. جميع الحقوق محفوظة.</p>
        </div>
      `
    },
    {
      id: "referral",
      name: "دعوة صديق",
      subject: "🎁 ادعُ أصدقاءك واربح!",
      content: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); padding: 40px 30px; border-radius: 15px 15px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎁 ادعُ أصدقاءك واربح!</h1>
          </div>
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 15px 15px;">
            <p style="font-size: 18px; color: #333;">مرحباً،</p>
            <p style="color: #555; line-height: 1.8;">شارك تجربتك مع أصدقائك واحصل على مكافآت حصرية!</p>
            <div style="background: #fdf2f8; padding: 20px; border-radius: 12px; margin: 20px 0; border-right: 4px solid #ec4899;">
              <p style="color: #9d174d; font-weight: bold; margin: 0 0 10px 0;">🎯 كيف يعمل البرنامج:</p>
              <ul style="color: #555; line-height: 2; margin: 0; padding-right: 20px;">
                <li>1️⃣ شارك رابط الدعوة مع أصدقائك</li>
                <li>2️⃣ عند تسجيلهم واشتراكهم</li>
                <li>3️⃣ احصل على مكافأتك!</li>
              </ul>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://tifue.com" style="background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); color: white; padding: 15px 40px; border-radius: 25px; text-decoration: none; font-weight: bold;">ابدأ الدعوة</a>
            </div>
          </div>
          <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA. جميع الحقوق محفوظة.</p>
        </div>
      `
    },
    {
      id: "holiday",
      name: "تهنئة",
      subject: "🌙 تهنئة بالمناسبة السعيدة!",
      content: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); padding: 40px 30px; border-radius: 15px 15px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🌙 تهنئة من TIFUE SA</h1>
          </div>
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 15px 15px;">
            <p style="font-size: 18px; color: #333;">عميلنا العزيز،</p>
            <p style="color: #555; line-height: 1.8;">بمناسبة هذه المناسبة السعيدة، نتقدم لكم بأطيب التهاني والتمنيات.</p>
            <div style="background: #f0fdfa; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
              <p style="color: #0f766e; font-size: 24px; font-weight: bold; margin: 0;">🎉 كل عام وأنتم بخير 🎉</p>
            </div>
            <p style="color: #555; line-height: 1.8; text-align: center;">نتمنى لكم دوام التوفيق والنجاح في تداولاتكم!</p>
          </div>
          <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA. جميع الحقوق محفوظة.</p>
        </div>
      `
    },
    {
      id: "security",
      name: "تنبيه أمني",
      subject: "🔐 تنبيه أمني مهم",
      content: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 40px 30px; border-radius: 15px 15px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🔐 تنبيه أمني مهم</h1>
          </div>
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 15px 15px;">
            <p style="font-size: 18px; color: #333;">عميلنا العزيز،</p>
            <p style="color: #555; line-height: 1.8;">نود تذكيرك ببعض النصائح الأمنية المهمة لحماية حسابك:</p>
            <div style="background: #fef2f2; padding: 20px; border-radius: 12px; margin: 20px 0; border-right: 4px solid #dc2626;">
              <ul style="color: #555; line-height: 2.2; margin: 0; padding-right: 20px;">
                <li>🔒 لا تشارك كلمة المرور مع أي شخص</li>
                <li>🔒 استخدم كلمة مرور قوية ومختلفة</li>
                <li>🔒 تأكد من تسجيل الخروج بعد الانتهاء</li>
                <li>🔒 احذر من الرسائل المشبوهة</li>
              </ul>
            </div>
            <p style="color: #555; line-height: 1.8;">إذا لاحظت أي نشاط مشبوه، تواصل معنا فوراً.</p>
          </div>
          <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA. جميع الحقوق محفوظة.</p>
        </div>
      `
    },
    {
      id: "comeback",
      name: "نفتقدك",
      subject: "😢 نفتقدك! عد إلينا",
      content: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 40px 30px; border-radius: 15px 15px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">😢 نفتقدك!</h1>
          </div>
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 15px 15px;">
            <p style="font-size: 18px; color: #333;">عميلنا العزيز،</p>
            <p style="color: #555; line-height: 1.8;">لاحظنا غيابك عن المنصة ونفتقد وجودك معنا!</p>
            <div style="background: #eef2ff; padding: 20px; border-radius: 12px; margin: 20px 0; border-right: 4px solid #6366f1;">
              <p style="color: #3730a3; font-weight: bold; margin: 0 0 10px 0;">🎁 عرض خاص للعودة:</p>
              <p style="color: #555; margin: 0;">جدد اشتراكك الآن واحصل على خصم حصري!</p>
            </div>
            <p style="color: #555; line-height: 1.8;">نتطلع لرؤيتك مجدداً على المنصة!</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://tifue.com" style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; padding: 15px 40px; border-radius: 25px; text-decoration: none; font-weight: bold;">عُد الآن</a>
            </div>
          </div>
          <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA. جميع الحقوق محفوظة.</p>
        </div>
      `
    },
    {
      id: "achievement",
      name: "إنجاز جديد",
      subject: "🏆 مبارك! حققت إنجازاً جديداً",
      content: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; border-radius: 15px 15px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🏆 مبارك!</h1>
          </div>
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 15px 15px;">
            <p style="font-size: 18px; color: #333;">عميلنا المميز،</p>
            <p style="color: #555; line-height: 1.8;">يسعدنا إبلاغك بأنك حققت إنجازاً جديداً على المنصة!</p>
            <div style="background: #fffbeb; padding: 30px; border-radius: 12px; margin: 20px 0; text-align: center;">
              <p style="font-size: 48px; margin: 0;">🏆</p>
              <p style="color: #92400e; font-weight: bold; font-size: 20px; margin: 10px 0 0 0;">متداول متميز!</p>
            </div>
            <p style="color: #555; line-height: 1.8; text-align: center;">استمر في التقدم والنجاح!</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://tifue.com" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 15px 40px; border-radius: 25px; text-decoration: none; font-weight: bold;">شاهد إنجازاتك</a>
            </div>
          </div>
          <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA. جميع الحقوق محفوظة.</p>
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

    // Avoid sending huge batches in a single request (providers often limit recipients per email)
    const MAX_RECIPIENTS_PER_BATCH = 25;
    const batches: string[][] = [];
    for (let i = 0; i < emails.length; i += MAX_RECIPIENTS_PER_BATCH) {
      batches.push(emails.slice(i, i + MAX_RECIPIENTS_PER_BATCH));
    }

    setSending(true);
    try {
      let sentTotal = 0;

      for (const batch of batches) {
        const { error } = await supabase.functions.invoke("send-email", {
          body: {
            to: batch,
            subject,
            html: emailContent,
          },
        });

        if (error) {
          throw error;
        }

        sentTotal += batch.length;
      }

      toast.success(`تم إرسال الإيميل إلى ${sentTotal} مستخدم بنجاح`);
      setSelectedUsers([]);
      setSubject("");
      setEmailContent("");
      setUseTemplate(null);
    } catch (error: any) {
      console.error("Error sending emails:", error);
      toast.error(error?.message || "فشل إرسال الإيميلات");
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="content">محتوى الإيميل (HTML)</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(true)}
                    disabled={!emailContent}
                    className="gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    معاينة
                  </Button>
                </div>
                <Textarea
                  id="content"
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  placeholder="أدخل محتوى الرسالة بصيغة HTML"
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>
            </div>

            {/* Preview Dialog */}
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    معاينة البريد الإلكتروني
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
                  {/* Email Header Preview */}
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold text-muted-foreground">من:</span>
                      <span>TIFUE SA &lt;noreply@tifue.com&gt;</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold text-muted-foreground">إلى:</span>
                      <span>{selectedUsers.length > 0 ? `${selectedUsers.length} مستلم` : "لم يتم تحديد مستلمين"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold text-muted-foreground">الموضوع:</span>
                      <span className="font-medium">{subject || "بدون عنوان"}</span>
                    </div>
                  </div>
                  
                  {/* Email Body Preview */}
                  <div className="flex-1 border rounded-lg overflow-hidden bg-white">
                    <div className="bg-muted/30 px-4 py-2 border-b text-xs text-muted-foreground">
                      كيف سيظهر البريد للمستلم
                    </div>
                    <div className="overflow-auto h-[400px]">
                      {emailContent ? (
                        <iframe
                          srcDoc={emailContent}
                          className="w-full h-full border-0"
                          title="Email Preview"
                          sandbox="allow-same-origin"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          لا يوجد محتوى للمعاينة
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 justify-end pt-2">
                    <Button variant="outline" onClick={() => setShowPreview(false)}>
                      إغلاق
                    </Button>
                    <Button
                      onClick={() => {
                        setShowPreview(false);
                        if (selectedUsers.length > 0) {
                          sendEmails();
                        }
                      }}
                      disabled={selectedUsers.length === 0 || !subject || !emailContent}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      إرسال الآن
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* User Selection */}
            <div className="space-y-4">
              <div className="flex flex-col gap-4">
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
                      {selectedUsers.length === filteredUsers.length && filteredUsers.length > 0 ? "إلغاء الكل" : "تحديد الكل"}
                    </Button>
                  </div>
                </div>

                {/* Filter Tabs */}
                <Tabs value={filterType} onValueChange={(v) => { setFilterType(v as FilterType); setSelectedUsers([]); }}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="all" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      الكل ({users.length})
                    </TabsTrigger>
                    <TabsTrigger value="active" className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      مفعّل ({activeCount})
                    </TabsTrigger>
                    <TabsTrigger value="inactive" className="flex items-center gap-2">
                      <UserX className="h-4 w-4" />
                      غير مفعّل ({inactiveCount})
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="border rounded-lg max-h-64 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>البريد الإلكتروني</TableHead>
                      <TableHead>الاسم</TableHead>
                      <TableHead>الحالة</TableHead>
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
                        <TableCell>
                          {isUserActive(user) ? (
                            <Badge variant="default" className="bg-green-600">مفعّل</Badge>
                          ) : (
                            <Badge variant="secondary">غير مفعّل</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredUsers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          لا يوجد أعضاء
                        </TableCell>
                      </TableRow>
                    )}
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

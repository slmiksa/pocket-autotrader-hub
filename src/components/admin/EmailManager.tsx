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
                <li>✅ توصيات تداول مباشرة من تيليجرام</li>
                <li>✅ تحليل الشارت بالذكاء الاصطناعي</li>
                <li>✅ محلل العرض والطلب الذكي</li>
                <li>✅ التقويم الاقتصادي مع التنبيهات</li>
                <li>✅ يوميات التداول الاحترافية</li>
              </ul>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://tifue.com" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; border-radius: 25px; text-decoration: none; font-weight: bold;">استكشف المنصة الآن</a>
            </div>
          </div>
          <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA. جميع الحقوق محفوظة.</p>
        </div>
      `
    },
    {
      id: "ai-analysis",
      name: "🤖 تحليل الذكاء الاصطناعي",
      subject: "🤖 اكتشف قوة تحليل الشارت بالذكاء الاصطناعي!",
      content: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); padding: 40px 30px; border-radius: 15px 15px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🤖 تحليل الشارت بالذكاء الاصطناعي</h1>
          </div>
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 15px 15px;">
            <p style="font-size: 18px; color: #333;">عميلنا العزيز،</p>
            <p style="color: #555; line-height: 1.8;">هل تعلم أن منصة TIFUE SA تمتلك أحدث تقنيات الذكاء الاصطناعي لتحليل الشارتات؟</p>
            <div style="background: #f5f3ff; padding: 25px; border-radius: 12px; margin: 20px 0; border-right: 4px solid #8b5cf6;">
              <p style="color: #5b21b6; font-weight: bold; margin: 0 0 15px 0; font-size: 18px;">✨ ما الذي يمكن للذكاء الاصطناعي فعله؟</p>
              <ul style="color: #555; line-height: 2.2; margin: 0; padding-right: 20px;">
                <li>📸 <strong>رفع صورة الشارت:</strong> ارفع أي صورة شارت واحصل على تحليل فوري</li>
                <li>🔍 <strong>تحديد الأنماط:</strong> يكتشف الأنماط الفنية تلقائياً (رأس وكتفين، مثلثات، قنوات...)</li>
                <li>📊 <strong>مستويات الدعم والمقاومة:</strong> يحدد أهم المستويات بدقة عالية</li>
                <li>🎯 <strong>توصيات CALL/PUT:</strong> يعطيك توصية واضحة مع نسبة الثقة</li>
                <li>⏰ <strong>أفضل وقت للدخول:</strong> يحدد التوقيت المثالي للصفقة</li>
              </ul>
            </div>
            <div style="background: #ecfdf5; padding: 20px; border-radius: 12px; margin: 20px 0;">
              <p style="color: #065f46; text-align: center; font-weight: bold; margin: 0;">💡 جرب الآن: ارفع صورة شارت واحصل على تحليل احترافي خلال ثوانٍ!</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://tifue.com/image-analysis" style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; padding: 15px 40px; border-radius: 25px; text-decoration: none; font-weight: bold;">جرب التحليل الذكي</a>
            </div>
          </div>
          <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA. جميع الحقوق محفوظة.</p>
        </div>
      `
    },
    {
      id: "supply-demand",
      name: "📊 محلل العرض والطلب",
      subject: "📊 اكتشف مناطق العرض والطلب باحترافية!",
      content: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; border-radius: 15px 15px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">📊 محلل العرض والطلب</h1>
          </div>
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 15px 15px;">
            <p style="font-size: 18px; color: #333;">عميلنا العزيز،</p>
            <p style="color: #555; line-height: 1.8;">تعرف على أقوى أداة لتحديد مناطق العرض والطلب في المنصة!</p>
            <div style="background: #fffbeb; padding: 25px; border-radius: 12px; margin: 20px 0; border-right: 4px solid #f59e0b;">
              <p style="color: #92400e; font-weight: bold; margin: 0 0 15px 0; font-size: 18px;">🎯 مميزات المحلل:</p>
              <ul style="color: #555; line-height: 2.2; margin: 0; padding-right: 20px;">
                <li>🔴 <strong>مناطق العرض (البيع):</strong> يحدد أفضل مناطق البيع بدقة</li>
                <li>🟢 <strong>مناطق الطلب (الشراء):</strong> يكتشف مناطق الشراء القوية</li>
                <li>💪 <strong>قوة المنطقة:</strong> يقيّم قوة كل منطقة من 1-10</li>
                <li>📈 <strong>صفقات مقترحة:</strong> يعطيك صفقات جاهزة مع الأهداف ووقف الخسارة</li>
                <li>🖼️ <strong>تحليل بالصورة:</strong> ارفع صورة الشارت واحصل على التحليل</li>
              </ul>
            </div>
            <div style="background: #fef3c7; padding: 20px; border-radius: 12px; margin: 20px 0;">
              <p style="color: #92400e; text-align: center; font-weight: bold; margin: 0;">⚡ نصيحة: ادمج تحليل العرض والطلب مع التحليل الفني لنتائج أفضل!</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://tifue.com/supply-demand" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 15px 40px; border-radius: 25px; text-decoration: none; font-weight: bold;">جرب المحلل الآن</a>
            </div>
          </div>
          <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA. جميع الحقوق محفوظة.</p>
        </div>
      `
    },
    {
      id: "live-signals",
      name: "🎯 التوصيات المباشرة",
      subject: "🎯 توصيات تداول مباشرة من تيليجرام!",
      content: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; border-radius: 15px 15px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎯 توصيات التداول المباشرة</h1>
          </div>
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 15px 15px;">
            <p style="font-size: 18px; color: #333;">عميلنا العزيز،</p>
            <p style="color: #555; line-height: 1.8;">احصل على توصيات التداول فور صدورها من قناة تيليجرام مباشرة على المنصة!</p>
            <div style="background: #ecfdf5; padding: 25px; border-radius: 12px; margin: 20px 0; border-right: 4px solid #10b981;">
              <p style="color: #065f46; font-weight: bold; margin: 0 0 15px 0; font-size: 18px;">📡 مميزات التوصيات:</p>
              <ul style="color: #555; line-height: 2.2; margin: 0; padding-right: 20px;">
                <li>⚡ <strong>توصيات فورية:</strong> تصلك التوصيات لحظة صدورها</li>
                <li>🔔 <strong>تنبيهات صوتية:</strong> تنبيه صوتي عند وصول توصية جديدة</li>
                <li>📊 <strong>سجل النتائج:</strong> تتبع نتائج كل توصية (ربح/خسارة)</li>
                <li>📈 <strong>إحصائيات الأداء:</strong> نسبة النجاح ومعدل الربح</li>
                <li>🤖 <strong>تنفيذ آلي:</strong> إمكانية التنفيذ الآلي على بوكت أوبشن</li>
              </ul>
            </div>
            <div style="display: flex; gap: 10px; margin: 20px 0;">
              <div style="flex: 1; background: #dcfce7; padding: 15px; border-radius: 10px; text-align: center;">
                <p style="font-size: 24px; margin: 0; color: #16a34a;">✅</p>
                <p style="color: #166534; font-weight: bold; margin: 5px 0 0 0;">WIN</p>
              </div>
              <div style="flex: 1; background: #fee2e2; padding: 15px; border-radius: 10px; text-align: center;">
                <p style="font-size: 24px; margin: 0; color: #dc2626;">❌</p>
                <p style="color: #991b1b; font-weight: bold; margin: 5px 0 0 0;">LOSS</p>
              </div>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://tifue.com" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 15px 40px; border-radius: 25px; text-decoration: none; font-weight: bold;">شاهد التوصيات</a>
            </div>
          </div>
          <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA. جميع الحقوق محفوظة.</p>
        </div>
      `
    },
    {
      id: "economic-calendar",
      name: "📅 التقويم الاقتصادي",
      subject: "📅 لا تفوت الأخبار الاقتصادية المهمة!",
      content: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 40px 30px; border-radius: 15px 15px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">📅 التقويم الاقتصادي</h1>
          </div>
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 15px 15px;">
            <p style="font-size: 18px; color: #333;">عميلنا العزيز،</p>
            <p style="color: #555; line-height: 1.8;">تابع جميع الأحداث الاقتصادية المهمة التي تؤثر على الأسواق!</p>
            <div style="background: #eff6ff; padding: 25px; border-radius: 12px; margin: 20px 0; border-right: 4px solid #2563eb;">
              <p style="color: #1e40af; font-weight: bold; margin: 0 0 15px 0; font-size: 18px;">📊 مميزات التقويم:</p>
              <ul style="color: #555; line-height: 2.2; margin: 0; padding-right: 20px;">
                <li>🌍 <strong>تغطية عالمية:</strong> أحداث من جميع الدول الكبرى</li>
                <li>⚠️ <strong>تصنيف الأهمية:</strong> عالي - متوسط - منخفض التأثير</li>
                <li>🔔 <strong>تنبيهات مسبقة:</strong> تنبيه قبل الحدث بالوقت الذي تختاره</li>
                <li>📈 <strong>القيم المتوقعة:</strong> التوقعات vs القيمة السابقة</li>
                <li>🇸🇦 <strong>عربي بالكامل:</strong> جميع الأحداث مترجمة للعربية</li>
              </ul>
            </div>
            <div style="background: #dbeafe; padding: 20px; border-radius: 12px; margin: 20px 0;">
              <p style="color: #1e40af; text-align: center; font-weight: bold; margin: 0;">💡 نصيحة: تجنب التداول أثناء الأخبار عالية التأثير!</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://tifue.com/economic-calendar" style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 15px 40px; border-radius: 25px; text-decoration: none; font-weight: bold;">شاهد التقويم</a>
            </div>
          </div>
          <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA. جميع الحقوق محفوظة.</p>
        </div>
      `
    },
    {
      id: "price-alerts",
      name: "🔔 تنبيهات الأسعار",
      subject: "🔔 لا تفوت أي فرصة مع تنبيهات الأسعار!",
      content: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); padding: 40px 30px; border-radius: 15px 15px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🔔 تنبيهات الأسعار الذكية</h1>
          </div>
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 15px 15px;">
            <p style="font-size: 18px; color: #333;">عميلنا العزيز،</p>
            <p style="color: #555; line-height: 1.8;">أنشئ تنبيهات أسعار مخصصة ولا تفوت أي فرصة تداول!</p>
            <div style="background: #fdf2f8; padding: 25px; border-radius: 12px; margin: 20px 0; border-right: 4px solid #ec4899;">
              <p style="color: #9d174d; font-weight: bold; margin: 0 0 15px 0; font-size: 18px;">⚡ مميزات التنبيهات:</p>
              <ul style="color: #555; line-height: 2.2; margin: 0; padding-right: 20px;">
                <li>📈 <strong>تنبيه عند الصعود:</strong> عندما يصل السعر لمستوى معين</li>
                <li>📉 <strong>تنبيه عند الهبوط:</strong> عند كسر مستوى دعم</li>
                <li>🔊 <strong>تنبيه صوتي:</strong> صوت تنبيه واضح</li>
                <li>📱 <strong>إشعارات فورية:</strong> تنبيهات على المتصفح والهاتف</li>
                <li>💹 <strong>جميع الأزواج:</strong> فوركس، عملات رقمية، مؤشرات</li>
              </ul>
            </div>
            <div style="background: #fce7f3; padding: 20px; border-radius: 12px; margin: 20px 0;">
              <p style="color: #9d174d; text-align: center; font-weight: bold; margin: 0;">🎯 حدد مستويات الدخول والخروج واترك المنصة تنبهك!</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://tifue.com/markets" style="background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); color: white; padding: 15px 40px; border-radius: 25px; text-decoration: none; font-weight: bold;">أنشئ تنبيه الآن</a>
            </div>
          </div>
          <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA. جميع الحقوق محفوظة.</p>
        </div>
      `
    },
    {
      id: "pro-signals",
      name: "👑 توصيات المحترفين",
      subject: "👑 توصيات المحترفين - دقة عالية!",
      content: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%); padding: 40px 30px; border-radius: 15px 15px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">👑 توصيات المحترفين</h1>
          </div>
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 15px 15px;">
            <p style="font-size: 18px; color: #333;">عميلنا العزيز،</p>
            <p style="color: #555; line-height: 1.8;">احصل على توصيات حصرية من فريق المحللين المحترفين!</p>
            <div style="background: #fefce8; padding: 25px; border-radius: 12px; margin: 20px 0; border-right: 4px solid #eab308;">
              <p style="color: #854d0e; font-weight: bold; margin: 0 0 15px 0; font-size: 18px;">🏆 ما يميز توصيات المحترفين:</p>
              <ul style="color: #555; line-height: 2.2; margin: 0; padding-right: 20px;">
                <li>🎯 <strong>دقة عالية:</strong> تحليل معمق من خبراء متخصصين</li>
                <li>📝 <strong>تحليل مفصل:</strong> شرح كامل لسبب التوصية</li>
                <li>🎚️ <strong>مستوى الثقة:</strong> نسبة ثقة لكل توصية</li>
                <li>⏱️ <strong>الإطار الزمني:</strong> M1, M5, M15, H1 وأكثر</li>
                <li>🎯 <strong>الأهداف:</strong> سعر الدخول والهدف ووقف الخسارة</li>
                <li>📊 <strong>سجل النتائج:</strong> تتبع نتائج كل توصية</li>
              </ul>
            </div>
            <div style="display: flex; gap: 10px; margin: 20px 0;">
              <div style="flex: 1; background: #fef9c3; padding: 15px; border-radius: 10px; text-align: center;">
                <p style="font-size: 28px; margin: 0;">🏆</p>
                <p style="color: #854d0e; font-weight: bold; margin: 5px 0 0 0;">خبراء معتمدون</p>
              </div>
              <div style="flex: 1; background: #fef9c3; padding: 15px; border-radius: 10px; text-align: center;">
                <p style="font-size: 28px; margin: 0;">📈</p>
                <p style="color: #854d0e; font-weight: bold; margin: 5px 0 0 0;">نسبة نجاح عالية</p>
              </div>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://tifue.com/professional-signals" style="background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%); color: white; padding: 15px 40px; border-radius: 25px; text-decoration: none; font-weight: bold;">شاهد التوصيات</a>
            </div>
          </div>
          <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA. جميع الحقوق محفوظة.</p>
        </div>
      `
    },
    {
      id: "trading-journal",
      name: "📓 يوميات التداول",
      subject: "📓 سجّل صفقاتك وتابع تقدمك!",
      content: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); padding: 40px 30px; border-radius: 15px 15px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">📓 يوميات التداول الاحترافية</h1>
          </div>
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 15px 15px;">
            <p style="font-size: 18px; color: #333;">عميلنا العزيز،</p>
            <p style="color: #555; line-height: 1.8;">يوميات التداول هي سر نجاح المحترفين - ابدأ تسجيل صفقاتك اليوم!</p>
            <div style="background: #f0fdfa; padding: 25px; border-radius: 12px; margin: 20px 0; border-right: 4px solid #14b8a6;">
              <p style="color: #0f766e; font-weight: bold; margin: 0 0 15px 0; font-size: 18px;">📊 مميزات اليوميات:</p>
              <ul style="color: #555; line-height: 2.2; margin: 0; padding-right: 20px;">
                <li>📝 <strong>تسجيل الصفقات:</strong> سجّل كل صفقة بالتفاصيل</li>
                <li>🎯 <strong>الهدف اليومي:</strong> حدد هدفك اليومي وتابع تحقيقه</li>
                <li>📈 <strong>إحصائيات شاملة:</strong> نسبة النجاح، متوسط الربح/الخسارة</li>
                <li>💡 <strong>الدروس المستفادة:</strong> سجّل ملاحظاتك وتعلم من أخطائك</li>
                <li>📅 <strong>تقرير شهري:</strong> ملخص أدائك الشهري</li>
              </ul>
            </div>
            <div style="background: #ccfbf1; padding: 20px; border-radius: 12px; margin: 20px 0;">
              <p style="color: #0f766e; text-align: center; font-weight: bold; margin: 0;">💡 "ما لا يمكن قياسه، لا يمكن تحسينه" - سجّل صفقاتك وحسّن أداءك!</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://tifue.com" style="background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); color: white; padding: 15px 40px; border-radius: 25px; text-decoration: none; font-weight: bold;">ابدأ التسجيل</a>
            </div>
          </div>
          <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA. جميع الحقوق محفوظة.</p>
        </div>
      `
    },
    {
      id: "live-chart",
      name: "📈 الشارت المباشر",
      subject: "📈 شارت TradingView احترافي مجاني!",
      content: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 40px 30px; border-radius: 15px 15px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">📈 شارت TradingView المباشر</h1>
          </div>
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 15px 15px;">
            <p style="font-size: 18px; color: #333;">عميلنا العزيز،</p>
            <p style="color: #555; line-height: 1.8;">استمتع بشارت TradingView الاحترافي مدمج في المنصة مع تحليل ذكي!</p>
            <div style="background: #eef2ff; padding: 25px; border-radius: 12px; margin: 20px 0; border-right: 4px solid #6366f1;">
              <p style="color: #3730a3; font-weight: bold; margin: 0 0 15px 0; font-size: 18px;">✨ مميزات الشارت:</p>
              <ul style="color: #555; line-height: 2.2; margin: 0; padding-right: 20px;">
                <li>📊 <strong>شارت TradingView:</strong> أفضل منصة تحليل في العالم</li>
                <li>🔧 <strong>أدوات الرسم:</strong> خطوط اتجاه، فيبوناتشي، وأكثر</li>
                <li>📐 <strong>المؤشرات الفنية:</strong> RSI, MACD, Bollinger وغيرها</li>
                <li>⏱️ <strong>جميع الفريمات:</strong> من 1 دقيقة إلى شهري</li>
                <li>🤖 <strong>تحليل بالذكاء الاصطناعي:</strong> احصل على تحليل فوري</li>
                <li>🖼️ <strong>حفظ الصورة:</strong> احفظ الشارت كصورة للمشاركة</li>
              </ul>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://tifue.com/live-chart" style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; padding: 15px 40px; border-radius: 25px; text-decoration: none; font-weight: bold;">افتح الشارت</a>
            </div>
          </div>
          <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA. جميع الحقوق محفوظة.</p>
        </div>
      `
    },
    {
      id: "markets",
      name: "💹 الأسواق والأسعار",
      subject: "💹 تابع أسعار الأسواق لحظة بلحظة!",
      content: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 40px 30px; border-radius: 15px 15px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">💹 الأسواق والأسعار</h1>
          </div>
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 15px 15px;">
            <p style="font-size: 18px; color: #333;">عميلنا العزيز،</p>
            <p style="color: #555; line-height: 1.8;">تابع أسعار جميع الأسواق لحظة بلحظة من مكان واحد!</p>
            <div style="background: #ecfdf5; padding: 25px; border-radius: 12px; margin: 20px 0; border-right: 4px solid #059669;">
              <p style="color: #065f46; font-weight: bold; margin: 0 0 15px 0; font-size: 18px;">📊 الأسواق المتاحة:</p>
              <ul style="color: #555; line-height: 2.2; margin: 0; padding-right: 20px;">
                <li>💱 <strong>الفوركس:</strong> EUR/USD, GBP/USD, USD/JPY وأكثر</li>
                <li>₿ <strong>العملات الرقمية:</strong> BTC, ETH, XRP, DOGE</li>
                <li>🏆 <strong>المعادن:</strong> الذهب والفضة</li>
                <li>📈 <strong>المؤشرات:</strong> US30, NASDAQ, S&P500</li>
                <li>⛽ <strong>السلع:</strong> النفط والغاز</li>
              </ul>
            </div>
            <div style="display: flex; gap: 10px; margin: 20px 0;">
              <div style="flex: 1; background: #d1fae5; padding: 15px; border-radius: 10px; text-align: center;">
                <p style="color: #065f46; font-weight: bold; margin: 0;">⭐ المفضلة</p>
                <p style="color: #555; font-size: 12px; margin: 5px 0 0 0;">أضف أزواجك المفضلة</p>
              </div>
              <div style="flex: 1; background: #d1fae5; padding: 15px; border-radius: 10px; text-align: center;">
                <p style="color: #065f46; font-weight: bold; margin: 0;">🔔 التنبيهات</p>
                <p style="color: #555; font-size: 12px; margin: 5px 0 0 0;">تنبيه عند وصول السعر</p>
              </div>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://tifue.com/markets" style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 15px 40px; border-radius: 25px; text-decoration: none; font-weight: bold;">شاهد الأسواق</a>
            </div>
          </div>
          <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA. جميع الحقوق محفوظة.</p>
        </div>
      `
    },
    {
      id: "market-hours",
      name: "🕐 أوقات الأسواق",
      subject: "🕐 تعرف على أفضل أوقات التداول!",
      content: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%); padding: 40px 30px; border-radius: 15px 15px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🕐 أوقات الأسواق العالمية</h1>
          </div>
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 15px 15px;">
            <p style="font-size: 18px; color: #333;">عميلنا العزيز،</p>
            <p style="color: #555; line-height: 1.8;">تعرف على أوقات فتح وإغلاق الأسواق العالمية بتوقيتك المحلي!</p>
            <div style="background: #ecfeff; padding: 25px; border-radius: 12px; margin: 20px 0; border-right: 4px solid #0891b2;">
              <p style="color: #155e75; font-weight: bold; margin: 0 0 15px 0; font-size: 18px;">🌍 الأسواق الرئيسية:</p>
              <ul style="color: #555; line-height: 2.2; margin: 0; padding-right: 20px;">
                <li>🇯🇵 <strong>سوق طوكيو:</strong> أول سوق يفتح في اليوم</li>
                <li>🇬🇧 <strong>سوق لندن:</strong> أكبر سوق فوركس في العالم</li>
                <li>🇺🇸 <strong>سوق نيويورك:</strong> أكثر الأسواق سيولة</li>
                <li>🇦🇺 <strong>سوق سيدني:</strong> بداية أسبوع التداول</li>
              </ul>
            </div>
            <div style="background: #cffafe; padding: 20px; border-radius: 12px; margin: 20px 0;">
              <p style="color: #155e75; text-align: center; font-weight: bold; margin: 0;">⚡ أفضل وقت للتداول: تداخل سوق لندن ونيويورك!</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://tifue.com/markets" style="background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%); color: white; padding: 15px 40px; border-radius: 25px; text-decoration: none; font-weight: bold;">شاهد الأوقات</a>
            </div>
          </div>
          <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA. جميع الحقوق محفوظة.</p>
        </div>
      `
    },
    {
      id: "community",
      name: "👥 مجتمع المتداولين",
      subject: "👥 انضم لمجتمع المتداولين وشارك تجربتك!",
      content: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 40px 30px; border-radius: 15px 15px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">👥 مجتمع المتداولين</h1>
          </div>
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 15px 15px;">
            <p style="font-size: 18px; color: #333;">عميلنا العزيز،</p>
            <p style="color: #555; line-height: 1.8;">انضم إلى مجتمع من المتداولين وتبادل الخبرات والأفكار!</p>
            <div style="background: #f5f3ff; padding: 25px; border-radius: 12px; margin: 20px 0; border-right: 4px solid #8b5cf6;">
              <p style="color: #5b21b6; font-weight: bold; margin: 0 0 15px 0; font-size: 18px;">🤝 مميزات المجتمع:</p>
              <ul style="color: #555; line-height: 2.2; margin: 0; padding-right: 20px;">
                <li>📝 <strong>نشر الأفكار:</strong> شارك تحليلاتك مع المجتمع</li>
                <li>🖼️ <strong>رفع الصور:</strong> شارك صور الشارت والتحليلات</li>
                <li>💬 <strong>التعليقات:</strong> ناقش الأفكار مع الآخرين</li>
                <li>❤️ <strong>الإعجابات:</strong> تفاعل مع المحتوى المفيد</li>
                <li>👤 <strong>ملف شخصي:</strong> بناء سمعتك كمتداول</li>
              </ul>
            </div>
            <div style="background: #ede9fe; padding: 20px; border-radius: 12px; margin: 20px 0;">
              <p style="color: #5b21b6; text-align: center; font-weight: bold; margin: 0;">💡 "التداول رحلة، والمجتمع يجعلها أسهل!"</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://tifue.com/community" style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 15px 40px; border-radius: 25px; text-decoration: none; font-weight: bold;">انضم للمجتمع</a>
            </div>
          </div>
          <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA. جميع الحقوق محفوظة.</p>
        </div>
      `
    },
    {
      id: "binary-options",
      name: "⚡ الخيارات الثنائية",
      subject: "⚡ تعلم أساسيات الخيارات الثنائية!",
      content: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 40px 30px; border-radius: 15px 15px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">⚡ الخيارات الثنائية</h1>
          </div>
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 15px 15px;">
            <p style="font-size: 18px; color: #333;">عميلنا العزيز،</p>
            <p style="color: #555; line-height: 1.8;">تعرف على قسم الخيارات الثنائية وأساسيات التداول!</p>
            <div style="background: #fef2f2; padding: 25px; border-radius: 12px; margin: 20px 0; border-right: 4px solid #dc2626;">
              <p style="color: #991b1b; font-weight: bold; margin: 0 0 15px 0; font-size: 18px;">📚 المحتوى التعليمي:</p>
              <ul style="color: #555; line-height: 2.2; margin: 0; padding-right: 20px;">
                <li>📖 <strong>ما هي الخيارات الثنائية:</strong> شرح مبسط للمبتدئين</li>
                <li>📊 <strong>كيف تعمل:</strong> آلية التداول والربح</li>
                <li>⚠️ <strong>المخاطر:</strong> فهم المخاطر المحتملة</li>
                <li>💡 <strong>النصائح:</strong> أفضل الممارسات للتداول</li>
                <li>🔗 <strong>الربط بالحساب:</strong> ربط حساب بوكت أوبشن</li>
              </ul>
            </div>
            <div style="background: #fee2e2; padding: 20px; border-radius: 12px; margin: 20px 0;">
              <p style="color: #991b1b; text-align: center; font-weight: bold; margin: 0;">⚠️ تحذير: التداول ينطوي على مخاطر. لا تتداول بأموال لا تستطيع خسارتها!</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://tifue.com/binary-options" style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 15px 40px; border-radius: 25px; text-decoration: none; font-weight: bold;">تعلم المزيد</a>
            </div>
          </div>
          <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA. جميع الحقوق محفوظة.</p>
        </div>
      `
    },
    {
      id: "auto-trade",
      name: "🤖 التداول الآلي",
      subject: "🤖 فعّل التداول الآلي واربح وأنت نائم!",
      content: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); padding: 40px 30px; border-radius: 15px 15px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🤖 التداول الآلي</h1>
          </div>
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 15px 15px;">
            <p style="font-size: 18px; color: #333;">عميلنا العزيز،</p>
            <p style="color: #555; line-height: 1.8;">فعّل التداول الآلي وسينفذ النظام الصفقات تلقائياً بناءً على التوصيات!</p>
            <div style="background: #f5f3ff; padding: 25px; border-radius: 12px; margin: 20px 0; border-right: 4px solid #7c3aed;">
              <p style="color: #5b21b6; font-weight: bold; margin: 0 0 15px 0; font-size: 18px;">⚙️ كيف يعمل:</p>
              <ul style="color: #555; line-height: 2.2; margin: 0; padding-right: 20px;">
                <li>🔗 <strong>ربط الحساب:</strong> اربط حسابك على بوكت أوبشن</li>
                <li>💰 <strong>تحديد المبلغ:</strong> حدد مبلغ كل صفقة</li>
                <li>✅ <strong>تفعيل الأوتو:</strong> فعّل التداول الآلي</li>
                <li>📡 <strong>استقبال التوصيات:</strong> عند وصول توصية يتم تنفيذها تلقائياً</li>
                <li>📊 <strong>تتبع النتائج:</strong> تابع أرباحك وخسائرك</li>
              </ul>
            </div>
            <div style="background: #ede9fe; padding: 20px; border-radius: 12px; margin: 20px 0;">
              <p style="color: #5b21b6; text-align: center; font-weight: bold; margin: 0;">💡 نصيحة: ابدأ بمبالغ صغيرة حتى تختبر الأداء!</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://tifue.com" style="background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); color: white; padding: 15px 40px; border-radius: 25px; text-decoration: none; font-weight: bold;">فعّل الآن</a>
            </div>
          </div>
          <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA. جميع الحقوق محفوظة.</p>
        </div>
      `
    },
    {
      id: "pwa-install",
      name: "📱 تثبيت التطبيق",
      subject: "📱 ثبّت تطبيق TIFUE SA على جهازك!",
      content: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 40px 30px; border-radius: 15px 15px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">📱 ثبّت التطبيق</h1>
          </div>
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 15px 15px;">
            <p style="font-size: 18px; color: #333;">عميلنا العزيز،</p>
            <p style="color: #555; line-height: 1.8;">ثبّت تطبيق TIFUE SA على هاتفك أو جهازك للوصول السريع!</p>
            <div style="background: #f0f9ff; padding: 25px; border-radius: 12px; margin: 20px 0; border-right: 4px solid #0ea5e9;">
              <p style="color: #0369a1; font-weight: bold; margin: 0 0 15px 0; font-size: 18px;">✨ مميزات التطبيق:</p>
              <ul style="color: #555; line-height: 2.2; margin: 0; padding-right: 20px;">
                <li>⚡ <strong>وصول سريع:</strong> افتح التطبيق من شاشتك الرئيسية</li>
                <li>🔔 <strong>إشعارات فورية:</strong> تنبيهات التوصيات والأسعار</li>
                <li>📴 <strong>يعمل بدون إنترنت:</strong> شاهد محتواك المحفوظ</li>
                <li>🚀 <strong>أداء أسرع:</strong> تجربة أفضل من المتصفح</li>
                <li>💾 <strong>مساحة صغيرة:</strong> لا يحتاج مساحة كبيرة</li>
              </ul>
            </div>
            <div style="background: #e0f2fe; padding: 20px; border-radius: 12px; margin: 20px 0;">
              <p style="color: #0369a1; font-weight: bold; margin: 0 0 10px 0;">📲 طريقة التثبيت:</p>
              <p style="color: #555; margin: 0;">افتح المنصة من المتصفح ← اضغط على أيقونة "التثبيت" أو "إضافة للشاشة الرئيسية"</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://tifue.com/install" style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 15px 40px; border-radius: 25px; text-decoration: none; font-weight: bold;">تعلم التثبيت</a>
            </div>
          </div>
          <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA. جميع الحقوق محفوظة.</p>
        </div>
      `
    },
    {
      id: "reminder",
      name: "⏰ تذكير التجديد",
      subject: "⏰ تذكير: اشتراكك ينتهي قريباً!",
      content: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 30px; border-radius: 15px 15px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">⏰ اشتراكك ينتهي قريباً!</h1>
          </div>
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 15px 15px;">
            <p style="font-size: 18px; color: #333;">عميلنا العزيز،</p>
            <p style="color: #555; line-height: 1.8;">نود تذكيرك بأن اشتراكك في TIFUE SA سينتهي قريباً.</p>
            <div style="background: #fef2f2; padding: 20px; border-radius: 12px; margin: 20px 0; border-right: 4px solid #ef4444;">
              <p style="color: #991b1b; font-weight: bold; margin: 0;">⚠️ لا تفوّت خدماتنا الحصرية!</p>
            </div>
            <p style="color: #555; line-height: 1.8;">جدد اشتراكك الآن للاستمرار في الاستفادة من:</p>
            <ul style="color: #555; line-height: 2; padding-right: 20px;">
              <li>📊 توصيات التداول المباشرة</li>
              <li>🤖 تحليل الذكاء الاصطناعي</li>
              <li>👑 توصيات المحترفين</li>
              <li>📅 التقويم الاقتصادي</li>
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
      id: "comeback",
      name: "😢 نفتقدك",
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
      id: "activation",
      name: "✅ تفعيل الباقة",
      subject: "✅ تم تفعيل حسابك - مرحباً بك!",
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
      name: "🔥 عرض خاص",
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
              <a href="https://tifue.com" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 15px 40px; border-radius: 25px; text-decoration: none; font-weight: bold;">احصل على العرض الآن</a>
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

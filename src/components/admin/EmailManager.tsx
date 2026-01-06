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
import { Mail, Send, Users, Search, Loader2, UserCheck, UserX, Eye } from "lucide-react";
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
      name: "🎉 ترحيب",
      subject: "مرحباً بك في TIFUE SA! 🎉",
      content: `<div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);"><div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%); padding: 50px 30px; border-radius: 20px 20px 0 0; text-align: center;"><div style="font-size: 50px; margin-bottom: 15px;">🎉</div><h1 style="color: white; margin: 0; font-size: 32px; font-weight: 800;">مرحباً بك في TIFUE SA!</h1><p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">منصة التداول الذكية</p></div><div style="background: #1e293b; padding: 40px 30px; border-radius: 0 0 20px 20px;"><p style="font-size: 20px; color: #f1f5f9; margin-bottom: 20px;">أهلاً بك 👋</p><p style="color: #94a3b8; line-height: 1.9;">شكراً لانضمامك إلى منصة <strong style="color: #8b5cf6;">TIFUE SA</strong>!</p><div style="background: linear-gradient(135deg, #0f172a 0%, #1a202c 100%); padding: 25px; border-radius: 16px; margin: 25px 0; border: 1px solid #334155;"><p style="color: #8b5cf6; font-weight: bold; margin: 0 0 15px 0; font-size: 18px;">📋 الميزات:</p><ul style="color: #cbd5e1; line-height: 2.2; margin: 0; padding-right: 20px;"><li>✅ توصيات تداول مباشرة</li><li>✅ تحليل AI للشارت</li><li>✅ نظام الصياد الهادئ</li><li>✅ عداد الانفجار السعري</li></ul></div><div style="text-align: center; margin: 30px 0;"><a href="https://tifue.com" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 15px 50px; border-radius: 30px; text-decoration: none; font-weight: bold;">استكشف المنصة</a></div></div><p style="text-align: center; color: #64748b; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA</p></div>`
    },
    {
      id: "smart-recovery",
      name: "🎯 الصياد الهادئ",
      subject: "🎯 اكتشف نظام الصياد الهادئ - Smart Recovery System!",
      content: `<div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);"><div style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 50%, #0e7490 100%); padding: 50px 30px; border-radius: 20px 20px 0 0; text-align: center;"><div style="font-size: 60px; margin-bottom: 15px;">🎯</div><h1 style="color: white; margin: 0; font-size: 32px; font-weight: 800;">نظام الصياد الهادئ</h1><p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px;">Smart Recovery System</p></div><div style="background: #1e293b; padding: 40px 30px; border-radius: 0 0 20px 20px;"><p style="font-size: 18px; color: #f1f5f9; margin-bottom: 20px;">أقوى نظام تداول ذكي! 👋</p><div style="background: linear-gradient(135deg, #0f172a 0%, #1a202c 100%); padding: 30px; border-radius: 16px; margin: 25px 0; border: 1px solid #334155;"><p style="color: #06b6d4; font-weight: bold; margin: 0 0 20px 0; font-size: 20px;">⚡ المميزات</p><div style="margin-bottom: 15px; background: #1e293b; padding: 15px 20px; border-radius: 10px; border-right: 3px solid #10b981;"><span style="color: #10b981; font-weight: bold;">✅ تأكيدات متعددة:</span><span style="color: #cbd5e1;"> RSI، MACD، EMA، CVD</span></div><div style="margin-bottom: 15px; background: #1e293b; padding: 15px 20px; border-radius: 10px; border-right: 3px solid #f59e0b;"><span style="color: #f59e0b; font-weight: bold;">📊 نسبة الثقة:</span><span style="color: #cbd5e1;"> 0-100% لكل توصية</span></div><div style="background: #1e293b; padding: 15px 20px; border-radius: 10px; border-right: 3px solid #ef4444;"><span style="color: #ef4444; font-weight: bold;">💥 عداد الانفجار:</span><span style="color: #cbd5e1;"> يتنبأ بالحركات الكبيرة</span></div></div><div style="text-align: center; margin: 30px 0;"><a href="https://tifue.com/smart-recovery" style="display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: white; padding: 18px 50px; border-radius: 30px; text-decoration: none; font-weight: bold; box-shadow: 0 10px 30px rgba(6, 182, 212, 0.3);">جرب النظام الآن</a></div></div><p style="text-align: center; color: #64748b; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA</p></div>`
    },
    {
      id: "explosion-timer",
      name: "💥 عداد الانفجار",
      subject: "💥 عداد الانفجار السعري - لا تفوت أي فرصة!",
      content: `<div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);"><div style="background: linear-gradient(135deg, #ef4444 0%, #f97316 50%, #f59e0b 100%); padding: 50px 30px; border-radius: 20px 20px 0 0; text-align: center;"><div style="font-size: 60px; margin-bottom: 15px;">💥</div><h1 style="color: white; margin: 0; font-size: 32px; font-weight: 800;">عداد الانفجار السعري</h1></div><div style="background: #1e293b; padding: 40px 30px; border-radius: 0 0 20px 20px;"><p style="font-size: 18px; color: #f1f5f9; margin-bottom: 20px;">لا تفوت أي انفجار! 🚀</p><div style="background: linear-gradient(135deg, #0f172a 0%, #1a202c 100%); padding: 30px; border-radius: 16px; margin: 25px 0; border: 1px solid #334155;"><p style="color: #f59e0b; font-weight: bold; margin: 0 0 20px 0; font-size: 20px;">⚡ كيف يعمل؟</p><div style="margin-bottom: 15px; background: #1e293b; padding: 15px 20px; border-radius: 10px; border-right: 3px solid #10b981;"><span style="color: #10b981; font-weight: bold;">1️⃣ رصد الضغط:</span><span style="color: #cbd5e1;"> يكتشف ضيق بولينجر</span></div><div style="margin-bottom: 15px; background: #1e293b; padding: 15px 20px; border-radius: 10px; border-right: 3px solid #f59e0b;"><span style="color: #f59e0b; font-weight: bold;">2️⃣ العد التنازلي:</span><span style="color: #cbd5e1;"> عداد دقيق للانفجار</span></div><div style="background: #1e293b; padding: 15px 20px; border-radius: 10px; border-right: 3px solid #ef4444;"><span style="color: #ef4444; font-weight: bold;">3️⃣ إشارة الدخول:</span><span style="color: #cbd5e1;"> متى تدخل ومتى فات الأوان</span></div></div><div style="text-align: center; margin: 30px 0;"><a href="https://tifue.com/smart-recovery" style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #f59e0b 100%); color: white; padding: 18px 50px; border-radius: 30px; text-decoration: none; font-weight: bold;">جرب العداد</a></div></div><p style="text-align: center; color: #64748b; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA</p></div>`
    },
    {
      id: "ai-analysis",
      name: "🤖 تحليل AI",
      subject: "🤖 تحليل الشارت بالذكاء الاصطناعي!",
      content: `<div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);"><div style="background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #d946ef 100%); padding: 50px 30px; border-radius: 20px 20px 0 0; text-align: center;"><div style="font-size: 60px; margin-bottom: 15px;">🤖</div><h1 style="color: white; margin: 0; font-size: 32px; font-weight: 800;">تحليل AI للشارت</h1></div><div style="background: #1e293b; padding: 40px 30px; border-radius: 0 0 20px 20px;"><p style="font-size: 18px; color: #f1f5f9; margin-bottom: 20px;">ارفع صورة واحصل على تحليل!</p><div style="background: linear-gradient(135deg, #0f172a 0%, #1a202c 100%); padding: 25px; border-radius: 16px; margin: 25px 0; border: 1px solid #334155;"><p style="color: #a855f7; font-weight: bold; margin: 0 0 15px 0; font-size: 18px;">✨ المميزات:</p><ul style="color: #cbd5e1; line-height: 2.2; margin: 0; padding-right: 20px;"><li>📸 رفع صورة الشارت</li><li>🔍 تحديد الأنماط تلقائياً</li><li>📊 مستويات الدعم والمقاومة</li><li>🎯 توصيات مع نسبة الثقة</li></ul></div><div style="text-align: center; margin: 30px 0;"><a href="https://tifue.com/image-analysis" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%); color: white; padding: 15px 50px; border-radius: 30px; text-decoration: none; font-weight: bold;">جرب التحليل</a></div></div><p style="text-align: center; color: #64748b; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA</p></div>`
    },
    {
      id: "supply-demand",
      name: "📊 العرض والطلب",
      subject: "📊 محلل العرض والطلب الذكي!",
      content: `<div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);"><div style="background: linear-gradient(135deg, #f59e0b 0%, #f97316 50%, #ea580c 100%); padding: 50px 30px; border-radius: 20px 20px 0 0; text-align: center;"><div style="font-size: 60px; margin-bottom: 15px;">📊</div><h1 style="color: white; margin: 0; font-size: 32px; font-weight: 800;">محلل العرض والطلب</h1></div><div style="background: #1e293b; padding: 40px 30px; border-radius: 0 0 20px 20px;"><p style="font-size: 18px; color: #f1f5f9; margin-bottom: 20px;">حدد مناطق الدخول المثالية!</p><div style="background: linear-gradient(135deg, #0f172a 0%, #1a202c 100%); padding: 25px; border-radius: 16px; margin: 25px 0; border: 1px solid #334155;"><p style="color: #f59e0b; font-weight: bold; margin: 0 0 15px 0; font-size: 18px;">🎯 المميزات:</p><ul style="color: #cbd5e1; line-height: 2.2; margin: 0; padding-right: 20px;"><li>🔴 مناطق العرض (البيع)</li><li>🟢 مناطق الطلب (الشراء)</li><li>💪 تقييم قوة المنطقة</li><li>📈 صفقات جاهزة</li></ul></div><div style="text-align: center; margin: 30px 0;"><a href="https://tifue.com/supply-demand" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); color: white; padding: 15px 50px; border-radius: 30px; text-decoration: none; font-weight: bold;">جرب المحلل</a></div></div><p style="text-align: center; color: #64748b; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA</p></div>`
    },
    {
      id: "live-signals",
      name: "🎯 التوصيات",
      subject: "🎯 توصيات تداول مباشرة من تيليجرام!",
      content: `<div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);"><div style="background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%); padding: 50px 30px; border-radius: 20px 20px 0 0; text-align: center;"><div style="font-size: 60px; margin-bottom: 15px;">🎯</div><h1 style="color: white; margin: 0; font-size: 32px; font-weight: 800;">التوصيات المباشرة</h1></div><div style="background: #1e293b; padding: 40px 30px; border-radius: 0 0 20px 20px;"><p style="font-size: 18px; color: #f1f5f9; margin-bottom: 20px;">توصيات فورية لحظة صدورها! ⚡</p><div style="background: linear-gradient(135deg, #0f172a 0%, #1a202c 100%); padding: 25px; border-radius: 16px; margin: 25px 0; border: 1px solid #334155;"><p style="color: #10b981; font-weight: bold; margin: 0 0 15px 0; font-size: 18px;">📡 المميزات:</p><ul style="color: #cbd5e1; line-height: 2.2; margin: 0; padding-right: 20px;"><li>⚡ توصيات فورية</li><li>🔔 تنبيهات صوتية</li><li>📊 سجل النتائج</li><li>🤖 تنفيذ آلي</li></ul></div><div style="text-align: center; margin: 30px 0;"><a href="https://tifue.com" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #047857 100%); color: white; padding: 15px 50px; border-radius: 30px; text-decoration: none; font-weight: bold;">شاهد التوصيات</a></div></div><p style="text-align: center; color: #64748b; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA</p></div>`
    },
    {
      id: "pro-signals",
      name: "👑 المحترفين",
      subject: "👑 توصيات المحترفين - دقة عالية!",
      content: `<div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);"><div style="background: linear-gradient(135deg, #eab308 0%, #ca8a04 50%, #a16207 100%); padding: 50px 30px; border-radius: 20px 20px 0 0; text-align: center;"><div style="font-size: 60px; margin-bottom: 15px;">👑</div><h1 style="color: white; margin: 0; font-size: 32px; font-weight: 800;">توصيات المحترفين</h1></div><div style="background: #1e293b; padding: 40px 30px; border-radius: 0 0 20px 20px;"><p style="font-size: 18px; color: #f1f5f9; margin-bottom: 20px;">توصيات حصرية من خبراء! 🏆</p><div style="background: linear-gradient(135deg, #0f172a 0%, #1a202c 100%); padding: 25px; border-radius: 16px; margin: 25px 0; border: 1px solid #334155;"><p style="color: #eab308; font-weight: bold; margin: 0 0 15px 0; font-size: 18px;">🏆 المميزات:</p><ul style="color: #cbd5e1; line-height: 2.2; margin: 0; padding-right: 20px;"><li>🎯 دقة عالية</li><li>📝 تحليل مفصل</li><li>🎚️ نسبة الثقة</li><li>⏱️ جميع الفريمات</li></ul></div><div style="text-align: center; margin: 30px 0;"><a href="https://tifue.com/professional-signals" style="display: inline-block; background: linear-gradient(135deg, #eab308 0%, #a16207 100%); color: white; padding: 15px 50px; border-radius: 30px; text-decoration: none; font-weight: bold;">شاهد التوصيات</a></div></div><p style="text-align: center; color: #64748b; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA</p></div>`
    },
    {
      id: "economic-calendar",
      name: "📅 التقويم",
      subject: "📅 لا تفوت الأخبار الاقتصادية!",
      content: `<div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);"><div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #1e40af 100%); padding: 50px 30px; border-radius: 20px 20px 0 0; text-align: center;"><div style="font-size: 60px; margin-bottom: 15px;">📅</div><h1 style="color: white; margin: 0; font-size: 32px; font-weight: 800;">التقويم الاقتصادي</h1></div><div style="background: #1e293b; padding: 40px 30px; border-radius: 0 0 20px 20px;"><p style="font-size: 18px; color: #f1f5f9; margin-bottom: 20px;">تابع الأحداث المهمة! 🌍</p><div style="background: linear-gradient(135deg, #0f172a 0%, #1a202c 100%); padding: 25px; border-radius: 16px; margin: 25px 0; border: 1px solid #334155;"><p style="color: #2563eb; font-weight: bold; margin: 0 0 15px 0; font-size: 18px;">📊 المميزات:</p><ul style="color: #cbd5e1; line-height: 2.2; margin: 0; padding-right: 20px;"><li>🌍 تغطية عالمية</li><li>⚠️ تصنيف الأهمية</li><li>🔔 تنبيهات مسبقة</li><li>🇸🇦 عربي بالكامل</li></ul></div><div style="text-align: center; margin: 30px 0;"><a href="https://tifue.com/economic-calendar" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 15px 50px; border-radius: 30px; text-decoration: none; font-weight: bold;">شاهد التقويم</a></div></div><p style="text-align: center; color: #64748b; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA</p></div>`
    },
    {
      id: "price-alerts",
      name: "🔔 التنبيهات",
      subject: "🔔 تنبيهات الأسعار الذكية!",
      content: `<div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);"><div style="background: linear-gradient(135deg, #ec4899 0%, #db2777 50%, #be185d 100%); padding: 50px 30px; border-radius: 20px 20px 0 0; text-align: center;"><div style="font-size: 60px; margin-bottom: 15px;">🔔</div><h1 style="color: white; margin: 0; font-size: 32px; font-weight: 800;">تنبيهات الأسعار</h1></div><div style="background: #1e293b; padding: 40px 30px; border-radius: 0 0 20px 20px;"><p style="font-size: 18px; color: #f1f5f9; margin-bottom: 20px;">لا تفوت أي فرصة! ⚡</p><div style="background: linear-gradient(135deg, #0f172a 0%, #1a202c 100%); padding: 25px; border-radius: 16px; margin: 25px 0; border: 1px solid #334155;"><p style="color: #ec4899; font-weight: bold; margin: 0 0 15px 0; font-size: 18px;">⚡ المميزات:</p><ul style="color: #cbd5e1; line-height: 2.2; margin: 0; padding-right: 20px;"><li>📈 تنبيه الصعود</li><li>📉 تنبيه الهبوط</li><li>🔊 تنبيه صوتي</li><li>📱 إشعارات فورية</li></ul></div><div style="text-align: center; margin: 30px 0;"><a href="https://tifue.com/markets" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #be185d 100%); color: white; padding: 15px 50px; border-radius: 30px; text-decoration: none; font-weight: bold;">أنشئ تنبيه</a></div></div><p style="text-align: center; color: #64748b; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA</p></div>`
    },
    {
      id: "live-chart",
      name: "📈 الشارت",
      subject: "📈 شارت TradingView احترافي!",
      content: `<div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);"><div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #4338ca 100%); padding: 50px 30px; border-radius: 20px 20px 0 0; text-align: center;"><div style="font-size: 60px; margin-bottom: 15px;">📈</div><h1 style="color: white; margin: 0; font-size: 32px; font-weight: 800;">الشارت المباشر</h1></div><div style="background: #1e293b; padding: 40px 30px; border-radius: 0 0 20px 20px;"><p style="font-size: 18px; color: #f1f5f9; margin-bottom: 20px;">أفضل شارت في العالم! 🌍</p><div style="background: linear-gradient(135deg, #0f172a 0%, #1a202c 100%); padding: 25px; border-radius: 16px; margin: 25px 0; border: 1px solid #334155;"><p style="color: #6366f1; font-weight: bold; margin: 0 0 15px 0; font-size: 18px;">✨ المميزات:</p><ul style="color: #cbd5e1; line-height: 2.2; margin: 0; padding-right: 20px;"><li>📊 TradingView مدمج</li><li>🔧 أدوات الرسم</li><li>📐 المؤشرات الفنية</li><li>🤖 تحليل AI فوري</li></ul></div><div style="text-align: center; margin: 30px 0;"><a href="https://tifue.com/live-chart" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #4338ca 100%); color: white; padding: 15px 50px; border-radius: 30px; text-decoration: none; font-weight: bold;">افتح الشارت</a></div></div><p style="text-align: center; color: #64748b; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA</p></div>`
    },
    {
      id: "markets",
      name: "💹 الأسواق",
      subject: "💹 تابع أسعار الأسواق لحظة بلحظة!",
      content: `<div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);"><div style="background: linear-gradient(135deg, #059669 0%, #047857 50%, #065f46 100%); padding: 50px 30px; border-radius: 20px 20px 0 0; text-align: center;"><div style="font-size: 60px; margin-bottom: 15px;">💹</div><h1 style="color: white; margin: 0; font-size: 32px; font-weight: 800;">الأسواق والأسعار</h1></div><div style="background: #1e293b; padding: 40px 30px; border-radius: 0 0 20px 20px;"><p style="font-size: 18px; color: #f1f5f9; margin-bottom: 20px;">جميع الأسواق في مكان واحد!</p><div style="background: linear-gradient(135deg, #0f172a 0%, #1a202c 100%); padding: 25px; border-radius: 16px; margin: 25px 0; border: 1px solid #334155;"><p style="color: #059669; font-weight: bold; margin: 0 0 15px 0; font-size: 18px;">📊 الأسواق:</p><ul style="color: #cbd5e1; line-height: 2.2; margin: 0; padding-right: 20px;"><li>💱 الفوركس</li><li>₿ العملات الرقمية</li><li>🏆 المعادن</li><li>📈 المؤشرات</li></ul></div><div style="text-align: center; margin: 30px 0;"><a href="https://tifue.com/markets" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #065f46 100%); color: white; padding: 15px 50px; border-radius: 30px; text-decoration: none; font-weight: bold;">شاهد الأسواق</a></div></div><p style="text-align: center; color: #64748b; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA</p></div>`
    },
    {
      id: "community",
      name: "👥 المجتمع",
      subject: "👥 انضم لمجتمع المتداولين!",
      content: `<div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);"><div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%); padding: 50px 30px; border-radius: 20px 20px 0 0; text-align: center;"><div style="font-size: 60px; margin-bottom: 15px;">👥</div><h1 style="color: white; margin: 0; font-size: 32px; font-weight: 800;">مجتمع المتداولين</h1></div><div style="background: #1e293b; padding: 40px 30px; border-radius: 0 0 20px 20px;"><p style="font-size: 18px; color: #f1f5f9; margin-bottom: 20px;">شارك وتعلم مع الآخرين! 🤝</p><div style="background: linear-gradient(135deg, #0f172a 0%, #1a202c 100%); padding: 25px; border-radius: 16px; margin: 25px 0; border: 1px solid #334155;"><p style="color: #8b5cf6; font-weight: bold; margin: 0 0 15px 0; font-size: 18px;">🤝 المميزات:</p><ul style="color: #cbd5e1; line-height: 2.2; margin: 0; padding-right: 20px;"><li>📝 نشر الأفكار</li><li>🖼️ رفع الصور</li><li>💬 التعليقات</li><li>❤️ الإعجابات</li></ul></div><div style="text-align: center; margin: 30px 0;"><a href="https://tifue.com/community" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); color: white; padding: 15px 50px; border-radius: 30px; text-decoration: none; font-weight: bold;">انضم للمجتمع</a></div></div><p style="text-align: center; color: #64748b; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA</p></div>`
    },
    {
      id: "auto-trade",
      name: "🤖 الآلي",
      subject: "🤖 فعّل التداول الآلي!",
      content: `<div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);"><div style="background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%); padding: 50px 30px; border-radius: 20px 20px 0 0; text-align: center;"><div style="font-size: 60px; margin-bottom: 15px;">🤖</div><h1 style="color: white; margin: 0; font-size: 32px; font-weight: 800;">التداول الآلي</h1></div><div style="background: #1e293b; padding: 40px 30px; border-radius: 0 0 20px 20px;"><p style="font-size: 18px; color: #f1f5f9; margin-bottom: 20px;">اربح وأنت نائم! 💰</p><div style="background: linear-gradient(135deg, #0f172a 0%, #1a202c 100%); padding: 25px; border-radius: 16px; margin: 25px 0; border: 1px solid #334155;"><p style="color: #7c3aed; font-weight: bold; margin: 0 0 15px 0; font-size: 18px;">⚙️ كيف يعمل:</p><ul style="color: #cbd5e1; line-height: 2.2; margin: 0; padding-right: 20px;"><li>🔗 ربط الحساب</li><li>💰 تحديد المبلغ</li><li>✅ تنفيذ تلقائي</li><li>📊 تتبع النتائج</li></ul></div><div style="text-align: center; margin: 30px 0;"><a href="https://tifue.com" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); color: white; padding: 15px 50px; border-radius: 30px; text-decoration: none; font-weight: bold;">فعّل الآن</a></div></div><p style="text-align: center; color: #64748b; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA</p></div>`
    },
    {
      id: "journal",
      name: "📓 اليوميات",
      subject: "📓 سجّل صفقاتك وتابع تقدمك!",
      content: `<div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);"><div style="background: linear-gradient(135deg, #14b8a6 0%, #0d9488 50%, #0f766e 100%); padding: 50px 30px; border-radius: 20px 20px 0 0; text-align: center;"><div style="font-size: 60px; margin-bottom: 15px;">📓</div><h1 style="color: white; margin: 0; font-size: 32px; font-weight: 800;">يوميات التداول</h1></div><div style="background: #1e293b; padding: 40px 30px; border-radius: 0 0 20px 20px;"><p style="font-size: 18px; color: #f1f5f9; margin-bottom: 20px;">سر نجاح المحترفين! 📈</p><div style="background: linear-gradient(135deg, #0f172a 0%, #1a202c 100%); padding: 25px; border-radius: 16px; margin: 25px 0; border: 1px solid #334155;"><p style="color: #14b8a6; font-weight: bold; margin: 0 0 15px 0; font-size: 18px;">📊 المميزات:</p><ul style="color: #cbd5e1; line-height: 2.2; margin: 0; padding-right: 20px;"><li>📝 تسجيل الصفقات</li><li>🎯 الهدف اليومي</li><li>📈 إحصائيات شاملة</li><li>💡 الدروس المستفادة</li></ul></div><div style="text-align: center; margin: 30px 0;"><a href="https://tifue.com" style="display: inline-block; background: linear-gradient(135deg, #14b8a6 0%, #0f766e 100%); color: white; padding: 15px 50px; border-radius: 30px; text-decoration: none; font-weight: bold;">ابدأ التسجيل</a></div></div><p style="text-align: center; color: #64748b; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA</p></div>`
    },
    {
      id: "pwa",
      name: "📱 التطبيق",
      subject: "📱 ثبّت التطبيق على جهازك!",
      content: `<div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);"><div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #0369a1 100%); padding: 50px 30px; border-radius: 20px 20px 0 0; text-align: center;"><div style="font-size: 60px; margin-bottom: 15px;">📱</div><h1 style="color: white; margin: 0; font-size: 32px; font-weight: 800;">ثبّت التطبيق</h1></div><div style="background: #1e293b; padding: 40px 30px; border-radius: 0 0 20px 20px;"><p style="font-size: 18px; color: #f1f5f9; margin-bottom: 20px;">وصول سريع من شاشتك! ⚡</p><div style="background: linear-gradient(135deg, #0f172a 0%, #1a202c 100%); padding: 25px; border-radius: 16px; margin: 25px 0; border: 1px solid #334155;"><p style="color: #0ea5e9; font-weight: bold; margin: 0 0 15px 0; font-size: 18px;">✨ المميزات:</p><ul style="color: #cbd5e1; line-height: 2.2; margin: 0; padding-right: 20px;"><li>⚡ وصول سريع</li><li>🔔 إشعارات فورية</li><li>📴 يعمل بدون إنترنت</li><li>🚀 أداء أسرع</li></ul></div><div style="text-align: center; margin: 30px 0;"><a href="https://tifue.com/install" style="display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%); color: white; padding: 15px 50px; border-radius: 30px; text-decoration: none; font-weight: bold;">تعلم التثبيت</a></div></div><p style="text-align: center; color: #64748b; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA</p></div>`
    },
    {
      id: "reminder",
      name: "⏰ تذكير",
      subject: "⏰ اشتراكك ينتهي قريباً!",
      content: `<div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);"><div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%); padding: 50px 30px; border-radius: 20px 20px 0 0; text-align: center;"><div style="font-size: 60px; margin-bottom: 15px;">⏰</div><h1 style="color: white; margin: 0; font-size: 32px; font-weight: 800;">تذكير مهم!</h1></div><div style="background: #1e293b; padding: 40px 30px; border-radius: 0 0 20px 20px;"><p style="font-size: 18px; color: #f1f5f9; margin-bottom: 20px;">اشتراكك ينتهي قريباً! ⚠️</p><div style="background: linear-gradient(135deg, #450a0a 0%, #7f1d1d 100%); padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #dc2626;"><p style="color: #fca5a5; font-weight: bold; margin: 0;">⚠️ لا تفوّت خدماتنا!</p></div><ul style="color: #cbd5e1; line-height: 2; padding-right: 20px;"><li>📊 التوصيات المباشرة</li><li>🤖 تحليل AI</li><li>🎯 نظام الصياد الهادئ</li><li>👑 توصيات المحترفين</li></ul><div style="text-align: center; margin: 30px 0;"><a href="https://tifue.com" style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); color: white; padding: 15px 50px; border-radius: 30px; text-decoration: none; font-weight: bold;">جدد الآن</a></div></div><p style="text-align: center; color: #64748b; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA</p></div>`
    },
    {
      id: "comeback",
      name: "😢 نفتقدك",
      subject: "😢 نفتقدك! عد إلينا",
      content: `<div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);"><div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #4338ca 100%); padding: 50px 30px; border-radius: 20px 20px 0 0; text-align: center;"><div style="font-size: 60px; margin-bottom: 15px;">😢</div><h1 style="color: white; margin: 0; font-size: 32px; font-weight: 800;">نفتقدك!</h1></div><div style="background: #1e293b; padding: 40px 30px; border-radius: 0 0 20px 20px;"><p style="font-size: 18px; color: #f1f5f9; margin-bottom: 20px;">لاحظنا غيابك!</p><div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #6366f1;"><p style="color: #a5b4fc; font-weight: bold; margin: 0 0 10px 0;">🎁 عرض خاص للعودة:</p><p style="color: #e0e7ff; margin: 0;">خصم حصري عند التجديد!</p></div><div style="text-align: center; margin: 30px 0;"><a href="https://tifue.com" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #4338ca 100%); color: white; padding: 15px 50px; border-radius: 30px; text-decoration: none; font-weight: bold;">عُد الآن</a></div></div><p style="text-align: center; color: #64748b; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA</p></div>`
    },
    {
      id: "activation",
      name: "✅ تفعيل",
      subject: "✅ تم تفعيل حسابك بنجاح!",
      content: `<div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);"><div style="background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%); padding: 50px 30px; border-radius: 20px 20px 0 0; text-align: center;"><div style="font-size: 60px; margin-bottom: 15px;">✅</div><h1 style="color: white; margin: 0; font-size: 32px; font-weight: 800;">تم التفعيل!</h1></div><div style="background: #1e293b; padding: 40px 30px; border-radius: 0 0 20px 20px;"><p style="font-size: 22px; color: #f1f5f9; margin-bottom: 20px;">مبارك! 🎊</p><p style="color: #94a3b8; line-height: 1.9;">تم تفعيل باقتك بنجاح! استمتع بجميع الخدمات.</p><div style="text-align: center; margin: 30px 0;"><a href="https://tifue.com" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #047857 100%); color: white; padding: 15px 50px; border-radius: 30px; text-decoration: none; font-weight: bold;">ابدأ التداول</a></div></div><p style="text-align: center; color: #64748b; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA</p></div>`
    },
    {
      id: "promo",
      name: "🔥 عرض",
      subject: "🔥 عرض حصري لك!",
      content: `<div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);"><div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%); padding: 50px 30px; border-radius: 20px 20px 0 0; text-align: center;"><div style="font-size: 60px; margin-bottom: 15px;">🔥</div><h1 style="color: white; margin: 0; font-size: 32px; font-weight: 800;">عرض خاص!</h1></div><div style="background: #1e293b; padding: 40px 30px; border-radius: 0 0 20px 20px;"><p style="font-size: 18px; color: #f1f5f9; margin-bottom: 20px;">عرض حصري لك!</p><div style="background: linear-gradient(135deg, #451a03 0%, #78350f 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border: 1px solid #f59e0b; text-align: center;"><p style="color: #fcd34d; font-size: 36px; font-weight: bold; margin: 0;">50% خصم</p><p style="color: #fef3c7; margin: 10px 0 0 0;">لفترة محدودة!</p></div><div style="text-align: center; margin: 30px 0;"><a href="https://tifue.com" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #b45309 100%); color: white; padding: 15px 50px; border-radius: 30px; text-decoration: none; font-weight: bold;">احصل على العرض</a></div></div><p style="text-align: center; color: #64748b; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA</p></div>`
    },
    {
      id: "new-feature",
      name: "🆕 ميزة جديدة",
      subject: "🆕 ميزة جديدة على المنصة!",
      content: `<div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);"><div style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 50%, #0e7490 100%); padding: 50px 30px; border-radius: 20px 20px 0 0; text-align: center;"><div style="font-size: 60px; margin-bottom: 15px;">🆕</div><h1 style="color: white; margin: 0; font-size: 32px; font-weight: 800;">ميزة جديدة!</h1></div><div style="background: #1e293b; padding: 40px 30px; border-radius: 0 0 20px 20px;"><p style="font-size: 18px; color: #f1f5f9; margin-bottom: 20px;">أضفنا ميزة جديدة!</p><div style="background: linear-gradient(135deg, #042f2e 0%, #134e4a 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border: 1px solid #14b8a6;"><p style="color: #5eead4; font-weight: bold; font-size: 20px; margin: 0 0 15px 0;">✨ الميزة الجديدة:</p><p style="color: #99f6e4; margin: 0;">[اسم الميزة] لتحسين تجربتك!</p></div><div style="text-align: center; margin: 30px 0;"><a href="https://tifue.com" style="display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #0e7490 100%); color: white; padding: 15px 50px; border-radius: 30px; text-decoration: none; font-weight: bold;">جربها الآن</a></div></div><p style="text-align: center; color: #64748b; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA</p></div>`
    },
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

        if (error) throw error;
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
            {/* Templates Grid */}
            <div className="space-y-2">
              <Label>قوالب جاهزة ({templates.length} قالب)</Label>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                {templates.map(template => (
                  <Button
                    key={template.id}
                    variant={useTemplate === template.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => applyTemplate(template.id)}
                    className="text-xs h-auto py-2 px-2"
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

                  <div className="flex gap-2 justify-end pt-2">
                    <Button variant="outline" onClick={() => setShowPreview(false)}>
                      إغلاق
                    </Button>
                    <Button
                      onClick={() => {
                        setShowPreview(false);
                        if (selectedUsers.length > 0) sendEmails();
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

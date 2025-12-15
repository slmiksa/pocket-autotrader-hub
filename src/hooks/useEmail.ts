import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export const useEmail = () => {
  const [loading, setLoading] = useState(false);

  const sendEmail = async ({ to, subject, html, from = "TIFUE SA <noreply@tifue.com>" }: SendEmailParams) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: { to, subject, html, from }
      });

      if (error) throw error;

      console.log('Email sent successfully:', data);
      return { success: true, data };
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast.error('فشل في إرسال البريد الإلكتروني');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // إيميل التسجيل (قبل شراء الباقة)
  const sendRegistrationEmail = async (email: string, name?: string) => {
    const html = `
      <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; border-radius: 15px 15px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">مرحباً بك في TIFUE SA! 🎉</h1>
        </div>
        <div style="background: white; padding: 40px 30px; border-radius: 0 0 15px 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
          <p style="font-size: 20px; color: #333; margin-bottom: 20px;">أهلاً ${name || 'بك'}،</p>
          <p style="color: #555; line-height: 1.8; font-size: 16px;">
            شكراً لتسجيلك في منصة <strong>TIFUE SA</strong>! نحن سعداء بانضمامك إلى أفضل منصة ذكاء اصطناعي للتداول في الشرق الأوسط.
          </p>
          <p style="color: #555; line-height: 1.8; font-size: 16px;">
            لتفعيل حسابك والاستمتاع بجميع الخدمات، يرجى شراء إحدى باقاتنا المميزة.
          </p>
          <div style="text-align: center; margin: 35px 0;">
            <a href="https://tifue.com/subscription" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 18px 50px; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 18px; display: inline-block; box-shadow: 0 4px 15px rgba(102,126,234,0.4);">
              شراء الباقة الآن
            </a>
          </div>
          <p style="color: #888; font-size: 14px; text-align: center;">
            لديك استفسار؟ تواصل معنا في أي وقت!
          </p>
        </div>
        <p style="text-align: center; color: #999; font-size: 12px; margin-top: 25px;">
          © 2024 TIFUE SA. جميع الحقوق محفوظة.
        </p>
      </div>
    `;

    return sendEmail({
      to: email,
      subject: 'مرحباً بك في TIFUE SA! 🎉 - قم بتفعيل حسابك',
      html
    });
  };

  // إيميل تفعيل الباقة (بعد شراء الباقة)
  const sendActivationEmail = async (email: string, name?: string) => {
    const html = `
      <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; border-radius: 15px 15px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">تم تفعيل حسابك بنجاح! ✅</h1>
        </div>
        <div style="background: white; padding: 40px 30px; border-radius: 0 0 15px 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
          <p style="font-size: 20px; color: #333; margin-bottom: 20px;">مبارك ${name || 'عزيزنا'}! 🎊</p>
          <p style="color: #555; line-height: 1.8; font-size: 16px;">
            تم تفعيل باقتك بنجاح! أنت الآن عضو مميز في <strong>TIFUE SA</strong> ويمكنك الاستمتاع بجميع الخدمات التالية:
          </p>
          
          <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border-right: 4px solid #0ea5e9;">
            <h3 style="color: #0369a1; margin: 0 0 15px 0;">🚀 خدمات باقتك المميزة:</h3>
            <ul style="color: #555; line-height: 2.2; margin: 0; padding-right: 20px; font-size: 15px;">
              <li><strong>🤖 تحليل الشارتات بالذكاء الاصطناعي</strong> - تحليل ذكي ودقيق لجميع الرسوم البيانية</li>
              <li><strong>📊 إشارات تداول احترافية</strong> - توصيات حية من خبراء التداول</li>
              <li><strong>⚡ تنبيهات الأسعار الفورية</strong> - إشعارات لحظية عند وصول السعر للهدف</li>
              <li><strong>📅 التقويم الاقتصادي</strong> - متابعة جميع الأحداث الاقتصادية المؤثرة</li>
              <li><strong>📈 محلل العرض والطلب</strong> - تحديد مناطق العرض والطلب تلقائياً</li>
              <li><strong>💹 التداول الافتراضي</strong> - تدرب على التداول بدون مخاطرة</li>
              <li><strong>📝 دفتر التداول اليومي</strong> - تتبع صفقاتك وتحليل أدائك</li>
              <li><strong>🎯 أهداف التداول</strong> - خطط وتتبع أهدافك المالية</li>
              <li><strong>👥 مجتمع المتداولين</strong> - تواصل مع متداولين آخرين</li>
              <li><strong>🔔 إشعارات فورية</strong> - لا تفوت أي فرصة تداول</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="https://tifue.com" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 18px 50px; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 18px; display: inline-block; box-shadow: 0 4px 15px rgba(16,185,129,0.4);">
              ابدأ التداول الآن
            </a>
          </div>
          
          <p style="color: #888; font-size: 14px; text-align: center;">
            نتمنى لك تداولاً ناجحاً ومربحاً! 💰
          </p>
        </div>
        <p style="text-align: center; color: #999; font-size: 12px; margin-top: 25px;">
          © 2024 TIFUE SA. جميع الحقوق محفوظة.
        </p>
      </div>
    `;

    return sendEmail({
      to: email,
      subject: '✅ تم تفعيل حسابك - مرحباً بك في TIFUE SA!',
      html
    });
  };

  // إيميل ترحيب عام (يستخدم إيميل التسجيل افتراضياً)
  const sendWelcomeEmail = async (email: string, name?: string) => {
    return sendRegistrationEmail(email, name);
  };

  const sendSignalNotification = async (email: string, signal: { asset: string; direction: string; timeframe: string }) => {
    const directionText = signal.direction === 'call' ? '📈 شراء' : '📉 بيع';
    const html = `
      <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
        <div style="background: ${signal.direction === 'call' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'}; padding: 40px 30px; border-radius: 15px 15px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">إشارة تداول جديدة! 🔔</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 15px 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
          <div style="background: #f8f9fa; padding: 25px; border-radius: 12px; margin-bottom: 25px; text-align: center;">
            <p style="font-size: 28px; font-weight: bold; color: #333; margin: 0;">${signal.asset}</p>
            <p style="font-size: 24px; color: ${signal.direction === 'call' ? '#10b981' : '#ef4444'}; margin: 15px 0; font-weight: bold;">${directionText}</p>
            <p style="color: #666; font-size: 16px; margin: 0;">الإطار الزمني: ${signal.timeframe}</p>
          </div>
          <div style="text-align: center;">
            <a href="https://tifue.com/professional-signals" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; border-radius: 25px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
              عرض الإشارة
            </a>
          </div>
        </div>
        <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
          © 2024 TIFUE SA. جميع الحقوق محفوظة.
        </p>
      </div>
    `;

    return sendEmail({
      to: email,
      subject: `🔔 إشارة تداول جديدة: ${signal.asset} - ${directionText}`,
      html
    });
  };

  const sendPriceAlert = async (email: string, alert: { symbol: string; targetPrice: number; currentPrice: number; condition: string }) => {
    const html = `
      <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; border-radius: 15px 15px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">⚡ تنبيه السعر!</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 15px 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
          <div style="background: #f8f9fa; padding: 25px; border-radius: 12px; margin-bottom: 20px; text-align: center;">
            <p style="font-size: 28px; font-weight: bold; color: #333; margin: 0;">${alert.symbol}</p>
            <p style="font-size: 18px; color: #666; margin: 15px 0;">
              السعر ${alert.condition === 'above' ? 'أعلى من' : 'أقل من'} ${alert.targetPrice}
            </p>
            <p style="font-size: 24px; color: #10b981; font-weight: bold; margin: 0;">
              السعر الحالي: ${alert.currentPrice}
            </p>
          </div>
        </div>
        <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
          © 2024 TIFUE SA. جميع الحقوق محفوظة.
        </p>
      </div>
    `;

    return sendEmail({
      to: email,
      subject: `⚡ تنبيه السعر: ${alert.symbol} وصل إلى ${alert.targetPrice}`,
      html
    });
  };

  return {
    sendEmail,
    sendRegistrationEmail,
    sendActivationEmail,
    sendWelcomeEmail,
    sendSignalNotification,
    sendPriceAlert,
    loading
  };
};

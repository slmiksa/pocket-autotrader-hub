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

  const sendEmail = async ({ to, subject, html, from }: SendEmailParams) => {
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

  const sendWelcomeEmail = async (email: string, name?: string) => {
    const html = `
      <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">مرحباً بك في Arabot! 🎉</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 18px; color: #333;">أهلاً ${name || 'بك'}،</p>
          <p style="color: #666; line-height: 1.8;">
            شكراً لانضمامك إلى منصة Arabot! نحن سعداء بوجودك معنا.
          </p>
          <p style="color: #666; line-height: 1.8;">
            استمتع بميزات المنصة:
          </p>
          <ul style="color: #666; line-height: 2;">
            <li>تحليل الشارتات بالذكاء الاصطناعي</li>
            <li>إشارات تداول احترافية</li>
            <li>تنبيهات الأسعار الفورية</li>
            <li>التقويم الاقتصادي</li>
          </ul>
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://arabot.lovable.app" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; border-radius: 25px; text-decoration: none; font-weight: bold;">
              ابدأ الآن
            </a>
          </div>
        </div>
        <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
          © 2024 Arabot. جميع الحقوق محفوظة.
        </p>
      </div>
    `;

    return sendEmail({
      to: email,
      subject: 'مرحباً بك في Arabot! 🎉',
      html
    });
  };

  const sendSignalNotification = async (email: string, signal: { asset: string; direction: string; timeframe: string }) => {
    const directionText = signal.direction === 'call' ? '📈 شراء' : '📉 بيع';
    const html = `
      <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: ${signal.direction === 'call' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'}; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">إشارة تداول جديدة! 🔔</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <div style="background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <p style="font-size: 24px; font-weight: bold; color: #333; margin: 0;">${signal.asset}</p>
            <p style="font-size: 20px; color: ${signal.direction === 'call' ? '#10b981' : '#ef4444'}; margin: 10px 0;">${directionText}</p>
            <p style="color: #666;">الإطار الزمني: ${signal.timeframe}</p>
          </div>
          <div style="text-align: center;">
            <a href="https://arabot.lovable.app/professional-signals" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; border-radius: 25px; text-decoration: none; font-weight: bold;">
              عرض الإشارة
            </a>
          </div>
        </div>
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
      <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">⚡ تنبيه السعر!</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <div style="background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <p style="font-size: 24px; font-weight: bold; color: #333; margin: 0;">${alert.symbol}</p>
            <p style="font-size: 18px; color: #666; margin: 10px 0;">
              السعر ${alert.condition === 'above' ? 'أعلى من' : 'أقل من'} ${alert.targetPrice}
            </p>
            <p style="font-size: 20px; color: #10b981; font-weight: bold;">
              السعر الحالي: ${alert.currentPrice}
            </p>
          </div>
        </div>
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
    sendWelcomeEmail,
    sendSignalNotification,
    sendPriceAlert,
    loading
  };
};

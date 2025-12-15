import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Checking for expiring subscriptions...');

    const now = new Date();
    
    // Check for subscriptions expiring in 3 days
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    // Check for subscriptions expiring in 1 day
    const oneDayFromNow = new Date(now);
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);

    // Get profiles with subscriptions expiring in 1 or 3 days
    const { data: expiringProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, email, nickname, subscription_expires_at, email_notifications_enabled')
      .not('subscription_expires_at', 'is', null)
      .gt('subscription_expires_at', now.toISOString())
      .lt('subscription_expires_at', threeDaysFromNow.toISOString());

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    if (!expiringProfiles || expiringProfiles.length === 0) {
      console.log('No expiring subscriptions found');
      return new Response(JSON.stringify({ message: 'No expiring subscriptions', sent: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`Found ${expiringProfiles.length} profiles with expiring subscriptions`);

    let sentCount = 0;
    const errors: string[] = [];

    for (const profile of expiringProfiles) {
      if (!profile.email) continue;

      const expiryDate = new Date(profile.subscription_expires_at);
      const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      // Format expiry date in Arabic
      const formattedDate = expiryDate.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const isUrgent = daysRemaining <= 1;
      const gradientColors = isUrgent 
        ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
        : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';

      const emailHtml = `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
          <div style="background: ${gradientColors}; padding: 40px 30px; border-radius: 15px 15px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">⚠️ تذكير بانتهاء الاشتراك</h1>
          </div>
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 15px 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
            <p style="font-size: 20px; color: #333; margin-bottom: 20px;">مرحباً ${profile.nickname || 'عزيزنا'}،</p>
            
            <div style="background: ${isUrgent ? '#fef2f2' : '#fffbeb'}; padding: 25px; border-radius: 12px; margin: 20px 0; border-right: 4px solid ${isUrgent ? '#ef4444' : '#f59e0b'};">
              <p style="color: ${isUrgent ? '#991b1b' : '#92400e'}; font-size: 18px; margin: 0; font-weight: bold;">
                ${isUrgent ? '🚨 اشتراكك سينتهي غداً!' : `⏰ اشتراكك سينتهي خلال ${daysRemaining} أيام`}
              </p>
              <p style="color: #555; font-size: 16px; margin: 15px 0 0 0;">
                تاريخ الانتهاء: <strong>${formattedDate}</strong>
              </p>
            </div>
            
            <p style="color: #555; line-height: 1.8; font-size: 16px;">
              لا تفوت فرصة الاستمرار في الاستفادة من جميع خدمات <strong>TIFUE SA</strong>:
            </p>
            
            <ul style="color: #555; line-height: 2; font-size: 15px; padding-right: 20px;">
              <li>✅ توصيات تداول احترافية</li>
              <li>✅ تحليل الشارتات بالذكاء الاصطناعي</li>
              <li>✅ محلل العرض والطلب</li>
              <li>✅ تنبيهات الأسعار الفورية</li>
              <li>✅ التقويم الاقتصادي</li>
            </ul>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="https://tifue.com/subscription" style="background: ${gradientColors}; color: white; padding: 18px 50px; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 18px; display: inline-block; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                تجديد الاشتراك الآن
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

      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: "TIFUE SA <noreply@tifue.com>",
            to: [profile.email],
            subject: isUrgent 
              ? `🚨 اشتراكك ينتهي غداً - جدد الآن!`
              : `⚠️ تذكير: اشتراكك ينتهي خلال ${daysRemaining} أيام`,
            html: emailHtml,
          }),
        });

        // Create notification in app
        await supabase
          .from('user_notifications')
          .insert({
            user_id: profile.user_id,
            type: 'subscription_reminder',
            title: isUrgent ? '🚨 اشتراكك ينتهي غداً!' : `⚠️ اشتراكك ينتهي خلال ${daysRemaining} أيام`,
            body: `تاريخ الانتهاء: ${formattedDate}. جدد اشتراكك للاستمرار في الاستفادة من جميع الخدمات.`,
            data: {
              expires_at: profile.subscription_expires_at,
              days_remaining: daysRemaining
            }
          });

        sentCount++;
        console.log(`Reminder sent to ${profile.email} (${daysRemaining} days remaining)`);
      } catch (emailError: any) {
        console.error(`Error sending reminder to ${profile.email}:`, emailError);
        errors.push(`${profile.email}: ${emailError.message}`);
      }
    }

    console.log(`✅ Sent ${sentCount} subscription reminder emails`);

    return new Response(JSON.stringify({ 
      success: true, 
      checked: expiringProfiles.length,
      sent: sentCount,
      errors: errors.length > 0 ? errors : undefined
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in send-subscription-reminders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});

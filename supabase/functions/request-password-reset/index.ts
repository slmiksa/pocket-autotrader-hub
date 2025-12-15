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
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { email } = await req.json();

    if (!email) {
      throw new Error("البريد الإلكتروني مطلوب");
    }

    console.log(`Requesting password reset for: ${email}`);

    // Check if user exists
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error listing users:', userError);
      throw new Error('حدث خطأ أثناء التحقق من البريد الإلكتروني');
    }

    const userExists = users.users.some(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!userExists) {
      // Don't reveal if user exists or not for security
      console.log('User not found, but returning success for security');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'إذا كان البريد الإلكتروني مسجلاً، ستتلقى رابط إعادة تعيين كلمة المرور'
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Generate password reset link using Supabase Admin API
    const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: 'https://tifue.com/auth?type=recovery'
      }
    });

    if (resetError) {
      console.error('Error generating reset link:', resetError);
      throw new Error('فشل في إنشاء رابط إعادة التعيين');
    }

    const resetLink = resetData.properties?.action_link;
    
    if (!resetLink) {
      throw new Error('فشل في الحصول على رابط إعادة التعيين');
    }

    console.log('Reset link generated successfully');

    // Send email with custom template using Resend
    const emailHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>إعادة تعيين كلمة المرور</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: 'Segoe UI', Tahoma, sans-serif;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse;">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 50px 40px; border-radius: 20px 20px 0 0; text-align: center;">
                    <div style="width: 80px; height: 80px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                      <span style="font-size: 40px;">🔐</span>
                    </div>
                    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">إعادة تعيين كلمة المرور</h1>
                    <p style="color: rgba(255,255,255,0.8); margin: 15px 0 0; font-size: 16px;">TIFUE SA</p>
                  </td>
                </tr>
                
                <!-- Body -->
                <tr>
                  <td style="background: #1e293b; padding: 50px 40px; border-radius: 0 0 20px 20px;">
                    <p style="color: #e2e8f0; font-size: 18px; margin: 0 0 20px; line-height: 1.8;">
                      مرحباً،
                    </p>
                    
                    <p style="color: #94a3b8; font-size: 16px; margin: 0 0 30px; line-height: 1.8;">
                      تلقينا طلباً لإعادة تعيين كلمة المرور لحسابك. اضغط على الزر أدناه لإنشاء كلمة مرور جديدة:
                    </p>
                    
                    <!-- Button -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td align="center" style="padding: 20px 0 40px;">
                          <a href="${resetLink}" 
                             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                    color: white; 
                                    padding: 18px 60px; 
                                    border-radius: 50px; 
                                    text-decoration: none; 
                                    font-weight: bold; 
                                    font-size: 18px; 
                                    display: inline-block;
                                    box-shadow: 0 10px 30px rgba(102,126,234,0.4);">
                            إعادة تعيين كلمة المرور
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Divider -->
                    <div style="border-top: 1px solid #334155; margin: 20px 0 30px;"></div>
                    
                    <!-- Info -->
                    <div style="background: #334155; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                      <p style="color: #fbbf24; font-size: 14px; margin: 0 0 10px; display: flex; align-items: center;">
                        <span style="margin-left: 8px;">⚠️</span>
                        تنبيه أمني
                      </p>
                      <p style="color: #94a3b8; font-size: 14px; margin: 0; line-height: 1.6;">
                        هذا الرابط صالح لمدة ساعة واحدة فقط. إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد بأمان.
                      </p>
                    </div>
                    
                    <!-- Alternative Link -->
                    <p style="color: #64748b; font-size: 13px; margin: 0; line-height: 1.6;">
                      إذا لم يعمل الزر، انسخ الرابط التالي والصقه في متصفحك:
                    </p>
                    <p style="color: #667eea; font-size: 12px; margin: 10px 0 0; word-break: break-all; direction: ltr;">
                      ${resetLink}
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px; text-align: center;">
                    <p style="color: #64748b; font-size: 14px; margin: 0 0 10px;">
                      مع تحيات فريق
                    </p>
                    <p style="color: #e2e8f0; font-size: 18px; font-weight: bold; margin: 0;">
                      TIFUE SA
                    </p>
                    <p style="color: #475569; font-size: 12px; margin: 20px 0 0;">
                      © ${new Date().getFullYear()} TIFUE SA. جميع الحقوق محفوظة.
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: "TIFUE SA <noreply@tifue.com>",
        to: [email],
        subject: "🔐 إعادة تعيين كلمة المرور - TIFUE SA",
        html: emailHtml,
      }),
    });

    const emailData = await emailResponse.json();
    
    if (!emailResponse.ok) {
      console.error("Resend API error:", emailData);
      throw new Error('فشل في إرسال البريد الإلكتروني');
    }
    
    console.log("Password reset email sent successfully:", emailData);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني'
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in request-password-reset:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});

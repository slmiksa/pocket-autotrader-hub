import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Send2FARequest {
  email: string;
  userId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email, userId }: Send2FARequest = await req.json();

    if (!email || !userId) {
      return new Response(
        JSON.stringify({ error: "البريد الإلكتروني ومعرف المستخدم مطلوبان" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Delete any existing codes for this user
    await supabase
      .from("email_verification_codes")
      .delete()
      .eq("email", email);

    // Insert new code
    const { error: insertError } = await supabase
      .from("email_verification_codes")
      .insert({
        user_id: userId,
        email: email,
        code: code,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Error inserting code:", insertError);
      return new Response(
        JSON.stringify({ error: "فشل في إنشاء رمز التحقق" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send email with code using Resend API
    const emailHtml = `
      <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🔐 رمز التحقق</h1>
        </div>
        
        <div style="padding: 40px 30px; text-align: center;">
          <p style="color: #cbd5e1; font-size: 16px; margin-bottom: 30px;">
            استخدم الرمز التالي لإكمال تسجيل الدخول:
          </p>
          
          <div style="background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); border-radius: 12px; padding: 25px; margin: 20px 0;">
            <span style="font-size: 42px; font-weight: bold; color: white; letter-spacing: 8px; font-family: monospace;">
              ${code}
            </span>
          </div>
          
          <p style="color: #94a3b8; font-size: 14px; margin-top: 30px;">
            ⏰ هذا الرمز صالح لمدة <strong style="color: #f59e0b;">5 دقائق</strong> فقط
          </p>
          
          <div style="background: #1e293b; border-radius: 8px; padding: 15px; margin-top: 25px; border: 1px solid #334155;">
            <p style="color: #64748b; font-size: 12px; margin: 0;">
              ⚠️ إذا لم تطلب هذا الرمز، يرجى تجاهل هذا البريد
            </p>
          </div>
        </div>
        
        <div style="background: #0f172a; padding: 20px; text-align: center; border-top: 1px solid #334155;">
          <p style="color: #64748b; font-size: 12px; margin: 0;">
            © 2024 توصيات الهوامير - جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "توصيات الهوامير <noreply@tifue.com>",
        to: [email],
        subject: "رمز التحقق لتسجيل الدخول",
        html: emailHtml,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Resend API error:", data);
      return new Response(
        JSON.stringify({ error: "فشل في إرسال البريد الإلكتروني" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`2FA code sent to ${email}`);

    return new Response(
      JSON.stringify({ success: true, message: "تم إرسال رمز التحقق" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-2fa-code:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);

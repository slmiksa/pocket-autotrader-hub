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

    // Verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: adminUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !adminUser) {
      throw new Error("Unauthorized");
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", adminUser.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roleData) {
      throw new Error("User is not an admin");
    }

    const { user_email } = await req.json();

    if (!user_email) {
      throw new Error("User email is required");
    }

    console.log(`Admin ${adminUser.email} requesting password reset for: ${user_email}`);

    // Generate password reset link using Supabase Admin API
    const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: user_email,
      options: {
        redirectTo: 'https://tifue.com/auth?type=recovery'
      }
    });

    if (resetError) {
      console.error('Error generating reset link:', resetError);
      throw new Error('Failed to generate reset link');
    }

    // Send email with reset link
    const resetLink = resetData.properties?.action_link;
    
    if (!resetLink) {
      throw new Error('Failed to get reset link');
    }

    const emailHtml = `
      <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; border-radius: 15px 15px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🔐 إعادة تعيين كلمة المرور</h1>
        </div>
        <div style="background: white; padding: 40px 30px; border-radius: 0 0 15px 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
          <p style="font-size: 18px; color: #333; margin-bottom: 20px;">مرحباً،</p>
          
          <p style="color: #555; line-height: 1.8; font-size: 16px;">
            تم طلب إعادة تعيين كلمة المرور لحسابك في <strong>TIFUE SA</strong>.
          </p>
          
          <p style="color: #555; line-height: 1.8; font-size: 16px;">
            اضغط على الزر أدناه لإنشاء كلمة مرور جديدة:
          </p>
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="${resetLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 18px 50px; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 18px; display: inline-block; box-shadow: 0 4px 15px rgba(102,126,234,0.4);">
              إعادة تعيين كلمة المرور
            </a>
          </div>
          
          <p style="color: #888; font-size: 14px; text-align: center;">
            هذا الرابط صالح لمدة ساعة واحدة فقط.
          </p>
          
          <p style="color: #888; font-size: 14px; text-align: center; margin-top: 20px;">
            إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد.
          </p>
        </div>
        <p style="text-align: center; color: #999; font-size: 12px; margin-top: 25px;">
          © 2024 TIFUE SA. جميع الحقوق محفوظة.
        </p>
      </div>
    `;

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: "TIFUE SA <noreply@tifue.com>",
        to: [user_email],
        subject: "🔐 إعادة تعيين كلمة المرور - TIFUE SA",
        html: emailHtml,
      }),
    });

    const emailData = await emailResponse.json();
    console.log("Password reset email sent:", emailData);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'تم إرسال رابط إعادة تعيين كلمة المرور بنجاح'
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in reset-user-password:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});

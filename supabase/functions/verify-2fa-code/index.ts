import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Verify2FARequest {
  email: string;
  code: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email, code }: Verify2FARequest = await req.json();

    if (!email || !code) {
      return new Response(
        JSON.stringify({ error: "البريد الإلكتروني والرمز مطلوبان", valid: false }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if code exists and is valid
    const { data: verificationCode, error: fetchError } = await supabase
      .from("email_verification_codes")
      .select("*")
      .eq("email", email)
      .eq("code", code)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (fetchError || !verificationCode) {
      console.log("Invalid or expired code for:", email);
      return new Response(
        JSON.stringify({ 
          error: "رمز التحقق غير صحيح أو منتهي الصلاحية", 
          valid: false 
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Mark code as used
    await supabase
      .from("email_verification_codes")
      .update({ used: true })
      .eq("id", verificationCode.id);

    console.log(`2FA code verified for ${email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        valid: true,
        userId: verificationCode.user_id,
        message: "تم التحقق بنجاح" 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in verify-2fa-code:", error);
    return new Response(
      JSON.stringify({ error: error.message, valid: false }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);

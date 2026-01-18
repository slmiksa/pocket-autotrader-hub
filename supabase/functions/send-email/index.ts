import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { to, subject, html, from }: EmailRequest = await req.json();

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, html" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const recipients = Array.isArray(to) ? to : [to];
    const senderEmail = from || "TIFUE SA <noreply@tifue.com>";
    
    console.log(`=== EMAIL SEND REQUEST ===`);
    console.log(`From: ${senderEmail}`);
    console.log(`Recipients: ${recipients.length}`);
    console.log(`Subject: ${subject}`);
    console.log(`Recipients list: ${recipients.join(', ')}`);

    // Send each email individually to prevent exposing recipient list
    const results: { email: string; success: boolean; error?: string; resendId?: string }[] = [];
    
    for (const recipient of recipients) {
      try {
        console.log(`Sending to: ${recipient}...`);
        
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: senderEmail,
            to: [recipient],
            subject: subject,
            html: html,
          }),
        });

        const data = await response.json();
        console.log(`Response for ${recipient}:`, JSON.stringify(data));

        if (!response.ok) {
          console.error(`❌ Failed to send to ${recipient}:`, data);
          results.push({ email: recipient, success: false, error: data.message || data.error });
        } else {
          console.log(`✅ Sent to ${recipient}, ID: ${data.id}`);
          results.push({ email: recipient, success: true, resendId: data.id });
        }
      } catch (err: any) {
        console.error(`❌ Exception sending to ${recipient}:`, err);
        results.push({ email: recipient, success: false, error: err.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    console.log(`Email results: ${successCount} success, ${failCount} failed`);

    return new Response(JSON.stringify({ 
      success: true, 
      sent: successCount, 
      failed: failCount,
      total: recipients.length 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BanNotificationRequest {
  email: string;
  reason: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, reason }: BanNotificationRequest = await req.json();

    console.log(`Sending ban notification to: ${email}`);

    const whatsappNumber = "00966575594911";
    const whatsappMessage = encodeURIComponent("السلام عليكم، أحتاج مساعدة بخصوص حظر حسابي");
    const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #0f1219;
            color: #ffffff;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
          }
          .card {
            background: linear-gradient(135deg, #1a1f2e 0%, #252b3b 100%);
            border-radius: 16px;
            padding: 40px;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .warning-icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            font-size: 40px;
          }
          h1 {
            color: #ef4444;
            font-size: 24px;
            margin: 0;
          }
          .content {
            text-align: center;
            line-height: 1.8;
          }
          .reason-box {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
          }
          .reason-label {
            color: #ef4444;
            font-size: 14px;
            margin-bottom: 10px;
          }
          .reason-text {
            color: #ffffff;
            font-size: 16px;
          }
          .whatsapp-btn {
            display: inline-block;
            background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
            color: #ffffff !important;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 12px;
            font-size: 16px;
            font-weight: bold;
            margin-top: 30px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #6b7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="header">
              <div class="warning-icon">⚠️</div>
              <h1>تم حظر حسابك</h1>
            </div>
            <div class="content">
              <p>عزيزي المستخدم،</p>
              <p>نأسف لإبلاغك أنه تم حظر حسابك من منصة التداول.</p>
              
              <div class="reason-box">
                <div class="reason-label">سبب الحظر:</div>
                <div class="reason-text">${reason}</div>
              </div>
              
              <p>إذا كنت تعتقد أن هذا خطأ أو لديك أي استفسار، يرجى التواصل مع فريق الدعم الفني:</p>
              
              <a href="${whatsappLink}" class="whatsapp-btn">
                📱 تواصل مع الدعم الفني
              </a>
            </div>
            <div class="footer">
              <p>رقم الدعم الفني: ${whatsappNumber}</p>
              <p>فريق منصة التداول</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Trading Platform <onboarding@resend.dev>",
        to: [email],
        subject: "إشعار حظر الحساب - منصة التداول",
        html: emailHtml,
      }),
    });

    if (!res.ok) {
      const errorData = await res.text();
      console.error("Resend API error:", errorData);
      // Don't throw - return success with warning so ban still works
      return new Response(JSON.stringify({ 
        success: true, 
        warning: "Email could not be sent - domain not verified on Resend",
        details: errorData 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const emailResponse = await res.json();
    console.log("Ban notification email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending ban notification:", error);
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

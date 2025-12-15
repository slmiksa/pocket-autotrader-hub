import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Function to convert base64url to Uint8Array
function base64UrlToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Function to convert Uint8Array to base64url
function uint8ArrayToBase64Url(uint8Array: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < uint8Array.byteLength; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Create VAPID JWT token
async function createVapidJwt(
  audience: string,
  subject: string,
  privateKeyBase64: string
): Promise<string> {
  const header = { alg: 'ES256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60,
    sub: subject
  };

  const headerBytes = new TextEncoder().encode(JSON.stringify(header));
  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
  
  const headerB64 = uint8ArrayToBase64Url(headerBytes);
  const payloadB64 = uint8ArrayToBase64Url(payloadBytes);
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import the private key
  const privateKeyBytes = base64UrlToUint8Array(privateKeyBase64);
  
  // Create ArrayBuffer from Uint8Array for importKey
  const keyBuffer = new ArrayBuffer(privateKeyBytes.length);
  const keyView = new Uint8Array(keyBuffer);
  keyView.set(privateKeyBytes);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  // Sign the token
  const signatureBuffer = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const signatureB64 = uint8ArrayToBase64Url(new Uint8Array(signatureBuffer));
  return `${unsignedToken}.${signatureB64}`;
}

// Simple push without encryption (tickle to wake service worker)
async function sendSimplePush(
  endpoint: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  try {
    const endpointUrl = new URL(endpoint);
    const audience = endpointUrl.origin;

    const jwt = await createVapidJwt(audience, 'mailto:support@tifue.com', vapidPrivateKey);
    const authHeader = `vapid t=${jwt}, k=${vapidPublicKey}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'TTL': '86400',
        'Urgency': 'high',
        'Content-Length': '0',
      },
    });
    
    if (response.ok || response.status === 201) {
      return { success: true, statusCode: response.status };
    } else {
      const errorText = await response.text();
      return { success: false, statusCode: response.status, error: errorText };
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Verify admin
    const authHeader = req.headers.get("Authorization");
    console.log("Auth header present:", !!authHeader);
    
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Use service role client to verify the token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    console.log("Auth result:", { userId: user?.id, error: authError?.message });
    
    if (authError || !user) {
      console.error("Auth error details:", authError);
      throw new Error("Unauthorized - invalid token");
    }

    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (roleError || !roleData) {
      throw new Error("User is not an admin");
    }

    // Get notification details
    const { title, body, targetUserIds } = await req.json();

    if (!title || !body) {
      throw new Error("Title and body are required");
    }

    console.log(`Admin sending notification: "${title}" to ${targetUserIds?.length > 0 ? targetUserIds.length + ' users' : 'all users'}`);

    // Get subscriptions based on target
    let subscriptionsQuery = supabase.from("push_subscriptions").select("*");
    
    if (targetUserIds && targetUserIds.length > 0) {
      subscriptionsQuery = subscriptionsQuery.in("user_id", targetUserIds);
    }

    const { data: subscriptions, error: subError } = await subscriptionsQuery;

    if (subError) {
      console.error("Error fetching subscriptions:", subError);
      throw subError;
    }

    console.log(`Found ${subscriptions?.length || 0} push subscriptions`);

    // Get unique user IDs
    const uniqueUserIds = subscriptions && subscriptions.length > 0 
      ? [...new Set(subscriptions.map(s => s.user_id))]
      : [];
    
    // Create notifications in database for realtime delivery (this triggers the app notification)
    if (uniqueUserIds.length > 0) {
      const notifications = uniqueUserIds.map(userId => ({
        user_id: userId,
        title,
        body,
        type: "admin_broadcast",
        data: { 
          sent_at: new Date().toISOString(),
          push_sent: true,
          show_browser_notification: true
        },
      }));

      const { error: notifError } = await supabase
        .from("user_notifications")
        .insert(notifications);

      if (notifError) {
        console.error("Error inserting notifications:", notifError);
      } else {
        console.log(`Created ${notifications.length} notification records for realtime delivery`);
      }
    }

    // Attempt to send Web Push notifications
    let pushSuccessCount = 0;
    let pushFailCount = 0;
    
    if (vapidPublicKey && vapidPrivateKey && subscriptions && subscriptions.length > 0) {
      console.log("VAPID keys configured, attempting push notifications...");
      
      for (const sub of subscriptions) {
        const result = await sendSimplePush(
          sub.endpoint,
          vapidPublicKey,
          vapidPrivateKey
        );
        
        if (result.success) {
          pushSuccessCount++;
          console.log(`Push sent to: ${sub.endpoint.substring(0, 50)}...`);
        } else {
          pushFailCount++;
          console.log(`Push failed for ${sub.endpoint.substring(0, 40)}: ${result.statusCode} - ${result.error?.substring(0, 50)}`);
          
          // If subscription is expired (410) or invalid (404), remove it
          if (result.statusCode === 410 || result.statusCode === 404) {
            console.log(`Removing expired subscription: ${sub.id}`);
            await supabase.from("push_subscriptions").delete().eq("id", sub.id);
          }
        }
      }
      
      console.log(`Push results: ${pushSuccessCount} success, ${pushFailCount} failed`);
    } else {
      console.log("VAPID keys not configured or no subscriptions - relying on realtime notifications only");
    }

    // Send email notifications for users who have email notifications enabled
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (resendApiKey && uniqueUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, email, email_notifications_enabled')
        .in('user_id', uniqueUserIds)
        .eq('email_notifications_enabled', true);

      if (profiles && profiles.length > 0) {
        const emailsToSend = profiles.filter(p => p.email).map(p => p.email);
        
        if (emailsToSend.length > 0) {
          const emailHtml = `
            <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 15px 15px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">🔔 ${title}</h1>
              </div>
              <div style="background: white; padding: 30px; border-radius: 0 0 15px 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                <p style="color: #333; font-size: 18px; line-height: 1.8; margin: 0;">${body}</p>
                <div style="text-align: center; margin-top: 25px;">
                  <a href="https://tifue.com" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; border-radius: 25px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
                    فتح التطبيق
                  </a>
                </div>
              </div>
              <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA. جميع الحقوق محفوظة.</p>
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
                to: emailsToSend,
                subject: `🔔 ${title}`,
                html: emailHtml,
              }),
            });
            console.log(`Email notifications sent to ${emailsToSend.length} users`);
          } catch (emailError) {
            console.error('Error sending email notifications:', emailError);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sentCount: uniqueUserIds.length,
        totalSubscriptions: subscriptions?.length || 0,
        uniqueUsers: uniqueUserIds.length,
        pushSuccessCount,
        pushFailCount,
        message: `تم إرسال الإشعار إلى ${uniqueUserIds.length} مستخدم`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in send-admin-push-notification:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

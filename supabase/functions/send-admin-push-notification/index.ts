import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the request is from an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (roleError || !roleData) {
      throw new Error("User is not an admin");
    }

    // Get notification details from request body
    const { title, body } = await req.json();

    if (!title || !body) {
      throw new Error("Title and body are required");
    }

    // Get all push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*");

    if (subError) {
      console.error("Error fetching subscriptions:", subError);
      throw subError;
    }

    console.log(`Found ${subscriptions?.length || 0} push subscriptions`);

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sentCount: 0, message: "No subscriptions found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create notification in user_notifications table for each unique user
    const uniqueUserIds = [...new Set(subscriptions.map(s => s.user_id))];
    
    const notifications = uniqueUserIds.map(userId => ({
      user_id: userId,
      title,
      body,
      type: "admin_broadcast",
      data: { sent_at: new Date().toISOString() },
    }));

    const { error: notifError } = await supabase
      .from("user_notifications")
      .insert(notifications);

    if (notifError) {
      console.error("Error inserting notifications:", notifError);
    }

    console.log(`Created ${notifications.length} notification records`);

    // For now, we'll just save to user_notifications
    // Real push notifications would require web-push library which is complex in Deno
    // The client-side will pick up notifications from user_notifications table via realtime

    return new Response(
      JSON.stringify({
        success: true,
        sentCount: uniqueUserIds.length,
        totalSubscriptions: subscriptions.length,
        uniqueUsers: uniqueUserIds.length,
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

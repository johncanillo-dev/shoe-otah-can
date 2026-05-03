import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const ADMIN_EMAIL = "admin@shoe-otah.com";

async function getActorFromSession(request: NextRequest) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return { supabase: null, actor: null, error: "Supabase service role not configured", status: 500 };
  }

  const sessionToken = request.headers.get("x-session-token")?.trim();
  if (!sessionToken) {
    return { supabase, actor: null, error: "Missing session token", status: 401 };
  }

  const { data: sessionData, error: sessionError } = await supabase
    .from("sessions")
    .select("user_id, is_active, expires_at")
    .eq("session_token", sessionToken)
    .maybeSingle();

  if (sessionError || !sessionData?.user_id || !sessionData.is_active) {
    return { supabase, actor: null, error: "Invalid session", status: 401 };
  }

  const expiresAt = new Date(sessionData.expires_at).getTime();
  if (Number.isFinite(expiresAt) && expiresAt < Date.now()) {
    return { supabase, actor: null, error: "Session expired", status: 401 };
  }

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id, email, isActive")
    .eq("id", sessionData.user_id)
    .maybeSingle();

  if (userError || !userData?.id || userData.isActive === false) {
    return { supabase, actor: null, error: "User not found or inactive", status: 401 };
  }

  return {
    supabase,
    actor: {
      id: userData.id,
      isAdmin: String(userData.email || "").toLowerCase() === ADMIN_EMAIL,
    },
  };
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await getActorFromSession(request);
  if (!auth.supabase) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status || 500 });
  }

  if (!auth.actor) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status || 401 });
  }

  const notificationId = params.id;

  const { data: notification, error: fetchError } = await auth.supabase
    .from("notifications")
    .select("id, recipient_user_id, recipient_role")
    .eq("id", notificationId)
    .maybeSingle();

  if (fetchError || !notification) {
    return NextResponse.json({ success: false, error: "Notification not found" }, { status: 404 });
  }

  const canUpdate =
    notification.recipient_user_id === auth.actor.id ||
    (auth.actor.isAdmin && notification.recipient_role === "admin");

  if (!canUpdate) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { error } = await auth.supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", notificationId);

  if (error) {
    return NextResponse.json({ success: false, error: "Failed to mark notification as read" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

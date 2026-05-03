import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type Actor = {
  id: string;
  email: string;
  isAdmin: boolean;
};

const ADMIN_EMAIL = "admin@shoe-otah.com";

async function getActorFromSession(request: NextRequest): Promise<{ actor: Actor | null; error?: string; status?: number }> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return { actor: null, error: "Supabase service role not configured", status: 500 };
  }

  const sessionToken = request.headers.get("x-session-token")?.trim();
  if (!sessionToken) {
    return { actor: null, error: "Missing session token", status: 401 };
  }

  const { data: sessionData, error: sessionError } = await supabase
    .from("sessions")
    .select("user_id, is_active, expires_at")
    .eq("session_token", sessionToken)
    .maybeSingle();

  if (sessionError || !sessionData?.user_id || !sessionData.is_active) {
    return { actor: null, error: "Invalid session", status: 401 };
  }

  const expiresAt = new Date(sessionData.expires_at).getTime();
  if (Number.isFinite(expiresAt) && expiresAt < Date.now()) {
    return { actor: null, error: "Session expired", status: 401 };
  }

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id, email, isActive")
    .eq("id", sessionData.user_id)
    .maybeSingle();

  if (userError || !userData?.id || userData.isActive === false) {
    return { actor: null, error: "User not found or inactive", status: 401 };
  }

  return {
    actor: {
      id: userData.id,
      email: String(userData.email || ""),
      isAdmin: String(userData.email || "").toLowerCase() === ADMIN_EMAIL,
    },
  };
}

function toNotificationRow(notification: any) {
  return {
    id: notification.id,
    recipientUserId: notification.recipient_user_id,
    recipientRole: notification.recipient_role,
    title: notification.title,
    message: notification.message,
    category: notification.category,
    relatedOrderId: notification.related_order_id,
    metadata: notification.metadata || {},
    isRead: notification.is_read,
    readAt: notification.read_at,
    createdBy: notification.created_by,
    createdAt: notification.created_at,
    updatedAt: notification.updated_at,
  };
}

export async function GET(request: NextRequest) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: "Supabase service role not configured" }, { status: 500 });
  }

  const auth = await getActorFromSession(request);
  if (!auth.actor) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status || 401 });
  }

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get("unreadOnly") === "true";
  const targetRole = searchParams.get("role");
  const limit = Math.min(Number(searchParams.get("limit") || 20), 100);

  let query = supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (auth.actor.isAdmin && targetRole === "admin") {
    query = query.or(`recipient_role.eq.admin,recipient_user_id.eq.${auth.actor.id}`);
  } else {
    query = query.eq("recipient_user_id", auth.actor.id);
  }

  if (unreadOnly) {
    query = query.eq("is_read", false);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch notifications" }, { status: 500 });
  }

  const rows = (data || []).map(toNotificationRow);
  const unreadCount = rows.filter((n) => !n.isRead).length;

  return NextResponse.json({
    success: true,
    notifications: rows,
    unreadCount,
  });
}

export async function POST(request: NextRequest) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: "Supabase service role not configured" }, { status: 500 });
  }

  const auth = await getActorFromSession(request);
  if (!auth.actor) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status || 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const recipientUserId = body?.recipientUserId ? String(body.recipientUserId) : null;
  const recipientRole = body?.recipientRole ? String(body.recipientRole) : null;
  const title = String(body?.title || "").trim();
  const message = String(body?.message || "").trim();
  const category = String(body?.category || "general").trim();
  const relatedOrderId = body?.relatedOrderId ? String(body.relatedOrderId) : null;
  const metadata = body?.metadata && typeof body.metadata === "object" ? body.metadata : {};

  if (!title || !message) {
    return NextResponse.json({ success: false, error: "title and message are required" }, { status: 400 });
  }

  if (!recipientUserId && !recipientRole) {
    return NextResponse.json({ success: false, error: "recipientUserId or recipientRole is required" }, { status: 400 });
  }

  const isSelfRecipient = recipientUserId === auth.actor.id;
  const canCreateNotification = auth.actor.isAdmin || recipientRole === "admin" || isSelfRecipient;
  if (!canCreateNotification) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  if (!auth.actor.isAdmin && recipientUserId && recipientUserId !== auth.actor.id) {
    return NextResponse.json({ success: false, error: "Forbidden recipient" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("notifications")
    .insert([
      {
        recipient_user_id: recipientUserId,
        recipient_role: recipientRole,
        title,
        message,
        category,
        related_order_id: relatedOrderId,
        metadata,
        created_by: auth.actor.id,
      },
    ])
    .select("*")
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ success: false, error: "Failed to create notification" }, { status: 500 });
  }

  return NextResponse.json({ success: true, notification: toNotificationRow(data) });
}

export async function PATCH(request: NextRequest) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: "Supabase service role not configured" }, { status: 500 });
  }

  const auth = await getActorFromSession(request);
  if (!auth.actor) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status || 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const markAllRead = body?.markAllRead === true;
  if (!markAllRead) {
    return NextResponse.json({ success: false, error: "Unsupported patch payload" }, { status: 400 });
  }

  let query = supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("is_read", false);

  if (auth.actor.isAdmin && body?.role === "admin") {
    query = query.or(`recipient_role.eq.admin,recipient_user_id.eq.${auth.actor.id}`);
  } else {
    query = query.eq("recipient_user_id", auth.actor.id);
  }

  const { error } = await query;

  if (error) {
    return NextResponse.json({ success: false, error: "Failed to mark notifications as read" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

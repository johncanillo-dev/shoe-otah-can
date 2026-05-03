export type NotificationRole = "customer" | "admin";

export type NotificationItem = {
  id: string;
  recipientUserId: string | null;
  recipientRole: NotificationRole | null;
  title: string;
  message: string;
  category: string;
  relatedOrderId: string | null;
  metadata: Record<string, unknown>;
  isRead: boolean;
  readAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateNotificationPayload = {
  recipientUserId?: string;
  recipientRole?: NotificationRole;
  title: string;
  message: string;
  category?: string;
  relatedOrderId?: string;
  metadata?: Record<string, unknown>;
};

const SESSION_TOKEN_KEY = "session_token";

function getSessionToken(): string {
  if (typeof window === "undefined") {
    return "";
  }
  return localStorage.getItem(SESSION_TOKEN_KEY) || "";
}

function getDefaultHeaders() {
  return {
    "Content-Type": "application/json",
    "x-session-token": getSessionToken(),
  };
}

async function handleResponse(response: Response) {
  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(
      `Request failed: ${response.status} ${response.statusText} - ${errorText}`
    ) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return response.json();
}

export async function fetchNotifications(options?: {
  unreadOnly?: boolean;
  role?: NotificationRole;
  limit?: number;
}): Promise<{ notifications: NotificationItem[]; unreadCount: number }> {
  const params = new URLSearchParams();
  if (options?.unreadOnly) params.set("unreadOnly", "true");
  if (options?.role) params.set("role", options.role);
  if (options?.limit) params.set("limit", String(options.limit));

  const query = params.toString();
  const url = query ? `/api/notifications?${query}` : "/api/notifications";

  const response = await fetch(url, {
    method: "GET",
    headers: getDefaultHeaders(),
    cache: "no-store",
  });

  const result = await handleResponse(response);
  return {
    notifications: result.notifications || [],
    unreadCount: Number(result.unreadCount || 0),
  };
}

export async function createNotification(
  payload: CreateNotificationPayload
): Promise<NotificationItem> {
  const response = await fetch("/api/notifications", {
    method: "POST",
    headers: getDefaultHeaders(),
    body: JSON.stringify(payload),
  });

  const result = await handleResponse(response);
  return result.notification;
}

export async function markNotificationAsRead(
  notificationId: string
): Promise<void> {
  const response = await fetch(`/api/notifications/${notificationId}/read`, {
    method: "PATCH",
    headers: getDefaultHeaders(),
  });

  await handleResponse(response);
}

export async function markAllNotificationsAsRead(
  role?: NotificationRole
): Promise<void> {
  const response = await fetch("/api/notifications", {
    method: "PATCH",
    headers: getDefaultHeaders(),
    body: JSON.stringify({ markAllRead: true, role }),
  });

  await handleResponse(response);
}

export async function sendCustomerNotification(input: {
  customerUserId: string;
  title: string;
  message: string;
  relatedOrderId?: string;
  category?: string;
}) {
  return createNotification({
    recipientUserId: input.customerUserId,
    recipientRole: "customer",
    title: input.title,
    message: input.message,
    relatedOrderId: input.relatedOrderId,
    category: input.category || "order_update",
  });
}

export async function sendAdminNotification(input: {
  title: string;
  message: string;
  relatedOrderId?: string;
  category?: string;
  actorUserId?: string;
}) {
  return createNotification({
    recipientRole: "admin",
    title: input.title,
    message: input.message,
    relatedOrderId: input.relatedOrderId,
    category: input.category || "admin_alert",
    metadata: input.actorUserId ? { actorUserId: input.actorUserId } : undefined,
  });
}
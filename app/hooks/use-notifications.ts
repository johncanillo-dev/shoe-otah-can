"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  NotificationItem,
  NotificationRole,
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/lib/notification-client";

export function useNotifications(userId?: string, isAdmin?: boolean) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const role: NotificationRole | undefined = isAdmin ? "admin" : undefined;

  const loadNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const sessionToken = typeof window !== "undefined" ? localStorage.getItem("session_token") : "";
    if (!sessionToken) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setIsLoading(true);
    try {
      const data = await fetchNotifications({ role, limit: 30 });
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      const status = typeof error === "object" && error && "status" in error ? Number((error as { status?: number }).status) : undefined;
      if (status === 401 || status === 403) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [role, userId]);

  const onMarkRead = useCallback(
    async (notificationId: string) => {
      try {
        await markNotificationAsRead(notificationId);
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notificationId
              ? { ...item, isRead: true, readAt: new Date().toISOString() }
              : item
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        return;
      }
    },
    []
  );

  const onMarkAllRead = useCallback(async () => {
    try {
      await markAllNotificationsAsRead(role);
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, isRead: true, readAt: item.readAt || new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch {
      return;
    }
  }, [role]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const userChannel = supabase
      .channel(`notifications-user-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `recipient_user_id=eq.${userId}`,
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    let adminChannel: ReturnType<typeof supabase.channel> | null = null;

    if (isAdmin) {
      adminChannel = supabase
        .channel("notifications-admin")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: "recipient_role=eq.admin",
          },
          () => {
            loadNotifications();
          }
        )
        .subscribe();
    }

    return () => {
      supabase.removeChannel(userChannel);
      if (adminChannel) {
        supabase.removeChannel(adminChannel);
      }
    };
  }, [isAdmin, loadNotifications, supabase, userId]);

  return {
    notifications,
    unreadCount,
    isLoading,
    refreshNotifications: loadNotifications,
    markAsRead: onMarkRead,
    markAllAsRead: onMarkAllRead,
  };
}

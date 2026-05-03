"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/app/hooks/use-notifications";
import styles from "./notification-bell.module.css";

function formatWhen(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

export function NotificationBell() {
  const { user, isAdmin, isLoggedIn } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications(user?.id, isAdmin);

  const shownNotifications = useMemo(() => notifications.slice(0, 15), [notifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isLoggedIn || !user?.id) {
    return null;
  }

  return (
    <div className={styles.wrapper} ref={rootRef}>
      <button
        type="button"
        className={styles.bellButton}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Notifications"
        title="Notifications"
      >
        🔔
      </button>

      {unreadCount > 0 && <span className={styles.badge}>{unreadCount > 99 ? "99+" : unreadCount}</span>}

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <p className={styles.headerTitle}>Notifications</p>
            {unreadCount > 0 && (
              <button className={styles.markAllBtn} onClick={() => markAllAsRead()}>
                Mark all read
              </button>
            )}
          </div>

          <div className={styles.list}>
            {isLoading && <div className={styles.empty}>Loading...</div>}

            {!isLoading && shownNotifications.length === 0 && (
              <div className={styles.empty}>You are all caught up.</div>
            )}

            {!isLoading &&
              shownNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`${styles.item} ${notification.isRead ? "" : styles.unread}`}
                >
                  <div className={styles.titleRow}>
                    <p className={styles.title}>{notification.title}</p>
                    {!notification.isRead && (
                      <button
                        className={styles.readBtn}
                        onClick={() => markAsRead(notification.id)}
                      >
                        Mark read
                      </button>
                    )}
                  </div>

                  <p className={styles.message}>{notification.message}</p>
                  <p className={styles.meta}>{formatWhen(notification.createdAt)}</p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

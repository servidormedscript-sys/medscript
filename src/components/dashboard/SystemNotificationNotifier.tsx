"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import type { UserNotification } from "@/lib/notifications/types";
import {
  useNotificationRealtime,
  usePollWhileVisible,
} from "@/hooks/useClinicRealtime";

const POLL_INTERVAL_MS = 8_000;

export default function SystemNotificationNotifier() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications ?? []);
      }
    } catch {
      // Ignora falhas temporárias de rede
    }
  }, []);

  usePollWhileVisible(loadNotifications, POLL_INTERVAL_MS);
  useNotificationRealtime(loadNotifications);

  const visibleNotifications = useMemo(
    () => notifications.filter((item) => !item.dismissed_at),
    [notifications]
  );

  async function dismissNotification(id: string) {
    setNotifications((current) => current.filter((item) => item.id !== id));

    await fetch(`/api/notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dismiss: true, read: true }),
    });
  }

  async function openNotification(notification: UserNotification) {
    await fetch(`/api/notifications/${notification.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read: true }),
    });

    if (notification.notification_type === "shift_assigned") {
      router.push("/dashboard/agenda");
    }
  }

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <aside
      className="pointer-events-none fixed bottom-4 right-4 z-[49] flex w-full max-w-sm flex-col gap-3"
      aria-live="polite"
      aria-label="Notificações do sistema"
    >
      {visibleNotifications.map((notification) => (
        <div
          key={notification.id}
          className="pointer-events-auto overflow-hidden rounded-lg border border-ocean-300 bg-ocean-50 shadow-lg"
        >
          <div className="flex items-start gap-2 p-3">
            <button
              type="button"
              onClick={() => openNotification(notification)}
              className="min-w-0 flex-1 text-left"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-ocean-900">
                {notification.title}
              </p>
              <p className="mt-1 text-sm text-navy-950">{notification.body}</p>
              <p className="mt-2 text-[11px] font-medium text-navy-800/75">
                Clique para abrir a agenda de plantões
              </p>
            </button>
            <button
              type="button"
              onClick={() => dismissNotification(notification.id)}
              className="shrink-0 rounded-md p-1 text-navy-800/45 transition-colors hover:bg-black/5 hover:text-navy-900"
              aria-label="Fechar notificação"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </aside>
  );
}

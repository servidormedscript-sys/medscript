"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const CLINIC_REALTIME_TABLES = [
  "patients",
  "patient_episodes",
  "patient_movements",
  "patient_care_items",
  "patient_medication_doses",
  "clinical_assessments",
  "documentation_cards",
  "documentation_files",
  "shift_schedules",
  "organizations",
  "organization_members",
  "profiles",
] as const;

const NOTIFICATION_REALTIME_TABLES = ["user_notifications"] as const;

export function useClinicRealtime(onRefresh: () => void, enabled = true) {
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    if (!enabled) return;

    let timeout: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefresh = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => onRefreshRef.current(), 350);
    };

    let supabase: ReturnType<typeof createClient> | null = null;
    try {
      supabase = createClient();
    } catch {
      return;
    }

    let channel = supabase.channel(`clinic-live-${Date.now()}`);

    for (const table of CLINIC_REALTIME_TABLES) {
      channel = channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        scheduleRefresh
      );
    }

    channel.subscribe();

    const onVisibility = () => {
      if (document.visibilityState === "visible") scheduleRefresh();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (timeout) clearTimeout(timeout);
      document.removeEventListener("visibilitychange", onVisibility);
      supabase?.removeChannel(channel);
    };
  }, [enabled]);
}

export function useNotificationRealtime(onRefresh: () => void, enabled = true) {
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    if (!enabled) return;

    let timeout: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefresh = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => onRefreshRef.current(), 200);
    };

    let supabase: ReturnType<typeof createClient> | null = null;
    try {
      supabase = createClient();
    } catch {
      return;
    }

    let channel = supabase.channel(`notifications-live-${Date.now()}`);

    for (const table of NOTIFICATION_REALTIME_TABLES) {
      channel = channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        scheduleRefresh
      );
    }

    channel.subscribe();

    return () => {
      if (timeout) clearTimeout(timeout);
      supabase?.removeChannel(channel);
    };
  }, [enabled]);
}

export function usePollWhileVisible(
  callback: () => void,
  intervalMs: number,
  enabled = true
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) return;

    const tick = () => {
      if (document.visibilityState === "visible") {
        callbackRef.current();
      }
    };

    tick();
    const interval = window.setInterval(tick, intervalMs);
    const onVisibility = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, intervalMs]);
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { pendingCount } from "./queue";
import { flushSyncQueue } from "./engine";

export function useOnlineStatus() {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return online;
}

export function useSyncStatus() {
  const online = useOnlineStatus();
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const checkPending = useCallback(async () => {
    const count = await pendingCount();
    setPending(count);
  }, []);

  // Check pending count periodically
  useEffect(() => {
    checkPending();
    const interval = setInterval(checkPending, 5000);
    return () => clearInterval(interval);
  }, [checkPending]);

  // Auto-flush when coming back online
  useEffect(() => {
    if (online && pending > 0 && !syncing) {
      setSyncing(true);
      flushSyncQueue().then(({ synced, failed }) => {
        setSyncing(false);
        checkPending();
        if (failed > 0) {
          console.warn(`Sync: ${synced} synced, ${failed} failed`);
        }
      });
    }
  }, [online, pending, syncing, checkPending]);

  const status: "synced" | "pending" | "offline" = !online
    ? "offline"
    : pending > 0
    ? "pending"
    : "synced";

  return { status, pending, syncing };
}

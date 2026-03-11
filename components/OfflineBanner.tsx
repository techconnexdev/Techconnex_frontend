"use client";

import { WifiOff } from "lucide-react";
import { useOffline } from "@/contexts/OfflineContext";

export function OfflineBanner() {
  const { isOffline } = useOffline();

  if (!isOffline) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed left-0 right-0 top-0 z-[100] flex items-center justify-center gap-2 bg-amber-600 px-4 py-3 text-center text-sm font-medium text-white shadow-md"
    >
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden />
      <span>
        No internet connection. Please connect to Wi-Fi or mobile data. The
        service will resume automatically when the connection is restored.
      </span>
    </div>
  );
}

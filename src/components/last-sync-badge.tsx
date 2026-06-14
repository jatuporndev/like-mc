"use client";

import { formatDistanceToNow } from "date-fns";
import { RefreshCw } from "lucide-react";

import { useSyncLog } from "@/hooks/useAdmin";

/**
 * Subtle, read-only indicator of when match data was last synced from
 * football-data.org. Visible to any signed-in player.
 */
export function LastSyncBadge() {
  const { data: syncLog } = useSyncLog();
  if (!syncLog?.lastSyncAt) return null;

  const when = new Date(syncLog.lastSyncAt);

  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
      title={when.toLocaleString()}
    >
      <RefreshCw className="h-3 w-3" />
      Data updated {formatDistanceToNow(when, { addSuffix: true })}
    </span>
  );
}

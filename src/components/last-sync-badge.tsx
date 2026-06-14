"use client";

import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import { RefreshCw } from "lucide-react";

import { useSyncLog } from "@/hooks/useAdmin";
import { useI18n } from "@/lib/i18n/context";

/**
 * Subtle, read-only indicator of when match data was last synced from
 * football-data.org. Visible to any signed-in player.
 */
export function LastSyncBadge() {
  const { data: syncLog } = useSyncLog();
  const { t, lang } = useI18n();
  if (!syncLog?.lastSyncAt) return null;

  const when = new Date(syncLog.lastSyncAt);
  const ago = formatDistanceToNow(when, {
    addSuffix: true,
    locale: lang === "th" ? th : undefined,
  });

  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
      title={when.toLocaleString()}
    >
      <RefreshCw className="h-3 w-3" />
      {t("dash.dataUpdated")} {ago}
    </span>
  );
}

import { type NextRequest } from "next/server";

import { requireSyncCaller } from "@/server/auth";
import { handleError, ok } from "@/lib/http";
import {
  recalculateAllPoints,
  syncMatchesFromFootballAPI,
  writeSyncLog,
} from "@/server/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Allow extra time for the upstream fetch + batched writes.
export const maxDuration = 60;

/**
 * Sync World Cup matches from football-data.org into Firestore, then recalculate
 * points so newly-finished results are reflected on the leaderboard.
 *
 * Auth: either a SYNC_SECRET bearer token (Google Apps Script / cron) or an
 * admin user's Firebase ID token (the in-app "Sync" button).
 */
export async function POST(req: NextRequest) {
  let source: "cron" | "manual" = "cron";
  try {
    source = await requireSyncCaller(req);

    const matchesProcessed = await syncMatchesFromFootballAPI();
    const usersUpdated = await recalculateAllPoints();

    await writeSyncLog({
      matchesProcessed,
      ok: true,
      message: `Synced ${matchesProcessed} matches; updated ${usersUpdated} users.`,
      source,
    });

    return ok({ matchesProcessed, usersUpdated, source });
  } catch (error) {
    // Best-effort failure log; ignore secondary errors.
    await writeSyncLog({
      matchesProcessed: 0,
      ok: false,
      message: error instanceof Error ? error.message : "Sync failed.",
      source,
    }).catch(() => undefined);
    return handleError(error);
  }
}

import { type NextRequest } from "next/server";

import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, META_DOCS } from "@/lib/constants";
import { requireSyncCaller } from "@/server/auth";
import { handleError, ok } from "@/lib/http";
import {
  recalculateAllPoints,
  syncMatchesFromFootballAPI,
  syncScorersFromFootballAPI,
  syncStandingsFromFootballAPI,
  writeSyncLog,
} from "@/server/sync";
import type { SyncLog } from "@/types";

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

    // Single meta/sync read shared by Fix #1 (the recalc gate) and Fix #5 (the
    // changed-only match writes), so the common "nothing changed" sync costs
    // ~1 read instead of ~500.
    const prevSnap = await adminDb
      .collection(COLLECTIONS.meta)
      .doc(META_DOCS.sync)
      .get();
    const prev = prevSnap.exists ? (prevSnap.data() as SyncLog) : null;

    const { matchesProcessed, matchesWritten, signature, hashes } =
      await syncMatchesFromFootballAPI(prev?.matchHashes ?? {});

    // Fix #1: only recalculate points when a result-affecting field actually
    // changed. Mid-match score updates (winner still null) produce the same
    // signature, so we skip the ~500-read recalc that would yield identical numbers.
    //
    // Exception: if the meta/picks mirror (C2) was never built (fresh deploy),
    // force one recalc so it self-seeds on the first run — recalc is what
    // rebuilds meta/picks. After that the `picksBuilt` flag keeps the gate closed.
    const resultsChanged = signature !== (prev?.resultsSignature ?? "");
    const needsPicksSeed = !prev?.picksBuilt;
    const recalculated = resultsChanged || needsPicksSeed;
    const usersUpdated = recalculated ? await recalculateAllPoints() : 0;

    // Top scorers are a nice-to-have side panel; a scorers fetch failure (rate
    // limit, pre-tournament empty, upstream blip) must not fail the match sync.
    let scorersProcessed = 0;
    try {
      scorersProcessed = await syncScorersFromFootballAPI();
    } catch {
      scorersProcessed = 0;
    }

    // Group standings are likewise supplementary — never let them fail the sync.
    let standingsProcessed = 0;
    try {
      standingsProcessed = await syncStandingsFromFootballAPI();
    } catch {
      standingsProcessed = 0;
    }

    await writeSyncLog({
      matchesProcessed,
      ok: true,
      message: `Synced ${matchesProcessed} matches (${matchesWritten} changed), ${scorersProcessed} scorers, ${standingsProcessed} groups; ${
        recalculated
          ? `updated ${usersUpdated} users`
          : "no result changes — recalc skipped"
      }.`,
      source,
      resultsSignature: signature,
      matchHashes: hashes,
      // Once a recalc runs, meta/picks has been (re)built — record it so the
      // self-seed exception above fires only on a truly fresh deploy.
      picksBuilt: true,
    });

    return ok({
      matchesProcessed,
      matchesWritten,
      scorersProcessed,
      standingsProcessed,
      usersUpdated,
      recalculated,
      source,
    });
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

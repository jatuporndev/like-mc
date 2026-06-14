import "server-only";

import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, META_DOCS } from "@/lib/constants";
import { fetchWorldCupMatches } from "@/lib/football/api";
import { calculateUserPoints } from "@/lib/scoring";
import type { Match, Prediction, SyncLog, UserProfile } from "@/types";

/**
 * Fetch all World Cup matches from football-data.org and upsert them into
 * Firestore. Writes are batched (Firestore caps batches at 500 ops). Returns
 * the number of matches processed.
 */
export async function syncMatchesFromFootballAPI(): Promise<number> {
  const matches = await fetchWorldCupMatches();

  const col = adminDb.collection(COLLECTIONS.matches);
  let batch = adminDb.batch();
  let opsInBatch = 0;

  for (const match of matches) {
    batch.set(col.doc(match.matchId), match, { merge: true });
    opsInBatch += 1;
    if (opsInBatch === 450) {
      await batch.commit();
      batch = adminDb.batch();
      opsInBatch = 0;
    }
  }
  if (opsInBatch > 0) await batch.commit();

  return matches.length;
}

/** Record the outcome of a sync run at meta/sync. */
export async function writeSyncLog(
  log: Omit<SyncLog, "lastSyncAt"> & { lastSyncAt?: string }
): Promise<void> {
  const payload: SyncLog = {
    lastSyncAt: log.lastSyncAt ?? new Date().toISOString(),
    matchesProcessed: log.matchesProcessed,
    ok: log.ok,
    message: log.message,
    source: log.source,
  };
  await adminDb
    .collection(COLLECTIONS.meta)
    .doc(META_DOCS.sync)
    .set(payload, { merge: true });
}

/**
 * Recompute every user's points from their predictions against current match
 * results. Returns the number of users updated. Used by the recalculate
 * endpoint and automatically after a sync so the leaderboard stays in step.
 */
export async function recalculateAllPoints(): Promise<number> {
  const [matchesSnap, usersSnap, predictionsSnap] = await Promise.all([
    adminDb.collection(COLLECTIONS.matches).get(),
    adminDb.collection(COLLECTIONS.users).get(),
    adminDb.collection(COLLECTIONS.predictions).get(),
  ]);

  const matchesById = new Map<string, Match>();
  matchesSnap.forEach((d) => matchesById.set(d.id, d.data() as Match));

  // Group predictions by user.
  const predictionsByUser = new Map<string, Prediction[]>();
  predictionsSnap.forEach((d) => {
    const p = d.data() as Prediction;
    const list = predictionsByUser.get(p.userId) ?? [];
    list.push(p);
    predictionsByUser.set(p.userId, list);
  });

  let batch = adminDb.batch();
  let opsInBatch = 0;
  let updated = 0;

  for (const userDoc of usersSnap.docs) {
    const user = userDoc.data() as UserProfile;
    const predictions = predictionsByUser.get(user.uid) ?? [];
    const points = calculateUserPoints(predictions, matchesById);

    if (points !== user.points) {
      batch.update(userDoc.ref, {
        points,
        updatedAt: new Date().toISOString(),
      });
      opsInBatch += 1;
      updated += 1;
      if (opsInBatch === 450) {
        await batch.commit();
        batch = adminDb.batch();
        opsInBatch = 0;
      }
    }
  }

  if (opsInBatch > 0) await batch.commit();
  return updated;
}

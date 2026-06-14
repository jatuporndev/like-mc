import "server-only";

import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, META_DOCS } from "@/lib/constants";
import { fetchWorldCupMatches, fetchWorldCupScorers } from "@/lib/football/api";
import { calculateUserPoints } from "@/lib/scoring";
import type {
  Match,
  Prediction,
  ScorersDoc,
  SyncLog,
  UserProfile,
} from "@/types";

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

/**
 * Fetch the current top scorers from football-data.org and store them as a
 * single snapshot at meta/scorers (fully replaced, not merged, so dropped
 * players don't linger). Returns the number of scorers stored.
 */
export async function syncScorersFromFootballAPI(): Promise<number> {
  const scorers = await fetchWorldCupScorers();
  const payload: ScorersDoc = {
    scorers,
    updatedAt: new Date().toISOString(),
  };
  await adminDb
    .collection(COLLECTIONS.meta)
    .doc(META_DOCS.scorers)
    .set(payload);
  return scorers.length;
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
    const points = calculateUserPoints(predictions, matchesById, user.championPick);

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

/**
 * Permanently remove a user from the game: their predictions, their profile
 * document, and their Firebase Auth account (so the same Google login can't
 * silently re-create the profile on next sign-in).
 *
 * Predictions are deleted in batches (Firestore caps batches at 500 ops). The
 * Auth deletion is best-effort — if the account is already gone we still want
 * the Firestore cleanup to count as success. Returns the number of predictions
 * removed.
 */
export async function deleteUserCompletely(uid: string): Promise<number> {
  const predictionsSnap = await adminDb
    .collection(COLLECTIONS.predictions)
    .where("userId", "==", uid)
    .get();

  let batch = adminDb.batch();
  let opsInBatch = 0;

  for (const predictionDoc of predictionsSnap.docs) {
    batch.delete(predictionDoc.ref);
    opsInBatch += 1;
    if (opsInBatch === 450) {
      await batch.commit();
      batch = adminDb.batch();
      opsInBatch = 0;
    }
  }

  batch.delete(adminDb.collection(COLLECTIONS.users).doc(uid));
  await batch.commit();

  try {
    await adminAuth.deleteUser(uid);
  } catch (error) {
    // auth/user-not-found just means the account was already removed.
    const code = (error as { code?: string })?.code;
    if (code !== "auth/user-not-found") throw error;
  }

  return predictionsSnap.size;
}

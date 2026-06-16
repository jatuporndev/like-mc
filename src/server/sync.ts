import "server-only";

import { createHash } from "crypto";
import { FieldValue } from "firebase-admin/firestore";

import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, META_DOCS } from "@/lib/constants";
import {
  fetchWorldCupMatches,
  fetchWorldCupScorers,
  fetchWorldCupStandings,
} from "@/lib/football/api";
import { calculateUserPoints } from "@/lib/scoring";
import type {
  Match,
  PicksDoc,
  Prediction,
  ScorersDoc,
  StandingsDoc,
  SyncLog,
  UserProfile,
} from "@/types";

/**
 * Stable content hash of a match, excluding the volatile `updatedAt` stamp
 * (which `mapMatch` sets to "now" on every fetch and would otherwise make every
 * match look changed). Any meaningful field — score, status, winner, kickoff,
 * lock, teams — still changes the hash and triggers a write.
 */
function hashMatch(match: Match): string {
  const { updatedAt: _updatedAt, ...stable } = match;
  return createHash("sha1").update(JSON.stringify(stable)).digest("hex");
}

/**
 * Compact signature of every result-affecting field across all matches. It only
 * changes when something that can move the leaderboard changes (a winner is set,
 * a team advances a knockout round), so the sync route can skip a recalculation
 * that would produce identical numbers.
 */
function resultsSignature(matches: Match[]): string {
  return matches
    .map(
      (m) =>
        `${m.matchId}:${m.winner ?? ""}:${m.stage}:${m.homeTeam}:${m.awayTeam}`
    )
    .sort()
    .join("|");
}

/** Outcome of a match sync, carrying the bookkeeping the route persists. */
export interface MatchSyncResult {
  /** Total matches returned by the upstream feed. */
  matchesProcessed: number;
  /** How many docs actually changed and were written this run. */
  matchesWritten: number;
  /** Results signature for Fix #1's recalc gate. */
  signature: string;
  /** matchId -> content hash, persisted for Fix #5's changed-only writes. */
  hashes: Record<string, string>;
}

/**
 * Fetch all World Cup matches from football-data.org and upsert the ones that
 * actually changed since the last sync (Fix #5). `previousHashes` is the map the
 * route loaded from meta/sync; any match whose content hash is unchanged is
 * skipped. Writes are batched (Firestore caps batches at 500 ops). Returns the
 * new signature + hash map alongside the counts.
 */
export async function syncMatchesFromFootballAPI(
  previousHashes: Record<string, string> = {}
): Promise<MatchSyncResult> {
  const matches = await fetchWorldCupMatches();

  const col = adminDb.collection(COLLECTIONS.matches);
  let batch = adminDb.batch();
  let opsInBatch = 0;
  let matchesWritten = 0;

  const hashes: Record<string, string> = {};

  for (const match of matches) {
    const hash = hashMatch(match);
    hashes[match.matchId] = hash;

    // Identical to last sync → nothing to write.
    if (previousHashes[match.matchId] === hash) continue;

    batch.set(col.doc(match.matchId), match, { merge: true });
    matchesWritten += 1;
    opsInBatch += 1;
    if (opsInBatch === 450) {
      await batch.commit();
      batch = adminDb.batch();
      opsInBatch = 0;
    }
  }
  if (opsInBatch > 0) await batch.commit();

  return {
    matchesProcessed: matches.length,
    matchesWritten,
    signature: resultsSignature(matches),
    hashes,
  };
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

/**
 * Fetch the current group standings from football-data.org and store them as a
 * single snapshot at meta/standings (fully replaced, not merged, so teams that
 * drop out of a table don't linger). Returns the number of groups stored.
 */
export async function syncStandingsFromFootballAPI(): Promise<number> {
  const groups = await fetchWorldCupStandings();
  const payload: StandingsDoc = {
    groups,
    updatedAt: new Date().toISOString(),
  };
  await adminDb
    .collection(COLLECTIONS.meta)
    .doc(META_DOCS.standings)
    .set(payload);
  return groups.length;
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
  // Only persist the Fix #1/#5 bookkeeping when supplied — the failure-path log
  // omits them so a merge keeps the last good signature + hashes intact.
  if (log.resultsSignature !== undefined) {
    payload.resultsSignature = log.resultsSignature;
  }
  if (log.matchHashes !== undefined) {
    payload.matchHashes = log.matchHashes;
  }
  if (log.picksBuilt !== undefined) {
    payload.picksBuilt = log.picksBuilt;
  }
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

  const usersById = new Map<string, UserProfile>();
  usersSnap.forEach((d) => usersById.set(d.id, d.data() as UserProfile));

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
    // The champion bonus is persisted too (C1) so the leaderboard can show the
    // breakdown from the user doc alone, without re-reading every match.
    const { points, championBonus } = calculateUserPoints(
      predictions,
      matchesById,
      user.championPick
    );

    if (points !== user.points || championBonus !== (user.championBonus ?? 0)) {
      batch.update(userDoc.ref, {
        points,
        championBonus,
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

  // Safety net for the meta/picks mirror (C2): rebuild it from the authoritative
  // predictions + users we already loaded above, so any drift from the
  // incremental per-pick writes self-heals. Reuses the snapshots — no extra reads.
  const picks: PicksDoc["picks"] = {};
  predictionsSnap.forEach((d) => {
    const p = d.data() as Prediction;
    const u = usersById.get(p.userId);
    if (!u) return; // orphan prediction (user removed)
    (picks[p.matchId] ??= {})[p.userId] = {
      displayName: u.displayName,
      photoURL: u.photoURL,
      pickedTeam: p.pickedTeam,
    };
  });
  await adminDb
    .collection(COLLECTIONS.meta)
    .doc(META_DOCS.picks)
    .set({ picks, updatedAt: new Date().toISOString() } satisfies PicksDoc);

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

  // Strip the user from the aggregated meta/picks mirror (C2) so their picks
  // disappear from the board immediately, rather than lingering until the next
  // recalc rebuild. One merge write with a FieldValue.delete() per picked match.
  if (predictionsSnap.size > 0) {
    const picksPatch: Record<string, Record<string, FieldValue>> = {};
    predictionsSnap.forEach((d) => {
      const { matchId } = d.data() as Prediction;
      (picksPatch[matchId] ??= {})[uid] = FieldValue.delete();
    });
    await adminDb
      .collection(COLLECTIONS.meta)
      .doc(META_DOCS.picks)
      .set(
        { picks: picksPatch, updatedAt: new Date().toISOString() },
        { merge: true }
      );
  }

  try {
    await adminAuth.deleteUser(uid);
  } catch (error) {
    // auth/user-not-found just means the account was already removed.
    const code = (error as { code?: string })?.code;
    if (code !== "auth/user-not-found") throw error;
  }

  return predictionsSnap.size;
}

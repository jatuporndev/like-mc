/**
 * Shared domain types for the World Cup prediction game.
 *
 * Firestore stores timestamps as ISO strings (set server-side) to keep the
 * client/server boundary simple and serializable through API routes and
 * React Query caches.
 */

export type Outcome = "HOME_TEAM" | "DRAW" | "AWAY_TEAM";

export type MatchStatus =
  | "SCHEDULED"
  | "TIMED"
  | "IN_PLAY"
  | "PAUSED"
  | "FINISHED"
  | "SUSPENDED"
  | "POSTPONED"
  | "CANCELLED";

/** A national team as we store it (subset of the football-data payload). */
export interface Team {
  id: number | null;
  name: string;
  shortName: string;
  tla: string;
  crest: string | null;
}

/** A World Cup match document. Document id === `matchId`. */
export interface Match {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamShort: string;
  awayTeamShort: string;
  homeCrest: string | null;
  awayCrest: string | null;
  /** ISO 8601 kickoff timestamp (UTC). */
  kickoff: string;
  stage: string;
  group: string | null;
  status: MatchStatus;
  /**
   * On-pitch score at the end of play (90' + extra time), excluding any penalty
   * shootout. For shootout matches the upstream `fullTime` *adds* the shootout
   * goals on top, so the sync subtracts them back out to keep this the real
   * result (e.g. a 1–1 that went to penalties stays 1–1, not 4–5).
   */
  homeScore: number | null;
  awayScore: number | null;
  /**
   * How the match was decided: "REGULAR" | "EXTRA_TIME" | "PENALTY_SHOOTOUT".
   * Optional — absent on match docs synced before shootout support existed.
   */
  duration?: string;
  /** Shootout score, only set when `duration === "PENALTY_SHOOTOUT"`. */
  homePenalties?: number | null;
  awayPenalties?: number | null;
  /** Final result once decided; null while pending. */
  winner: Outcome | null;
  /** True once kickoff has passed — predictions are frozen. */
  locked: boolean;
  updatedAt: string;
}

/** A user profile document. Document id === Firebase UID. */
export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  points: number;
  /**
   * Portion of `points` from the tiered champion-pick bonus, persisted by
   * `recalculateAllPoints` so the leaderboard can show the breakdown without
   * re-reading every match. Absent on profiles synced before this field
   * existed; treated as 0 until the next recalc fills it in.
   */
  championBonus?: number;
  /** Team name of the predicted champion, or null if not yet picked. */
  championPick: string | null;
  championPickedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** A single match prediction. Document id === `${userId}_${matchId}`. */
export interface Prediction {
  userId: string;
  matchId: string;
  pickedTeam: Outcome;
  createdAt: string;
  updatedAt: string;
}

/** Leaderboard row (derived from user profiles). */
export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  photoURL: string | null;
  points: number;
  /** Portion of `points` earned from the tiered champion-pick bonus. */
  championBonus: number;
  championPick: string | null;
  rank: number;
}

/** A top scorer synced from football-data.org. Part of the meta/scorers doc. */
export interface Scorer {
  playerId: number | null;
  playerName: string;
  nationality: string | null;
  teamName: string;
  teamCrest: string | null;
  goals: number;
  assists: number | null;
  penalties: number | null;
  playedMatches: number | null;
}

/** Top-scorers snapshot, fully replaced each sync. Stored at meta/scorers. */
export interface ScorersDoc {
  scorers: Scorer[];
  updatedAt: string;
}

/** One row of a group standings table, synced from football-data.org. */
export interface StandingRow {
  position: number;
  teamId: number | null;
  teamName: string;
  teamShort: string;
  teamCrest: string | null;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  /** Recent form like "W,D,L" when the feed provides it, else null. */
  form: string | null;
}

/** A single group's standings table. */
export interface StandingsGroup {
  /** Raw group code from the feed, e.g. "GROUP_A". */
  group: string;
  table: StandingRow[];
}

/** Group standings snapshot, fully replaced each sync. Stored at meta/standings. */
export interface StandingsDoc {
  groups: StandingsGroup[];
  updatedAt: string;
}

/** Metadata about the most recent sync run. Stored at meta/sync. */
export interface SyncLog {
  lastSyncAt: string;
  matchesProcessed: number;
  ok: boolean;
  message: string;
  /** "manual" (admin user) or "cron" (bearer token). */
  source: string;
  /**
   * Compact signature of every match's result-affecting fields (winner, stage,
   * teams). The sync route compares it to the previous run to decide whether a
   * points recalculation is actually needed (Fix #1).
   */
  resultsSignature?: string;
  /**
   * matchId -> content hash of the full match doc, used to write only the
   * matches that actually changed since the last sync (Fix #5). Shares this doc
   * so reading it costs the same single read as the signature above.
   */
  matchHashes?: Record<string, string>;
  /**
   * Whether the aggregated meta/picks mirror (C2) has ever been built. The sync
   * route forces one recalc when this is missing so a fresh deploy self-seeds
   * meta/picks on the first run, instead of staying empty until a result changes.
   */
  picksBuilt?: boolean;
}

/** One player's pick on a match, as mirrored into the meta/picks doc. */
export interface PickEntry {
  displayName: string;
  photoURL: string | null;
  pickedTeam: Outcome;
}

/**
 * Aggregated "who picked what" mirror. Stored at meta/picks so the dashboard can
 * read every player's picks in a single document/listener instead of scanning
 * the whole `predictions` collection. This is a derived mirror — the `predictions`
 * collection remains the source of truth, and the cron rebuilds this doc from it.
 *
 * Shape: matchId -> uid -> pick. A nested map (rather than arrays) lets the
 * prediction API update or delete a single player's pick with one field-path
 * write and no read.
 */
export interface PicksDoc {
  picks: Record<string, Record<string, PickEntry>>;
  updatedAt: string;
}

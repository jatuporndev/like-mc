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
  homeScore: number | null;
  awayScore: number | null;
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
}

import {
  CHAMPION_BONUS,
  KNOCKOUT_STAGE_RANK,
  POINTS_PER_CORRECT,
} from "@/lib/constants";
import type { LeaderboardEntry, Match, Outcome, Prediction, UserProfile } from "@/types";

export type PredictionResult = "correct" | "wrong" | "pending";

/** Normalize a team name for tolerant comparison (case/whitespace-insensitive). */
function normalizeTeamName(name: string): string {
  return name.trim().toLowerCase();
}

function teamsMatch(a: string, b: string): boolean {
  return normalizeTeamName(a) === normalizeTeamName(b);
}

/**
 * Tiered bonus for a user's champion pick, based on the furthest knockout round
 * the picked team reached. A team that wins the final earns `WINNER`; otherwise
 * the deepest stage it appears in (final / semi / quarter) decides the bonus.
 *
 * Pure: derived entirely from the match documents, so it stays correct after
 * any sync without extra bookkeeping. Returns 0 if the pick never reached the
 * knockouts (or no pick was made).
 */
export function championBonusPoints(
  championPick: string | null | undefined,
  matches: Iterable<Match>
): number {
  if (!championPick) return 0;

  let deepestRank = 0;
  let final: Match | null = null;

  for (const match of matches) {
    if (match.stage === "FINAL") final = match;

    const rank = KNOCKOUT_STAGE_RANK[match.stage];
    if (!rank) continue;
    if (teamsMatch(match.homeTeam, championPick) || teamsMatch(match.awayTeam, championPick)) {
      deepestRank = Math.max(deepestRank, rank);
    }
  }

  // Won the trophy: the final is decided and the picked team is the winner.
  if (final?.winner) {
    const winningTeam = final.winner === "HOME_TEAM" ? final.homeTeam : final.awayTeam;
    if (teamsMatch(winningTeam, championPick)) return CHAMPION_BONUS.WINNER;
  }

  // Otherwise award by furthest round reached.
  switch (deepestRank) {
    case KNOCKOUT_STAGE_RANK.FINAL:
      return CHAMPION_BONUS.FINAL;
    case KNOCKOUT_STAGE_RANK.SEMI_FINALS:
      return CHAMPION_BONUS.SEMI_FINAL;
    case KNOCKOUT_STAGE_RANK.QUARTER_FINALS:
      return CHAMPION_BONUS.QUARTER_FINAL;
    default:
      return 0;
  }
}

/**
 * Determine whether a prediction is correct, wrong, or still pending.
 * A result is only known once the match has a decided `winner`.
 */
export function calculatePredictionResult(
  pickedTeam: Outcome | null | undefined,
  match: Pick<Match, "winner" | "status">
): PredictionResult {
  if (!pickedTeam || !match.winner) return "pending";
  return pickedTeam === match.winner ? "correct" : "wrong";
}

/** Points earned for a single prediction against a match. */
export function pointsForPrediction(
  pickedTeam: Outcome,
  match: Pick<Match, "winner" | "status">
): number {
  return calculatePredictionResult(pickedTeam, match) === "correct"
    ? POINTS_PER_CORRECT
    : 0;
}

/**
 * Compute one user's score breakdown: `matchPoints` (1 per correct match
 * prediction), `championBonus` (the tiered champion-pick bonus), and their sum
 * as `points`. Pure function — the champion bonus is computed once here so
 * callers can persist the breakdown without recomputing it.
 */
export function calculateUserPoints(
  predictions: Prediction[],
  matchesById: Map<string, Match>,
  championPick?: string | null
): { points: number; matchPoints: number; championBonus: number } {
  let matchPoints = 0;
  for (const p of predictions) {
    const match = matchesById.get(p.matchId);
    if (match) matchPoints += pointsForPrediction(p.pickedTeam, match);
  }
  const championBonus = championBonusPoints(championPick, matchesById.values());
  return { points: matchPoints + championBonus, matchPoints, championBonus };
}

/**
 * Build a ranked leaderboard from user profiles. Sorted by points desc, then
 * display name asc for stable ordering. Ranks share numbers on ties (1,2,2,4).
 *
 * The champion-pick bonus surfaced as `championBonus` comes from each user's
 * stored `championBonus` field (persisted by `recalculateAllPoints`), so the
 * leaderboard needs no match data. Pass `matches` only to recompute the bonus
 * on the fly (e.g. a preview before a recalc has run); otherwise the stored
 * value — falling back to 0 on profiles predating the field — is used.
 */
export function calculateLeaderboard(
  users: UserProfile[],
  matches?: Iterable<Match>
): LeaderboardEntry[] {
  const matchList = matches ? [...matches] : [];

  const sorted = [...users].sort(
    (a, b) =>
      b.points - a.points ||
      a.displayName.localeCompare(b.displayName)
  );

  let lastPoints: number | null = null;
  let lastRank = 0;

  return sorted.map((u, index) => {
    const rank = lastPoints === u.points ? lastRank : index + 1;
    lastPoints = u.points;
    lastRank = rank;
    return {
      uid: u.uid,
      displayName: u.displayName,
      photoURL: u.photoURL,
      points: u.points,
      championBonus: matchList.length
        ? championBonusPoints(u.championPick, matchList)
        : u.championBonus ?? 0,
      championPick: u.championPick,
      rank,
    };
  });
}

/** A match is locked for predictions once kickoff has passed. */
export function lockPrediction(
  match: Pick<Match, "kickoff">,
  now: Date = new Date()
): boolean {
  return new Date(match.kickoff).getTime() <= now.getTime();
}

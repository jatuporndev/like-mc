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
 * Compute total points for one user: 1 per correct match prediction plus the
 * tiered champion bonus for how far their champion pick advanced. Pure function
 * — used by the recalculate endpoint and tests.
 */
export function calculateUserPoints(
  predictions: Prediction[],
  matchesById: Map<string, Match>,
  championPick?: string | null
): number {
  let total = 0;
  for (const p of predictions) {
    const match = matchesById.get(p.matchId);
    if (match) total += pointsForPrediction(p.pickedTeam, match);
  }
  total += championBonusPoints(championPick, matchesById.values());
  return total;
}

/**
 * Build a ranked leaderboard from user profiles. Sorted by points desc, then
 * display name asc for stable ordering. Ranks share numbers on ties (1,2,2,4).
 *
 * Pass `matches` to surface each player's champion-pick bonus as `championBonus`
 * (the rest of their total is match-prediction points). Omit it — e.g. on a
 * preview that hasn't loaded matches — and the bonus is reported as 0.
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
      championBonus: matchList.length ? championBonusPoints(u.championPick, matchList) : 0,
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

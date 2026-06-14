import { POINTS_PER_CORRECT } from "@/lib/constants";
import type { LeaderboardEntry, Match, Outcome, Prediction, UserProfile } from "@/types";

export type PredictionResult = "correct" | "wrong" | "pending";

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
 * Compute total points for one user given all their predictions and a lookup
 * of matches by id. Pure function — used by the recalculate endpoint and tests.
 */
export function calculateUserPoints(
  predictions: Prediction[],
  matchesById: Map<string, Match>
): number {
  let total = 0;
  for (const p of predictions) {
    const match = matchesById.get(p.matchId);
    if (match) total += pointsForPrediction(p.pickedTeam, match);
  }
  return total;
}

/**
 * Build a ranked leaderboard from user profiles. Sorted by points desc, then
 * display name asc for stable ordering. Ranks share numbers on ties (1,2,2,4).
 */
export function calculateLeaderboard(users: UserProfile[]): LeaderboardEntry[] {
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

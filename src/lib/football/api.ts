import "server-only";

import type { Match, MatchStatus, Outcome, Scorer } from "@/types";

const FOOTBALL_DATA_URL =
  "https://api.football-data.org/v4/competitions/WC/matches";

const FOOTBALL_SCORERS_URL =
  "https://api.football-data.org/v4/competitions/WC/scorers";

/** Minimal shape of the football-data.org match payload we consume. */
interface FdTeam {
  id: number | null;
  name: string | null;
  shortName: string | null;
  tla: string | null;
  crest: string | null;
}

interface FdMatch {
  id: number;
  utcDate: string;
  status: string;
  stage: string;
  group: string | null;
  homeTeam: FdTeam;
  awayTeam: FdTeam;
  score: {
    winner: string | null;
    fullTime: { home: number | null; away: number | null };
  };
}

interface FdResponse {
  matches: FdMatch[];
}

const VALID_OUTCOMES: Outcome[] = ["HOME_TEAM", "DRAW", "AWAY_TEAM"];

function normalizeWinner(winner: string | null): Outcome | null {
  return winner && VALID_OUTCOMES.includes(winner as Outcome)
    ? (winner as Outcome)
    : null;
}

function teamLabel(team: FdTeam, fallback: string): {
  name: string;
  short: string;
  crest: string | null;
} {
  const name = team.name ?? fallback;
  return {
    name,
    short: team.tla ?? team.shortName ?? name,
    crest: team.crest ?? null,
  };
}

/**
 * Map a raw football-data match to our Firestore `Match` shape.
 * `locked` is derived from kickoff vs. now so a fresh sync always reflects the
 * correct lock state even if the cron cadence is sparse.
 */
export function mapMatch(raw: FdMatch, now: Date = new Date()): Match {
  const home = teamLabel(raw.homeTeam, "Home TBD");
  const away = teamLabel(raw.awayTeam, "Away TBD");
  const kickoff = raw.utcDate;

  return {
    matchId: String(raw.id),
    homeTeam: home.name,
    awayTeam: away.name,
    homeTeamShort: home.short,
    awayTeamShort: away.short,
    homeCrest: home.crest,
    awayCrest: away.crest,
    kickoff,
    stage: raw.stage,
    group: raw.group ?? null,
    status: (raw.status as MatchStatus) ?? "SCHEDULED",
    homeScore: raw.score.fullTime.home,
    awayScore: raw.score.fullTime.away,
    winner: raw.status === "FINISHED" ? normalizeWinner(raw.score.winner) : null,
    locked: new Date(kickoff).getTime() <= now.getTime(),
    updatedAt: now.toISOString(),
  };
}

/**
 * Fetch all World Cup matches from football-data.org and map them to our shape.
 * Server-side only — the API token must never reach the browser.
 */
export async function fetchWorldCupMatches(): Promise<Match[]> {
  const token = process.env.FOOTBALL_DATA_API_TOKEN;
  if (!token) {
    throw new Error("Missing FOOTBALL_DATA_API_TOKEN.");
  }

  const res = await fetch(FOOTBALL_DATA_URL, {
    headers: { "X-Auth-Token": token },
    // Always fetch fresh data on sync.
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `football-data.org responded ${res.status} ${res.statusText}: ${body.slice(0, 200)}`
    );
  }

  const data = (await res.json()) as FdResponse;
  const now = new Date();
  return (data.matches ?? []).map((m) => mapMatch(m, now));
}

/** Minimal shape of the football-data.org scorers payload we consume. */
interface FdScorer {
  player: { id: number | null; name: string | null; nationality: string | null } | null;
  team: { name: string | null; crest: string | null } | null;
  playedMatches: number | null;
  goals: number | null;
  assists: number | null;
  penalties: number | null;
}

interface FdScorersResponse {
  scorers: FdScorer[];
}

/** Map a raw football-data scorer row to our Firestore `Scorer` shape. */
export function mapScorer(raw: FdScorer): Scorer {
  return {
    playerId: raw.player?.id ?? null,
    playerName: raw.player?.name ?? "Unknown player",
    nationality: raw.player?.nationality ?? null,
    teamName: raw.team?.name ?? "",
    teamCrest: raw.team?.crest ?? null,
    goals: raw.goals ?? 0,
    assists: raw.assists ?? null,
    penalties: raw.penalties ?? null,
    playedMatches: raw.playedMatches ?? null,
  };
}

/**
 * Fetch the current World Cup top scorers (default top 10) from
 * football-data.org. Server-side only — the API token must never reach the
 * browser. Returns an empty list before the tournament has any goals.
 */
export async function fetchWorldCupScorers(limit = 10): Promise<Scorer[]> {
  const token = process.env.FOOTBALL_DATA_API_TOKEN;
  if (!token) {
    throw new Error("Missing FOOTBALL_DATA_API_TOKEN.");
  }

  const res = await fetch(`${FOOTBALL_SCORERS_URL}?limit=${limit}`, {
    headers: { "X-Auth-Token": token },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `football-data.org responded ${res.status} ${res.statusText}: ${body.slice(0, 200)}`
    );
  }

  const data = (await res.json()) as FdScorersResponse;
  return (data.scorers ?? []).map(mapScorer);
}

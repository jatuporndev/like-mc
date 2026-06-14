import "server-only";

import type { Match, MatchStatus, Outcome } from "@/types";

const FOOTBALL_DATA_URL =
  "https://api.football-data.org/v4/competitions/WC/matches";

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
    winner: normalizeWinner(raw.score.winner),
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

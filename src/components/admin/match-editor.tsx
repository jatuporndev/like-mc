"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Loader2, Save, Search } from "lucide-react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMatches } from "@/hooks/useMatches";
import { useEditMatch } from "@/hooks/useAdmin";
import type { Match, MatchStatus, Outcome } from "@/types";

const selectClass =
  "h-9 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const inputClass =
  "h-9 w-14 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const STATUSES: MatchStatus[] = [
  "SCHEDULED",
  "TIMED",
  "IN_PLAY",
  "PAUSED",
  "FINISHED",
  "SUSPENDED",
  "POSTPONED",
  "CANCELLED",
];

export function MatchEditor() {
  const { data: matches, isLoading } = useMatches();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const all = matches ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (m) =>
        m.homeTeam.toLowerCase().includes(q) ||
        m.awayTeam.toLowerCase().includes(q) ||
        m.matchId.includes(q)
    );
  }, [matches, search]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual match edit</CardTitle>
        <CardDescription>
          Override winner, score, or status. Saving recalculates points
          automatically.
        </CardDescription>
        <div className="relative pt-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teams…"
            className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))
        ) : filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No matches found.
          </p>
        ) : (
          <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
            {filtered.map((match) => (
              <MatchRow key={match.matchId} match={match} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MatchRow({ match }: { match: Match }) {
  const edit = useEditMatch();
  const [winner, setWinner] = useState<Outcome | "">(match.winner ?? "");
  const [status, setStatus] = useState<MatchStatus>(match.status);
  const [homeScore, setHomeScore] = useState(
    match.homeScore?.toString() ?? ""
  );
  const [awayScore, setAwayScore] = useState(
    match.awayScore?.toString() ?? ""
  );

  async function save() {
    try {
      await edit.mutateAsync({
        matchId: match.matchId,
        winner: winner === "" ? null : winner,
        status,
        homeScore: homeScore === "" ? null : Number(homeScore),
        awayScore: awayScore === "" ? null : Number(awayScore),
      });
      toast.success("Match updated", {
        description: `${match.homeTeam} vs ${match.awayTeam}`,
      });
    } catch (err) {
      toast.error("Update failed", {
        description: err instanceof Error ? err.message : "Try again.",
      });
    }
  }

  return (
    <div className="rounded-lg border p-3">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-semibold">
          {match.homeTeam} <span className="text-muted-foreground">vs</span>{" "}
          {match.awayTeam}
        </span>
        <span className="text-xs text-muted-foreground">
          {format(new Date(match.kickoff), "MMM d, HH:mm")}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="number"
          min={0}
          value={homeScore}
          onChange={(e) => setHomeScore(e.target.value)}
          className={inputClass}
          aria-label="Home score"
        />
        <span className="text-muted-foreground">–</span>
        <input
          type="number"
          min={0}
          value={awayScore}
          onChange={(e) => setAwayScore(e.target.value)}
          className={inputClass}
          aria-label="Away score"
        />

        <select
          value={winner}
          onChange={(e) => setWinner(e.target.value as Outcome | "")}
          className={selectClass}
          aria-label="Winner"
        >
          <option value="">No winner</option>
          <option value="HOME_TEAM">Home win</option>
          <option value="DRAW">Draw</option>
          <option value="AWAY_TEAM">Away win</option>
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as MatchStatus)}
          className={selectClass}
          aria-label="Status"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <Button
          size="sm"
          onClick={save}
          disabled={edit.isPending}
          className="ml-auto"
        >
          {edit.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save
        </Button>
      </div>
    </div>
  );
}

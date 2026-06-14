"use client";

import { Flame } from "lucide-react";

import { MatchCard } from "@/components/match-card";
import type { MatchDayGroup } from "@/lib/matches";
import type { PredictionMap } from "@/hooks/usePredictions";
import type { MatchPicks } from "@/hooks/useMatchPicks";

export function MatchDaySection({
  group,
  predictions,
  picks,
}: {
  group: MatchDayGroup;
  predictions: PredictionMap;
  picks: MatchPicks;
}) {
  const isToday = group.label === "Today";

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        {isToday && <Flame className="h-4 w-4 text-primary" />}
        <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
          {group.label}
        </h3>
        <span className="text-xs text-muted-foreground">
          ({group.matches.length})
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {group.matches.map((match) => (
          <MatchCard
            key={match.matchId}
            match={match}
            prediction={predictions[match.matchId]}
            picks={picks[match.matchId] ?? []}
          />
        ))}
      </div>
    </section>
  );
}

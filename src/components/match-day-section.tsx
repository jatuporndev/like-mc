"use client";

import { Flame } from "lucide-react";

import { MatchCard } from "@/components/match-card";
import { useI18n } from "@/lib/i18n/context";
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
  const { t } = useI18n();
  const isToday = group.label.key === "day.today";
  const label = group.label.key ? t(group.label.key) : group.label.text;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        {isToday && <Flame className="h-4 w-4 shrink-0 text-primary" />}
        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
        <span className="text-xs tabular-nums text-muted-foreground">
          {group.matches.length}
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

"use client";

import { useMemo, useState } from "react";
import { CalendarClock, CalendarCheck2, WifiOff } from "lucide-react";

import { MatchCard } from "@/components/match-card";
import { MatchDaySection } from "@/components/match-day-section";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { groupMatchesByDate, isMatchLive, partitionMatches } from "@/lib/matches";
import { useI18n } from "@/lib/i18n/context";
import { useMatches } from "@/hooks/useMatches";
import { usePredictions } from "@/hooks/usePredictions";
import { useMatchPicks } from "@/hooks/useMatchPicks";

type Tab = "upcoming" | "completed";

export function MatchesBoard() {
  const {
    data: matches,
    isLoading: matchesLoading,
    isError: matchesError,
    refetch: refetchMatches,
  } = useMatches();
  const { data: predictions } = usePredictions();
  const { data: matchPicks } = useMatchPicks();
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>("upcoming");

  const { liveMatches, upcomingGroups, completedGroups } = useMemo(() => {
    const all = matches ?? [];
    const { upcoming, completed } = partitionMatches(all);
    // Pull in-progress matches into their own highlighted section, soonest
    // kickoff first, and keep them out of the day groups so they don't repeat.
    const live = upcoming
      .filter((m) => isMatchLive(m))
      .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime());
    const scheduled = upcoming.filter((m) => !isMatchLive(m));
    return {
      liveMatches: live,
      upcomingGroups: groupMatchesByDate(scheduled),
      // Most recently played first — both across days and within each day, so
      // the latest finished match sits at the top of its group.
      completedGroups: groupMatchesByDate(completed)
        .reverse()
        .map((group) => ({ ...group, matches: [...group.matches].reverse() })),
    };
  }, [matches]);

  if (matchesLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-44 w-full" />
        ))}
      </div>
    );
  }

  // A failed fetch must not look like "no matches yet" — show a recoverable
  // error with a retry instead of the empty state.
  if (matchesError) {
    return (
      <EmptyState
        icon={WifiOff}
        title={t("board.loadError")}
        description={t("board.loadErrorDesc")}
      >
        <Button variant="outline" size="sm" onClick={() => refetchMatches()}>
          {t("common.retry")}
        </Button>
      </EmptyState>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <EmptyState
        icon={CalendarClock}
        title={t("board.noMatches")}
        description={t("board.noMatchesDesc")}
      />
    );
  }

  const groups = tab === "upcoming" ? upcomingGroups : completedGroups;
  const predictionMap = predictions ?? {};
  const picksMap = matchPicks ?? {};

  return (
    <div className="space-y-5">
      {liveMatches.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="live-dot shrink-0" aria-hidden />
            <h3 className="text-sm font-semibold text-primary">
              {t("board.playingNow")}
            </h3>
            <span className="text-xs tabular-nums text-muted-foreground">
              {liveMatches.length}
            </span>
            <div className="h-px flex-1 bg-primary/30" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {liveMatches.map((match) => (
              <MatchCard
                key={match.matchId}
                match={match}
                prediction={predictionMap[match.matchId]}
                picks={picksMap[match.matchId] ?? []}
              />
            ))}
          </div>
        </section>
      )}

      <div className="flex w-full rounded-lg border bg-muted/40 p-1 sm:inline-flex sm:w-auto">
        <TabButton
          active={tab === "upcoming"}
          onClick={() => setTab("upcoming")}
          icon={<CalendarClock className="h-4 w-4" />}
          label={t("board.upcoming")}
          count={upcomingGroups.reduce((n, g) => n + g.matches.length, 0)}
        />
        <TabButton
          active={tab === "completed"}
          onClick={() => setTab("completed")}
          icon={<CalendarCheck2 className="h-4 w-4" />}
          label={t("board.completed")}
          count={completedGroups.reduce((n, g) => n + g.matches.length, 0)}
        />
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon={tab === "upcoming" ? CalendarClock : CalendarCheck2}
          title={
            tab === "upcoming"
              ? t("board.noUpcoming")
              : t("board.noCompleted")
          }
          description={
            tab === "upcoming"
              ? t("board.noUpcomingDesc")
              : t("board.noCompletedDesc")
          }
        />
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <MatchDaySection
              key={group.key}
              group={group}
              predictions={predictionMap}
              picks={picksMap}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        // Equal-width, full-width tabs on mobile (Android tab-bar style);
        // compact content-width buttons from sm up. The transparent base border
        // reserves space so the active chip's hairline causes no layout shift.
        "flex-1 gap-1.5 border border-transparent sm:flex-none",
        // Active chip raises above the muted track with a neutral surface,
        // hairline, and soft shadow — no accent colour, so switching stays calm.
        active
          ? "border-border bg-card text-foreground shadow-sm"
          : "text-muted-foreground"
      )}
    >
      {icon}
      {label}
      <span className="text-xs text-muted-foreground">({count})</span>
    </Button>
  );
}

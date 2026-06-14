"use client";

import { useMemo, useState } from "react";
import { CalendarClock, CalendarCheck2 } from "lucide-react";

import { MatchDaySection } from "@/components/match-day-section";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { groupMatchesByDate, partitionMatches } from "@/lib/matches";
import { useMatches } from "@/hooks/useMatches";
import { usePredictions } from "@/hooks/usePredictions";
import { useMatchPicks } from "@/hooks/useMatchPicks";

type Tab = "upcoming" | "completed";

export function MatchesBoard() {
  const { data: matches, isLoading: matchesLoading } = useMatches();
  const { data: predictions } = usePredictions();
  const { data: matchPicks } = useMatchPicks();
  const [tab, setTab] = useState<Tab>("upcoming");

  const { upcomingGroups, completedGroups } = useMemo(() => {
    const all = matches ?? [];
    const { upcoming, completed } = partitionMatches(all);
    return {
      upcomingGroups: groupMatchesByDate(upcoming),
      // Most recently played first for completed matches.
      completedGroups: groupMatchesByDate(completed).reverse(),
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

  if (!matches || matches.length === 0) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="No matches yet"
        description="Matches appear here once an admin runs the first sync from football-data.org."
      />
    );
  }

  const groups = tab === "upcoming" ? upcomingGroups : completedGroups;
  const predictionMap = predictions ?? {};
  const picksMap = matchPicks ?? {};

  return (
    <div className="space-y-5">
      <div className="inline-flex rounded-lg border bg-muted/40 p-1">
        <TabButton
          active={tab === "upcoming"}
          onClick={() => setTab("upcoming")}
          icon={<CalendarClock className="h-4 w-4" />}
          label="Upcoming"
          count={upcomingGroups.reduce((n, g) => n + g.matches.length, 0)}
        />
        <TabButton
          active={tab === "completed"}
          onClick={() => setTab("completed")}
          icon={<CalendarCheck2 className="h-4 w-4" />}
          label="Completed"
          count={completedGroups.reduce((n, g) => n + g.matches.length, 0)}
        />
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon={tab === "upcoming" ? CalendarClock : CalendarCheck2}
          title={
            tab === "upcoming"
              ? "No upcoming matches"
              : "No completed matches yet"
          }
          description={
            tab === "upcoming"
              ? "All scheduled matches have kicked off."
              : "Played matches will show up here with results."
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
      className={cn(
        "gap-1.5",
        active && "bg-background shadow-sm"
      )}
    >
      {icon}
      {label}
      <span className="text-xs text-muted-foreground">({count})</span>
    </Button>
  );
}

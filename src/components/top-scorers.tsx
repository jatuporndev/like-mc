"use client";

import { Goal, WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { TeamCrest } from "@/components/team-crest";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { useScorers } from "@/hooks/useScorers";
import type { Scorer } from "@/types";

export function TopScorers({
  limit,
  detailed = false,
}: {
  limit?: number;
  /** Full-page treatment: a players table with matches/assists/penalties. */
  detailed?: boolean;
}) {
  const { t } = useI18n();
  const { data, isLoading, isError, refetch } = useScorers();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: limit ?? 5 }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={WifiOff}
        title={t("scorers.loadError")}
        description={t("scorers.loadErrorDesc")}
      >
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          {t("common.retry")}
        </Button>
      </EmptyState>
    );
  }

  const scorers: Scorer[] = data ?? [];
  if (scorers.length === 0) {
    return (
      <EmptyState
        icon={Goal}
        title={t("scorers.empty")}
        description={t("scorers.emptyDesc")}
      />
    );
  }

  const rows = limit ? scorers.slice(0, limit) : scorers;

  // Compact widget (dashboard sidebar): the lean ranked list.
  if (!detailed) {
    return (
      <ol className="divide-y rounded-xl border">
        {rows.map((s, i) => {
          const rank = i + 1;
          return (
            <li
              key={s.playerId ?? `${s.playerName}-${i}`}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5",
                rank === 1 && "bg-primary/5"
              )}
            >
              <span
                className={cn(
                  "w-4 text-center text-sm font-bold tabular-nums",
                  rank === 1 ? "text-primary" : "text-muted-foreground"
                )}
              >
                {rank}
              </span>
              <TeamCrest
                src={s.teamCrest}
                name={s.teamName}
                size={22}
                className="shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold leading-tight">
                  {s.playerName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {s.teamName}
                </p>
              </div>
              <div className="flex shrink-0 items-baseline gap-1">
                <span className="text-base font-bold tabular-nums">
                  {s.goals}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t("scorers.goals")}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    );
  }

  // Full /scorers page: a players table.
  return (
    <div className="overflow-hidden rounded-xl border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <th className="w-10 py-2.5 pl-4 pr-2 text-center font-medium">#</th>
            <th className="py-2.5 pr-3 text-left font-medium">
              {t("scorers.player")}
            </th>
            <th className="hidden py-2.5 px-3 text-right font-medium tabular-nums sm:table-cell">
              {t("scorers.matches")}
            </th>
            <th className="py-2.5 pl-3 pr-4 text-right font-medium">
              {t("scorers.goals")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((s, i) => {
            const rank = i + 1;
            // Free-tier feeds often null out assists/penalties — only surface
            // what's present so the line never reads "0 assists".
            const meta: string[] = [];
            if (s.assists) meta.push(`${s.assists} ${t("scorers.assists")}`);
            if (s.penalties)
              meta.push(`${s.penalties} ${t("scorers.penalties")}`);
            const sub = meta.join(" · ");

            return (
              <tr
                key={s.playerId ?? `${s.playerName}-${i}`}
                className={cn(rank === 1 && "bg-primary/[0.04]")}
              >
                <td className="py-3 pl-4 pr-2 text-center align-middle">
                  <span
                    className={cn(
                      "text-sm font-bold tabular-nums",
                      rank === 1 ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {rank}
                  </span>
                </td>
                <td className="py-3 pr-3 align-middle">
                  <div className="flex items-center gap-3">
                    <TeamCrest
                      src={s.teamCrest}
                      name={s.teamName}
                      size={26}
                      className="shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-semibold leading-tight">
                        {s.playerName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {sub ? `${s.teamName} · ${sub}` : s.teamName}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="hidden px-3 text-right align-middle tabular-nums text-muted-foreground sm:table-cell">
                  {s.playedMatches ?? "—"}
                </td>
                <td className="py-3 pl-3 pr-4 text-right align-middle">
                  <span className="text-base font-bold tabular-nums">
                    {s.goals}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

"use client";

import { Table2, WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { TeamCrest } from "@/components/team-crest";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { useAuth } from "@/hooks/useAuth";
import { useStandings } from "@/hooks/useStandings";
import type { StandingRow, StandingsGroup } from "@/types";

/** "GROUP_A" → "A"; falls back to the raw code for anything unexpected. */
function groupLetter(code: string): string {
  const last = code.split("_").pop() ?? code;
  return last.charAt(0).toUpperCase() + last.slice(1).toLowerCase();
}

/** Loose name match so a champion pick lines up with the feed's team name. */
function normalizeTeam(name: string): string {
  return name.trim().toLowerCase();
}

export function GroupStandings() {
  const { t } = useI18n();
  const { profile } = useAuth();
  const { data, isLoading, isError, refetch } = useStandings();
  const championPick = profile?.championPick
    ? normalizeTeam(profile.championPick)
    : null;

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-52 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={WifiOff}
        title={t("standings.loadError")}
        description={t("standings.loadErrorDesc")}
      >
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          {t("common.retry")}
        </Button>
      </EmptyState>
    );
  }

  const groups: StandingsGroup[] = data ?? [];
  if (groups.length === 0) {
    return (
      <EmptyState
        icon={Table2}
        title={t("standings.empty")}
        description={t("standings.emptyDesc")}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {groups.map((group) => (
        <GroupTable key={group.group} group={group} championPick={championPick} />
      ))}
    </div>
  );
}

function GroupTable({
  group,
  championPick,
}: {
  group: StandingsGroup;
  /** Normalized champion-pick team name, or null. */
  championPick: string | null;
}) {
  const { t } = useI18n();

  return (
    <section className="overflow-hidden rounded-xl border">
      <header className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2.5">
        <h3 className="text-sm font-bold tracking-tight">
          {t("board.group")} {groupLetter(group.group)}
        </h3>
      </header>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <th className="w-8 py-2 pl-3 pr-1 text-center font-medium">#</th>
            <th className="py-2 pr-2 text-left font-medium">
              {t("standings.team")}
            </th>
            <th className="px-1.5 py-2 text-center font-medium tabular-nums">
              {t("standings.played")}
            </th>
            <th className="hidden px-1.5 py-2 text-center font-medium tabular-nums sm:table-cell">
              {t("standings.won")}
            </th>
            <th className="hidden px-1.5 py-2 text-center font-medium tabular-nums sm:table-cell">
              {t("standings.drawn")}
            </th>
            <th className="hidden px-1.5 py-2 text-center font-medium tabular-nums sm:table-cell">
              {t("standings.lost")}
            </th>
            <th className="px-1.5 py-2 text-center font-medium tabular-nums">
              {t("standings.gd")}
            </th>
            <th className="py-2 pl-1.5 pr-3 text-center font-medium tabular-nums">
              {t("standings.points")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {group.table.map((row) => (
            <StandingTableRow
              key={row.teamId ?? row.teamName}
              row={row}
              isChampionPick={
                championPick !== null &&
                normalizeTeam(row.teamName) === championPick
              }
            />
          ))}
        </tbody>
      </table>
    </section>
  );
}

function StandingTableRow({
  row,
  isChampionPick,
}: {
  row: StandingRow;
  isChampionPick: boolean;
}) {
  // Top two of each group advance directly — give them a subtle pitch-green
  // accent so the qualification line reads at a glance without a legend.
  const qualifies = row.position <= 2;

  return (
    <tr
      className={cn(
        // The user's champion pick wins out over the qualify tint so it stands
        // out wherever it sits in the table — echoes the dashboard's 🏆 stat.
        isChampionPick
          ? "bg-amber-400/15"
          : qualifies && "bg-primary/[0.04]"
      )}
    >
      <td className="py-2.5 pl-3 pr-1 text-center align-middle">
        <span
          className={cn(
            "inline-block w-5 border-l-2 text-center text-sm font-bold tabular-nums",
            qualifies
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground"
          )}
        >
          {row.position}
        </span>
      </td>
      <td className="py-2.5 pr-2 align-middle">
        <div className="flex items-center gap-2">
          <TeamCrest
            src={row.teamCrest}
            name={row.teamName}
            size={20}
            className="shrink-0"
          />
          <span
            className={cn(
              "truncate leading-tight",
              isChampionPick ? "font-bold" : "font-medium"
            )}
          >
            {/* Full name on sm+, the TLA on cramped phones. */}
            <span className="hidden sm:inline">{row.teamName}</span>
            <span className="sm:hidden">{row.teamShort}</span>
          </span>
          {isChampionPick && (
            <span className="shrink-0 text-sm leading-none" title="Your champion pick">
              🏆
            </span>
          )}
        </div>
      </td>
      <td className="px-1.5 text-center align-middle tabular-nums text-muted-foreground">
        {row.playedGames}
      </td>
      <td className="hidden px-1.5 text-center align-middle tabular-nums text-muted-foreground sm:table-cell">
        {row.won}
      </td>
      <td className="hidden px-1.5 text-center align-middle tabular-nums text-muted-foreground sm:table-cell">
        {row.draw}
      </td>
      <td className="hidden px-1.5 text-center align-middle tabular-nums text-muted-foreground sm:table-cell">
        {row.lost}
      </td>
      <td className="px-1.5 text-center align-middle tabular-nums text-muted-foreground">
        {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
      </td>
      <td className="py-2.5 pl-1.5 pr-3 text-center align-middle">
        <span className="text-base font-bold tabular-nums">{row.points}</span>
      </td>
    </tr>
  );
}

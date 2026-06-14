"use client";

import Link from "next/link";
import { BarChart3, CalendarDays, Goal, Medal } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { MatchesBoard } from "@/components/matches-board";
import { Leaderboard } from "@/components/leaderboard";
import { TopScorers } from "@/components/top-scorers";
import { LastSyncBadge } from "@/components/last-sync-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { flagForTeam } from "@/lib/constants";
import { useI18n } from "@/lib/i18n/context";

// Gold / silver / bronze for a top-three rank, matching the leaderboard's medal
// palette so the player's standing reads consistently across surfaces.
const RANK_COLOR: Record<number, string> = {
  1: "text-yellow-500 dark:text-yellow-400",
  2: "text-slate-400 dark:text-slate-300",
  3: "text-amber-700 dark:text-amber-500",
};

export default function DashboardPage() {
  return (
    <AppShell>
      <DashboardContent />
    </AppShell>
  );
}

function DashboardContent() {
  const { profile } = useAuth();
  const { t } = useI18n();
  const { data: leaderboard } = useLeaderboard();
  const firstName = profile?.displayName?.split(" ")[0] ?? "there";
  const points = profile?.points ?? 0;
  const me = leaderboard?.find((e) => e.uid === profile?.uid);
  const championBonus = me?.championBonus ?? 0;
  const rank = me?.rank;
  const champion = profile?.championPick;

  return (
    <div className="space-y-6 lg:space-y-8">
      <header className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {t("dash.welcome")}, {firstName} 👋
          </h1>
          <LastSyncBadge />
        </div>

        {/* Player standing — one segmented scoreboard, not a grid of cards. */}
        <dl className="grid grid-cols-3 divide-x rounded-xl border bg-card">
          <Stat label={t("dash.rank")}>
            {rank ? (
              <span className="flex items-center gap-1.5">
                {rank <= 3 && (
                  <Medal className={cn("h-5 w-5 shrink-0", RANK_COLOR[rank])} />
                )}
                <span className="tabular-nums">#{rank}</span>
              </span>
            ) : (
              <span className="text-base font-medium text-muted-foreground">
                {t("dash.unranked")}
              </span>
            )}
          </Stat>

          <Stat label={t("dash.statPoints")}>
            <span className="tabular-nums">{points}</span>
            {championBonus > 0 && (
              <span className="ml-1.5 text-sm font-semibold text-primary">
                +{championBonus} 🏆
              </span>
            )}
          </Stat>

          <Stat label={t("dash.champion")}>
            {champion ? (
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="shrink-0 text-xl leading-none">
                  {flagForTeam(champion)}
                </span>
                <span className="truncate">{champion}</span>
              </span>
            ) : (
              <span className="text-base font-medium text-muted-foreground">
                {t("dash.noPick")}
              </span>
            )}
          </Stat>
        </dl>

        <p className="text-sm text-muted-foreground">{t("dash.pointsPost")}</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">{t("dash.matches")}</h2>
          </div>
          <MatchesBoard />
        </div>

        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">{t("dash.leaderboard")}</h2>
              </div>
              <Button asChild variant="link" size="sm">
                <Link href="/leaderboard">{t("dash.viewAll")}</Link>
              </Button>
            </div>
            <Leaderboard limit={5} />
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Goal className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">{t("scorers.title")}</h2>
              </div>
              <Button asChild variant="link" size="sm">
                <Link href="/scorers">{t("dash.viewAll")}</Link>
              </Button>
            </div>
            <TopScorers limit={5} />
          </section>
        </aside>
      </div>
    </div>
  );
}

/** One cell of the player standing scoreboard: muted label over a bold value. */
function Stat({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 px-3 py-2.5 sm:px-4 sm:py-3">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 flex items-center text-xl font-bold leading-tight">
        {children}
      </dd>
    </div>
  );
}

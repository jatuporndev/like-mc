"use client";

import Link from "next/link";
import { BarChart3, CalendarDays, Trophy } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { MatchesBoard } from "@/components/matches-board";
import { Leaderboard } from "@/components/leaderboard";
import { LastSyncBadge } from "@/components/last-sync-badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { flagForTeam } from "@/lib/constants";
import { useI18n } from "@/lib/i18n/context";

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
  const firstName = profile?.displayName?.split(" ")[0] ?? "there";
  const points = profile?.points ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("dash.welcome")}, {firstName} 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("dash.pointsPre")}{" "}
            <span className="font-semibold text-foreground">{points}</span>{" "}
            {points === 1 ? t("dash.point") : t("dash.points")}.{" "}
            {t("dash.pointsPost")}
          </p>
          {profile?.championPick && (
            <div className="mt-1.5 flex items-center gap-1.5 text-sm">
              <Trophy className="h-4 w-4 text-primary" />
              <span className="font-semibold uppercase tracking-wide text-primary">
                {t("banner.yourPick")}
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="text-lg leading-none">
                {flagForTeam(profile.championPick)}
              </span>
              <span className="font-bold">{profile.championPick}</span>
            </div>
          )}
        </div>

        <LastSyncBadge />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">{t("dash.matches")}</h2>
          </div>
          <MatchesBoard />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
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
        </aside>
      </div>
    </div>
  );
}

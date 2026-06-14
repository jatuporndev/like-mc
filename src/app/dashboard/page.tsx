"use client";

import Link from "next/link";
import { BarChart3, CalendarDays } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { MatchesBoard } from "@/components/matches-board";
import { Leaderboard } from "@/components/leaderboard";
import { LastSyncBadge } from "@/components/last-sync-badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  return (
    <AppShell>
      <DashboardContent />
    </AppShell>
  );
}

function DashboardContent() {
  const { profile } = useAuth();
  const firstName = profile?.displayName?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {firstName} 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            You have{" "}
            <span className="font-semibold text-foreground">
              {profile?.points ?? 0}
            </span>{" "}
            point{profile?.points === 1 ? "" : "s"}. Make your calls before
            kickoff.
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">Matches</h2>
            </div>
            <LastSyncBadge />
          </div>
          <MatchesBoard />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">Leaderboard</h2>
            </div>
            <Button asChild variant="link" size="sm">
              <Link href="/leaderboard">View all</Link>
            </Button>
          </div>
          <Leaderboard limit={5} />
        </aside>
      </div>
    </div>
  );
}

"use client";

import { BarChart3 } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Leaderboard } from "@/components/leaderboard";

export default function LeaderboardPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          One point per correct match prediction. Champion bonus points may be
          awarded at the end of the tournament.
        </p>
        <Leaderboard />
      </div>
    </AppShell>
  );
}

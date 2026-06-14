"use client";

import { BarChart3 } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Leaderboard } from "@/components/leaderboard";
import { useI18n } from "@/lib/i18n/context";

export default function LeaderboardPage() {
  return (
    <AppShell>
      <LeaderboardContent />
    </AppShell>
  );
}

function LeaderboardContent() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">{t("lb.title")}</h1>
      </div>
      <p className="text-sm text-muted-foreground">{t("lb.subtitle")}</p>
      <Leaderboard />
    </div>
  );
}

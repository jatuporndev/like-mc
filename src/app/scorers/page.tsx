"use client";

import { Goal } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { TopScorers } from "@/components/top-scorers";
import { useI18n } from "@/lib/i18n/context";

export default function ScorersPage() {
  return (
    <AppShell>
      <ScorersContent />
    </AppShell>
  );
}

function ScorersContent() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
            <Goal className="h-5 w-5" aria-hidden />
          </span>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("scorers.title")}
          </h1>
        </div>
        <p className="max-w-prose text-sm text-muted-foreground">
          {t("scorers.subtitle")}
        </p>
      </header>
      {/* Detailed: golden-boot banner, medals, and goal-race bars. */}
      <TopScorers detailed />
    </div>
  );
}

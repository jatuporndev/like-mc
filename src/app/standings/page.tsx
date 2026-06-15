"use client";

import { Table2 } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { GroupStandings } from "@/components/group-standings";
import { useI18n } from "@/lib/i18n/context";

export default function StandingsPage() {
  return (
    <AppShell>
      <StandingsContent />
    </AppShell>
  );
}

function StandingsContent() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
            <Table2 className="h-5 w-5" aria-hidden />
          </span>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("standings.title")}
          </h1>
        </div>
        <p className="max-w-prose text-sm text-muted-foreground">
          {t("standings.subtitle")}
        </p>
      </header>
      <GroupStandings />
    </div>
  );
}

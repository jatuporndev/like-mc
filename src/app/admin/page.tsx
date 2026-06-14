"use client";

import { ShieldCheck } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { SyncPanel } from "@/components/admin/sync-panel";
import { MatchEditor } from "@/components/admin/match-editor";
import { ChampionEditor } from "@/components/admin/champion-editor";
import { UserManager } from "@/components/admin/user-manager";

export default function AdminPage() {
  return (
    <AppShell adminOnly>
      <div className="space-y-8">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
        </div>

        <SyncPanel />

        <div className="grid gap-6 lg:grid-cols-2">
          <MatchEditor />
          <ChampionEditor />
        </div>

        <UserManager />
      </div>
    </AppShell>
  );
}

"use client";

import { type ReactNode } from "react";

import { Navbar } from "@/components/navbar";
import { ChampionBanner } from "@/components/champion-banner";
import { ChampionPickModal } from "@/components/champion-pick-modal";
import { AuthGate } from "@/components/auth-gate";

/**
 * Wraps every authenticated page: navbar, the always-on champion banner, the
 * mandatory champion-pick modal, and the auth/admin route guard.
 */
export function AppShell({
  children,
  adminOnly = false,
}: {
  children: ReactNode;
  adminOnly?: boolean;
}) {
  return (
    <AuthGate adminOnly={adminOnly}>
      <Navbar />
      <ChampionBanner />
      <ChampionPickModal />
      <main className="container py-6">{children}</main>
    </AuthGate>
  );
}

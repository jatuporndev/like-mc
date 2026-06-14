"use client";

import { type ReactNode } from "react";

import { Navbar } from "@/components/navbar";
import { AuthGate } from "@/components/auth-gate";

/**
 * Wraps every authenticated page: navbar and the auth/admin route guard. The
 * mandatory champion pick now lives on its own `/champion` page; AuthGate
 * redirects unpicked users there, and the dashboard header shows the pick.
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
      <main className="container py-6">{children}</main>
    </AuthGate>
  );
}

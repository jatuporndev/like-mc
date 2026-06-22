"use client";

import { type ReactNode } from "react";

import { Navbar } from "@/components/navbar";
import { AppSidebar } from "@/components/app-sidebar";
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
      {/* Full-height app frame: the sidebar runs from the top edge down the left
          (lg+), while the navbar + page content stack in the column to its right
          so the top bar never crosses the rail. On mobile the sidebar is hidden,
          so this collapses to the original navbar-over-content layout. */}
      <div className="flex min-h-dvh">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Navbar />
          <main className="min-w-0 flex-1 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] lg:pl-8 lg:pr-12">
            {children}
          </main>
        </div>
      </div>
    </AuthGate>
  );
}

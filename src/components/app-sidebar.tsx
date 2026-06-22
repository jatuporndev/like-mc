"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  Goal,
  ShieldCheck,
  Table2,
  Trophy,
  type LucideIcon,
} from "lucide-react";

import { LastSyncBadge } from "@/components/last-sync-badge";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n/context";
import type { MessageKey } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";

/**
 * Primary navigation, shared between the desktop left rail and the navbar's
 * mobile menu so the two never drift. Icons echo the dashboard's own vocabulary
 * (BarChart3 = leaderboard, Goal = scorers).
 */
export const NAV_ITEMS: { href: string; key: MessageKey; icon: LucideIcon }[] = [
  { href: "/dashboard", key: "nav.matches", icon: CalendarDays },
  { href: "/standings", key: "nav.standings", icon: Table2 },
  { href: "/leaderboard", key: "nav.leaderboard", icon: BarChart3 },
  { href: "/scorers", key: "nav.scorers", icon: Goal },
];

/** Shared link styling for the sidebar's nav items and the admin entry. */
function navLinkClass(active: boolean): string {
  return cn(
    "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
    active
      ? "bg-accent text-accent-foreground"
      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
  );
}

/**
 * Desktop-only left navigation rail (lg+). The primary nav links moved here from
 * the centered top bar; below lg the same links live in the navbar's hamburger
 * menu. Sticks under the navbar and runs the full viewport height.
 */
export function AppSidebar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const { isAdmin } = useAuth();

  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 self-start flex-col border-r pl-[max(0.75rem,env(safe-area-inset-left))] pr-4 pt-5 lg:flex">
      {/* Brand sits at the head of the full-height rail so the title reads as one
          unit with the nav (it's hidden in the top bar at lg+). */}
      <Link
        href="/dashboard"
        className="mb-6 flex h-9 items-center gap-2 px-3 text-base font-bold"
      >
        <Trophy className="h-5 w-5 shrink-0 text-primary" />
        <span>WC&nbsp;2026 Predictor</span>
      </Link>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, key, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={navLinkClass(active)}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {t(key)}
            </Link>
          );
        })}

        {isAdmin && (
          <Link
            href="/admin"
            aria-current={pathname === "/admin" ? "page" : undefined}
            className={navLinkClass(pathname === "/admin")}
          >
            <ShieldCheck className="h-4 w-4 shrink-0" />
            {t("nav.admin")}
          </Link>
        )}
      </nav>

      {/* Last-sync indicator pinned to the foot of the rail (read-only meta). */}
      <div className="mt-auto px-3 pb-5 pt-3">
        <LastSyncBadge />
      </div>
    </aside>
  );
}

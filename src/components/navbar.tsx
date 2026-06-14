"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, ShieldCheck, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/dashboard", key: "nav.matches" as const },
  { href: "/leaderboard", key: "nav.leaderboard" as const },
];

export function Navbar() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const { t } = useI18n();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between gap-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold">
          <Trophy className="h-5 w-5 text-primary" />
          <span className="hidden sm:inline">WC&nbsp;2026 Predictor</span>
          <span className="sm:hidden">WC&nbsp;26</span>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Button
              key={link.href}
              asChild
              variant="ghost"
              size="sm"
              className={cn(
                pathname === link.href && "bg-accent text-accent-foreground"
              )}
            >
              <Link href={link.href}>{t(link.key)}</Link>
            </Button>
          ))}

          {isAdmin && (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className={cn(
                pathname === "/admin" && "bg-accent text-accent-foreground"
              )}
            >
              <Link href="/admin" className="gap-1.5">
                <ShieldCheck className="h-4 w-4" />
                <span className="hidden sm:inline">{t("nav.admin")}</span>
              </Link>
            </Button>
          )}

          <LanguageToggle />
          <ThemeToggle />

          {user && (
            <>
              <Avatar className="h-8 w-8">
                {profile?.photoURL && (
                  <AvatarImage src={profile.photoURL} alt={profile.displayName} />
                )}
                <AvatarFallback>
                  {(profile?.displayName ?? "?").slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("nav.signOut")}
                onClick={() => signOut()}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LogOut, Menu, ShieldCheck, Trophy, X } from "lucide-react";

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
  { href: "/scorers", key: "nav.scorers" as const },
];

export function Navbar() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const { t } = useI18n();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // While the mobile menu is open: close on Escape (restoring focus to the
  // toggle) and move focus into the panel so keyboard users land inside it.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    menuRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // The page links + admin entry, shared between the desktop bar and the
  // mobile menu. `stack` switches to a full-width, left-aligned layout.
  const pageLinks = (stack: boolean) => (
    <>
      {NAV_LINKS.map((link) => (
        <Button
          key={link.href}
          asChild
          variant="ghost"
          size="sm"
          className={cn(
            stack && "w-full justify-start",
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
            stack && "w-full justify-start",
            pathname === "/admin" && "bg-accent text-accent-foreground"
          )}
        >
          <Link href="/admin" className="gap-1.5">
            <ShieldCheck className="h-4 w-4" />
            {/* Icon-only on the desktop bar; labelled in the mobile menu. */}
            <span className={cn(!stack && "hidden sm:inline")}>
              {t("nav.admin")}
            </span>
          </Link>
        </Button>
      )}
    </>
  );

  const userAvatar = (
    <Avatar className="h-8 w-8">
      {profile?.photoURL && (
        <AvatarImage src={profile.photoURL} alt={profile.displayName} />
      )}
      <AvatarFallback>
        {(profile?.displayName ?? "?").slice(0, 1).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center gap-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold">
          <Trophy className="h-5 w-5 text-primary" />
          <span className="hidden sm:inline">WC&nbsp;2026 Predictor</span>
          <span className="sm:hidden">WC&nbsp;26</span>
        </Link>

        {/* Desktop nav links — centered between the logo and the controls. */}
        <nav className="hidden flex-1 items-center justify-center gap-1 sm:flex">
          {pageLinks(false)}
        </nav>

        {/* Desktop controls (sm and up) */}
        <div className="hidden items-center gap-1 sm:flex">
          <LanguageToggle />
          <ThemeToggle />
          {user && (
            <>
              {userAvatar}
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
        </div>

        {/* Mobile hamburger (below sm) */}
        <Button
          ref={toggleRef}
          variant="ghost"
          size="icon"
          className="ml-auto sm:hidden"
          aria-label={t("nav.menu")}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile menu */}
      {open && (
        <>
          {/* Tap-outside backdrop (below the bar, so the X stays tappable). */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            className="fixed inset-x-0 bottom-0 top-14 z-40 cursor-default sm:hidden"
            onClick={() => setOpen(false)}
          />
          <nav
            ref={menuRef}
            id="mobile-menu"
            className="absolute inset-x-0 top-full z-50 flex flex-col gap-1 border-b bg-background p-3 shadow-lg sm:hidden"
          >
            {user && (
              <div className="flex items-center gap-2 px-1 pb-2">
                {userAvatar}
                <span className="truncate text-sm font-medium">
                  {profile?.displayName}
                </span>
              </div>
            )}

            {pageLinks(true)}

            <div className="flex items-center gap-1 px-1 pt-1">
              <LanguageToggle />
              <ThemeToggle />
            </div>

            {user && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-1.5"
                onClick={() => signOut()}
              >
                <LogOut className="h-4 w-4" />
                {t("nav.signOut")}
              </Button>
            )}
          </nav>
        </>
      )}
    </header>
  );
}

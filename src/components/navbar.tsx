"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Languages,
  LogOut,
  Menu,
  ShieldCheck,
  Trophy,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { NAV_ITEMS } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n/context";
import { LANGUAGES, LANGUAGE_LABELS } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";

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

  // Full-width, left-aligned page links for the mobile menu. On desktop these
  // same links live in the left sidebar (AppSidebar) instead of the top bar.
  const mobileLinks = (
    <>
      {NAV_ITEMS.map(({ href, key, icon: Icon }) => (
        <Button
          key={href}
          asChild
          variant="ghost"
          size="sm"
          className={cn(
            "w-full justify-start",
            pathname === href && "bg-accent text-accent-foreground"
          )}
        >
          <Link href={href}>
            <Icon className="h-4 w-4" />
            {t(key)}
          </Link>
        </Button>
      ))}

      {isAdmin && (
        <Button
          asChild
          variant="ghost"
          size="sm"
          className={cn(
            "w-full justify-start",
            pathname === "/admin" && "bg-accent text-accent-foreground"
          )}
        >
          <Link href="/admin">
            <ShieldCheck className="h-4 w-4" />
            {t("nav.admin")}
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
      <div className="flex h-14 items-center gap-4 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] lg:pr-12">
        {/* Mobile/tablet brand only — on lg+ the brand lives at the top of the
            left sidebar, so it's hidden here to avoid showing twice. */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-bold lg:hidden"
        >
          <Trophy className="h-5 w-5 text-primary" />
          <span className="hidden sm:inline">WC&nbsp;2026 Predictor</span>
          <span className="sm:hidden">WC&nbsp;26</span>
        </Link>

        {/* Desktop controls (lg and up) — the primary nav links now live in the
            left sidebar, so the bar keeps just the theme toggle and the account
            menu, pushed to the right. */}
        <div className="ml-auto hidden items-center gap-1 lg:flex">
          <ThemeToggle />
          {user && <UserMenu />}
        </div>

        {/* Hamburger (below lg) — opens the menu that holds the nav links plus
            theme / language / sign out on phones and tablets. */}
        <Button
          ref={toggleRef}
          variant="ghost"
          size="icon"
          className="ml-auto lg:hidden"
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
            className="fixed inset-x-0 bottom-0 top-14 z-40 cursor-default lg:hidden"
            onClick={() => setOpen(false)}
          />
          <nav
            ref={menuRef}
            id="mobile-menu"
            className="absolute inset-x-0 top-full z-50 flex flex-col gap-1 border-b bg-background p-3 shadow-lg lg:hidden"
          >
            {user && (
              <div className="flex items-center gap-2 px-1 pb-2">
                {userAvatar}
                <span className="truncate text-sm font-medium">
                  {profile?.displayName}
                </span>
              </div>
            )}

            {mobileLinks}

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

/**
 * Desktop account menu: an avatar + full name trigger with a chevron that opens
 * a small dropdown holding the identity line and Sign out. Replaces the bare
 * logout icon so the name is visible and the destructive action is tucked one
 * intentional click away. Closes on outside click or Escape.
 */
function UserMenu() {
  const { profile, signOut } = useAuth();
  const { t, lang, toggleLang } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!profile) return null;

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="gap-2 pl-1.5"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Avatar className="h-7 w-7">
          {profile.photoURL && (
            <AvatarImage src={profile.photoURL} alt={profile.displayName} />
          )}
          <AvatarFallback>
            {profile.displayName.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="max-w-[14ch] truncate text-sm font-medium">
          {profile.displayName}
        </span>
        <ChevronDown
          className={cn(
            "text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </Button>

      {open && (
        <div
          role="menu"
          aria-label={profile.displayName}
          className="absolute right-0 top-full z-50 mt-1.5 w-56 origin-top-right overflow-hidden rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95 duration-150"
        >
          <div className="border-b px-2.5 py-2">
            <p className="truncate text-sm font-semibold">
              {profile.displayName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {profile.email}
            </p>
          </div>

          {/* Language — a two-option segmented control; the inactive label
              switches the language (there are only two, so it's a toggle). */}
          <div className="border-b px-2.5 py-2">
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Languages className="h-3.5 w-3.5 shrink-0" />
              {t("nav.language")}
            </p>
            <div className="flex gap-1 rounded-md bg-muted/60 p-0.5">
              {LANGUAGES.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => {
                    if (l !== lang) toggleLang();
                  }}
                  aria-pressed={l === lang}
                  className={cn(
                    "flex-1 rounded px-2 py-1 text-xs font-semibold transition-colors",
                    l === lang
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {LANGUAGE_LABELS[l]}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              signOut();
            }}
            className="mt-1 flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm font-medium transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {t("nav.signOut")}
          </button>
        </div>
      )}
    </div>
  );
}

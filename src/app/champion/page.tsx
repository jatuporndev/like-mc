"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { cn } from "@/lib/utils";
import { CHAMPION_TEAMS } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import { useSubmitChampionPick } from "@/hooks/useChampionPick";
import { useI18n } from "@/lib/i18n/context";

/**
 * Dedicated, mandatory champion-pick page (replaces the old modal).
 *
 * Access rules:
 *  - Not signed in        → bounced to the landing page.
 *  - Already has a pick    → bounced to the dashboard (pick is permanent).
 *  - Signed in, no pick    → shown the picker. AppShell-guarded pages send
 *                            unpicked users here, so this is the only way in.
 */
export default function ChampionPage() {
  const { user, profile, loading } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const submit = useSubmitChampionPick();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/");
    else if (profile?.championPick) router.replace("/dashboard");
  }, [user, profile, loading, router]);

  const teams = useMemo(
    () => [...CHAMPION_TEAMS].sort((a, b) => a.name.localeCompare(b.name)),
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return teams;
    return teams.filter((tm) => tm.name.toLowerCase().includes(q));
  }, [teams, query]);

  async function confirm() {
    if (!selected) return;
    try {
      await submit.mutateAsync(selected);
      toast.success(t("champion.lockedTitle"), {
        description: `${selected} ${t("champion.lockedDesc")}`,
      });
      router.replace("/dashboard");
    } catch (err) {
      toast.error(t("champion.errorTitle"), {
        description: err instanceof Error ? err.message : t("champion.errorDesc"),
      });
    }
  }

  // While auth resolves or a redirect is pending, show a spinner.
  if (loading || !user || !profile || profile.championPick) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="pitch-gradient min-h-screen">
      <header className="container flex h-16 items-center justify-between pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-2 font-bold">
          <Trophy className="h-5 w-5 text-primary" />
          WC&nbsp;2026 Predictor
        </div>
        <div className="flex items-center gap-1">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      <main className="container max-w-3xl pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="rounded-xl border bg-background/80 p-6 shadow-sm backdrop-blur sm:p-8">
          <div className="space-y-2 text-center sm:text-left">
            <h1 className="flex items-center justify-center gap-2 text-2xl font-bold tracking-tight sm:justify-start">
              <Trophy className="h-6 w-6 text-primary" />
              {t("champion.title")}
            </h1>
            <p className="text-sm text-muted-foreground">{t("champion.desc")}</p>
            <p className="text-sm font-medium text-primary">
              {t("champion.required")}
            </p>
          </div>

          <div className="relative mt-6">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("champion.searchPlaceholder")}
              aria-label={t("champion.searchPlaceholder")}
              className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <div className="mt-3 grid max-h-[50vh] grid-cols-2 gap-2 overflow-y-auto py-1 sm:grid-cols-3 md:grid-cols-4">
            {filtered.map((team) => {
              const active = selected === team.name;
              return (
                <button
                  key={team.name}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelected(team.name)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border p-3 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    active
                      ? "border-primary bg-primary/10 ring-2 ring-primary"
                      : "hover:bg-accent"
                  )}
                >
                  <span className="text-xl leading-none">{team.flag}</span>
                  <span className="truncate">{team.name}</span>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="col-span-full py-6 text-center text-sm text-muted-foreground">
                {t("champion.noMatch")} “{query}”.
              </p>
            )}
          </div>

          <Button
            size="lg"
            className="mt-6 w-full"
            disabled={!selected || submit.isPending}
            onClick={confirm}
          >
            {submit.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {selected
              ? `${t("champion.confirm")} ${selected}`
              : t("champion.select")}
          </Button>
        </div>
      </main>
    </div>
  );
}

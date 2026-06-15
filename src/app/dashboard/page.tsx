"use client";

import Link from "next/link";
import { useState } from "react";
import { BarChart3, Goal, Medal } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { MatchesBoard } from "@/components/matches-board";
import { Leaderboard } from "@/components/leaderboard";
import { TopScorers } from "@/components/top-scorers";
import { LastSyncBadge } from "@/components/last-sync-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { flagForTeam } from "@/lib/constants";
import { useI18n } from "@/lib/i18n/context";
import type { Lang } from "@/lib/i18n/dictionary";
import type { LeaderboardEntry } from "@/types";

// Gold / silver / bronze for a top-three rank, matching the leaderboard's medal
// palette so the player's standing reads consistently across surfaces.
const RANK_COLOR: Record<number, string> = {
  1: "text-yellow-500 dark:text-yellow-400",
  2: "text-slate-400 dark:text-slate-300",
  3: "text-amber-700 dark:text-amber-500",
};

const firstNameOf = (name: string) => name.split(" ")[0];

/**
 * The matchday "where you stand" line: a single sentence that names the rival
 * just ahead (or behind) so the standing feels personal and consequential —
 * everyone in this group knows each other. Tone is `primary` (pitch green) when
 * the player is leading, `muted` when there's ground to make up. Localised by
 * hand because the phrases need natural word order in Thai and English, and the
 * i18n helper has no interpolation.
 */
function standingLine(
  lang: Lang,
  me: LeaderboardEntry,
  above: LeaderboardEntry | undefined,
  below: LeaderboardEntry | undefined,
  tiedTop: LeaderboardEntry | undefined,
): { text: string; tone: "primary" | "muted" } {
  const th = lang === "th";
  const pts = (n: number) => (th ? `${n} คะแนน` : `${n} ${n === 1 ? "pt" : "pts"}`);

  if (me.points === 0 && !above) {
    return {
      tone: "muted",
      text: th
        ? "เปิดให้ทายผลแล้ว — รีบส่งคำทายของคุณ"
        : "Predictions are open — get your picks in.",
    };
  }
  if (above) {
    const gap = above.points - me.points;
    return {
      tone: "muted",
      text: th
        ? `อันดับ ${me.rank} · ตามหลัง ${firstNameOf(above.displayName)} ${pts(gap)}`
        : `${ordinal(me.rank)} — ${pts(gap)} behind ${firstNameOf(above.displayName)}`,
    };
  }
  if (tiedTop) {
    return {
      tone: "primary",
      text: th
        ? `เสมอจ่าฝูงกับ ${firstNameOf(tiedTop.displayName)}`
        : `Tied for 1st with ${firstNameOf(tiedTop.displayName)}`,
    };
  }
  if (below) {
    const gap = me.points - below.points;
    return {
      tone: "primary",
      text: th
        ? `จ่าฝูง · นำ ${firstNameOf(below.displayName)} ${pts(gap)}`
        : `Top of the table — ${pts(gap)} clear of ${firstNameOf(below.displayName)}`,
    };
  }
  return {
    tone: "primary",
    text: th ? "ครองจ่าฝูง — รอคนมาท้าชิง" : "Top of the table — be the one to beat.",
  };
}

/** English ordinal suffix (1st, 2nd, 3rd, 4th…). */
function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

export default function DashboardPage() {
  return (
    <AppShell>
      <DashboardContent />
    </AppShell>
  );
}

function DashboardContent() {
  const { profile } = useAuth();
  const { t, lang } = useI18n();
  const { data: leaderboard } = useLeaderboard();
  const firstName = profile?.displayName?.split(" ")[0] ?? "there";
  const me = leaderboard?.find((e) => e.uid === profile?.uid);
  const points = me?.points ?? profile?.points ?? 0;
  const championBonus = me?.championBonus ?? 0;
  const rank = me?.rank;
  const champion = profile?.championPick;

  // Nearest rivals for the stakes line. Compared on points (not rank ± 1) so a
  // tie in the table — where ranks skip, e.g. 1, 2, 2, 4 — still resolves to the
  // closest player above and below.
  let above: LeaderboardEntry | undefined;
  let below: LeaderboardEntry | undefined;
  if (me && leaderboard) {
    for (const e of leaderboard) {
      if (e.points > me.points && (!above || e.points < above.points)) above = e;
      if (e.uid !== me.uid && e.points < me.points && (!below || e.points > below.points))
        below = e;
    }
  }
  const tiedTop =
    me && rank === 1
      ? leaderboard?.find((e) => e.uid !== me.uid && e.points === me.points)
      : undefined;
  const standing = me ? standingLine(lang, me, above, below, tiedTop) : null;

  return (
    <div className="space-y-6 lg:space-y-8">
      <header className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {t("dash.welcome")}, {firstName}
            </h1>
            {standing && (
              <p
                className={cn(
                  "text-sm",
                  standing.tone === "primary"
                    ? "font-semibold text-primary"
                    : "text-muted-foreground",
                )}
              >
                {standing.text}
              </p>
            )}
          </div>
          <LastSyncBadge />
        </div>

        {/* Player standing — one segmented scoreboard, not a grid of cards.
            On mobile the champion cell drops to its own full-width row so long
            team names ("France") show in full instead of truncating. The 1px
            dividers come from a bg-border backdrop showing through gap-px, which
            stays clean across both the 2-col (mobile) and 3-col layouts. */}
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-3">
          <Stat label={t("dash.rank")}>
            {rank ? (
              <span className="flex items-center gap-1.5">
                {rank <= 3 && (
                  <Medal className={cn("h-5 w-5 shrink-0", RANK_COLOR[rank])} />
                )}
                <span className="tabular-nums">#{rank}</span>
              </span>
            ) : (
              <span className="text-base font-medium text-muted-foreground">
                {t("dash.unranked")}
              </span>
            )}
          </Stat>

          <Stat label={t("dash.statPoints")}>
            <span className="tabular-nums">{points}</span>
            {championBonus > 0 && (
              <span className="ml-1.5 text-sm font-semibold text-primary">
                +{championBonus} 🏆
              </span>
            )}
          </Stat>

          <Stat label={t("dash.champion")} className="col-span-2 sm:col-span-1">
            {champion ? (
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="shrink-0 text-xl leading-none">
                  {flagForTeam(champion)}
                </span>
                <span className="truncate">{champion}</span>
              </span>
            ) : (
              <span className="text-base font-medium text-muted-foreground">
                {t("dash.noPick")}
              </span>
            )}
          </Stat>
        </dl>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Mobile-only: standings live above the long match list as a single
            tabbed section (ตารางคะแนน | ดาวซัลโว) so they're reachable without
            scrolling past every match. The desktop right rail below keeps both
            stacked and is hidden here. */}
        <MobileStandings className="lg:hidden" />

        <div className="space-y-4">
          <SectionHeader title={t("dash.matches")} />
          <MatchesBoard />
        </div>

        <aside className="hidden space-y-6 lg:block lg:sticky lg:top-20 lg:self-start">
          <section className="space-y-3">
            <SectionHeader
              title={t("dash.leaderboard")}
              action={
                <Button asChild variant="link" size="sm" className="h-auto p-0">
                  <Link href="/leaderboard">{t("dash.viewAll")}</Link>
                </Button>
              }
            />
            <Leaderboard limit={5} />
          </section>

          <section className="space-y-3">
            <SectionHeader
              title={t("scorers.title")}
              action={
                <Button asChild variant="link" size="sm" className="h-auto p-0">
                  <Link href="/scorers">{t("dash.viewAll")}</Link>
                </Button>
              }
            />
            <TopScorers limit={5} />
          </section>
        </aside>
      </div>
    </div>
  );
}

/**
 * Section header: a bold title with an optional trailing action. No decorative
 * icon and no rule — the weight of the title alone carries the structure.
 */
function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-base font-bold tracking-tight">{title}</h2>
      {action}
    </div>
  );
}

/**
 * Mobile-only tabbed standings: one full-width tab bar (Android-style) toggling
 * between the leaderboard and the top scorers, showing a single panel at a time
 * so the section stays short and sits above the match list.
 */
function MobileStandings({ className }: { className?: string }) {
  const { t } = useI18n();
  const [tab, setTab] = useState<"leaderboard" | "scorers">("leaderboard");

  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex w-full rounded-lg border bg-muted/40 p-1">
        <StandingsTab
          active={tab === "leaderboard"}
          onClick={() => setTab("leaderboard")}
          icon={<BarChart3 className="h-4 w-4" />}
          label={t("dash.leaderboard")}
        />
        <StandingsTab
          active={tab === "scorers"}
          onClick={() => setTab("scorers")}
          icon={<Goal className="h-4 w-4" />}
          label={t("scorers.title")}
        />
      </div>

      {tab === "leaderboard" ? <Leaderboard limit={5} /> : <TopScorers limit={5} />}
    </section>
  );
}

/** One full-width tab in the mobile standings switcher. */
function StandingsTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex-1 gap-1.5 border border-transparent",
        active
          ? "border-border bg-card text-foreground shadow-sm"
          : "text-muted-foreground"
      )}
    >
      {icon}
      {label}
    </Button>
  );
}

/** One cell of the player standing scoreboard: muted label over a bold value. */
function Stat({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("min-w-0 bg-card px-3 py-2.5 sm:px-4 sm:py-3", className)}>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 flex items-center text-xl font-bold leading-tight">
        {children}
      </dd>
    </div>
  );
}

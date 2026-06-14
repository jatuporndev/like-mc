"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Target, Crown, Trophy, Lock } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { Leaderboard } from "@/components/leaderboard";
import { useAuth } from "@/hooks/useAuth";

const STEPS = [
  {
    icon: Target,
    title: "Predict every match",
    body: "Home, draw or away — change your mind right up to kickoff.",
  },
  {
    icon: Crown,
    title: "Crown one champion",
    body: "A single permanent pick for the team that lifts the trophy.",
  },
  {
    icon: Trophy,
    title: "Climb the table",
    body: "A point for every correct call. The leaderboard settles it.",
  },
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading, router]);

  return (
    <div className="pitch-gradient flex min-h-screen flex-col">
      <header className="container flex h-16 shrink-0 items-center justify-between pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-2 font-bold tracking-tight">
          <Trophy className="h-5 w-5 text-primary" />
          WC&nbsp;2026 Predictor
        </div>
        <ThemeToggle />
      </header>

      <main className="container flex flex-1 items-center pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-8 lg:py-16">
        <div className="grid w-full gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
          {/* Hero / sign-in */}
          <section className="space-y-7">
            <p className="reveal flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              <span className="tabular-nums">Jun 11 – Jul 19</span>
              <span className="h-3 w-px bg-border" aria-hidden />
              <span>48 nations · one group chat</span>
            </p>

            <h1 className="reveal reveal-2 text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
              Predict the World Cup.
              <br />
              Beat your friends.
            </h1>

            <p className="reveal reveal-2 max-w-md text-pretty text-base text-muted-foreground sm:text-lg">
              A private prediction game for our little crew. Call the matches,
              crown your champion, and let the leaderboard handle the bragging
              rights.
            </p>

            <div className="reveal reveal-3 space-y-3">
              <GoogleSignInButton
                size="lg"
                label="Sign in with Google"
                className="w-full sm:w-auto"
              />
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Lock className="h-3.5 w-3.5" />
                Invite only — we just use your Google name and photo.
              </p>
            </div>

            <ol className="reveal reveal-4 divide-y rounded-xl border bg-card">
              {STEPS.map((step) => (
                <li key={step.title} className="flex items-start gap-3.5 p-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <step.icon className="h-4 w-4" />
                  </span>
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold leading-tight">
                      {step.title}
                    </p>
                    <p className="text-sm text-muted-foreground">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Live standings — the leaderboard's own border is the frame; the
              header and footnote sit outside it to avoid nesting cards. */}
          <section className="reveal reveal-4 space-y-3">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-base font-bold leading-none">
                  League standings
                </h2>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Top of the table right now
                </p>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <span className="live-dot" aria-hidden />
                Live
              </span>
            </div>

            <Leaderboard limit={10} />

            <p className="text-center text-xs text-muted-foreground">
              Sign in to see the full table and lock in your picks.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

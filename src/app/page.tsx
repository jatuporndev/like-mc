"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trophy, Target, Crown, BarChart3 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { Leaderboard } from "@/components/leaderboard";
import { useAuth } from "@/hooks/useAuth";

const FEATURES = [
  {
    icon: Target,
    title: "Predict every match",
    body: "Call the winner of each World Cup match — home, away, or draw.",
  },
  {
    icon: Crown,
    title: "Pick your champion",
    body: "Lock in the nation you think lifts the trophy. One pick, no take-backs.",
  },
  {
    icon: BarChart3,
    title: "Climb the leaderboard",
    body: "Earn a point per correct call and battle your friends for the top spot.",
  },
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading, router]);

  return (
    <div className="pitch-gradient min-h-screen">
      <header className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2 font-bold">
          <Trophy className="h-5 w-5 text-primary" />
          WC&nbsp;2026 Predictor
        </div>
        <ThemeToggle />
      </header>

      <main className="container grid gap-12 py-10 lg:grid-cols-2 lg:items-center lg:py-20">
        {/* Hero */}
        <section className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="text-base leading-none">🏆</span>
            FIFA World Cup 2026 · Friends League
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Predict the World Cup.
            <br />
            <span className="text-primary">Beat your friends.</span>
          </h1>
          <p className="max-w-md text-lg text-muted-foreground">
            A private prediction game for our little crew. Call the matches,
            crown your champion, and let the leaderboard settle the bragging
            rights.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <GoogleSignInButton
              size="lg"
              variant="default"
              label="Sign in to play"
            />
            <span className="text-sm text-muted-foreground">
              Google sign-in · invite only
            </span>
          </div>

          <div className="grid gap-3 pt-4 sm:grid-cols-3">
            {FEATURES.map((f) => (
              <Card key={f.title} className="bg-background/60">
                <CardContent className="space-y-2 p-4">
                  <f.icon className="h-5 w-5 text-primary" />
                  <p className="text-sm font-semibold">{f.title}</p>
                  <p className="text-xs text-muted-foreground">{f.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Leaderboard preview */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">Current standings</h2>
          </div>
          <Leaderboard limit={5} />
          <p className="text-center text-xs text-muted-foreground">
            Sign in to see the full table and make your picks.
          </p>
        </section>
      </main>
    </div>
  );
}

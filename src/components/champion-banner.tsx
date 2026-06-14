"use client";

import { Trophy } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { flagForTeam } from "@/lib/constants";

/**
 * Sticky banner shown on every authenticated page once the user has locked in
 * their champion pick. Renders nothing until a pick exists.
 */
export function ChampionBanner() {
  const { profile } = useAuth();
  if (!profile?.championPick) return null;

  return (
    <div className="sticky top-0 z-40 border-b border-primary/20 bg-primary/10 backdrop-blur supports-[backdrop-filter]:bg-primary/10">
      <div className="container flex items-center justify-center gap-2 py-2 text-sm">
        <Trophy className="h-4 w-4 text-primary" />
        <span className="font-semibold uppercase tracking-wide text-primary">
          Your champion pick
        </span>
        <span className="text-muted-foreground">·</span>
        <span className="text-lg leading-none">
          {flagForTeam(profile.championPick)}
        </span>
        <span className="font-bold">{profile.championPick}</span>
      </div>
    </div>
  );
}

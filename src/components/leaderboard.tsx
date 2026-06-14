"use client";

import { Medal, Trophy } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";
import { flagForTeam } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n/context";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import type { LeaderboardEntry } from "@/types";

const RANK_STYLES: Record<number, string> = {
  1: "text-yellow-500",
  2: "text-slate-400",
  3: "text-amber-700",
};

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    return <Medal className={cn("h-5 w-5", RANK_STYLES[rank])} />;
  }
  return (
    <span className="w-5 text-center text-sm font-bold text-muted-foreground">
      {rank}
    </span>
  );
}

export function Leaderboard({
  limit,
  showChampion = true,
}: {
  limit?: number;
  showChampion?: boolean;
}) {
  const { user } = useAuth();
  const { t } = useI18n();
  const { data, isLoading } = useLeaderboard();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: limit ?? 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  const entries: LeaderboardEntry[] = data ?? [];
  if (entries.length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title="No players yet"
        description="The leaderboard fills up as friends sign in and start predicting."
      />
    );
  }

  const rows = limit ? entries.slice(0, limit) : entries;

  return (
    <ul className="divide-y rounded-xl border">
      {rows.map((entry) => {
        const isMe = entry.uid === user?.uid;
        return (
          <li
            key={entry.uid}
            className={cn(
              "flex items-center gap-3 px-4 py-3",
              isMe && "bg-primary/5"
            )}
          >
            <RankBadge rank={entry.rank} />
            <Avatar className="h-9 w-9">
              {entry.photoURL && (
                <AvatarImage src={entry.photoURL} alt={entry.displayName} />
              )}
              <AvatarFallback>
                {entry.displayName.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {entry.displayName}
                {isMe && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    (you)
                  </span>
                )}
              </p>
              {showChampion && entry.championPick && (
                <p className="truncate text-xs text-muted-foreground">
                  {flagForTeam(entry.championPick)} {entry.championPick}
                  {entry.championBonus > 0 && (
                    <span className="ml-1 font-semibold text-primary">
                      +{entry.championBonus} 🏆
                    </span>
                  )}
                </p>
              )}
            </div>

            <div className="flex flex-col items-end gap-0.5">
              <Badge variant={entry.rank === 1 ? "default" : "secondary"}>
                {entry.points} pt{entry.points === 1 ? "" : "s"}
              </Badge>
              {entry.championBonus > 0 && (
                <span className="text-[10px] leading-none text-muted-foreground">
                  +{entry.championBonus} {t("lb.bonus")}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

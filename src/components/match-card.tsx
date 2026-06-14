"use client";

import { CheckCircle2, Lock, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TeamCrest } from "@/components/team-crest";
import { cn } from "@/lib/utils";
import { formatKickoffTime, isMatchLive } from "@/lib/matches";
import { calculatePredictionResult, lockPrediction } from "@/lib/scoring";
import { useDeletePrediction, useSubmitPrediction } from "@/hooks/usePredictions";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n/context";
import type { PickWithUser } from "@/hooks/useMatchPicks";
import type { Match, Outcome, Prediction } from "@/types";

const OUTCOMES: Outcome[] = ["HOME_TEAM", "DRAW", "AWAY_TEAM"];

export function MatchCard({
  match,
  prediction,
  picks = [],
}: {
  match: Match;
  prediction?: Prediction;
  picks?: PickWithUser[];
}) {
  const submit = useSubmitPrediction();
  const remove = useDeletePrediction();
  const { user } = useAuth();
  const { t } = useI18n();
  const locked = lockPrediction(match);
  const live = isMatchLive(match);
  const picked = prediction?.pickedTeam;
  const result = calculatePredictionResult(picked, match);
  const hasScore = match.homeScore !== null && match.awayScore !== null;

  function choose(value: Outcome) {
    if (locked) return;
    const onError = (err: unknown) =>
      toast.error(t("match.saveError"), {
        description: err instanceof Error ? err.message : t("match.tryAgain"),
      });

    // Clicking the already-picked option clears it (unselect). Otherwise set
    // the new pick. Both are fire-and-forget: the optimistic update reflects
    // the change instantly and rolls back (with a toast) if the request fails.
    if (value === picked) {
      remove.mutate(match.matchId, { onError });
    } else {
      submit.mutate({ matchId: match.matchId, pickedTeam: value }, { onError });
    }
  }

  return (
    <Card
      className={cn(
        "overflow-hidden",
        // Live matches carry their own emphasis (no wrapping container) so the
        // card sits in the same grid as every other match without nesting.
        live && "ring-1 ring-primary/50"
      )}
    >
      {/* Meta row */}
      <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-1.5 text-xs text-muted-foreground">
        <span className="truncate">
          {match.stage.replaceAll("_", " ")}
          {match.group
            ? ` · ${match.group.replace("GROUP_", `${t("board.group")} `)}`
            : ""}
        </span>
        <span className="flex items-center gap-1.5">
          {live ? (
            <span className="flex items-center gap-1.5 font-semibold text-primary">
              <span className="live-dot shrink-0" aria-hidden />
              {t("match.playing")}
            </span>
          ) : (
            locked && <Lock className="h-3 w-3" />
          )}
          {formatKickoffTime(match.kickoff)}
        </span>
      </div>

      {/* Teams + score — 3 equal columns so each crest sits centered directly
          above its matching prediction button below. */}
      <div className="grid grid-cols-3 items-start gap-2 px-4 py-3">
        <div className="flex min-w-0 flex-col items-center gap-1 text-center">
          <TeamCrest src={match.homeCrest} name={match.homeTeam} size={40} />
          <span className="break-words text-sm font-semibold leading-tight">
            {match.homeTeam}
          </span>
        </div>

        <div className="flex h-full min-w-12 flex-col items-center justify-center">
          {hasScore ? (
            <span className="text-xl font-bold tabular-nums">
              {match.homeScore}–{match.awayScore}
            </span>
          ) : (
            <span className="text-sm font-medium text-muted-foreground">
              {t("match.vs")}
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-col items-center gap-1 text-center">
          <TeamCrest src={match.awayCrest} name={match.awayTeam} size={40} />
          <span className="break-words text-sm font-semibold leading-tight">
            {match.awayTeam}
          </span>
        </div>
      </div>

      {/* Prediction controls */}
      <div className="grid grid-cols-3 gap-2 px-4 pb-3">
        {OUTCOMES.map((outcome) => {
          const isPicked = picked === outcome;
          const isWinner = match.winner === outcome;
          const label =
            outcome === "HOME_TEAM"
              ? `${match.homeTeam} ${t("match.win")}`
              : outcome === "AWAY_TEAM"
                ? `${match.awayTeam} ${t("match.win")}`
                : t("match.draw");
          return (
            <button
              key={outcome}
              type="button"
              disabled={locked}
              aria-pressed={isPicked}
              aria-label={label}
              onClick={() => choose(outcome)}
              className={cn(
                "flex min-h-11 items-center justify-center rounded-md border px-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed",
                isPicked
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:bg-accent",
                // Highlight the actual winning option once decided.
                !isPicked && isWinner && "border-success/60 bg-success/10",
                locked && !isPicked && "opacity-60"
              )}
            >
              {outcome === "HOME_TEAM"
                ? match.homeTeamShort
                : outcome === "AWAY_TEAM"
                  ? match.awayTeamShort
                  : t("match.draw")}
            </button>
          );
        })}
      </div>

      {/* Who picked what */}
      <PicksRow picks={picks} currentUid={user?.uid} winner={match.winner} />

      {/* Result / status footer */}
      <Footer locked={locked} hasPick={!!picked} result={result} />
    </Card>
  );
}

function PicksRow({
  picks,
  currentUid,
  winner,
}: {
  picks: PickWithUser[];
  currentUid?: string;
  winner: Outcome | null;
}) {
  const { t } = useI18n();
  if (picks.length === 0) return null;

  const byOption: Record<Outcome, PickWithUser[]> = {
    HOME_TEAM: [],
    DRAW: [],
    AWAY_TEAM: [],
  };
  for (const p of picks) byOption[p.pickedTeam].push(p);

  return (
    <div className="grid grid-cols-3 gap-2 border-t bg-muted/30 px-4 py-2">
      {OUTCOMES.map((outcome) => {
        const players = byOption[outcome];
        const isWinner = winner === outcome;
        return (
          <div key={outcome} className="flex flex-col items-center gap-1">
            {players.length === 0 ? (
              <span className="text-xs text-muted-foreground" aria-hidden>
                —
              </span>
            ) : (
              players.map((p) => (
                <div
                  key={p.uid}
                  className={cn(
                    "flex max-w-full items-center gap-1 rounded-full border px-1.5 py-0.5",
                    p.uid === currentUid && "border-primary/50 bg-primary/10",
                    isWinner && "border-success/50 bg-success/10"
                  )}
                  title={p.displayName}
                >
                  <Avatar className="h-4 w-4">
                    {p.photoURL && (
                      <AvatarImage src={p.photoURL} alt={p.displayName} />
                    )}
                    <AvatarFallback className="text-[9px]">
                      {p.displayName.slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 truncate text-[11px] font-medium">
                    {p.uid === currentUid
                      ? t("match.you")
                      : p.displayName.split(" ")[0]}
                  </span>
                </div>
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}

function Footer({
  locked,
  hasPick,
  result,
}: {
  locked: boolean;
  hasPick: boolean;
  result: ReturnType<typeof calculatePredictionResult>;
}) {
  const { t } = useI18n();
  if (result === "correct") {
    return (
      <div className="flex items-center gap-1.5 border-t bg-success/10 px-4 py-2 text-sm font-medium text-success">
        <CheckCircle2 className="h-4 w-4" /> {t("match.correct")}
      </div>
    );
  }
  if (result === "wrong") {
    return (
      <div className="flex items-center gap-1.5 border-t bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive">
        <XCircle className="h-4 w-4" /> {t("match.wrong")}
      </div>
    );
  }
  if (locked) {
    return (
      <div className="border-t px-4 py-2 text-xs text-muted-foreground">
        {hasPick ? t("match.lockedAwaiting") : t("match.lockedNoPick")}
      </div>
    );
  }
  return (
    <div className="border-t px-4 py-2 text-xs text-muted-foreground">
      {hasPick ? (
        <Badge variant="secondary">{t("match.saved")}</Badge>
      ) : (
        t("match.makePrediction")
      )}
    </div>
  );
}

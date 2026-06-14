"use client";

import { useState } from "react";
import { Trophy, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CHAMPION_TEAMS } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import { useSubmitChampionPick } from "@/hooks/useChampionPick";

/**
 * Mandatory, non-dismissable modal prompting the user to pick a World Cup
 * champion. Shows automatically while the signed-in user has no championPick.
 * The pick is permanent once confirmed.
 */
export function ChampionPickModal() {
  const { user, profile, loading } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);
  const submit = useSubmitChampionPick();

  const open = !loading && !!user && !!profile && !profile.championPick;

  async function confirm() {
    if (!selected) return;
    try {
      await submit.mutateAsync(selected);
      toast.success("Champion locked in!", {
        description: `${selected} is your pick for the World Cup 🏆`,
      });
    } catch (err) {
      toast.error("Could not save pick", {
        description: err instanceof Error ? err.message : "Try again.",
      });
    }
  }

  return (
    <Dialog open={open}>
      <DialogContent
        showClose={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        className="max-w-xl"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-center sm:justify-start sm:text-left">
            <Trophy className="h-6 w-6 text-primary" />
            Pick Your World Cup Champion
          </DialogTitle>
          <DialogDescription>
            Choose the one nation you think will lift the trophy. This pick is{" "}
            <strong>permanent</strong> — you can&apos;t change it later.
          </DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[45vh] grid-cols-2 gap-2 overflow-y-auto py-2 sm:grid-cols-3">
          {CHAMPION_TEAMS.map((team) => {
            const active = selected === team.name;
            return (
              <button
                key={team.name}
                type="button"
                onClick={() => setSelected(team.name)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border p-3 text-left text-sm font-medium transition-colors",
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
        </div>

        <Button
          size="lg"
          disabled={!selected || submit.isPending}
          onClick={confirm}
        >
          {submit.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {selected ? `Confirm ${selected}` : "Select a team"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

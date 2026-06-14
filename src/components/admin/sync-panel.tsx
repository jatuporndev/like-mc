"use client";

import { formatDistanceToNow } from "date-fns";
import { Loader2, RefreshCw, Calculator, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useRecalculatePoints,
  useSyncLog,
  useSyncMatches,
} from "@/hooks/useAdmin";

export function SyncPanel() {
  const { data: syncLog } = useSyncLog();
  const sync = useSyncMatches();
  const recalc = useRecalculatePoints();

  async function runSync() {
    try {
      const res = await sync.mutateAsync();
      toast.success("Sync complete", {
        description: `${res.matchesProcessed} matches processed.`,
      });
    } catch (err) {
      toast.error("Sync failed", {
        description: err instanceof Error ? err.message : "Try again.",
      });
    }
  }

  async function runRecalc() {
    try {
      const res = await recalc.mutateAsync();
      toast.success("Points recalculated", {
        description: `${res.usersUpdated} user(s) updated.`,
      });
    } catch (err) {
      toast.error("Recalculation failed", {
        description: err instanceof Error ? err.message : "Try again.",
      });
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Sync matches
          </CardTitle>
          <CardDescription>
            Pull the latest World Cup matches &amp; results from
            football-data.org and recalculate points.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={runSync} disabled={sync.isPending} className="w-full">
            {sync.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Sync World Cup Matches
          </Button>

          {syncLog ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {syncLog.ok ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive" />
              )}
              <span>
                Last sync{" "}
                {formatDistanceToNow(new Date(syncLog.lastSyncAt), {
                  addSuffix: true,
                })}
              </span>
              <Badge variant="outline">{syncLog.source}</Badge>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No sync run yet.</p>
          )}
          {syncLog?.message && (
            <p className="text-xs text-muted-foreground">{syncLog.message}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Recalculate points
          </CardTitle>
          <CardDescription>
            Recompute every user&apos;s score from their predictions and the
            current match results.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={runRecalc}
            disabled={recalc.isPending}
            variant="secondary"
            className="w-full"
          >
            {recalc.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Recalculate Scores
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

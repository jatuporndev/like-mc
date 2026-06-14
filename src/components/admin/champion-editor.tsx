"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CHAMPION_TEAMS } from "@/lib/constants";
import { useEditChampionPick, useUsers } from "@/hooks/useAdmin";
import type { UserProfile } from "@/types";

const selectClass =
  "h-9 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function ChampionEditor() {
  const { data: users, isLoading } = useUsers();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Champion picks</CardTitle>
        <CardDescription>
          Override or clear a user&apos;s champion pick. Users cannot change
          their own pick once set.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))
        ) : !users || users.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No users yet.
          </p>
        ) : (
          users.map((user) => <ChampionRow key={user.uid} user={user} />)
        )}
      </CardContent>
    </Card>
  );
}

function ChampionRow({ user }: { user: UserProfile }) {
  const edit = useEditChampionPick();
  const [team, setTeam] = useState(user.championPick ?? "");

  async function save() {
    try {
      await edit.mutateAsync({
        uid: user.uid,
        team: team === "" ? null : team,
      });
      toast.success("Champion pick updated", {
        description: `${user.displayName}: ${team || "cleared"}`,
      });
    } catch (err) {
      toast.error("Update failed", {
        description: err instanceof Error ? err.message : "Try again.",
      });
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <Avatar className="h-9 w-9">
        {user.photoURL && (
          <AvatarImage src={user.photoURL} alt={user.displayName} />
        )}
        <AvatarFallback>
          {user.displayName.slice(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span className="min-w-0 flex-1 truncate text-sm font-medium">
        {user.displayName}
      </span>

      <select
        value={team}
        onChange={(e) => setTeam(e.target.value)}
        className={selectClass}
        aria-label={`Champion pick for ${user.displayName}`}
      >
        <option value="">— none —</option>
        {CHAMPION_TEAMS.map((t) => (
          <option key={t.name} value={t.name}>
            {t.name}
          </option>
        ))}
        {/* Preserve a custom value not in the preset list. */}
        {user.championPick &&
          !CHAMPION_TEAMS.some((t) => t.name === user.championPick) && (
            <option value={user.championPick}>{user.championPick}</option>
          )}
      </select>

      <Button size="sm" onClick={save} disabled={edit.isPending}>
        {edit.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

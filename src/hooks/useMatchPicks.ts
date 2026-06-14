"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { collection, onSnapshot } from "firebase/firestore";

import { db } from "@/lib/firebase/client";
import { COLLECTIONS } from "@/lib/constants";
import type { Outcome, Prediction, UserProfile } from "@/types";

/** One player's pick on a match, enriched with their display info. */
export interface PickWithUser {
  uid: string;
  displayName: string;
  photoURL: string | null;
  pickedTeam: Outcome;
}

/** matchId -> list of every player's pick on that match. */
export type MatchPicks = Record<string, PickWithUser[]>;

const PICKS_KEY = ["match-picks"];

/** Build the matchId -> picks map from raw users + predictions. */
function buildPicks(
  users: Map<string, UserProfile>,
  predictions: Prediction[]
): MatchPicks {
  const byMatch: MatchPicks = {};
  for (const p of predictions) {
    const u = users.get(p.userId);
    if (!u) continue; // orphan prediction (user removed)
    (byMatch[p.matchId] ??= []).push({
      uid: u.uid,
      displayName: u.displayName,
      photoURL: u.photoURL,
      pickedTeam: p.pickedTeam,
    });
  }
  return byMatch;
}

/**
 * All players' picks across all matches — LIVE.
 *
 * Subscribes to the `users` and `predictions` collections with Firestore
 * `onSnapshot` listeners and writes the combined result into the React Query
 * cache under PICKS_KEY. Because it shares that cache key, optimistic updates in
 * `useSubmitPrediction` still give the current user instant feedback, while
 * other players' picks stream in in realtime.
 */
export function useMatchPicks() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let users = new Map<string, UserProfile>();
    let predictions: Prediction[] = [];
    let haveUsers = false;
    let havePredictions = false;

    const publish = () => {
      // Wait until both streams have delivered at least once so we never
      // render predictions whose authors haven't loaded yet.
      if (!haveUsers || !havePredictions) return;
      queryClient.setQueryData<MatchPicks>(
        PICKS_KEY,
        buildPicks(users, predictions)
      );
    };

    const unsubUsers = onSnapshot(
      collection(db, COLLECTIONS.users),
      (snap) => {
        users = new Map(
          snap.docs.map((d) => [d.id, d.data() as UserProfile])
        );
        haveUsers = true;
        publish();
      }
    );

    const unsubPredictions = onSnapshot(
      collection(db, COLLECTIONS.predictions),
      (snap) => {
        predictions = snap.docs.map((d) => d.data() as Prediction);
        havePredictions = true;
        publish();
      }
    );

    return () => {
      unsubUsers();
      unsubPredictions();
    };
  }, [queryClient]);

  // The live listeners above are the source of truth; this query just exposes
  // the cached value. We never refetch it manually — staleTime is infinite.
  return useQuery<MatchPicks>({
    queryKey: PICKS_KEY,
    queryFn: () =>
      queryClient.getQueryData<MatchPicks>(PICKS_KEY) ?? ({} as MatchPicks),
    staleTime: Infinity,
  });
}

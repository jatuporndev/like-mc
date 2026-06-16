"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { doc, onSnapshot } from "firebase/firestore";

import { db } from "@/lib/firebase/client";
import { COLLECTIONS, META_DOCS } from "@/lib/constants";
import type { Outcome, PicksDoc } from "@/types";

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

/** Flatten the meta/picks nested map (matchId -> uid -> pick) into arrays. */
function buildPicks(picks: PicksDoc["picks"]): MatchPicks {
  const byMatch: MatchPicks = {};
  for (const [matchId, byUid] of Object.entries(picks)) {
    for (const [uid, entry] of Object.entries(byUid)) {
      (byMatch[matchId] ??= []).push({
        uid,
        displayName: entry.displayName,
        photoURL: entry.photoURL,
        pickedTeam: entry.pickedTeam,
      });
    }
  }
  return byMatch;
}

/**
 * All players' picks across all matches — LIVE.
 *
 * C2: subscribes to a single aggregated `meta/picks` document with `onSnapshot`
 * instead of streaming the entire `users` + `predictions` collections (~400
 * reads per mount). The initial load is now 1 read and a live pick change is
 * ~1 read — same realtime "watch everyone flip their picks" experience, ~400×
 * cheaper. The result is written into the React Query cache under PICKS_KEY,
 * which `useSubmitPrediction` also updates optimistically for instant feedback.
 */
export function useMatchPicks() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, COLLECTIONS.meta, META_DOCS.picks),
      (snap) => {
        const data = snap.exists() ? (snap.data() as PicksDoc) : null;
        queryClient.setQueryData<MatchPicks>(
          PICKS_KEY,
          buildPicks(data?.picks ?? {})
        );
      }
    );

    return () => unsub();
  }, [queryClient]);

  // The live listener above is the source of truth; this query just exposes the
  // cached value. We never refetch it manually — staleTime is infinite.
  return useQuery<MatchPicks>({
    queryKey: PICKS_KEY,
    queryFn: () =>
      queryClient.getQueryData<MatchPicks>(PICKS_KEY) ?? ({} as MatchPicks),
    staleTime: Infinity,
  });
}

"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { collection, getDocs, query, where } from "firebase/firestore";

import { db } from "@/lib/firebase/client";
import { COLLECTIONS } from "@/lib/constants";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "@/hooks/useAuth";
import type { MatchPicks } from "@/hooks/useMatchPicks";
import type { Outcome, Prediction } from "@/types";

/** Map of matchId -> prediction for the signed-in user. */
export type PredictionMap = Record<string, Prediction>;

async function fetchPredictions(userId: string): Promise<PredictionMap> {
  const q = query(
    collection(db, COLLECTIONS.predictions),
    where("userId", "==", userId)
  );
  const snap = await getDocs(q);
  const map: PredictionMap = {};
  snap.docs.forEach((d) => {
    const p = d.data() as Prediction;
    map[p.matchId] = p;
  });
  return map;
}

/** The current user's predictions keyed by matchId. */
export function usePredictions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["predictions", user?.uid],
    queryFn: () => fetchPredictions(user!.uid),
    enabled: !!user,
  });
}

type SubmitInput = { matchId: string; pickedTeam: Outcome };
type SubmitContext = {
  prevPreds?: PredictionMap;
  prevPicks?: MatchPicks;
};

/**
 * Create or update a single match prediction (server enforces kickoff lock).
 *
 * Uses optimistic updates: the pick is reflected in both the user's prediction
 * map and the shared "who picked what" cache immediately, so the UI feels
 * instant. We reconcile with the server in the background on settle, and roll
 * back if the request fails.
 */
export function useSubmitPrediction() {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  const predKey = ["predictions", user?.uid];
  const picksKey = ["match-picks"];

  return useMutation<Prediction, Error, SubmitInput, SubmitContext>({
    mutationFn: (input) =>
      apiFetch<Prediction>("/api/predictions", {
        method: "POST",
        body: JSON.stringify(input),
      }),

    onMutate: async (input) => {
      if (!user) return {};
      await Promise.all([
        queryClient.cancelQueries({ queryKey: predKey }),
        queryClient.cancelQueries({ queryKey: picksKey }),
      ]);

      const prevPreds = queryClient.getQueryData<PredictionMap>(predKey);
      const prevPicks = queryClient.getQueryData<MatchPicks>(picksKey);
      const now = new Date().toISOString();

      // Optimistically update the current user's own prediction map.
      queryClient.setQueryData<PredictionMap>(predKey, (old) => {
        const map = { ...(old ?? {}) };
        const existing = map[input.matchId];
        map[input.matchId] = {
          userId: user.uid,
          matchId: input.matchId,
          pickedTeam: input.pickedTeam,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        };
        return map;
      });

      // Optimistically update the shared per-match picks list.
      queryClient.setQueryData<MatchPicks>(picksKey, (old) => {
        const map = { ...(old ?? {}) };
        const list = (map[input.matchId] ?? []).filter(
          (p) => p.uid !== user.uid
        );
        list.push({
          uid: user.uid,
          displayName: profile?.displayName ?? "You",
          photoURL: profile?.photoURL ?? null,
          pickedTeam: input.pickedTeam,
        });
        map[input.matchId] = list;
        return map;
      });

      return { prevPreds, prevPicks };
    },

    onError: (_err, _input, ctx) => {
      // Roll back to the pre-mutation snapshots.
      if (ctx?.prevPreds !== undefined) {
        queryClient.setQueryData(predKey, ctx.prevPreds);
      }
      if (ctx?.prevPicks !== undefined) {
        queryClient.setQueryData(picksKey, ctx.prevPicks);
      }
    },

    onSettled: () => {
      // Reconcile the user's own picks with the server in the background.
      // The shared ["match-picks"] cache is kept fresh by the live onSnapshot
      // listener in useMatchPicks, so it doesn't need invalidation here.
      queryClient.invalidateQueries({ queryKey: predKey });
    },
  });
}

/**
 * Clear the signed-in user's prediction for a match (unselect). Mirrors
 * {@link useSubmitPrediction}'s optimistic pattern: the pick disappears from
 * both caches immediately and is restored on error. Server enforces the same
 * kickoff lock as submitting.
 */
export function useDeletePrediction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const predKey = ["predictions", user?.uid];
  const picksKey = ["match-picks"];

  return useMutation<{ matchId: string }, Error, string, SubmitContext>({
    mutationFn: (matchId) =>
      apiFetch<{ matchId: string }>(
        `/api/predictions?matchId=${encodeURIComponent(matchId)}`,
        { method: "DELETE" }
      ),

    onMutate: async (matchId) => {
      if (!user) return {};
      await Promise.all([
        queryClient.cancelQueries({ queryKey: predKey }),
        queryClient.cancelQueries({ queryKey: picksKey }),
      ]);

      const prevPreds = queryClient.getQueryData<PredictionMap>(predKey);
      const prevPicks = queryClient.getQueryData<MatchPicks>(picksKey);

      // Optimistically drop the pick from the user's own prediction map.
      queryClient.setQueryData<PredictionMap>(predKey, (old) => {
        if (!old) return old;
        const map = { ...old };
        delete map[matchId];
        return map;
      });

      // Optimistically drop the user from the shared per-match picks list.
      queryClient.setQueryData<MatchPicks>(picksKey, (old) => {
        if (!old) return old;
        const map = { ...old };
        const list = (map[matchId] ?? []).filter((p) => p.uid !== user.uid);
        if (list.length) map[matchId] = list;
        else delete map[matchId];
        return map;
      });

      return { prevPreds, prevPicks };
    },

    onError: (_err, _matchId, ctx) => {
      if (ctx?.prevPreds !== undefined) {
        queryClient.setQueryData(predKey, ctx.prevPreds);
      }
      if (ctx?.prevPicks !== undefined) {
        queryClient.setQueryData(picksKey, ctx.prevPicks);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: predKey });
    },
  });
}

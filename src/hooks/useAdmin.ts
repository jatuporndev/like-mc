"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";

import { db } from "@/lib/firebase/client";
import { COLLECTIONS, META_DOCS } from "@/lib/constants";
import { apiFetch } from "@/lib/api-client";
import type {
  AdminChampionEdit,
  AdminDeleteUser,
  AdminMatchEdit,
} from "@/lib/validation";
import type { SyncLog, UserProfile } from "@/types";

/** Latest sync metadata (meta/sync). */
export function useSyncLog() {
  return useQuery({
    queryKey: ["sync-log"],
    queryFn: async (): Promise<SyncLog | null> => {
      const snap = await getDoc(doc(db, COLLECTIONS.meta, META_DOCS.sync));
      return snap.exists() ? (snap.data() as SyncLog) : null;
    },
  });
}

/** All users (admin view, for manual champion edits). */
export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async (): Promise<UserProfile[]> => {
      const snap = await getDocs(collection(db, COLLECTIONS.users));
      return snap.docs.map((d) => d.data() as UserProfile);
    },
  });
}

function useInvalidateAll() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["matches"] });
    qc.invalidateQueries({ queryKey: ["leaderboard"] });
    qc.invalidateQueries({ queryKey: ["users"] });
    qc.invalidateQueries({ queryKey: ["sync-log"] });
    qc.invalidateQueries({ queryKey: ["scorers"] });
  };
}

export function useSyncMatches() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: () =>
      apiFetch<{ matchesProcessed: number }>("/api/admin/sync-matches", {
        method: "POST",
      }),
    onSuccess: invalidate,
  });
}

export function useRecalculatePoints() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: () =>
      apiFetch<{ usersUpdated: number }>("/api/admin/recalculate-points", {
        method: "POST",
      }),
    onSuccess: invalidate,
  });
}

export function useEditMatch() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (input: AdminMatchEdit) =>
      apiFetch("/api/admin/match", {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: invalidate,
  });
}

export function useEditChampionPick() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (input: AdminChampionEdit) =>
      apiFetch("/api/admin/champion", {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: invalidate,
  });
}

export function useDeleteUser() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (input: AdminDeleteUser) =>
      apiFetch<{ uid: string; predictionsDeleted: number }>(
        "/api/admin/user",
        {
          method: "DELETE",
          body: JSON.stringify(input),
        }
      ),
    onSuccess: invalidate,
  });
}

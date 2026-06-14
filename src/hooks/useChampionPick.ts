"use client";

import { useMutation } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-client";
import { useAuth } from "@/hooks/useAuth";
import type { UserProfile } from "@/types";

/** Submit the (permanent) World Cup champion pick for the current user. */
export function useSubmitChampionPick() {
  const { refreshProfile } = useAuth();

  return useMutation({
    mutationFn: (team: string) =>
      apiFetch<UserProfile>("/api/champion-pick", {
        method: "POST",
        body: JSON.stringify({ team }),
      }),
    onSuccess: async () => {
      await refreshProfile();
    },
  });
}

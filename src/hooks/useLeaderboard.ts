"use client";

import { useQuery } from "@tanstack/react-query";
import { collection, getDocs } from "firebase/firestore";

import { db } from "@/lib/firebase/client";
import { COLLECTIONS } from "@/lib/constants";
import { calculateLeaderboard } from "@/lib/scoring";
import type { LeaderboardEntry, UserProfile } from "@/types";

// C1: read only the `users` collection. Both `points` and `championBonus` are
// already aggregated onto each user doc by `recalculateAllPoints`, so the
// leaderboard no longer needs to pull all ~104 match docs on every view.
async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const usersSnap = await getDocs(collection(db, COLLECTIONS.users));
  const users = usersSnap.docs.map((d) => d.data() as UserProfile);
  return calculateLeaderboard(users);
}

/** Ranked leaderboard derived from all user profiles. */
export function useLeaderboard() {
  return useQuery({ queryKey: ["leaderboard"], queryFn: fetchLeaderboard });
}

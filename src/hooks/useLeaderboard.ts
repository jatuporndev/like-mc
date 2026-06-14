"use client";

import { useQuery } from "@tanstack/react-query";
import { collection, getDocs } from "firebase/firestore";

import { db } from "@/lib/firebase/client";
import { COLLECTIONS } from "@/lib/constants";
import { calculateLeaderboard } from "@/lib/scoring";
import type { LeaderboardEntry, UserProfile } from "@/types";

async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const snap = await getDocs(collection(db, COLLECTIONS.users));
  const users = snap.docs.map((d) => d.data() as UserProfile);
  return calculateLeaderboard(users);
}

/** Ranked leaderboard derived from all user profiles. */
export function useLeaderboard() {
  return useQuery({ queryKey: ["leaderboard"], queryFn: fetchLeaderboard });
}

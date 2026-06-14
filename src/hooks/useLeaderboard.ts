"use client";

import { useQuery } from "@tanstack/react-query";
import { collection, getDocs } from "firebase/firestore";

import { db } from "@/lib/firebase/client";
import { COLLECTIONS } from "@/lib/constants";
import { calculateLeaderboard } from "@/lib/scoring";
import type { LeaderboardEntry, Match, UserProfile } from "@/types";

async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const [usersSnap, matchesSnap] = await Promise.all([
    getDocs(collection(db, COLLECTIONS.users)),
    getDocs(collection(db, COLLECTIONS.matches)),
  ]);
  const users = usersSnap.docs.map((d) => d.data() as UserProfile);
  const matches = matchesSnap.docs.map((d) => d.data() as Match);
  return calculateLeaderboard(users, matches);
}

/** Ranked leaderboard derived from all user profiles. */
export function useLeaderboard() {
  return useQuery({ queryKey: ["leaderboard"], queryFn: fetchLeaderboard });
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

import { db } from "@/lib/firebase/client";
import { COLLECTIONS } from "@/lib/constants";
import type { Match } from "@/types";

async function fetchMatches(): Promise<Match[]> {
  const q = query(
    collection(db, COLLECTIONS.matches),
    orderBy("kickoff", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Match);
}

/** All World Cup matches, ordered by kickoff. */
export function useMatches() {
  return useQuery({ queryKey: ["matches"], queryFn: fetchMatches });
}

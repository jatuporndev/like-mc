"use client";

import { useQuery } from "@tanstack/react-query";
import { doc, getDoc } from "firebase/firestore";

import { db } from "@/lib/firebase/client";
import { COLLECTIONS, META_DOCS } from "@/lib/constants";
import type { StandingsDoc, StandingsGroup } from "@/types";

/** Group standings snapshot (meta/standings). Empty until the group stage runs. */
export function useStandings() {
  return useQuery({
    queryKey: ["standings"],
    queryFn: async (): Promise<StandingsGroup[]> => {
      const snap = await getDoc(doc(db, COLLECTIONS.meta, META_DOCS.standings));
      return snap.exists() ? ((snap.data() as StandingsDoc).groups ?? []) : [];
    },
  });
}

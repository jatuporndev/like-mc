"use client";

import { useQuery } from "@tanstack/react-query";
import { doc, getDoc } from "firebase/firestore";

import { db } from "@/lib/firebase/client";
import { COLLECTIONS, META_DOCS } from "@/lib/constants";
import type { Scorer, ScorersDoc } from "@/types";

/** Top scorers snapshot (meta/scorers). Empty until goals are scored/synced. */
export function useScorers() {
  return useQuery({
    queryKey: ["scorers"],
    queryFn: async (): Promise<Scorer[]> => {
      const snap = await getDoc(doc(db, COLLECTIONS.meta, META_DOCS.scorers));
      return snap.exists() ? ((snap.data() as ScorersDoc).scorers ?? []) : [];
    },
  });
}

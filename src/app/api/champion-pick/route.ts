import { type NextRequest } from "next/server";

import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/constants";
import { requireUser, HttpError } from "@/server/auth";
import { handleError, ok } from "@/lib/http";
import { championPickInputSchema } from "@/lib/validation";
import type { UserProfile } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Save the user's World Cup champion prediction.
 * Rule: the pick is PERMANENT — it can only be set once. Any later change must
 * go through the admin endpoint. Enforced atomically inside a transaction.
 */
export async function POST(req: NextRequest) {
  try {
    const decoded = await requireUser(req);
    const body = await req.json();
    const { team } = championPickInputSchema.parse(body);

    const ref = adminDb.collection(COLLECTIONS.users).doc(decoded.uid);

    const updated = await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) {
        throw new HttpError(404, "Profile not found. Sign in again.");
      }
      const profile = snap.data() as UserProfile;
      if (profile.championPick) {
        throw new HttpError(409, "Champion pick is already set and locked.");
      }

      const now = new Date().toISOString();
      const patch = {
        championPick: team,
        championPickedAt: now,
        updatedAt: now,
      };
      tx.update(ref, patch);
      return { ...profile, ...patch } as UserProfile;
    });

    return ok(updated);
  } catch (error) {
    return handleError(error);
  }
}

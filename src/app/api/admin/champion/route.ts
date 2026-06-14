import { type NextRequest } from "next/server";

import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/constants";
import { requireAdmin, HttpError } from "@/server/auth";
import { handleError, ok } from "@/lib/http";
import { adminChampionEditSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Admin override for a user's champion pick. Unlike the user endpoint this can
 * change an already-set pick, or clear it (team: null) to let the user re-pick.
 */
export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const { uid, team } = adminChampionEditSchema.parse(body);

    const ref = adminDb.collection(COLLECTIONS.users).doc(uid);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpError(404, "User not found.");

    const now = new Date().toISOString();
    await ref.set(
      {
        championPick: team,
        championPickedAt: team ? now : null,
        updatedAt: now,
      },
      { merge: true }
    );

    return ok({ uid, championPick: team });
  } catch (error) {
    return handleError(error);
  }
}

import { type NextRequest } from "next/server";

import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/constants";
import { requireAdmin, HttpError } from "@/server/auth";
import { handleError, ok } from "@/lib/http";
import { adminMatchEditSchema } from "@/lib/validation";
import { recalculateAllPoints } from "@/server/sync";
import type { Match } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Manually edit a match (winner / score / status). After editing, points are
 * recalculated so the leaderboard reflects the correction immediately.
 */
export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const input = adminMatchEditSchema.parse(body);

    const ref = adminDb.collection(COLLECTIONS.matches).doc(input.matchId);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpError(404, "Match not found.");

    const patch: Partial<Match> = { updatedAt: new Date().toISOString() };
    if (input.winner !== undefined) patch.winner = input.winner;
    if (input.homeScore !== undefined) patch.homeScore = input.homeScore;
    if (input.awayScore !== undefined) patch.awayScore = input.awayScore;
    if (input.status !== undefined) patch.status = input.status;

    await ref.set(patch, { merge: true });
    const usersUpdated = await recalculateAllPoints();

    return ok({ matchId: input.matchId, usersUpdated });
  } catch (error) {
    return handleError(error);
  }
}

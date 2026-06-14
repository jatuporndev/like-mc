import { type NextRequest } from "next/server";

import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, predictionId } from "@/lib/constants";
import { requireUser, HttpError } from "@/server/auth";
import { handleError, ok } from "@/lib/http";
import { predictionInputSchema } from "@/lib/validation";
import { lockPrediction } from "@/lib/scoring";
import type { Match, Prediction } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Create or update a single match prediction for the signed-in user.
 * Server-enforced rules:
 *  - the match must exist
 *  - predictions are rejected once kickoff has passed (locked)
 *  - one prediction per (user, match) via deterministic document id
 */
export async function POST(req: NextRequest) {
  try {
    const decoded = await requireUser(req);
    const body = await req.json();
    const { matchId, pickedTeam } = predictionInputSchema.parse(body);

    const matchSnap = await adminDb
      .collection(COLLECTIONS.matches)
      .doc(matchId)
      .get();
    if (!matchSnap.exists) {
      throw new HttpError(404, "Match not found.");
    }

    const match = matchSnap.data() as Match;
    if (lockPrediction(match)) {
      throw new HttpError(409, "This match is locked — kickoff has passed.");
    }

    const ref = adminDb
      .collection(COLLECTIONS.predictions)
      .doc(predictionId(decoded.uid, matchId));
    const existing = await ref.get();
    const now = new Date().toISOString();

    const prediction: Prediction = {
      userId: decoded.uid,
      matchId,
      pickedTeam,
      createdAt: existing.exists
        ? (existing.data() as Prediction).createdAt
        : now,
      updatedAt: now,
    };

    await ref.set(prediction);
    return ok(prediction);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Remove the signed-in user's prediction for a match (i.e. unselect).
 * Allowed only before kickoff — the same lock that blocks creating/editing a
 * pick blocks clearing one, so a result can't be gamed after the fact.
 * Idempotent: deleting a non-existent prediction succeeds.
 */
export async function DELETE(req: NextRequest) {
  try {
    const decoded = await requireUser(req);
    const matchId = req.nextUrl.searchParams.get("matchId");
    if (!matchId) {
      throw new HttpError(400, "matchId is required.");
    }

    const matchSnap = await adminDb
      .collection(COLLECTIONS.matches)
      .doc(matchId)
      .get();
    if (!matchSnap.exists) {
      throw new HttpError(404, "Match not found.");
    }

    if (lockPrediction(matchSnap.data() as Match)) {
      throw new HttpError(409, "This match is locked — kickoff has passed.");
    }

    await adminDb
      .collection(COLLECTIONS.predictions)
      .doc(predictionId(decoded.uid, matchId))
      .delete();

    return ok({ matchId });
  } catch (error) {
    return handleError(error);
  }
}

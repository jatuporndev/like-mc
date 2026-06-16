import { type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, META_DOCS, predictionId } from "@/lib/constants";
import { requireUser, HttpError } from "@/server/auth";
import { handleError, ok } from "@/lib/http";
import { predictionInputSchema } from "@/lib/validation";
import { lockPrediction } from "@/lib/scoring";
import type { Match, Prediction } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const metaPicksRef = () =>
  adminDb.collection(COLLECTIONS.meta).doc(META_DOCS.picks);

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

    // C2: mirror the pick into the aggregated meta/picks doc so the dashboard
    // can read everyone's picks from one live document. Best-effort — the
    // `predictions` write above is the source of truth, and the cron rebuilds
    // this mirror, so a mirror hiccup must never lose the user's pick.
    try {
      await metaPicksRef().set(
        {
          picks: {
            [matchId]: {
              [decoded.uid]: {
                displayName: decoded.name ?? decoded.email ?? "Anonymous",
                photoURL: decoded.picture ?? null,
                pickedTeam,
              },
            },
          },
          updatedAt: now,
        },
        { merge: true }
      );
    } catch {
      // Mirror drift self-heals on the next cron rebuild.
    }

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

    // C2: drop the user's pick from the aggregated meta/picks mirror too.
    // Best-effort, for the same reason as the POST path above.
    try {
      await metaPicksRef().set(
        {
          picks: { [matchId]: { [decoded.uid]: FieldValue.delete() } },
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch {
      // Mirror drift self-heals on the next cron rebuild.
    }

    return ok({ matchId });
  } catch (error) {
    return handleError(error);
  }
}

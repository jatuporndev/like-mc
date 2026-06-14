import { type NextRequest } from "next/server";

import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/constants";
import { requireAdmin, HttpError } from "@/server/auth";
import { handleError, ok } from "@/lib/http";
import { adminDeleteUserSchema } from "@/lib/validation";
import { deleteUserCompletely } from "@/server/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Permanently remove a user — their predictions, profile, and auth account.
 * Admins cannot delete themselves (guards against locking out the panel).
 */
export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();
    const { uid } = adminDeleteUserSchema.parse(body);

    if (uid === admin.uid) {
      throw new HttpError(400, "You cannot remove your own account.");
    }

    const ref = adminDb.collection(COLLECTIONS.users).doc(uid);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpError(404, "User not found.");

    const predictionsDeleted = await deleteUserCompletely(uid);

    return ok({ uid, predictionsDeleted });
  } catch (error) {
    return handleError(error);
  }
}

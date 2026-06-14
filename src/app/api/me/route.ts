import { type NextRequest } from "next/server";

import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/constants";
import { requireUser } from "@/server/auth";
import { handleError, ok } from "@/lib/http";
import type { UserProfile } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Upsert and return the signed-in user's profile.
 *
 * On first login the profile is created with points=0 and championPick=null.
 * On subsequent logins only the Google-sourced identity fields are refreshed —
 * points and championPick are never touched here, keeping them server-owned.
 */
export async function POST(req: NextRequest) {
  try {
    const decoded = await requireUser(req);
    const ref = adminDb.collection(COLLECTIONS.users).doc(decoded.uid);
    const snap = await ref.get();
    const now = new Date().toISOString();

    const identity = {
      uid: decoded.uid,
      displayName: decoded.name ?? decoded.email ?? "Anonymous",
      email: decoded.email ?? "",
      photoURL: decoded.picture ?? null,
      updatedAt: now,
    };

    if (!snap.exists) {
      const profile: UserProfile = {
        ...identity,
        points: 0,
        championPick: null,
        championPickedAt: null,
        createdAt: now,
      };
      await ref.set(profile);
      return ok(profile);
    }

    await ref.set(identity, { merge: true });
    const updated = { ...(snap.data() as UserProfile), ...identity };
    return ok(updated);
  } catch (error) {
    return handleError(error);
  }
}

import { type NextRequest } from "next/server";

import { requireAdmin } from "@/server/auth";
import { handleError, ok } from "@/lib/http";
import { recalculateAllPoints } from "@/server/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Recompute every user's points from their predictions and match results. */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const usersUpdated = await recalculateAllPoints();
    return ok({ usersUpdated });
  } catch (error) {
    return handleError(error);
  }
}

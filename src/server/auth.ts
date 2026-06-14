import "server-only";

import { type NextRequest } from "next/server";
import type { DecodedIdToken } from "firebase-admin/auth";

import { adminAuth } from "@/lib/firebase/admin";
import { parseAdminEmails } from "@/lib/constants";

/** Thrown by auth guards; carries an HTTP status for the route to surface. */
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "HttpError";
  }
}

function bearerToken(req: NextRequest): string | null {
  const header = req.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  return scheme === "Bearer" && token ? token : null;
}

/**
 * Verify the Firebase ID token on the request and return the decoded user.
 * Throws HttpError(401) when missing or invalid.
 */
export async function requireUser(req: NextRequest): Promise<DecodedIdToken> {
  const token = bearerToken(req);
  if (!token) throw new HttpError(401, "Missing Authorization bearer token.");

  try {
    return await adminAuth.verifyIdToken(token);
  } catch {
    throw new HttpError(401, "Invalid or expired authentication token.");
  }
}

function adminEmails(): string[] {
  return parseAdminEmails(process.env.ADMIN_EMAILS);
}

/** Verify the request is from a whitelisted admin user. */
export async function requireAdmin(req: NextRequest): Promise<DecodedIdToken> {
  const decoded = await requireUser(req);
  const email = decoded.email?.toLowerCase();
  if (!email || !adminEmails().includes(email)) {
    throw new HttpError(403, "Admin access required.");
  }
  return decoded;
}

/**
 * Authorize a machine-to-machine sync request. Accepts EITHER:
 *  - a valid SYNC_SECRET bearer token (Google Apps Script / cron), or
 *  - a whitelisted admin user's Firebase ID token (manual button click).
 * Returns the source for sync logging.
 */
export async function requireSyncCaller(
  req: NextRequest
): Promise<"cron" | "manual"> {
  const token = bearerToken(req);
  const secret = process.env.SYNC_SECRET;

  if (token && secret && token === secret) return "cron";

  // Fall back to admin user auth (the in-app "Sync" button).
  await requireAdmin(req);
  return "manual";
}

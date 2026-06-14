/**
 * First-deploy seed: triggers an initial match sync against a running instance
 * of the app (local dev or deployed) using the shared SYNC_SECRET.
 *
 * Usage:
 *   npm run seed                         # targets http://localhost:3000
 *   SEED_TARGET_URL=https://app npm run seed
 *
 * Env (read from .env.local automatically): SYNC_SECRET, optional SEED_TARGET_URL.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/** Minimal .env.local loader so we don't add a dotenv dependency. */
function loadEnv() {
  try {
    const file = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of file.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // .env.local is optional if vars are already in the environment.
  }
}

async function main() {
  loadEnv();

  const url = process.env.SEED_TARGET_URL ?? "http://localhost:3000";
  const secret = process.env.SYNC_SECRET;

  if (!secret) {
    console.error("✖ SYNC_SECRET is not set. Add it to .env.local.");
    process.exit(1);
  }

  console.log(`→ Seeding matches via ${url}/api/admin/sync-matches …`);

  const res = await fetch(`${url}/api/admin/sync-matches`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` },
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok || !body?.ok) {
    console.error(`✖ Seed failed (${res.status}):`, body?.error ?? body);
    process.exit(1);
  }

  console.log(
    `✓ Seed complete: ${body.data.matchesProcessed} matches processed, ` +
      `${body.data.usersUpdated} users updated.`
  );
}

main().catch((err) => {
  console.error("✖ Unexpected error:", err);
  process.exit(1);
});

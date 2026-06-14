import { auth } from "@/lib/firebase/client";

/**
 * Authenticated fetch helper for calling our own API routes from the browser.
 * Attaches the current user's Firebase ID token as a Bearer header and unwraps
 * the standard { ok, data | error } envelope.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const user = auth.currentUser;
  const token = user ? await user.getIdToken() : null;

  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    // non-JSON response
  }

  const body = payload as { ok?: boolean; data?: T; error?: string } | null;

  if (!res.ok || !body?.ok) {
    throw new Error(body?.error || `Request failed (${res.status}).`);
  }

  return body.data as T;
}

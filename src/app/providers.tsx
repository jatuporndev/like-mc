"use client";

import { useEffect, useState, type ReactNode } from "react";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { polyfillCountryFlagEmojis } from "country-flag-emoji-polyfill";

import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/lib/i18n/context";

// How long a cached query is considered fresh. C3 raises this from 60s to 5 min
// so hammering refresh to check a score serves from cache (0 Firestore reads)
// until it goes stale.
const STALE_TIME = 5 * 60 * 1000;
// Keep cached entries around long enough to survive a reload and be rehydrated
// from localStorage. Matches the persisted cache's max age.
const PERSIST_MAX_AGE = 24 * 60 * 60 * 1000;
// Bump to invalidate every client's persisted cache after a breaking change to
// cached shapes.
const PERSIST_BUSTER = "v1";

export function Providers({ children }: { children: ReactNode }) {
  // Inject the "Twemoji Country Flags" web font so flag emoji render on
  // platforms whose system fonts lack flag glyphs (notably Windows).
  useEffect(() => {
    polyfillCountryFlagEmojis();
  }, []);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: STALE_TIME,
            gcTime: PERSIST_MAX_AGE,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  // C3: persist the React Query cache to localStorage so a hard refresh restores
  // the last data instead of re-reading the whole dataset. `storage` is undefined
  // during SSR, which yields a no-op persister — persistence kicks in on the client.
  const [persister] = useState(() =>
    createSyncStoragePersister({
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
      key: "likewc-query-cache",
    })
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          maxAge: PERSIST_MAX_AGE,
          buster: PERSIST_BUSTER,
        }}
      >
        <LanguageProvider>
          <AuthProvider>{children}</AuthProvider>
          <Toaster richColors position="top-center" />
        </LanguageProvider>
      </PersistQueryClientProvider>
    </ThemeProvider>
  );
}

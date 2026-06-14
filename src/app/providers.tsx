"use client";

import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { polyfillCountryFlagEmojis } from "country-flag-emoji-polyfill";

import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/lib/i18n/context";

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
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <AuthProvider>{children}</AuthProvider>
          <Toaster richColors position="top-center" />
        </LanguageProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

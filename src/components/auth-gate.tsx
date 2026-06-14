"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";

/**
 * Client-side route guard. Redirects unauthenticated users to the landing page,
 * bounces non-admins away from `adminOnly` pages, and — critically — forces any
 * signed-in user who has not yet locked in a champion to the `/champion` page.
 * No AppShell-wrapped page is reachable until a champion pick exists.
 */
export function AuthGate({
  children,
  adminOnly = false,
}: {
  children: ReactNode;
  adminOnly?: boolean;
}) {
  const { user, profile, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/");
    } else if (adminOnly && !isAdmin) {
      router.replace("/dashboard");
    } else if (profile && !profile.championPick) {
      router.replace("/champion");
    }
  }, [user, profile, loading, isAdmin, adminOnly, router]);

  // Block render until: auth resolves, the profile loads, and a champion is
  // picked. `!profile` covers the brief window after sign-in before /api/me
  // returns, so we never flash protected content or a premature redirect.
  if (
    loading ||
    !user ||
    (adminOnly && !isAdmin) ||
    !profile ||
    !profile.championPick
  ) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}

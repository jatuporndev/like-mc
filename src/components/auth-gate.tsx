"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";

/**
 * Client-side route guard. Redirects unauthenticated users to the landing page
 * and, when `adminOnly`, bounces non-admins to the dashboard.
 */
export function AuthGate({
  children,
  adminOnly = false,
}: {
  children: ReactNode;
  adminOnly?: boolean;
}) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/");
    } else if (adminOnly && !isAdmin) {
      router.replace("/dashboard");
    }
  }, [user, loading, isAdmin, adminOnly, router]);

  if (loading || !user || (adminOnly && !isAdmin)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}

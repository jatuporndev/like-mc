"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

/** Inline Google "G" mark. */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.15-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.85 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.67-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.67 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

export function GoogleSignInButton({
  label = "Continue with Google",
  className,
  ...props
}: ButtonProps & { label?: string }) {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign-in failed.";
      // Users closing the popup is expected; don't shout about it.
      if (!/popup-closed|cancelled-popup/i.test(message)) {
        toast.error("Could not sign in", { description: message });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      disabled={loading}
      // Authentic Google styling: white surface, Google's hairline border and
      // ink color, kept consistent across light/dark (Google buttons stay white
      // on dark sites). Roboto-ish system medium weight already applies.
      className={cn(
        "border-[#dadce0] bg-white font-medium text-[#3c4043] shadow-sm hover:border-[#d2e3fc] hover:bg-[#f8faff] hover:text-[#3c4043] hover:shadow",
        className
      )}
      {...props}
    >
      <GoogleIcon />
      {loading ? "Signing in…" : label}
    </Button>
  );
}

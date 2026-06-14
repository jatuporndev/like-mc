"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";

import { auth, googleProvider } from "@/lib/firebase/client";
import { apiFetch } from "@/lib/api-client";
import { isAdminEmail } from "@/lib/constants";
import type { UserProfile } from "@/types";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  /** Upsert + fetch the Firestore profile via the Admin-backed /api/me route. */
  async function loadProfile() {
    try {
      const data = await apiFetch<UserProfile>("/api/me", { method: "POST" });
      setProfile(data);
    } catch (err) {
      console.error("Failed to load profile:", err);
      setProfile(null);
    }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      if (fbUser) {
        await loadProfile();
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      isAdmin: isAdminEmail(user?.email),
      signInWithGoogle: async () => {
        await signInWithPopup(auth, googleProvider);
        // onAuthStateChanged will pick up the new user and load the profile.
      },
      signOut: async () => {
        await fbSignOut(auth);
        setProfile(null);
      },
      refreshProfile: loadProfile,
    }),
    [user, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>.");
  return ctx;
}

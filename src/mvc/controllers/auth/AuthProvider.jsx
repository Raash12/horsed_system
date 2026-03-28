/* eslint react-refresh/only-export-components: off */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/config/supabaseClient";
import { signInWithEmailPassword, signOut, subscribeToAuthChanges } from "@/mvc/models/authModel";
import { getProfileByUserId } from "@/mvc/models/profileModel";

export const AuthContext = createContext(undefined);

async function loadProfileForUser(userId) {
  if (!userId) return null;
  return getProfileByUserId(userId);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      setIsLoading(true);
      setAuthError(null);

      const { data } = await supabase.auth.getSession();
      const nextUser = data?.session?.user ?? null;

      setUser(nextUser);
      setProfile(null);

      if (nextUser?.id) {
        try {
          const p = await loadProfileForUser(nextUser.id);
          if (!mounted) return;
          setProfile(p);
        } catch (e) {
          if (!mounted) return;
          setProfile(null);
          setAuthError(e);
        }
      }

      if (mounted) setIsLoading(false);
    }

    init();

    const subscription = subscribeToAuthChanges(async (_event, session) => {
      setIsLoading(true);
      setAuthError(null);

      const nextUser = session?.user ?? null;
      setUser(nextUser);
      setProfile(null);

      if (nextUser?.id) {
        try {
          const p = await loadProfileForUser(nextUser.id);
          setProfile(p);
        } catch (e) {
          setProfile(null);
          setAuthError(e);
        }
      }

      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe?.();
    };
  }, []);

  const value = useMemo(() => {
    return {
      user,
      profile,
      authError,
      isLoading,
      signIn: async (email, password, signInOptions) => {
        setAuthError(null);
        await signInWithEmailPassword(email, password, signInOptions ?? {});
      },
      signOut: async () => {
        await signOut();
      },
    };
  }, [user, profile, authError, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}


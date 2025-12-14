import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { syncProfile } from "@/auth/syncProfile";
import type { Role } from "./permissions";
import { logAudit } from "@/audit/logAudit";

type AuthCtx = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  role: Role;
  onboardingComplete: boolean | null;
  ready: boolean;
};

const Ctx = createContext<AuthCtx>({
  session: null,
  user: null,
  loading: true,
  role: "manager",
  onboardingComplete: null,
  ready: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role>("manager");
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const s = data.session ?? null;
      setSession(s);
      setLoading(false);
      if (s?.user) fetchProfile(s.user.id);
      else {
        setProfileLoaded(true);
        setProfileLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, s) => {
      setSession(s ?? null);
      setLoading(false);
      if (event === "SIGNED_IN" && s?.user) await syncProfile();
      if (s?.user) fetchProfile(s.user.id);
      if (event === "SIGNED_IN" && s?.user) {
        logAudit({
          actorId: s.user.id,
          action: "login",
          entityType: "auth",
          entityId: null,
          metadata: { role },
        });
      }
      if (event === "SIGNED_OUT" && s?.user) {
        logAudit({
          actorId: s.user.id,
          action: "logout",
          entityType: "auth",
          entityId: null,
          metadata: { role },
        });
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    setProfileLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("role, onboarding_complete")
      .eq("id", userId)
      .maybeSingle();
    if (!error && data) {
      setRole((data.role as Role) ?? "manager");
      setOnboardingComplete(
        data.onboarding_complete === null || data.onboarding_complete === undefined
          ? false
          : Boolean(data.onboarding_complete),
      );
    } else {
      setRole("manager");
      setOnboardingComplete(false);
    }
    setProfileLoading(false);
    setProfileLoaded(true);
  };

  const ready = !loading && (!session?.user ? true : profileLoaded);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      role,
      onboardingComplete,
      ready,
    }),
    [session, loading, role, onboardingComplete, ready],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  return useContext(Ctx);
}

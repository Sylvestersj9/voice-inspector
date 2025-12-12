import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type SubscriptionStatus = string | null;

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  subscriptionStatus: SubscriptionStatus;
  refreshSubscription: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = async (currentSession: Session | null) => {
    if (!currentSession?.user) {
      setSubscriptionStatus(null);
      return;
    }

    const { data, error } = await supabase
      .from("user_subscriptions")
      .select("status")
      .eq("user_id", currentSession.user.id)
      .maybeSingle();

    if (error) {
      console.error("Subscription fetch error", error);
    }

    setSubscriptionStatus(data?.status || null);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) console.error("getSession error:", error);

        setSession(data.session);
        setUser(data.session?.user ?? null);

        await fetchSubscription(data.session);
      } catch (e) {
        console.error("Auth init failed:", e);
        setSession(null);
        setUser(null);
        setSubscriptionStatus(null);
      } finally {
        setLoading(false);
      }
    };

    load();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      try {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        await fetchSubscription(newSession);
      } catch (e) {
        console.error("Auth state change handler failed:", e);
        setSubscriptionStatus(null);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const refreshSubscription = async () => {
    await fetchSubscription(session);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSubscriptionStatus(null);
  };

  const value = useMemo(
    () => ({ session, user, loading, subscriptionStatus, refreshSubscription, signOut }),
    [session, user, loading, subscriptionStatus],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

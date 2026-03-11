import { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1️⃣ Get initial session
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) console.error("getSession error:", error);
      setSession(data.session ?? null);
      setLoading(false); // 🔥 flips regardless of profile/org loading
    });

    // 2️⃣ Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);

      // Send welcome email on SIGNED_UP (email) and SIGNED_IN (first-time OAuth)
      if ((event === "SIGNED_UP" || event === "SIGNED_IN") && newSession?.user?.email) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const name = newSession.user.user_metadata?.name || newSession.user.email.split("@")[0];

        // Check if we've already sent welcome email for this user in this session
        const welcomeEmailKey = `welcomed_${newSession.user.id}`;
        if (!sessionStorage.getItem(welcomeEmailKey)) {
          sessionStorage.setItem(welcomeEmailKey, "true");

          // Send welcome email
          fetch(`${supabaseUrl}/functions/v1/welcome-email`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${newSession.access_token}`,
              apikey: anonKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ user_id: newSession.user.id, name }),
          }).catch((err) => {
            console.error("Welcome email error:", err);
          });

          // Send admin signup notification (non-blocking, errors ignored)
          fetch(`${supabaseUrl}/functions/v1/admin-notifications`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: anonKey,
              Authorization: `Bearer ${newSession.access_token}`,
            },
            body: JSON.stringify({
              type: "signup",
              userName: name,
              userEmail: newSession.user.email,
              userId: newSession.user.id,
            }),
          }).catch(() => {
            // Non-critical notification - ignore errors
          });
        }
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

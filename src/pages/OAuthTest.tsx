import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function OAuthTest() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user?.email ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const login = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      {email ? (
        <div className="space-y-3 text-center">
          <p className="text-sm text-foreground">✅ Logged in as: {email}</p>
          <button
            onClick={logout}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground font-semibold"
          >
            Sign out
          </button>
        </div>
      ) : (
        <button
          onClick={login}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground font-semibold"
        >
          Test Google Login
        </button>
      )}
    </div>
  );
}

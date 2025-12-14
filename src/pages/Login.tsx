import { supabase } from "@/lib/supabase";
import { useAuth } from "@/auth/AuthProvider";
import { Navigate, useLocation } from "react-router-dom";

export default function Login() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const from = (location.state as any)?.from || "/app";

  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;
  if (user) return <Navigate to={from} replace />;

  const login = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?from=${encodeURIComponent(from)}` },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="card-elevated w-full max-w-md space-y-4 p-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Use your Google account to continue.
        </p>
        <button
          onClick={login}
          className="w-full px-4 py-2 rounded-md bg-primary text-primary-foreground font-semibold"
        >
          Continue with Google
        </button>
      </div>
    </div>
  );
}

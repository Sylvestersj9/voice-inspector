import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { LogIn, UserPlus, KeyRound } from "lucide-react";

export default function Login() {
  const { session } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (session) {
      const redirectTo = (location.state as { from?: Location })?.from?.pathname || "/";
      navigate(redirectTo, { replace: true });
    }
  }, [session, location.state, navigate]);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;

      const redirectTo = (location.state as { from?: Location })?.from?.pathname || "/";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) throw signUpError;

      setMessage("Account created. You can now sign in.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-up failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (resetError) throw resetError;

      setMessage("Password reset email sent. Please check your inbox.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password reset failed");
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = email.trim().length > 3 && password.length >= 6;

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center px-4">
      <div className="card-elevated max-w-md w-full p-8 space-y-6">
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-bold text-foreground">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            Use your email and password to access the simulator.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Email address</label>
          <Input
            type="email"
            placeholder="you@your-home.org"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Password</label>
          <Input
            type="password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            autoComplete="current-password"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {message && <p className="text-sm text-success">{message}</p>}

        <div className="space-y-2">
          <Button onClick={handleSignIn} disabled={loading || !canSubmit} className="w-full gap-2">
            <LogIn className="h-4 w-4" />
            {loading ? "Please wait…" : "Sign in"}
          </Button>

          <Button
            onClick={handleSignUp}
            disabled={loading || !canSubmit}
            variant="outline"
            className="w-full gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Create account
          </Button>

          <button
            type="button"
            onClick={handleResetPassword}
            disabled={loading || email.trim().length < 3}
            className="w-full text-sm text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-2 mt-2"
          >
            <KeyRound className="h-4 w-4" />
            Forgot password?
          </button>
        </div>

        <p className="text-xs text-muted-foreground">
          Please do not include names or identifying details about children.
        </p>
      </div>
    </div>
  );
}

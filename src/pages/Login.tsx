import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthLoopPanel from "@/components/auth/AuthLoopPanel";
import AuthCardShell from "@/components/auth/AuthCardShell";
import { supabase } from "../lib/supabase";
import { useLoading } from "@/providers/LoadingProvider";

type Mode = "signin" | "signup";

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loading = useLoading();

  const loggedOut = useMemo(() => params.get("loggedOut") === "true", [params]);

  useEffect(() => {
    if (loggedOut) setMessage("You’ve been logged out successfully.");
  }, [loggedOut]);

  useEffect(() => {
    // If already signed in, go straight to app
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/app");
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate("/app");
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  const signInWithGoogle = async () => {
    setError(null);
    setMessage(null);
    setBusy(true);
    loading.show("Signing you in…");
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
    } catch (e: any) {
      setError(e?.message ?? "Google sign-in failed.");
    } finally {
      loading.hide();
      setBusy(false);
    }
  };

  const submitEmail = async () => {
    setError(null);
    setMessage(null);

    if (!email.trim()) return setError("Please enter your email.");
    if (!password) return setError("Please enter your password.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");

    setBusy(true);
    loading.show(mode === "signin" ? "Signing you in…" : "Creating your account…");
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw error;

        setMessage("Account created. If email confirmation is enabled, check your inbox to finish signup.");
      }
    } catch (e: any) {
      setError(e?.message ?? "Authentication failed.");
    } finally {
      loading.hide();
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-900 via-emerald-800 to-slate-900">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
        <div className="grid w-full overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-slate-200 lg:grid-cols-2">
          {/* LEFT: looping slideshow */}
          <div className="min-h-[520px]">
            <AuthLoopPanel />
          </div>

          {/* RIGHT: auth */}
          <div className="p-3 sm:p-4">
            <AuthCardShell
              title="Create Account"
              subtitle="Continue with Google or use your email to sign in or sign up."
            >
              {message && (
                <div className="mb-4 rounded-lg bg-teal-50 text-teal-700 text-sm px-4 py-3 text-center">
                  {message}
                </div>
              )}
              {error && (
                <div className="mb-4 rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3 text-center">
                  {error}
                </div>
              )}

              {/* Mode toggle */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className={`rounded-xl py-2 text-sm font-semibold ring-1 ring-slate-200 transition ${
                    mode === "signin" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className={`rounded-xl py-2 text-sm font-semibold ring-1 ring-slate-200 transition ${
                    mode === "signup" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Sign up
                </button>
              </div>

              {/* Email + password */}
              <div className="space-y-3">
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  type="email"
                  autoComplete="email"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-600"
                />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  type="password"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-600"
                />

                <button
                  onClick={submitEmail}
                  disabled={busy}
                  className="w-full rounded-xl bg-teal-600 py-3 font-semibold text-white shadow-sm ring-1 ring-slate-200 transition hover:bg-teal-700 disabled:opacity-60"
                >
                  {busy ? "Please wait…" : mode === "signin" ? "Sign in with email" : "Create account"}
                </button>
              </div>

              {/* Divider */}
              <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
                <div className="h-px flex-1 bg-slate-200" />
                <span>OR</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              {/* Google */}
              <button
                onClick={signInWithGoogle}
                disabled={busy}
                className="flex w-full items-center justify-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white">
                  <svg viewBox="0 0 48 48" className="h-6 w-6">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.3 0 6.2 1.1 8.5 3.3l6.3-6.3C34.2 2.7 29.5 1 24 1 14.6 1 6.6 6.8 3.2 15.1l7.5 5.8C12.6 14.7 17.8 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.5 24.5c0-1.6-.1-3.2-.4-4.7H24v9.1h12.6c-.5 2.6-2 4.8-4.3 6.3l6.9 5.3c4-3.7 6.3-9 6.3-16z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.7 28.9c-.5-1.6-.8-3.2-.8-4.9s.3-3.3.8-4.9l-7.5-5.8C1.1 16.1 0 19.9 0 24s1.1 7.9 3.2 10.7l7.5-5.8z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 47c5.5 0 10.1-1.8 13.5-4.8l-6.9-5.3c-1.9 1.3-4.4 2.1-6.6 2.1-6.2 0-11.4-5.2-12.7-12l-7.5 5.8C6.6 41.2 14.6 47 24 47z"
                    />
                    <path fill="none" d="M0 0h48v48H0z" />
                  </svg>
                </span>
                <span>{busy ? "Please wait…" : "Sign in with Google"}</span>
              </button>
            </AuthCardShell>
          </div>
        </div>
      </div>
    </div>
  );
}

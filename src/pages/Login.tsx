import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
    if (loggedOut) setMessage("You've been logged out successfully.");
  }, [loggedOut]);

  useEffect(() => {
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
    loading.show("Signing you in...");
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
    loading.show(mode === "signin" ? "Signing you in..." : "Creating your account...");
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/60 to-white">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center px-4 py-12">
        <div className="flex w-full max-w-xl justify-start">
          <a href="/" className="inline-flex items-center gap-3 rounded-xl bg-white/80 px-3 py-2 text-slate-900 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md">
            <img src="/logo.svg" alt="Voice Inspector" className="h-10 w-10" />
            <span className="font-display text-lg font-semibold">Voice Inspector</span>
          </a>
        </div>

        <div className="mt-10 w-full max-w-xl">
          <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl ring-1 ring-slate-100">
            <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-teal-500 to-emerald-400" />
            <div className="relative p-8 sm:p-10">
              <div className="text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.08em] text-teal-700">Welcome</p>
                <h1 className="mt-2 font-display text-3xl font-bold text-slate-900">Welcome Back</h1>
                <p className="mt-2 text-sm text-slate-600">
                  We've missed you, let's start building something great together, shall we?
                </p>
              </div>

              {message && (
                <div className="mt-4 rounded-lg bg-teal-50 px-4 py-3 text-center text-sm text-teal-700">
                  {message}
                </div>
              )}
              {error && (
                <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-center text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="mt-6 space-y-4">
                <button
                  onClick={signInWithGoogle}
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60"
                >
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white">
                    <svg viewBox="0 0 48 48" className="h-6 w-6" aria-hidden="true">
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
                  <span>{busy ? "Please wait..." : "Continue with Google"}</span>
                </button>

                <div className="flex items-center gap-3 text-xs uppercase tracking-[0.08em] text-slate-400">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span>Or</span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                <div className="space-y-3">
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    type="email"
                    autoComplete="email"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-600"
                  />
                  <div className="space-y-2">
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      type="password"
                      autoComplete={mode === "signin" ? "current-password" : "new-password"}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-600"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={async () => {
                          setError(null);
                          setMessage(null);
                          if (!email.trim()) {
                            setError("Please enter your email to reset your password.");
                            return;
                          }
                          setBusy(true);
                          loading.show("Sending reset link...");
                          try {
                            await supabase.auth.resetPasswordForEmail(email.trim(), {
                              redirectTo: `${window.location.origin}/auth/callback`,
                            });
                            setMessage("Reset link sent. Check your inbox to continue.");
                          } catch (e: any) {
                            setError(e?.message ?? "Unable to send reset link right now.");
                          } finally {
                            loading.hide();
                            setBusy(false);
                          }
                        }}
                        className="text-xs font-semibold text-teal-700 hover:text-teal-800"
                      >
                        Forgot password?
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={submitEmail}
                    disabled={busy}
                    className="w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white shadow-sm ring-1 ring-teal-100 transition hover:-translate-y-0.5 hover:bg-teal-700 hover:shadow-md disabled:opacity-60"
                  >
                    {busy ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
                  </button>
                </div>
              </div>

              <div className="mt-8 border-t pt-5 text-center text-xs text-slate-500">
                <div>By continuing, you agree to our Terms of Service and Privacy Policy.</div>
                <button
                  type="button"
                  onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                  className="mt-2 font-semibold text-teal-700 hover:text-teal-800"
                >
                  {mode === "signin" ? "Need an account? Click here" : "Already have an account? Sign in"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

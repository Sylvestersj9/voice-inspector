import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLoading } from "@/providers/LoadingProvider";

type Mode = "signin" | "signup";

const ROLES = [
  "Registered Manager",
  "Deputy Manager",
  "Responsible Individual",
] as const;

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<string>("");
  const [homeName, setHomeName] = useState("");
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

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setMessage(null);
  };

  const submitEmail = async () => {
    setError(null);
    setMessage(null);

    if (!email.trim()) return setError("Please enter your email.");
    if (!password) return setError("Please enter your password.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");

    if (mode === "signup") {
      if (!name.trim()) return setError("Please enter your name.");
      if (!role) return setError("Please select your role.");
      if (!homeName.trim()) return setError("Please enter your home name.");
    }

    setBusy(true);
    loading.show(mode === "signin" ? "Signing you in..." : "Creating your account...");
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: { name: name.trim() },
          },
        });
        if (error) throw error;

        // If we have a session (email confirmation disabled), update profile immediately
        if (data.session) {
          await supabase
            .from("users")
            .update({ role, home_name: homeName.trim() })
            .eq("id", data.session.user.id);
          // onAuthStateChange will navigate to /app
        } else {
          setMessage("Account created! Check your inbox to confirm your email, then sign in.");
        }
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Authentication failed.";
      setError(msg);
    } finally {
      loading.hide();
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/60 to-white">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center px-4 py-12">
        {/* Logo */}
        <div className="flex w-full max-w-xl justify-start">
          <a href="/" className="inline-flex items-center gap-2.5 rounded-xl bg-white/80 px-3 py-2 text-slate-900 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600">
              <svg viewBox="0 0 32 32" fill="none" className="h-5 w-5" aria-hidden="true">
                <path d="M16 4L4 10v12l12 6 12-6V10L16 4z" stroke="white" strokeWidth="2" strokeLinejoin="round" fill="none" />
                <path d="M16 4v18M4 10l12 6 12-6" stroke="white" strokeWidth="2" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-display text-lg font-semibold">InspectReady</span>
          </a>
        </div>

        <div className="mt-10 w-full max-w-xl">
          <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl ring-1 ring-slate-100">
            <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-teal-500 to-emerald-400" />
            <div className="relative p-8 sm:p-10">
              <div className="text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.08em] text-teal-700">
                  {mode === "signin" ? "Welcome back" : "Get started free"}
                </p>
                <h1 className="mt-2 font-display text-3xl font-bold text-slate-900">
                  {mode === "signin" ? "Sign in to InspectReady" : "Create your account"}
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  {mode === "signin"
                    ? "Continue your inspection preparation."
                    : "Start your free trial — no card required."}
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

              <div className="mt-6 space-y-3">
                {/* Signup-only fields */}
                {mode === "signup" && (
                  <>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      type="text"
                      autoComplete="name"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-600"
                    />
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-teal-600 bg-white"
                    >
                      <option value="">Your role…</option>
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <input
                      value={homeName}
                      onChange={(e) => setHomeName(e.target.value)}
                      placeholder="Home name (e.g. Meadow View House)"
                      type="text"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </>
                )}

                {/* Email + password */}
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  type="email"
                  autoComplete="email"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-600"
                />

                <div className="space-y-1">
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    type="password"
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-600"
                  />
                  {mode === "signin" && (
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
                            setMessage("Reset link sent. Check your inbox.");
                          } catch (e: unknown) {
                            const msg = e instanceof Error ? e.message : "Unable to send reset link.";
                            setError(msg);
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
                  )}
                </div>

                <button
                  onClick={submitEmail}
                  disabled={busy}
                  className="w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-teal-700 hover:shadow-md disabled:opacity-60"
                >
                  {busy
                    ? "Please wait..."
                    : mode === "signin"
                    ? "Sign in"
                    : "Start free trial"}
                </button>
              </div>

              <div className="mt-8 border-t pt-5 text-center text-xs text-slate-500">
                {mode === "signup" && (
                  <p className="mb-2">By creating an account you agree to our Terms of Service and Privacy Policy.</p>
                )}
                <button
                  type="button"
                  onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}
                  className="font-semibold text-teal-700 hover:text-teal-800"
                >
                  {mode === "signin"
                    ? "No account yet? Start your free trial"
                    : "Already have an account? Sign in"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Mic, BarChart3, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLoading } from "@/providers/LoadingProvider";

type Mode = "signin" | "signup";

const ROLES = [
  "Registered Manager (RM)",
  "Nominated Individual (NI)",
  "Responsible Individual (RI)",
  "Deputy Manager",
  "Team Leader",
  "Senior Support Worker",
  "Support Worker",
  "Key Worker",
  "Other",
] as const;

const BENEFITS = [
  { icon: Mic,          title: "Real inspector questions",  desc: "Voice or text — under actual SCCIF pressure" },
  { icon: BarChart3,    title: "SCCIF scoring accuracy",    desc: "All 9 Quality Standards, grounded in how judgements form" },
  { icon: MessageSquare,title: "Instant actionable feedback", desc: "Named gaps, evidence prompts, follow-up questions" },
];

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [mode, setMode]         = useState<Mode>("signin");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [name, setName]         = useState("");
  const [role, setRole]         = useState<string>("");
  const [homeName, setHomeName] = useState("");
  const [busy, setBusy]         = useState(false);
  const [message, setMessage]   = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);
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
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setMessage(null);
  };

  const handleGoogle = async () => {
    setError(null);
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setBusy(false);
    }
  };

  const submitEmail = async () => {
    setError(null);
    setMessage(null);

    if (!email.trim())   return setError("Please enter your email.");
    if (!password)       return setError("Please enter your password.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");

    if (mode === "signup") {
      if (!name.trim())     return setError("Please enter your name.");
      if (!role)            return setError("Please select your role.");
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
        if (data.session) {
          await supabase
            .from("users")
            .update({ role, home_name: homeName.trim() })
            .eq("id", data.session.user.id);
          // Fire welcome email (non-blocking — ignore failures)
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
          fetch(`${supabaseUrl}/functions/v1/welcome-email`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${data.session.access_token}`,
              apikey: anonKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ user_id: data.session.user.id, name: name.trim() }),
          }).catch(() => { /* best-effort */ });
        } else {
          setMessage("Account created! Check your inbox to confirm your email, then sign in.");
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Authentication failed.");
    } finally {
      loading.hide();
      setBusy(false);
    }
  };

  const handleForgotPassword = async () => {
    setError(null);
    setMessage(null);
    if (!email.trim()) return setError("Enter your email address first.");
    setBusy(true);
    loading.show("Sending reset link...");
    try {
      await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback`,
      });
      setMessage("Reset link sent — check your inbox.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unable to send reset link.");
    } finally {
      loading.hide();
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/50 to-white">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 lg:grid-cols-2">

        {/* ── Left panel: hero + benefits ──────────────────────────────────── */}
        <div className="hidden lg:flex flex-col justify-center px-12 py-16">
          {/* Logo */}
          <a href="/" className="inline-flex items-center gap-2.5 mb-12 w-fit rounded-xl bg-white/80 px-3 py-2 text-slate-900 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600">
              <svg viewBox="0 0 32 32" fill="none" className="h-5 w-5" aria-hidden="true">
                <path d="M16 4L4 10v12l12 6 12-6V10L16 4z" stroke="white" strokeWidth="2" strokeLinejoin="round" fill="none" />
                <path d="M16 4v18M4 10l12 6 12-6" stroke="white" strokeWidth="2" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-display text-lg font-semibold">MockOfsted</span>
          </a>

          <h1 className="font-display text-3xl font-bold text-slate-900 leading-snug">
            Practice Ofsted inspections<br />before they happen.
          </h1>
          <p className="mt-4 text-slate-500">
            3-day free trial · 2 sessions/day · no card needed.
          </p>

          <div className="mt-10 space-y-4">
            {BENEFITS.map((b) => (
              <div key={b.title} className="flex items-start gap-4 rounded-2xl bg-white/70 border border-slate-100 px-5 py-4 shadow-sm backdrop-blur-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                  <b.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{b.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-10 text-xs text-slate-400">
            Beta-tested with 10+ homes across England · All 9 SCCIF Quality Standards
          </p>
        </div>

        {/* ── Right panel: form ─────────────────────────────────────────────── */}
        <div className="flex flex-col justify-center px-4 py-12 sm:px-8 lg:px-12">
          {/* Mobile logo */}
          <a href="/" className="inline-flex items-center gap-2.5 mb-8 w-fit rounded-xl bg-white/80 px-3 py-2 text-slate-900 shadow-sm ring-1 ring-slate-200 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-600">
              <svg viewBox="0 0 32 32" fill="none" className="h-4 w-4" aria-hidden="true">
                <path d="M16 4L4 10v12l12 6 12-6V10L16 4z" stroke="white" strokeWidth="2" strokeLinejoin="round" fill="none" />
                <path d="M16 4v18M4 10l12 6 12-6" stroke="white" strokeWidth="2" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-display text-base font-semibold">MockOfsted</span>
          </a>

          <div className="w-full max-w-sm mx-auto lg:mx-0 lg:max-w-md">
            {/* Mode tabs */}
            <div className="flex rounded-xl bg-slate-100 p-1 mb-6">
              {(["signin", "signup"] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                    mode === m
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {m === "signin" ? "Sign in" : "Create account"}
                </button>
              ))}
            </div>

            <h2 className="font-display text-2xl font-bold text-slate-900">
              {mode === "signin" ? "Welcome back" : "Start your free trial"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {mode === "signin"
                ? "Continue your inspection preparation."
                : "No card required. 2 sessions/day for 3 days."}
            </p>

            {message && (
              <div className="mt-4 rounded-xl bg-teal-50 border border-teal-100 px-4 py-3 text-sm text-teal-700">
                {message}
              </div>
            )}
            {error && (
              <div className="mt-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mt-6 space-y-3">
              {/* Google OAuth */}
              <button
                type="button"
                onClick={handleGoogle}
                disabled={busy}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:shadow-md disabled:opacity-60"
              >
                {/* Google G */}
                <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              {/* Divider */}
              <div className="relative flex items-center gap-3">
                <div className="flex-1 border-t border-slate-200" />
                <span className="text-xs text-slate-400">or</span>
                <div className="flex-1 border-t border-slate-200" />
              </div>

              {/* Signup-only fields */}
              {mode === "signup" && (
                <>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    type="text"
                    autoComplete="name"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="">Your role…</option>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <input
                    value={homeName}
                    onChange={(e) => setHomeName(e.target.value)}
                    placeholder="Home name (e.g. Meadow View House)"
                    type="text"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </>
              )}

              {/* Email */}
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                type="email"
                autoComplete="email"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />

              {/* Password with show/hide */}
              <div className="relative">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  type={showPw ? "text" : "password"}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-11 text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Forgot password */}
              {mode === "signin" && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={busy}
                    className="text-xs font-semibold text-teal-700 hover:text-teal-800 disabled:opacity-50"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Submit */}
              <button
                type="button"
                onClick={submitEmail}
                disabled={busy}
                className="w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-teal-700 hover:shadow-md disabled:opacity-60"
              >
                {busy
                  ? "Please wait…"
                  : mode === "signin"
                  ? "Continue with Email"
                  : "Start free trial"}
              </button>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center text-xs text-slate-500 space-y-2">
              {mode === "signup" && (
                <p>
                  By creating an account you agree to our{" "}
                  <Link to="/terms" className="underline hover:text-slate-700">Terms</Link> and{" "}
                  <Link to="/privacy" className="underline hover:text-slate-700">Privacy Policy</Link>.
                </p>
              )}
              <p>
                {mode === "signin" ? (
                  <>
                    New here?{" "}
                    <button type="button" onClick={() => switchMode("signup")} className="font-semibold text-teal-700 hover:text-teal-800">
                      Start your free trial
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button type="button" onClick={() => switchMode("signin")} className="font-semibold text-teal-700 hover:text-teal-800">
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

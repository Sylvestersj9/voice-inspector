import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);   // session confirmed
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Supabase has already exchanged the recovery token in AuthCallback.
    // Check we have a live session here.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setReady(true);
      } else {
        // No session — the link may have expired; send them back to login
        navigate("/login");
      }
    });
  }, [navigate]);

  const handleSubmit = async () => {
    setError(null);
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setBusy(false);
      return;
    }
    setDone(true);
    await supabase.auth.signOut();
    setTimeout(() => navigate("/login"), 2500);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <a href="/" className="mb-8 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600">
            <svg viewBox="0 0 32 32" fill="none" className="h-5 w-5" aria-hidden="true">
              <path d="M16 2C16 2 6 8 6 14C6 19 16 26 16 26C16 26 26 19 26 14C26 8 16 2 16 2Z" fill="white"/>
              <g stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none">
                <path d="M11 16L13.5 19L20 11"/>
              </g>
            </svg>
          </div>
          <span className="font-display text-lg font-bold text-slate-900">MockOfsted</span>
        </a>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="font-display text-xl font-bold text-slate-900">Set a new password</h1>
          <p className="mt-1 text-sm text-slate-500">Choose something you haven't used before.</p>

          {done ? (
            <div className="mt-6 flex flex-col items-center gap-3 text-center">
              <CheckCircle2 className="h-10 w-10 text-teal-600" />
              <p className="font-semibold text-slate-900">Password updated!</p>
              <p className="text-sm text-slate-500">Redirecting you to sign in…</p>
            </div>
          ) : !ready ? (
            <div className="mt-6 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  New password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    autoFocus
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-10 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  Confirm password
                </label>
                <input
                  type={showPw ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat new password"
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={busy}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60 transition-colors"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Update password
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

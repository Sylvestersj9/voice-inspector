import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import { useState } from "react";

export default function Paywall() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (!user) {
      navigate("/login?next=/app/paywall");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        navigate("/login?next=/app/paywall");
        return;
      }
      if (!anonKey || !supabaseUrl) {
        throw new Error("Missing Supabase configuration.");
      }

      const returnUrl = `${window.location.origin}/app`;
      const res = await fetch(`${supabaseUrl}/functions/v1/create-checkout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: anonKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ returnUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Unable to start checkout.");
      }
      if (!data?.url) {
        throw new Error("Checkout URL not returned.");
      }
      window.location.href = data.url as string;
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : "Unable to start checkout.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Nav */}
      <header className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link
            to="/app/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600">
              <svg viewBox="0 0 32 32" fill="none" className="h-4 w-4" aria-hidden="true">
                <path d="M16 4L4 10v12l12 6 12-6V10L16 4z" stroke="white" strokeWidth="2" strokeLinejoin="round" fill="none" />
                <path d="M16 4v18M4 10l12 6 12-6" stroke="white" strokeWidth="2" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-display font-bold text-slate-900">InspectReady</span>
          </div>
          <div className="w-20" /> {/* spacer */}
        </div>
      </header>

      {/* Content */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="mx-auto w-full max-w-md text-center">
          <div className="rounded-2xl border-2 border-teal-600 bg-white p-8 shadow-lg">
            <div className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200">
              Free trial limit reached
            </div>
            <h1 className="mt-4 font-display text-2xl font-bold text-slate-900">
              Ready to keep practising?
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Your free trial limit has been reached. The trial includes 3 days with up to 5 sessions per day (15 total).
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Subscribe now to unlock unlimited sessions and full inspection reports.
            </p>

            <div className="mt-6 flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold text-slate-900">£29</span>
              <span className="text-slate-500">/month</span>
            </div>

            <ul className="mt-5 space-y-2.5 text-left text-sm">
              {[
                "Unlimited practice sessions",
                "All core standards",
                "Full inspection report after each session",
                "Scored feedback on every answer",
                "Session history",
                "Cancel any time",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-slate-700">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-600" />
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={handleCheckout}
              disabled={busy}
              className="mt-7 inline-flex w-full items-center justify-center rounded-xl bg-teal-600 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors disabled:opacity-60"
            >
              {busy ? "Redirecting to checkout..." : "Subscribe — £29/month"}
              {!busy && <ArrowRight className="ml-2 h-4 w-4" />}
            </button>
            {error ? (
              <p className="mt-3 text-xs text-red-700">
                {error}
              </p>
            ) : null}

            <p className="mt-3 text-xs text-slate-400">
              Secure payment via Stripe. Prices exclude VAT where applicable.
            </p>
          </div>

          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-xs text-amber-800">
            <strong>Reminder:</strong> InspectReady is a practice tool and does not constitute official Ofsted guidance. Feedback is based on your responses.
          </div>
        </div>
      </main>
    </div>
  );
}

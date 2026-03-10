import { ArrowRight, CheckCircle2, Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import MarketingLayout from "./MarketingLayout";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import { useState } from "react";

const SOLO_FEATURES = [
  "All 9 Quality Standards",
  "Unlimited practice sessions",
  "Voice or text responses",
  "Scored feedback on every answer",
  "Full inspection report after each session",
  "Session history",
  "3-day free trial — 2 sessions/day (6 total)",
];

const TEAM_FEATURES = [
  "Everything in Solo",
  "Up to 5 registered managers",
  "Shared session history across the team",
  "Designated account manager",
  "Priority email support",
  "Onboarding call included",
];

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (!user) {
      navigate("/login?next=/pricing");
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
        navigate("/login?next=/pricing");
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
    <MarketingLayout>
      <div className="px-4 py-14">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mx-auto max-w-2xl text-center">
            <div className="inline-flex items-center rounded-full bg-teal-50 px-4 py-1.5 text-sm font-semibold text-teal-800 ring-1 ring-teal-100">
              Pricing
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold text-slate-900 md:text-4xl">
              Simple, honest pricing
            </h1>
            <p className="mt-3 text-slate-600">
              Start free. Subscribe when you're ready. Cancel any time.
            </p>
          </div>

          {/* Pricing cards */}
          <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2">
            {/* Solo */}
            <div className="relative rounded-2xl border-2 border-slate-200 bg-white p-8 shadow-sm">
              <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-0.5 text-xs font-bold text-slate-700">
                Solo
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-slate-900">£29</span>
                <span className="text-slate-500">/month</span>
              </div>
              <p className="mt-1 text-sm text-slate-500">Per registered manager. Cancel any time.</p>

              <ul className="mt-7 space-y-3">
                {SOLO_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={handleCheckout}
                disabled={busy}
                className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-teal-600 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors disabled:opacity-60"
              >
                {busy ? "Redirecting to checkout..." : user ? "Subscribe — £29/month" : "Start free trial"}
                {!busy && <ArrowRight className="ml-2 h-4 w-4" />}
              </button>
              {error ? (
                <p className="mt-3 text-center text-xs text-red-700">{error}</p>
              ) : null}
              <p className="mt-3 text-center text-xs text-slate-500">
                Free trial: 3 days, 2 sessions/day (6 total).
              </p>
            </div>

            {/* Team — Most Popular */}
            <div className="relative rounded-2xl border-2 border-teal-600 bg-white p-8 shadow-lg">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 rounded-full bg-teal-600 px-3 py-1 text-xs font-bold text-white shadow">
                  <Star className="h-3 w-3 fill-white" /> Most Popular
                </span>
              </div>

              <div className="inline-flex items-center rounded-full bg-teal-600 px-3 py-0.5 text-xs font-bold text-white">
                Team
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-slate-900">£69</span>
                <span className="text-slate-500">/month</span>
              </div>
              <p className="mt-1 text-sm text-slate-500">Up to 5 managers. One home or several.</p>

              <ul className="mt-7 space-y-3">
                {TEAM_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                to="/contact"
                className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
              >
                Contact us <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <p className="mt-3 text-center text-xs text-slate-500">
                We'll set up your team within 24 hours.
              </p>
            </div>
          </div>

          <div className="mx-auto mt-6 max-w-4xl rounded-xl bg-slate-50 border border-slate-200 px-5 py-4 text-sm text-slate-600 text-center">
            Prices exclude VAT where applicable. For multi-home or organisational licensing,{" "}
            <Link to="/contact" className="text-teal-700 hover:underline font-medium">
              contact us
            </Link>
            .
          </div>

          {/* Disclaimer */}
          <div className="mx-auto mt-6 max-w-4xl rounded-xl bg-amber-50 border border-amber-200 px-5 py-4 text-sm text-amber-800 text-center">
            <strong>Disclaimer:</strong> MockOfsted is a practice and professional development tool. It does not constitute official Ofsted guidance or legal compliance advice. All evaluations are AI-generated based on your answers only and do not reflect a full Ofsted inspection.
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}

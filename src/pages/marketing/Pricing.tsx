import { ArrowRight, CheckCircle2, Star, Minus, Shield, Zap, Target, HelpCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import MarketingLayout from "./MarketingLayout";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { trackCheckoutStarted } from "@/lib/analytics";

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
  "Accounts for up to 5 staff",
  "Designated account contact",
  "Priority email support",
  "Personal onboarding call",
  "Manual setup within 24 hours",
];

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");

  const MONTHLY_PRICE_ID = import.meta.env.VITE_STRIPE_PRICE_ID;
  const ANNUAL_PRICE_ID = import.meta.env.VITE_STRIPE_ANNUAL_PRICE_ID || "price_1TBLmuK2Jf3A4FB8HDggUkTg";

  const handleCheckout = async (priceId?: string) => {
    if (!user) {
      navigate("/login?next=/pricing");
      return;
    }
    setBusy(true);
    setError(null);
    trackCheckoutStarted();
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
        body: JSON.stringify({ returnUrl, priceId }),
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
              For Registered Managers, Responsible Individuals, Nominated Individuals, Deputies, and Care Leaders. Start free. Subscribe when you're ready. Cancel any time.
            </p>
          </div>

          {/* Pricing cards */}
          <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2">
            {/* Solo */}
            <div className="relative rounded-2xl border-2 border-slate-200 bg-white p-8 shadow-sm">
              <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-0.5 text-xs font-bold text-slate-700">
                Solo
              </div>

              {/* Monthly/Annual Toggle */}
              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={() => setBillingPeriod("monthly")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    billingPeriod === "monthly"
                      ? "bg-teal-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingPeriod("annual")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    billingPeriod === "annual"
                      ? "bg-teal-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Annual
                </button>
              </div>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-slate-900">
                  {billingPeriod === "monthly" ? "£29" : "£299"}
                </span>
                <span className="text-slate-500">
                  {billingPeriod === "monthly" ? "/month" : "/year"}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {billingPeriod === "annual" ? "Save 2 months worth of fees" : "Per user. Cancel any time."}
              </p>
              {billingPeriod === "annual" && (
                <div className="mt-2 inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Save £49/year
                </div>
              )}

              <ul className="mt-7 space-y-3">
                {SOLO_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => {
                  const priceId = billingPeriod === "annual" ? ANNUAL_PRICE_ID : MONTHLY_PRICE_ID;
                  handleCheckout(priceId);
                }}
                disabled={busy}
                className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-teal-600 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors disabled:opacity-60"
              >
                {busy ? "Redirecting to checkout..." : user ? (
                  billingPeriod === "annual"
                    ? "Subscribe — £299/year"
                    : "Subscribe — £29/month"
                ) : "Start free trial"}
                {!busy && <ArrowRight className="ml-2 h-4 w-4" />}
              </button>
              {error ? (
                <p className="mt-3 text-center text-xs text-red-700">{error}</p>
              ) : null}
              <p className="mt-3 text-center text-xs text-slate-500">
                Free trial: 3 days, 2 sessions/day (6 total).
              </p>
              <p className="mt-2 text-center text-xs text-slate-500">
                Have a promo code? You can enter it at checkout.
              </p>
            </div>

            {/* Team — Most Popular */}
            <div className="relative rounded-2xl border-2 border-teal-600 bg-white p-8 shadow-lg">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 rounded-full bg-teal-600 px-3 py-1 text-xs font-bold text-white shadow">
                  <Star className="h-3 w-3 fill-white" /> Most Popular
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="inline-flex items-center rounded-full bg-teal-600 px-3 py-0.5 text-xs font-bold text-white">
                  Team
                </div>
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                  Save 39%
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-slate-900">£89</span>
                <span className="text-slate-500">/month</span>
              </div>
              <p className="mt-1 text-sm text-slate-500">Up to 5 staff (£17.80 per person vs £29 solo)</p>
              <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                <p className="text-xs font-semibold text-emerald-900">✓ Best for homes with multiple managers</p>
                <p className="text-xs text-emerald-700 mt-1">All staff practice together, see team progress</p>
              </div>

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

          {/* ── Section: Who is this for? ──────────────────────────────────── */}
          <div className="mx-auto mt-16 max-w-4xl">
            <div className="text-center mb-10">
              <h2 className="font-display text-2xl font-bold text-slate-900">Who is this for?</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-8">
                <div className="inline-flex items-center rounded-full bg-teal-50 px-3 py-1 text-sm font-semibold text-teal-800 ring-1 ring-teal-100 mb-4">
                  🏠 Registered Managers
                </div>
                <h3 className="font-semibold text-slate-900 text-lg mt-2 mb-3">Preparing for inspections</h3>
                <p className="text-sm text-slate-600 mb-4">
                  You need to pass unannounced inspections. Practice with realistic SCCIF scenarios, get scored feedback on all 9 Quality Standards, and build confidence before inspection day.
                </p>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li>✓ Unannounced inspection prep</li>
                  <li>✓ Protection of Children (limiting judgement) practice</li>
                  <li>✓ All 9 Quality Standards coverage</li>
                  <li>✓ Measurable progress tracking</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-8">
                <div className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-800 ring-1 ring-amber-100 mb-4">
                  🎯 Aspiring RMs & Leaders
                </div>
                <h3 className="font-semibold text-slate-900 text-lg mt-2 mb-3">Interview & career prep</h3>
                <p className="text-sm text-slate-600 mb-4">
                  You're interviewing for Registered Manager or leadership roles. Prepare for fit-person interviews and SCCIF readiness assessment by practising real inspection scenarios.
                </p>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li>✓ Fit-person interview preparation</li>
                  <li>✓ Leadership competency building</li>
                  <li>✓ SCCIF knowledge development</li>
                  <li>✓ Career advancement readiness</li>
                </ul>
              </div>
            </div>
          </div>

          {/* ── Section: ROI Comparison ──────────────────────────────────── */}
          <div className="mx-auto mt-16 max-w-4xl">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8">
                <p className="text-sm font-semibold text-slate-600 mb-4">The old way</p>
                <ul className="space-y-3 text-slate-700 text-sm">
                  <li>• 3 hours of self-study</li>
                  <li>• Reading 40-page SCCIF documents</li>
                  <li>• Guessing what inspectors will ask</li>
                  <li>• Anxiety on inspection day</li>
                </ul>
              </div>
              <div className="rounded-2xl border-2 border-teal-600 bg-white p-8">
                <p className="text-sm font-semibold text-teal-700 mb-4">With MockOfsted</p>
                <ul className="space-y-3 text-slate-700 text-sm">
                  <li>• 20-minute practice session</li>
                  <li>• AI inspector asks real questions</li>
                  <li>• Instant scored feedback</li>
                  <li>• Confidence on inspection day</li>
                </ul>
              </div>
            </div>
            <div className="mt-8 text-center rounded-2xl border-2 border-teal-200 bg-teal-50 p-6">
              <p className="text-3xl font-bold text-teal-900">1 session = 3 hours of prep</p>
              <p className="mt-1 text-sm text-teal-700">Compressed into 20 minutes</p>
            </div>
          </div>

          {/* ── Section: Feature Comparison Table ────────────────────────── */}
          <div className="mx-auto mt-16 max-w-4xl">
            <h2 className="text-center font-display text-2xl font-bold text-slate-900 mb-8">Compare plans</h2>
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-6 py-4 font-semibold text-slate-900">Feature</th>
                    <th className="text-center px-6 py-4 font-semibold text-slate-900">Free Trial</th>
                    <th className="text-center px-6 py-4 font-semibold text-teal-900">Pro — £29/mo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { name: "All 9 Quality Standards", trial: true, pro: true },
                    { name: "Voice & text responses", trial: true, pro: true },
                    { name: "Scored feedback (bands 1–4)", trial: true, pro: true },
                    { name: "Full inspection report", trial: false, pro: true },
                    { name: "Session history", trial: false, pro: true },
                    { name: "Sessions per day", trial: "2", pro: "Unlimited" },
                    { name: "Trial duration", trial: "3 days", pro: "No expiry" },
                  ].map((row) => (
                    <tr key={row.name} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-slate-700 font-medium">{row.name}</td>
                      <td className="px-6 py-4 text-center">
                        {typeof row.trial === "boolean" ? (
                          row.trial ? <CheckCircle2 className="h-5 w-5 text-teal-600 mx-auto" /> : <Minus className="h-5 w-5 text-slate-300 mx-auto" />
                        ) : (
                          <span className="text-slate-700 font-medium">{row.trial}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {typeof row.pro === "boolean" ? (
                          row.pro ? <CheckCircle2 className="h-5 w-5 text-teal-600 mx-auto" /> : <Minus className="h-5 w-5 text-slate-300 mx-auto" />
                        ) : (
                          <span className="text-slate-700 font-medium">{row.pro}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Section: Trust Indicators ────────────────────────────────── */}
          <div className="mx-auto mt-16 max-w-4xl">
            <h2 className="text-center font-display text-2xl font-bold text-slate-900 mb-8">Why managers trust MockOfsted</h2>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 mx-auto mb-4">
                  <Shield className="h-6 w-6 text-teal-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Built for SCCIF</h3>
                <p className="text-sm text-slate-600">All 9 Quality Standards, SCCIF-aligned rubric, and evidence-based evaluation.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 mx-auto mb-4">
                  <Zap className="h-6 w-6 text-teal-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">AI evaluated</h3>
                <p className="text-sm text-slate-600">Claude evaluates your answers against SCCIF criteria in real-time.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 mx-auto mb-4">
                  <Target className="h-6 w-6 text-teal-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Expert-designed</h3>
                <p className="text-sm text-slate-600">Questions and feedback reflect how real Ofsted inspectors think.</p>
              </div>
            </div>
          </div>

          {/* ── Section: FAQ Link Banner ────────────────────────────────── */}
          <div className="mx-auto mt-16 max-w-4xl rounded-2xl border border-teal-200 bg-teal-50 p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <HelpCircle className="h-5 w-5 text-teal-700" />
              <p className="text-sm font-semibold text-teal-900">Have questions?</p>
            </div>
            <p className="text-sm text-teal-800 mb-4">
              Read our <Link to="/faq" className="font-semibold hover:underline">full FAQ</Link> or <Link to="/contact" className="font-semibold hover:underline">contact us</Link>
            </p>
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

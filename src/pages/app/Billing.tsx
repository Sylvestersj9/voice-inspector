import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Loader2, AlertCircle, Download, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import { computeTrialUsage, TRIAL_DAILY_LIMIT, TRIAL_TOTAL_LIMIT } from "@/lib/trial";
import AppNav from "@/components/AppNav";

type Subscription = {
  status: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  created_at: string | null;
};

type BillingDetails = {
  hasPaidSub: boolean;
  planName?: string;
  amount?: number;
  interval?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  paymentMethod?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  } | null;
  invoices?: Array<{
    id: string;
    date: string;
    amount: string;
    status: string;
    pdfUrl: string;
  }>;
};

function isPaidSub(sub: Subscription | null): boolean {
  return (
    sub?.status === "active" ||
    (!!sub?.stripe_subscription_id && sub.status === "trialing")
  );
}

export default function Billing() {
  const { user } = useAuth();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [billingDetails, setBillingDetails] = useState<BillingDetails | null>(null);
  const [trialInfo, setTrialInfo] = useState<ReturnType<typeof computeTrialUsage> | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [billingPortalLoading, setBillingPortalLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [{ data: subData }, { data: sessionsData }] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("status,stripe_subscription_id,stripe_customer_id,created_at")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("sessions")
        .select("started_at")
        .eq("user_id", user.id),
    ]);

    setSub(subData ?? null);

    // Compute trial info if not paid
    const paid = isPaidSub(subData ?? null);
    if (!paid) {
      const trialStart = subData?.created_at ? new Date(subData.created_at) : new Date();
      setTrialInfo(computeTrialUsage(trialStart, sessionsData ?? []));
    } else {
      setTrialInfo(null);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  // Load Stripe billing details if paid
  useEffect(() => {
    async function loadBillingDetails() {
      if (!isPaidSub(sub) || !user) return;

      setDetailsLoading(true);
      try {
        const { data: { session: authSession } } = await supabase.auth.getSession();
        const token = authSession?.access_token;
        if (!token) throw new Error("No auth token");

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

        const res = await fetch(`${supabaseUrl}/functions/v1/get-billing-details`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: anonKey,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) throw new Error("Failed to fetch billing details");
        const details = await res.json();
        setBillingDetails(details);
      } catch (err) {
        console.error("Failed to load billing details:", err);
      } finally {
        setDetailsLoading(false);
      }
    }

    loadBillingDetails();
  }, [sub, user]);

  const handleBillingPortal = async () => {
    setBillingPortalLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("billing-portal", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ returnUrl: window.location.href }),
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Billing portal error:", err);
    } finally {
      setBillingPortalLoading(false);
    }
  };

  const paid = isPaidSub(sub);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNav isPaid={paid} onSignOut={() => window.location.href = "/login"} />

      <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        {/* Header */}
        <div>
          <Link
            to="/app/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="font-display text-3xl font-bold text-slate-900">Billing & Subscription</h1>
          <p className="mt-2 text-sm text-slate-600">Manage your MockOfsted subscription and payment details.</p>
        </div>

        {/* Section 1: Current Plan */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg font-bold text-slate-900 mb-4">Current Plan</h2>

          {paid ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Status</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {billingDetails?.planName || "Pro"} — £{billingDetails?.amount || "29"}/month
                  </p>
                </div>
                <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Active subscription
                </div>
              </div>

              {billingDetails?.currentPeriodEnd && (
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs text-slate-600">Next billing date</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">
                    {new Date(billingDetails.currentPeriodEnd).toLocaleDateString("en-GB")}
                  </p>
                </div>
              )}

              {billingDetails?.cancelAtPeriodEnd && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900">Cancellation scheduled</p>
                    <p className="text-xs text-amber-800 mt-1">
                      Your subscription will end on {new Date(billingDetails.currentPeriodEnd).toLocaleDateString("en-GB")}.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Status</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">Free Trial</p>
                </div>
                <div className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  Trial active
                </div>
              </div>

              {trialInfo && !trialInfo.expired && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <p className="text-slate-600">Sessions used</p>
                    <p className="font-semibold text-slate-900">
                      {trialInfo.usedTotal} / {TRIAL_TOTAL_LIMIT}
                    </p>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-amber-600 transition-all"
                      style={{
                        width: `${Math.min((trialInfo.usedTotal / TRIAL_TOTAL_LIMIT) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-600 mt-2">
                    {trialInfo.remainingTotal} sessions remaining • Expires {trialInfo.trialEndsAt?.toLocaleDateString("en-GB")}
                  </p>
                </div>
              )}

              <Link
                to="/app/paywall"
                className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-700 transition-colors w-full"
              >
                Upgrade to Pro — £29/month
              </Link>
            </div>
          )}
        </section>

        {/* Section 2: Payment Method */}
        {paid && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-display text-lg font-bold text-slate-900 mb-4">Payment Method</h2>

            {detailsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
              </div>
            ) : billingDetails?.paymentMethod ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-6">
                  <p className="text-sm text-slate-600 mb-2">Card</p>
                  <p className="text-lg font-semibold text-slate-900 capitalize">
                    {billingDetails.paymentMethod.brand} •••• {billingDetails.paymentMethod.last4}
                  </p>
                  <p className="text-xs text-slate-600 mt-4">
                    Expires {String(billingDetails.paymentMethod.expMonth).padStart(2, "0")}/{String(
                      billingDetails.paymentMethod.expYear
                    ).slice(-2)}
                  </p>
                </div>

                <button
                  onClick={handleBillingPortal}
                  disabled={billingPortalLoading}
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60"
                >
                  {billingPortalLoading ? "Loading..." : "Update payment method"}
                </button>
              </div>
            ) : (
              <p className="text-sm text-slate-600">Payment method information not available.</p>
            )}
          </section>
        )}

        {/* Section 3: Invoice History */}
        {paid && billingDetails?.invoices && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-display text-lg font-bold text-slate-900 mb-4">Billing History</h2>

            {billingDetails.invoices.length > 0 ? (
              <div className="space-y-2">
                {billingDetails.invoices.map(inv => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{inv.date}</p>
                      <p className="text-xs text-slate-600">£{inv.amount}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        inv.status === "paid"
                          ? "bg-emerald-50 text-emerald-700"
                          : inv.status === "open"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-slate-100 text-slate-700"
                      }`}>
                        {inv.status}
                      </span>
                      {inv.pdfUrl && (
                        <a
                          href={inv.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded p-1.5 hover:bg-slate-200 transition-colors"
                          title="Download PDF"
                        >
                          <Download className="h-4 w-4 text-slate-600" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-600">No invoices yet.</p>
            )}
          </section>
        )}

        {/* Section 4: Danger Zone */}
        {paid && !billingDetails?.cancelAtPeriodEnd && (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <h2 className="font-display text-lg font-bold text-red-900 mb-2">Danger Zone</h2>
            <p className="text-sm text-red-800 mb-4">
              Cancel your subscription and lose access at the end of your billing period.
            </p>
            <button
              onClick={handleBillingPortal}
              disabled={billingPortalLoading}
              className="rounded-lg border border-red-300 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-100 transition-colors disabled:opacity-60"
            >
              {billingPortalLoading ? "Loading..." : "Cancel subscription"}
            </button>
          </section>
        )}
      </main>
    </div>
  );
}

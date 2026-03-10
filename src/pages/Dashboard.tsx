import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/auth/AuthProvider";
import { getBandColorClass } from "@/lib/questions";
import { computeTrialUsage } from "@/lib/trial";
import { ArrowRight, PlayCircle, FileText, LogOut } from "lucide-react";

type UserProfile = {
  name: string | null;
  role: string | null;
  home_name: string | null;
};

type Subscription = {
  status: string;
  stripe_subscription_id: string | null;
  created_at: string | null;
};

type SessionRow = {
  id: string;
  started_at: string;
  completed_at: string | null;
  overall_band: string | null;
  overall_score: number | null;
};

function statusLabel(sub: Subscription | null, trialInfo: ReturnType<typeof computeTrialUsage> | null) {
  if (!sub) return { text: "Free trial", colour: "bg-teal-50 text-teal-700" };
  const isPaid = !!sub.stripe_subscription_id && (sub.status === "active" || sub.status === "trialing");
  if (isPaid) return { text: "Active subscription", colour: "bg-emerald-50 text-emerald-700" };
  if (trialInfo) {
    if (trialInfo.expired) return { text: "Trial ended", colour: "bg-amber-50 text-amber-700" };
    return { text: `Trial: ${trialInfo.remainingToday} left today`, colour: "bg-amber-50 text-amber-700" };
  }
  switch (sub.status) {
    case "active": return { text: "Active subscription", colour: "bg-emerald-50 text-emerald-700" };
    case "past_due": return { text: "Payment overdue", colour: "bg-red-50 text-red-700" };
    case "cancelled": return { text: "Subscription cancelled", colour: "bg-slate-100 text-slate-600" };
    default: return { text: sub.status, colour: "bg-slate-100 text-slate-600" };
  }
}

function canStartSession(sub: Subscription | null, trialInfo: ReturnType<typeof computeTrialUsage> | null): boolean {
  if (!sub) return true;
  const isPaid = !!sub.stripe_subscription_id && (sub.status === "active" || sub.status === "trialing");
  if (isPaid) return true;
  if (!trialInfo) return true;
  if (trialInfo.expired) return false;
  if (trialInfo.remainingTotal <= 0) return false;
  if (trialInfo.remainingToday <= 0) return false;
  return true;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [trialInfo, setTrialInfo] = useState<ReturnType<typeof computeTrialUsage> | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      setLoading(true);
      const [{ data: prof }, { data: sub }, { data: sess }] = await Promise.all([
        supabase.from("users").select("name,role,home_name").eq("id", user!.id).single(),
        supabase.from("subscriptions").select("status,stripe_subscription_id,created_at").eq("user_id", user!.id).maybeSingle(),
        supabase
          .from("sessions")
          .select("id,started_at,completed_at,overall_band,overall_score")
          .eq("user_id", user!.id)
          .order("started_at", { ascending: false })
          .limit(20),
      ]);
      setProfile(prof ?? null);
      setSubscription(sub ?? null);
      setSessions(sess ?? []);

      const status = sub?.status ?? null;
      const stripeId = sub?.stripe_subscription_id ?? null;
      const isPaid = !!stripeId && (status === "active" || status === "trialing");
      if (!isPaid) {
        const trialStart = sub?.created_at ? new Date(sub.created_at) : new Date();
        const { data: trialSessions } = await supabase
          .from("sessions")
          .select("started_at")
          .eq("user_id", user!.id)
          .gte("started_at", trialStart.toISOString());
        setTrialInfo(computeTrialUsage(trialStart, trialSessions ?? []));
      } else {
        setTrialInfo(null);
      }
      setLoading(false);
    }
    load();
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login?loggedOut=true", { replace: true });
  };

  const startSession = () => {
    if (!canStartSession(subscription, trialInfo)) {
      navigate("/app/paywall");
      return;
    }
    navigate("/app");
  };

  const displayName = profile?.name || user?.email?.split("@")[0] || "Manager";
  const sub = subscription;
  const badge = statusLabel(sub, trialInfo);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600">
              <svg viewBox="0 0 32 32" fill="none" className="h-4 w-4" aria-hidden="true">
                <path d="M16 4L4 10v12l12 6 12-6V10L16 4z" stroke="white" strokeWidth="2" strokeLinejoin="round" fill="none" />
                <path d="M16 4v18M4 10l12 6 12-6" stroke="white" strokeWidth="2" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-display font-bold text-slate-900">InspectReady</span>
          </div>
          <nav className="hidden items-center gap-1 sm:flex">
            <Link to="/app" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
              Practice
            </Link>
            <Link to="/app/dashboard" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-900 bg-slate-100">
              Dashboard
            </Link>
            {sub?.status !== "active" && (
              <Link
                to="/pricing"
                className="rounded-lg px-3 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50 transition-colors"
              >
                Subscribe
              </Link>
            )}
          </nav>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 space-y-8">
        {/* Welcome */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900">
              Welcome back, {displayName}
            </h1>
            {profile?.home_name && (
              <p className="mt-0.5 text-sm text-slate-500">{profile.home_name}</p>
            )}
            <div className={`mt-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badge.colour}`}>
              {badge.text}
            </div>
          </div>
          <div className="flex gap-2">
            {!canStartSession(sub, trialInfo) && (
              <Link
                to="/pricing"
                className="inline-flex items-center justify-center rounded-xl border border-teal-600 px-4 py-2.5 text-sm font-semibold text-teal-600 hover:bg-teal-50 transition-colors"
              >
                Upgrade — £29/mo
              </Link>
            )}
            <button
              onClick={startSession}
              className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors"
            >
              <PlayCircle className="mr-2 h-4 w-4" />
              Start new session
            </button>
          </div>
        </div>

        {/* Trial / upgrade nudge */}
        {trialInfo && !canStartSession(sub, trialInfo) && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
            <p className="text-sm font-semibold text-amber-900">Free trial limit reached.</p>
            <p className="mt-1 text-sm text-amber-800">Trial includes 3 days with up to 5 sessions per day (15 total).</p>
            <p className="mt-1 text-sm text-amber-800">
              Subscribe for unlimited sessions and full inspection reports.
            </p>
            <Link
              to="/pricing"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition-colors"
            >
              Subscribe now <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        {/* Session history */}
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900 mb-4">Session history</h2>
          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading sessions…</div>
          ) : sessions.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
              <PlayCircle className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 font-semibold text-slate-700">No sessions yet</p>
              <p className="mt-1 text-sm text-slate-500">Start your first practice session to see your history here.</p>
              <button
                onClick={startSession}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
              >
                Start first session <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Overall band</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Report</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sessions.map((s) => {
                    const date = new Date(s.started_at).toLocaleDateString("en-GB", {
                      day: "numeric", month: "short", year: "numeric",
                    });
                    const completed = !!s.completed_at;
                    return (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-800">{date}</td>
                        <td className="px-4 py-3">
                          {s.overall_band ? (
                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getBandColorClass(s.overall_band)}`}>
                              {s.overall_band}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium ${completed ? "text-teal-700" : "text-amber-600"}`}>
                            {completed ? "Complete" : "In progress"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {completed ? (
                            <Link
                              to={`/app/report/${s.id}`}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-100 transition-colors"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              View report
                            </Link>
                          ) : (
                            <Link
                              to="/app"
                              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                            >
                              Continue
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-slate-400 leading-relaxed">
          InspectReady is a practice and professional development tool. It does not constitute official Ofsted guidance or legal compliance advice.
          All evaluations are AI-generated based on your answers only and do not reflect a full Ofsted inspection.
        </p>
      </main>
    </div>
  );
}

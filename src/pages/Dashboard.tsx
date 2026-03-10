import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/auth/AuthProvider";
import { getBandColorClass, DOMAIN_LABELS, type Domain } from "@/lib/questions";
import { computeTrialUsage, TRIAL_DAILY_LIMIT, TRIAL_TOTAL_LIMIT } from "@/lib/trial";
import ConfettiBurst from "@/components/ConfettiBurst";
import type { SessionRow } from "@/types/session";
import {
  ArrowRight,
  PlayCircle,
  FileText,
  LogOut,
  CheckCircle2,
  Loader2,
  Clipboard,
  Zap,
  RotateCcw,
} from "lucide-react";

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

// ── Helpers ───────────────────────────────────────────────────────────────────

function isPaidSub(sub: Subscription | null): boolean {
  return (
    sub?.status === "active" ||
    (!!sub?.stripe_subscription_id && sub.status === "trialing")
  );
}

function canStartSession(
  sub: Subscription | null,
  trialInfo: ReturnType<typeof computeTrialUsage> | null,
): boolean {
  if (isPaidSub(sub)) return true;
  if (!trialInfo) return true;
  if (trialInfo.expired) return false;
  if (trialInfo.remainingTotal <= 0) return false;
  if (trialInfo.remainingToday <= 0) return false;
  return true;
}

/** "Safeguarding + 4 others" */
function formatDomainMix(responses: Array<{ domain: string }>): string {
  const uniqueDomains = [...new Set(responses.map((r) => r.domain))];
  if (uniqueDomains.length === 0) return "—";

  // Prioritise ProtectionChildren as the primary label
  const primary = uniqueDomains.includes("ProtectionChildren")
    ? "Safeguarding"
    : uniqueDomains.includes("LeadershipManagement")
      ? "Leadership"
      : DOMAIN_LABELS[uniqueDomains[0] as Domain] ?? uniqueDomains[0];

  const primaryDomain = uniqueDomains.includes("ProtectionChildren")
    ? "ProtectionChildren"
    : uniqueDomains.includes("LeadershipManagement")
      ? "LeadershipManagement"
      : uniqueDomains[0];

  const othersCount = uniqueDomains.filter((d) => d !== primaryDomain).length;
  if (othersCount === 0) return primary;
  return `${primary} + ${othersCount} other${othersCount !== 1 ? "s" : ""}`;
}

function getSessionTypeInfo(responseCount: number): {
  label: string;
  Icon: React.ElementType;
  colour: string;
} {
  if (responseCount >= 6)
    return { label: "Full", Icon: Clipboard, colour: "text-teal-600" };
  if (responseCount >= 3)
    return { label: "Practice", Icon: PlayCircle, colour: "text-amber-600" };
  return { label: "Quick", Icon: Zap, colour: "text-slate-500" };
}

/** Colour‑coded trial pill: teal → amber → red as limits approach */
function trialBadgeColour(
  trialInfo: ReturnType<typeof computeTrialUsage>,
): string {
  if (trialInfo.expired || trialInfo.remainingTotal === 0)
    return "bg-red-50 text-red-700 border-red-200";
  if (trialInfo.remainingToday <= 1 || trialInfo.remainingTotal <= 2)
    return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-teal-50 text-teal-700 border-teal-200";
}

function subStatusText(
  sub: Subscription | null,
  trialInfo: ReturnType<typeof computeTrialUsage> | null,
): string {
  if (isPaidSub(sub)) return "Active subscription — unlimited access";
  if (!trialInfo) return "Free trial";
  if (trialInfo.expired) return "Trial ended — upgrade for unlimited access";
  const endsStr = trialInfo.trialEndsAt
    ? trialInfo.trialEndsAt.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      })
    : "";
  return endsStr ? `Trial ends ${endsStr}` : "Free trial";
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [trialInfo, setTrialInfo] = useState<ReturnType<
    typeof computeTrialUsage
  > | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [justSubscribed, setJustSubscribed] = useState(false);

  const checkoutSuccess = searchParams.get("checkout") === "success";

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [{ data: prof }, { data: sub }, { data: sess }] = await Promise.all([
      supabase
        .from("users")
        .select("name,role,home_name")
        .eq("id", user.id)
        .single(),
      supabase
        .from("subscriptions")
        .select("status,stripe_subscription_id,created_at")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("sessions")
        .select("id,started_at,completed_at,overall_band,overall_score,responses(domain)")
        .eq("user_id", user.id)
        .order("started_at", { ascending: false })
        .limit(10),
    ]);

    setProfile(prof ?? null);
    setSubscription(sub ?? null);
    setSessions((sess as SessionRow[]) ?? []);

    const paid = isPaidSub(sub ?? null);
    if (!paid) {
      const trialStart = sub?.created_at ? new Date(sub.created_at) : new Date();
      const { data: trialSessions } = await supabase
        .from("sessions")
        .select("started_at")
        .eq("user_id", user.id)
        .gte("started_at", trialStart.toISOString());
      setTrialInfo(computeTrialUsage(trialStart, trialSessions ?? []));
    } else {
      setTrialInfo(null);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    load();
  }, [user, load]);

  // On checkout success: sync subscription from Stripe then reload
  useEffect(() => {
    if (!checkoutSuccess || !user) return;

    async function syncAndReload() {
      setSyncing(true);
      try {
        const {
          data: { session: authSession },
        } = await supabase.auth.getSession();
        const token = authSession?.access_token ?? "";
        await supabase.functions.invoke("sync-subscription", {
          headers: { Authorization: `Bearer ${token}` },
        });
        await new Promise((r) => setTimeout(r, 500));
        await load();
        setJustSubscribed(true);
      } finally {
        setSyncing(false);
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.delete("checkout");
          return next;
        });
      }
    }

    syncAndReload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutSuccess, user]);

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

  const displayName =
    profile?.name || user?.email?.split("@")[0] || "there";
  const homeName = profile?.home_name ?? "";
  const paid = isPaidSub(subscription);
  const canStart = canStartSession(subscription, trialInfo);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600">
              <svg
                viewBox="0 0 32 32"
                fill="none"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path
                  d="M16 4L4 10v12l12 6 12-6V10L16 4z"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  fill="none"
                />
                <path
                  d="M16 4v18M4 10l12 6 12-6"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="font-display font-bold text-slate-900">
              MockOfsted
            </span>
          </div>
          <nav className="hidden items-center gap-1 sm:flex">
            <Link
              to="/app"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              Practice
            </Link>
            <Link
              to="/app/dashboard"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-900 bg-slate-100"
            >
              Dashboard
            </Link>
            <Link
              to="/app/profile"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              Profile
            </Link>
            {!paid && (
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

      <main className="mx-auto max-w-6xl px-4 py-8 space-y-6 relative">
        <ConfettiBurst active={justSubscribed} />

        {/* Syncing / confirmed banners */}
        {syncing && (
          <div className="rounded-xl border border-teal-200 bg-teal-50 px-5 py-4 flex items-center gap-3">
            <Loader2 className="h-4 w-4 animate-spin text-teal-600 shrink-0" />
            <p className="text-sm text-teal-800 font-medium">
              Confirming your subscription…
            </p>
          </div>
        )}
        {justSubscribed && !syncing && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-900">
                Subscription confirmed — welcome!
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">
                You now have unlimited access to all practice sessions.
              </p>
            </div>
          </div>
        )}

        {/* ── Header row: welcome + status + CTA ─────────────────────────────── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold text-slate-900 truncate">
              Welcome back, {displayName}
            </h1>
            {homeName && (
              <p className="mt-0.5 text-sm text-slate-500 truncate">
                {homeName}
              </p>
            )}

            {/* Sub status line */}
            <p className="mt-1.5 text-xs text-slate-500">
              {subStatusText(subscription, trialInfo)}
            </p>

            {/* Trial badge */}
            {trialInfo && !paid && (
              <div
                className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${trialBadgeColour(trialInfo)}`}
              >
                {trialInfo.expired ? (
                  "Trial ended"
                ) : (
                  <>
                    Trial:{" "}
                    <span>
                      {trialInfo.usedToday}/{TRIAL_DAILY_LIMIT} today
                    </span>
                    <span className="opacity-40">|</span>
                    <span>
                      {trialInfo.usedTotal}/{TRIAL_TOTAL_LIMIT} total
                    </span>
                  </>
                )}
              </div>
            )}
            {paid && (
              <div className="mt-2 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Active subscription
              </div>
            )}
          </div>

          <div className="flex shrink-0 gap-2">
            {!canStart && (
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
              New session
            </button>
          </div>
        </div>

        {/* Trial exhausted upgrade nudge */}
        {trialInfo && !canStart && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
            <p className="text-sm font-semibold text-amber-900">
              Free trial limit reached.
            </p>
            <p className="mt-1 text-sm text-amber-800">
              Trial includes 2 sessions/day for 3 days (6 total).
            </p>
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

        {/* ── Session history ──────────────────────────────────────────────── */}
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900 mb-4">
            Session history
          </h2>

          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 flex items-center gap-3 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              Loading sessions…
            </div>
          ) : sessions.length === 0 ? (
            /* Empty state */
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
              <PlayCircle className="mx-auto h-12 w-12 text-slate-200" />
              <p className="mt-4 font-semibold text-slate-700">
                No sessions yet
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Start your first practice session to see your history here.
              </p>
              <button
                onClick={startSession}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
              >
                Start your first practice
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              {/* ── Desktop table (hidden on mobile) ── */}
              <div className="hidden sm:block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-teal-600">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-teal-50">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-teal-50">
                        Domain mix
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-teal-50">
                        Overall band
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-teal-50">
                        Type
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-teal-50">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sessions.map((s) => (
                      <SessionTableRow
                        key={s.id}
                        session={s}
                        onRestart={() => navigate("/app")}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── Mobile cards (hidden on sm+) ── */}
              <div className="sm:hidden space-y-3">
                {sessions.map((s) => (
                  <SessionCard
                    key={s.id}
                    session={s}
                    onRestart={() => navigate("/app")}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-slate-400 leading-relaxed">
          MockOfsted is a practice and professional development tool. It does
          not constitute official Ofsted guidance or legal compliance advice.
          All evaluations are AI-generated based on your answers only and do not
          reflect a full Ofsted inspection.
        </p>
      </main>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SessionTableRow({
  session: s,
  onRestart,
}: {
  session: SessionRow;
  onRestart: () => void;
}) {
  const navigate = useNavigate();
  const completed = !!s.completed_at;
  const date = new Date(s.started_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const responses = s.responses ?? [];
  const { label: typeLabel, Icon: TypeIcon, colour: typeColour } =
    getSessionTypeInfo(responses.length);

  function handleRowClick() {
    if (completed) navigate(`/app/report/${s.id}`);
  }

  return (
    <tr
      onClick={handleRowClick}
      className={`transition-colors ${completed ? "cursor-pointer hover:bg-slate-50" : "hover:bg-slate-50"}`}
    >
      <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
        {date}
      </td>
      <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate">
        {formatDomainMix(responses)}
      </td>
      <td className="px-4 py-3">
        {s.overall_band ? (
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getBandColorClass(s.overall_band)}`}
          >
            {s.overall_band}
          </span>
        ) : (
          <span
            className={`text-xs font-medium ${completed ? "text-slate-400" : "text-amber-600"}`}
          >
            {completed ? "—" : "In progress"}
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center gap-1 text-xs font-medium ${typeColour}`}
        >
          <TypeIcon className="h-3.5 w-3.5" />
          {typeLabel}
        </span>
      </td>
      <td
        className="px-4 py-3 text-right"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="inline-flex items-center gap-2">
          {completed ? (
            <Link
              to={`/app/report/${s.id}`}
              className="inline-flex items-center gap-1 rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-100 transition-colors"
            >
              <FileText className="h-3.5 w-3.5" />
              View report
            </Link>
          ) : (
            <Link
              to="/app"
              className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Continue
            </Link>
          )}
          <button
            onClick={onRestart}
            title="Restart with same domains"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restart
          </button>
        </div>
      </td>
    </tr>
  );
}

function SessionCard({
  session: s,
  onRestart,
}: {
  session: SessionRow;
  onRestart: () => void;
}) {
  const navigate = useNavigate();
  const completed = !!s.completed_at;
  const date = new Date(s.started_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const responses = s.responses ?? [];
  const { label: typeLabel, Icon: TypeIcon, colour: typeColour } =
    getSessionTypeInfo(responses.length);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
      {/* Top row: date + type */}
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium text-slate-800 text-sm">{date}</span>
        <span
          className={`inline-flex items-center gap-1 text-xs font-medium ${typeColour}`}
        >
          <TypeIcon className="h-3.5 w-3.5" />
          {typeLabel}
        </span>
      </div>

      {/* Domain mix */}
      <p className="text-xs text-slate-500 truncate">
        {formatDomainMix(responses)}
      </p>

      {/* Band + status */}
      <div className="flex items-center gap-2">
        {s.overall_band ? (
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getBandColorClass(s.overall_band)}`}
          >
            {s.overall_band}
          </span>
        ) : (
          <span
            className={`text-xs font-medium ${completed ? "text-slate-400" : "text-amber-600"}`}
          >
            {completed ? "No band" : "In progress"}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
        {completed ? (
          <button
            onClick={() => navigate(`/app/report/${s.id}`)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-100 transition-colors"
          >
            <FileText className="h-3.5 w-3.5" />
            View report
          </button>
        ) : (
          <Link
            to="/app"
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Continue
          </Link>
        )}
        <button
          onClick={onRestart}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Restart
        </button>
      </div>
    </div>
  );
}

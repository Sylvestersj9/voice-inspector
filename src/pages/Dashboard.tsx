import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/auth/AuthProvider";
import { getBandColorClass, DOMAIN_LABELS, type Domain } from "@/lib/questions";
import { computeTrialUsage, TRIAL_DAILY_LIMIT, TRIAL_TOTAL_LIMIT } from "@/lib/trial";
import AppNav from "@/components/AppNav";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import ConfettiBurst from "@/components/ConfettiBurst";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { SessionRow } from "@/types/session";
import {
  ArrowRight,
  PlayCircle,
  FileText,
  CheckCircle2,
  Loader2,
  Clipboard,
  Zap,
  RotateCcw,
  MessageSquare,
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
  const [sessions, setSessions] = useState<DashboardSessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [justSubscribed, setJustSubscribed] = useState(false);

  const checkoutSuccess = searchParams.get("checkout") === "success";

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const [
        { data: prof, error: profError },
        { data: sub, error: subError },
        { data: sess, error: sessError },
      ] = await Promise.all([
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
          .select("id,started_at,completed_at,overall_band,overall_score,notes")
          .eq("user_id", user.id)
          .order("started_at", { ascending: false })
          .limit(10),
      ]);

      // Fetch responses for all sessions separately to avoid nested query issues
      if (sess && sess.length > 0) {
        const sessionIds = sess.map(s => s.id);
        const { data: responses, error: respError } = await supabase
          .from("responses")
          .select("session_id,domain")
          .in("session_id", sessionIds);

        if (!respError && responses) {
          // Attach responses to sessions
          sess = sess.map(s => ({
            ...s,
            responses: responses.filter(r => r.session_id === s.id),
          }));
        }
      }

      if (profError) {
        console.error("Error loading user profile:", profError);
      }
      if (subError) {
        console.error("Error loading subscription:", subError);
      }
      if (sessError) {
        console.error("Error loading sessions:", sessError);
      }

      setProfile(prof ?? null);
      setSubscription(sub ?? null);
      setSessions((sess as DashboardSessionRow[]) ?? []);

      const paid = isPaidSub(sub ?? null);
      if (!paid) {
        const trialStart = sub?.created_at ? new Date(sub.created_at) : new Date();
        const { data: trialSessions, error: trialError } = await supabase
          .from("sessions")
          .select("started_at")
          .eq("user_id", user.id)
          .gte("started_at", trialStart.toISOString());

        if (trialError) {
          console.error("Error loading trial sessions:", trialError);
        }
        setTrialInfo(computeTrialUsage(trialStart, trialSessions ?? []));
      } else {
        setTrialInfo(null);
      }
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
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
      <AppNav isPaid={paid} onSignOut={handleSignOut} />

      <main className="mx-auto max-w-6xl px-4 py-8 space-y-6 relative">
        <ConfettiBurst active={justSubscribed} />
        <AnnouncementBanner />

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

function NoteButton({ sessionId, currentNote }: { sessionId: string; currentNote?: string | null }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(currentNote ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("sessions")
        .update({ notes: note.trim() || null })
        .eq("id", sessionId);

      if (error) {
        console.error("Failed to save note:", error);
        alert("Failed to save note. Please try again.");
        return;
      }

      setOpen(false);
    } catch (err) {
      console.error("Error saving note:", err);
      alert("Failed to save note. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          title={currentNote ? "Edit note" : "Add note"}
          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          {currentNote ? "Edit" : "Note"}
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Session note</DialogTitle>
          <DialogDescription>Add a private note about this session for your records.</DialogDescription>
        </DialogHeader>
        <Textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Add a note…"
          className="min-h-[100px]"
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SessionTableRow({
  session: s,
  onRestart,
}: {
  session: DashboardSessionRow;
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
          <NoteButton sessionId={s.id} currentNote={s.notes} />
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
  session: DashboardSessionRow;
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
        <NoteButton sessionId={s.id} currentNote={s.notes} />
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

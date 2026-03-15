import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/auth/AuthProvider";
import { computeTrialUsage, TRIAL_DAILY_LIMIT, TRIAL_TOTAL_LIMIT } from "@/lib/trial";
import {
  User,
  CreditCard,
  BarChart2,
  LogOut,
  ArrowLeft,
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  Bell,
  Trash2,
} from "lucide-react";

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

type UserProfile = {
  name: string;
  role: string;
  home_name: string;
  facility_type?: string;
};

type Subscription = {
  status: string;
  stripe_subscription_id: string | null;
  created_at: string | null;
  current_period_end: string | null;
};

function isPaid(sub: Subscription | null) {
  return (
    sub?.status === "active" ||
    (!!sub?.stripe_subscription_id && sub.status === "trialing")
  );
}

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile>({ name: "", role: "", home_name: "" });
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [trialInfo, setTrialInfo] = useState<ReturnType<typeof computeTrialUsage> | null>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [answerCount, setAnswerCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  const [pwSending, setPwSending] = useState(false);
  const [pwSent, setPwSent] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalErr, setPortalErr] = useState<string | null>(null);
  const [emailPrefs, setEmailPrefs] = useState({ trial_warnings: true, product_updates: true });
  const [prefsSaving, setPrefsSaving] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const [
        { data: prof, error: profError },
        { data: sub, error: subError },
        { data: sess, error: sessError },
        { count: ansCount, error: ansError },
      ] = await Promise.all([
        supabase.from("users").select("name,role,home_name,email_preferences,facility_type").eq("id", user.id).single(),
        supabase.from("subscriptions").select("status,stripe_subscription_id,created_at").eq("user_id", user.id).maybeSingle(),
        supabase.from("sessions").select("started_at").eq("user_id", user.id),
        supabase.from("responses").select("id", { count: "exact", head: true }).in(
          "session_id",
          (await supabase.from("sessions").select("id").eq("user_id", user.id)).data?.map((s) => s.id) ?? [],
        ),
      ]);

      if (profError) {
        console.error("Error loading user profile:", profError);
        throw profError;
      }
      if (subError) {
        console.error("Error loading subscription:", subError);
      }
      if (sessError) {
        console.error("Error loading sessions:", sessError);
      }
      if (ansError) {
        console.error("Error loading response count:", ansError);
      }

      if (prof) {
        setProfile({
          name: prof.name ?? "",
          role: prof.role ?? "",
          home_name: prof.home_name ?? "",
          facility_type: prof.facility_type ?? "childrens_home",
        });
        setEmailPrefs(prof.email_preferences ?? { trial_warnings: true, product_updates: true });
      }

      setSubscription(sub ?? null);
      setSessionCount(sess?.length ?? 0);
      setAnswerCount(ansCount ?? 0);

      if (!isPaid(sub ?? null)) {
        const trialStart = sub?.created_at ? new Date(sub.created_at) : new Date();
        setTrialInfo(computeTrialUsage(trialStart, sess ?? []));
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    load();
  }, [user, load, navigate]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSaveOk(false);
    setSaveErr(null);

    try {
      const { error } = await supabase
        .from("users")
        .update({
          name: profile.name.trim(),
          role: profile.role,
          home_name: profile.home_name.trim(),
          facility_type: profile.facility_type || "childrens_home",
        })
        .eq("id", user.id);

      if (error) {
        setSaveErr(error.message);
      } else {
        // Reload to confirm changes were saved
        await load();
        setSaveOk(true);
        setTimeout(() => setSaveOk(false), 3000);
      }
    } catch (err) {
      setSaveErr(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setPwSending(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/login`,
      });

      if (error) {
        console.error("Password reset error:", error);
        setSaveErr("Failed to send reset email. Please try again.");
        return;
      }

      setPwSent(true);
    } catch (err) {
      console.error("Password reset error:", err);
      setSaveErr("Failed to send reset email. Please try again.");
    } finally {
      setPwSending(false);
    }
  };

  const handleBillingPortal = async () => {
    setPortalLoading(true);
    setPortalErr(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const res = await fetch(`${supabaseUrl}/functions/v1/billing-portal`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          apikey: anonKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ returnUrl: `${window.location.origin}/app/profile` }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not open billing portal.");
      window.location.href = data.url;
    } catch (e) {
      setPortalErr(e instanceof Error ? e.message : "Unable to open billing portal.");
      setPortalLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleteLoading(true);
    setDeleteErr(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const res = await fetch(`${supabaseUrl}/functions/v1/delete-account`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          apikey: anonKey,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setDeleteErr(data.error || "Failed to delete account");
        return;
      }

      // Account deleted successfully, sign out and redirect
      await supabase.auth.signOut();
      navigate("/");
    } catch (e) {
      setDeleteErr(e instanceof Error ? e.message : "Failed to delete account");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const subLabel = subscription?.status === "cancelled"
    ? "Cancelled"
    : isPaid(subscription)
      ? "Active — unlimited access"
      : trialInfo?.expired
        ? "Trial ended"
        : `Free trial`;

  const subColour = subscription?.status === "cancelled"
    ? "bg-slate-50 text-slate-700 border-slate-200"
    : isPaid(subscription)
      ? "bg-teal-50 text-teal-700 border-teal-200"
      : trialInfo?.expired
        ? "bg-red-50 text-red-700 border-red-200"
        : "bg-amber-50 text-amber-700 border-amber-200";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 pb-16 pt-8">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            to="/app/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
        </div>

        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Your profile</h1>
          <p className="mt-1 text-sm text-slate-500">{user?.email}</p>
        </div>

        {/* ── Subscription card ─────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-teal-600" />
            <h2 className="font-display text-base font-bold text-slate-900">Subscription</h2>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold ${subColour}`}>
                  {subLabel}
                </span>
                {subscription?.status === "past_due" && (
                  <span className="inline-flex rounded-full border bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700 border-red-200">
                    Payment overdue
                  </span>
                )}
              </div>
              {!isPaid(subscription) && trialInfo && !trialInfo.expired && (
                <p className="text-sm text-slate-500">
                  {trialInfo.remainingToday}/{TRIAL_DAILY_LIMIT} today ·{" "}
                  {trialInfo.remainingTotal}/{TRIAL_TOTAL_LIMIT} total ·{" "}
                  expires{" "}
                  {trialInfo.trialEndsAt?.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                </p>
              )}
              {isPaid(subscription) && (
                <p className="text-sm text-slate-500">£29/month · unlimited sessions</p>
              )}
              {subscription?.status === "cancelled" && subscription?.current_period_end && (
                <p className="text-sm text-slate-500">
                  Your subscription was cancelled. Full access until{" "}
                  <span className="font-semibold text-slate-700">
                    {new Date(subscription.current_period_end).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </p>
              )}
            </div>
            {subscription?.status === "cancelled" ? (
              <Link
                to="/app/paywall"
                className="inline-flex items-center rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
              >
                Resubscribe — £29/month
              </Link>
            ) : isPaid(subscription) ? (
              <div className="space-y-2">
                <button
                  onClick={handleBillingPortal}
                  disabled={portalLoading}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition-colors"
                >
                  {portalLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Manage subscription
                </button>
                {portalErr && <p className="text-xs text-red-600">{portalErr}</p>}
              </div>
            ) : (
              <Link
                to="/app/paywall"
                className="inline-flex items-center rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
              >
                Upgrade — £29/month
              </Link>
            )}
          </div>
        </section>

        {/* ── Usage card ────────────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-teal-600" />
            <h2 className="font-display text-base font-bold text-slate-900">Usage</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{sessionCount}</p>
              <p className="mt-1 text-xs text-slate-500">Sessions completed</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{answerCount}</p>
              <p className="mt-1 text-xs text-slate-500">Answers submitted</p>
            </div>
            <div className="col-span-2 sm:col-span-1 rounded-xl bg-teal-50 p-4 text-center">
              <p className="text-2xl font-bold text-teal-700">
                {sessionCount > 0 ? Math.round(answerCount / sessionCount) : 0}
              </p>
              <p className="mt-1 text-xs text-teal-600">Avg answers/session</p>
            </div>
          </div>
        </section>

        {/* ── Personal info card ────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-teal-600" />
            <h2 className="font-display text-base font-bold text-slate-900">Personal info</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Full name</label>
              <input
                value={profile.name}
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                placeholder="Your name"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Role</label>
              <select
                value={profile.role}
                onChange={(e) => setProfile((p) => ({ ...p, role: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="">Select role…</option>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Facility Type</label>
              <select
                value={profile.facility_type || "childrens_home"}
                onChange={(e) => setProfile((p) => ({ ...p, facility_type: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="childrens_home">Children's Home (9 Quality Standards)</option>
                <option value="supported_accommodation">Supported Accommodation (4 Standards)</option>
              </select>
              <p className="mt-1.5 text-xs text-slate-500">This determines which inspection standards your practice sessions use.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Home / setting name</label>
              <input
                value={profile.home_name}
                onChange={(e) => setProfile((p) => ({ ...p, home_name: e.target.value }))}
                placeholder="e.g. Sunrise House"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            {saveErr && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {saveErr}
              </div>
            )}
            {saveOk && (
              <div className="flex items-center gap-2 rounded-lg bg-teal-50 px-4 py-3 text-sm text-teal-700">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                Profile saved.
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60 transition-colors"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save changes
            </button>
          </div>
        </section>

        {/* ── Account card ──────────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-teal-600" />
            <h2 className="font-display text-base font-bold text-slate-900">Account</h2>
          </div>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-700">Change password</p>
                <p className="text-xs text-slate-500">We'll email you a reset link.</p>
              </div>
              {pwSent ? (
                <span className="flex items-center gap-1.5 text-sm font-semibold text-teal-600">
                  <CheckCircle2 className="h-4 w-4" /> Email sent
                </span>
              ) : (
                <button
                  onClick={handlePasswordReset}
                  disabled={pwSending}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-60"
                >
                  {pwSending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Send reset email
                </button>
              )}
            </div>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-100 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </section>

        {/* ── Email Preferences card ────────────────────────────────────── */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-teal-600" />
            <h2 className="font-display text-base font-bold text-slate-900">Email preferences</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-700">Trial session reminders</p>
                <p className="text-xs text-slate-500">Email when you're running low on trial sessions.</p>
              </div>
              <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-300 transition-colors" style={{ backgroundColor: emailPrefs.trial_warnings ? '#0d9488' : '#cbd5e1' }}>
                <button
                  onClick={async () => {
                    const next = { ...emailPrefs, trial_warnings: !emailPrefs.trial_warnings };
                    setEmailPrefs(next);
                    setPrefsSaving(true);
                    try {
                      const { error } = await supabase.from("users").update({ email_preferences: next }).eq("id", user!.id);
                      if (error) {
                        console.error("Failed to update preferences:", error);
                        setEmailPrefs(emailPrefs); // revert on error
                      }
                    } catch (err) {
                      console.error("Error updating preferences:", err);
                      setEmailPrefs(emailPrefs); // revert on error
                    } finally {
                      setPrefsSaving(false);
                    }
                  }}
                  disabled={prefsSaving}
                  className="absolute h-5 w-5 rounded-full bg-white shadow-md transition-transform"
                  style={{ left: emailPrefs.trial_warnings ? '22px' : '2px' }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-700">Product updates & tips</p>
                <p className="text-xs text-slate-500">Occasional updates about new features and inspection preparation tips.</p>
              </div>
              <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-300 transition-colors" style={{ backgroundColor: emailPrefs.product_updates ? '#0d9488' : '#cbd5e1' }}>
                <button
                  onClick={async () => {
                    const next = { ...emailPrefs, product_updates: !emailPrefs.product_updates };
                    setEmailPrefs(next);
                    setPrefsSaving(true);
                    await supabase.from("users").update({ email_preferences: next }).eq("id", user!.id);
                    setPrefsSaving(false);
                  }}
                  disabled={prefsSaving}
                  className="absolute h-5 w-5 rounded-full bg-white shadow-md transition-transform"
                  style={{ left: emailPrefs.product_updates ? '22px' : '2px' }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Danger Zone ────────────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-600" />
            <h2 className="font-display text-base font-bold text-red-900">Danger zone</h2>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-red-700">
              Permanently delete your account and anonymize your personal data. Your session records will be retained for compliance purposes only.
            </p>
            {deleteErr && (
              <div className="flex items-center gap-2 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {deleteErr}
              </div>
            )}
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-red-300 bg-white px-5 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Delete my account
              </button>
            ) : (
              <div className="space-y-3 rounded-lg border border-red-300 bg-white p-4">
                <div>
                  <p className="text-sm font-semibold text-red-900 mb-2">Are you sure?</p>
                  <p className="text-xs text-red-700 mb-4">
                    This action cannot be undone. Your account will be permanently deleted, but your session records will be retained for our records.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleteLoading}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading}
                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-60"
                  >
                    {deleteLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Yes, delete permanently
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";
import { bootstrapOrganisation } from "@/org/bootstrapOrganisation";

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completeOnboarding = async () => {
    if (!user) return;
    setSubmitting(true);
    setError(null);
    try {
      const { data: existing } = await supabase
        .from("memberships")
        .select("organisation_id")
        .eq("profile_id", user.id)
        .limit(1)
        .maybeSingle();

      if (!existing) {
        await bootstrapOrganisation({
          id: user.id,
          email: user.email,
          role: "manager",
          full_name: (user.user_metadata as { full_name?: unknown } | undefined)?.full_name ?? null,
        });
      }

      const { error: updErr } = await supabase
        .from("profiles")
        .update({ onboarding_complete: true })
        .eq("id", user.id);
      if (updErr) throw updErr;

      setSubmitting(false);
      navigate("/app");
    } catch (err: unknown) {
      setSubmitting(false);
      const message = err instanceof Error ? err.message : "Onboarding failed";
      setError(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="card-elevated w-full max-w-lg space-y-4 p-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Welcome – one last step</h1>
        <p className="text-sm text-muted-foreground">
          Confirm to continue to the app.
        </p>
        <button
          onClick={completeOnboarding}
          className="w-full px-4 py-2 rounded-md bg-primary text-primary-foreground font-semibold"
          disabled={submitting}
        >
          {submitting ? "Saving..." : "Continue to app"}
        </button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completeOnboarding = async () => {
    if (!user) return;
    setSubmitting(true);
    setError(null);
    const { error: updErr } = await supabase
      .from("profiles")
      .update({ onboarding_complete: true })
      .eq("id", user.id);
    if (updErr) {
      setError(updErr.message);
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    navigate("/app");
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

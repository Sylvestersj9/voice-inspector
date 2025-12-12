import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { startCheckout } from "@/lib/billing";
import { CreditCard, LogOut, ShieldCheck } from "lucide-react";

export default function Account() {
  const { user, subscriptionStatus, refreshSubscription, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBilling = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const result = await startCheckout();
      if (result.portalUrl) {
        window.location.href = result.portalUrl;
        return;
      }
      if (result.url) {
        window.location.href = result.url;
        return;
      }
      setError("Unable to open billing.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Billing error");
    } finally {
      setLoading(false);
      refreshSubscription();
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const active = subscriptionStatus === "active" || subscriptionStatus === "trialing";

  return (
    <div className="min-h-screen gradient-hero py-8 px-4">
      <div className="container max-w-3xl mx-auto space-y-6">
        <div className="card-elevated p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Signed in as</p>
            <p className="text-lg font-semibold text-foreground">{user?.email}</p>
            <p className="text-sm text-muted-foreground capitalize">
              Subscription status: {subscriptionStatus || "none"}
            </p>
          </div>
          <Button variant="outline" onClick={handleSignOut} className="gap-2">
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>

        <div className="card-elevated p-6 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-semibold text-foreground">Billing</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            One subscription per account (£29/month). Manage payment details or cancel anytime via Stripe.
          </p>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {message && <p className="text-sm text-success">{message}</p>}

          <Button onClick={handleBilling} disabled={loading} className="gap-2">
            <CreditCard className="h-4 w-4" />
            {active ? "Open billing portal" : "Subscribe now"}
          </Button>
        </div>
      </div>
    </div>
  );
}

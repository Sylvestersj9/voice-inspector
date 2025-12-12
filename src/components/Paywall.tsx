import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, CreditCard, Sparkles } from "lucide-react";
import { startCheckout } from "@/lib/billing";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface PaywallProps {
  onRefresh?: () => void;
}

export function Paywall({ onRefresh }: PaywallProps) {
  const { user } = useAuth();
  const [promoCode, setPromoCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const result = await startCheckout(promoCode.trim() || undefined);
      if (result.alreadySubscribed && result.portalUrl) {
        setMessage("You already have an active subscription. Opening billing portal...");
        window.location.href = result.portalUrl;
        return;
      }
      if (result.url) {
        window.location.href = result.url;
      } else {
        setError("Unable to start checkout. Please try again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setLoading(false);
      onRefresh?.();
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center px-4">
      <div className="card-elevated max-w-lg w-full p-8 space-y-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Subscription required</h1>
            <p className="text-sm text-muted-foreground">
              Sign in to your account and activate your plan to continue.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border p-4 bg-muted/40 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Ofsted Readiness Simulator</p>
              <p className="text-sm text-muted-foreground">Single-manager license</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-display font-bold text-foreground">稖29</p>
              <p className="text-xs text-muted-foreground">per month</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <Sparkles className="h-3 w-3" />
            Includes history, exports, and SCCIF-grounded evaluations. One account per manager.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Promo code (beta)</label>
          <Input
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            placeholder="Optional"
            disabled={loading}
          />
        </div>

        {user?.email && (
          <p className="text-xs text-muted-foreground">
            Signed in as <span className="font-medium text-foreground">{user.email}</span>
          </p>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
        {message && <p className="text-sm text-success">{message}</p>}

        <Button onClick={handleSubscribe} disabled={loading} className="w-full gap-2">
          <CreditCard className="h-4 w-4" />
          {loading ? "Starting checkout..." : "Subscribe for 稖29/month"}
        </Button>

        <Button variant="outline" onClick={handleLogout} className="w-full">
          Sign Out
        </Button>
      </div>
    </div>
  );
}

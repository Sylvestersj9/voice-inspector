import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Paywall } from "./Paywall";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading, subscriptionStatus, refreshSubscription } = useAuth();
  const location = useLocation();

  const active = subscriptionStatus === "active" || subscriptionStatus === "trialing";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!active) {
    return <Paywall onRefresh={refreshSubscription} />;
  }

  return <>{children}</>;
}

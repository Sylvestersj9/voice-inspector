import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Role } from "./permissions";

interface RequireAuthProps {
  children: JSX.Element;
  allowedRoles?: Role[];
}

export function RequireAuth({ children, allowedRoles }: RequireAuthProps) {
  const { user, loading, role, onboardingComplete, ready } = useAuth();
  const location = useLocation();
  const isOnboardingRoute = location.pathname === "/onboarding";

  // Wait until auth + profile are ready
  if (loading || !ready) return <div style={{ padding: 16 }}>Loading…</div>;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (onboardingComplete === false && !isOnboardingRoute) {
    return <Navigate to="/onboarding" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/app" replace />;
  }

  return children;
}

import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import LoadingOverlay from "@/components/LoadingOverlay";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingOverlay message="Signing you in..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

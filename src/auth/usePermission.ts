import { useAuth } from "./AuthProvider";
import { hasPermission, type Permission, type Role } from "./permissions";

export function usePermission(permission: Permission) {
  const { user, loading } = useAuth();
  if (loading || !user) return false;
  // Default role; in a full RBAC setup this would come from a user_roles table
  const role: Role = "manager";
  return hasPermission(role, permission);
}

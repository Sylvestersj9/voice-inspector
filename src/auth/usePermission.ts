import { useAuth } from "./AuthProvider";
import { hasPermission, type Permission } from "./permissions";

export function usePermission(permission: Permission) {
  const { role, ready } = useAuth();
  if (!ready) return false;
  return hasPermission(role, permission);
}

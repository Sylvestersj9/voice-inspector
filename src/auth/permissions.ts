export type Role = "admin" | "manager" | "staff";
export type Permission = string;

export const rolePermissions: Record<Role, Permission[]> = {
  admin: ["*"],
  manager: [
    "inspection:start",
    "inspection:answer",
    "inspection:submit",
    "inspection:review",
  ],
  staff: ["inspection:answer"],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  if (role === "admin") return true;
  const perms = rolePermissions[role] || [];
  return perms.includes(permission);
}

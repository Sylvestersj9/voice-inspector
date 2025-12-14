import type { InspectionSession } from "./types";
import type { Role } from "@/auth/permissions";
import type { Session } from "@supabase/supabase-js";

export function isOwner(session: InspectionSession, user: Session["user"] | null): boolean {
  if (!session || !user) return false;
  return session.created_by === user.id;
}

export function canSubmitInspection(session: InspectionSession, profile: { id: string; role: Role }): boolean {
  if (!session || !profile) return false;

  // Prevent double submit
  if (session.status === "submitted") return false;

  // Admin can submit any session
  if (profile.role === "admin") return true;

  // Manager can submit only if they are the creator
  if (profile.role === "manager" && session.created_by === profile.id) return true;

  // Staff cannot submit
  return false;
}

// Usage note:
// Submission requires BOTH:
// - permission "inspection:submit"
// - canSubmitInspection(session, profile) === true

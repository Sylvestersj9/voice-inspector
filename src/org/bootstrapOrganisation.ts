import { supabase } from "@/lib/supabase";
import type { Organisation, Membership } from "./types";
import type { Role } from "@/auth/permissions";

type ProfileLike = {
  id: string;
  email?: string | null;
  role: Role;
  full_name?: string | null;
};

export async function bootstrapOrganisation(profile: ProfileLike): Promise<{
  organisation: Organisation;
  membership: Membership;
}> {
  const name = `${profile.full_name || profile.email || "Organisation"}'s Organisation`;

  const { data, error } = await supabase
    .from("organisations")
    .insert({
      name,
      created_by: profile.id,
    })
    .select("*")
    .single();
  if (error || !data) throw error || new Error("Failed to create organisation");

  const org = data as Organisation;

  const { data: membership, error: memErr } = await supabase
    .from("memberships")
    .insert({
      organisation_id: org.id,
      profile_id: profile.id,
      role: profile.role,
    })
    .select("*")
    .single();

  if (memErr || !membership) throw memErr || new Error("Failed to create membership");

  return { organisation: org, membership: membership as Membership };
}

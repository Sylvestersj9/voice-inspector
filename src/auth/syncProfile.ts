import { supabase } from "@/lib/supabase";

export async function syncProfile() {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return;

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const payload = {
    id: user.id,
    email: user.email ?? null,
    full_name: (typeof meta.full_name === "string" && meta.full_name) || (typeof meta.name === "string" ? meta.name : null),
    avatar_url:
      (typeof meta.avatar_url === "string" && meta.avatar_url) || (typeof meta.picture === "string" ? meta.picture : null),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
  if (error) console.error("syncProfile error:", error);
}

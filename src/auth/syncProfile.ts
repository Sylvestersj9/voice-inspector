import { supabase } from "@/lib/supabase";

export async function syncProfile() {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return;

  const meta: any = user.user_metadata ?? {};
  const payload = {
    id: user.id,
    email: user.email ?? null,
    full_name: meta.full_name ?? meta.name ?? null,
    avatar_url: meta.avatar_url ?? meta.picture ?? null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
  if (error) console.error("syncProfile error:", error);
}

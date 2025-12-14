import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const target = new URL(window.location.href).searchParams.get("from") || "/app";

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate(target);
    });

    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        navigate("/login?error=1");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_complete")
        .eq("id", data.session.user.id)
        .maybeSingle();
      if (profile && profile.onboarding_complete === false) {
        navigate("/onboarding");
      } else {
        navigate(target);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  return <div style={{ padding: 16 }}>Signing you in…</div>;
}

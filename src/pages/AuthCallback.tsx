import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import LoadingOverlay from "@/components/LoadingOverlay";

export default function AuthCallback() {
  useEffect(() => {
    // Listen for auth state — Supabase automatically exchanges the PKCE code
    // from the URL query params during client init and fires SIGNED_IN.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        window.location.href = "/app";
      } else if (event === "SIGNED_OUT") {
        window.location.href = "/login";
      }
    });

    // Also check in case session was already established before the listener fired
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        window.location.href = "/login";
        return;
      }
      if (data.session) {
        window.location.href = "/app";
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return <LoadingOverlay message="Signing you in..." />;
}

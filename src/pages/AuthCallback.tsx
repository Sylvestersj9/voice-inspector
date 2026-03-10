import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import LoadingOverlay from "@/components/LoadingOverlay";

export default function AuthCallback() {
  useEffect(() => {
    // Listen for auth state — Supabase automatically exchanges the PKCE code
    // from the URL query params during client init and fires SIGNED_IN.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        // Redirect to the dedicated reset-password page — session is available there
        window.location.href = "/reset-password";
      } else if (session) {
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
      // Only redirect to app if not a recovery session (recovery is handled above by event)
      if (data.session && data.session.user.aud === "authenticated") {
        window.location.href = "/app";
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return <LoadingOverlay message="Signing you in..." />;
}

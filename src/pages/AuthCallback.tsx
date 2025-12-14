import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import LoadingOverlay from "@/components/LoadingOverlay";

export default function AuthCallback() {
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Auth callback error:", error);
        window.location.href = "/login";
        return;
      }

      if (data.session) {
        window.location.href = "/app";
      } else {
        window.location.href = "/login";
      }
    })();
  }, []);

  return <LoadingOverlay message="Signing you in..." />;
}

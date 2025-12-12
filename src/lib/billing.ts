import { supabase } from "@/integrations/supabase/client";

interface CheckoutResponse {
  url?: string;
  alreadySubscribed?: boolean;
  portalUrl?: string;
  status?: string;
}

export async function startCheckout(promoCode?: string): Promise<CheckoutResponse> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new Error("Please sign in to continue.");
  }

  const res = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || "Unable to start checkout");
  }
  return json;
}

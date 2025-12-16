type FeedbackContext = {
  route?: string;
  sessionId?: string;
  page?: string;
  extra?: Record<string, unknown>;
};

export type FeedbackPayload = {
  message: string;
  details?: string;
  expected?: string;
  rating?: number;
  context?: FeedbackContext;
  userId?: string | null;
  email?: string | null;
  appVersion?: string;
};

export async function sendFeedback(payload: FeedbackPayload) {
  const message = String(payload.message ?? "").trim();
  if (message.length < 10) {
    throw new Error("Please add a little more detail (min 10 characters).");
  }
  const rating = payload.rating;
  if (rating != null && (rating < 1 || rating > 5)) {
    throw new Error("Rating must be between 1 and 5.");
  }

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-feedback`;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const appVersion = payload.appVersion ?? import.meta.env.VITE_APP_VERSION ?? "dev";

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify({
      ...payload,
      message,
      rating,
      appVersion,
      details: payload.details?.toString().trim() || undefined,
      sentAt: new Date().toISOString(),
    }),
  });

  if (!res.ok) {
    let msg = "Failed to send feedback";
    try {
      const text = await res.text();
      if (text) msg = text;
    } catch {
      // ignore parse failures
    }
    throw new Error(msg);
  }

  return { ok: true };
}

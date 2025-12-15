import { useState } from "react";
import MarketingLayout from "./marketing/MarketingLayout";
import { useLoading } from "@/providers/LoadingProvider";

type ContactPayload = {
  name: string;
  email: string;
  organisation?: string;
  message?: string;
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export default function Contact() {
  const loading = useLoading();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setError(null);

    if (!email.trim()) {
      setError("Please add your email.");
      return;
    }
    if (!supabaseUrl || !anonKey) {
      setError("Missing Supabase configuration.");
      return;
    }

    loading.show("Sending your message...");
    try {
      const payload: ContactPayload = {
        name: name.trim(),
        email: email.trim(),
        organisation: organisation.trim(),
        message: message.trim(),
      };

      const res = await fetch(`${supabaseUrl}/functions/v1/send-feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ type: "contact", ...payload }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Unable to submit your message right now.");
      }
      setStatus("Thanks for reaching out. We'll reply from reports@ziantra.co.uk.");
      setName("");
      setEmail("");
      setOrganisation("");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send your message.");
    } finally {
      loading.hide();
    }
  };

  return (
    <MarketingLayout>
      <main className="px-4 py-14">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <div className="inline-flex items-center rounded-full bg-teal-50 px-4 py-1.5 text-sm font-medium text-teal-800 ring-1 ring-teal-100">
              Contact
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold text-slate-900 md:text-4xl">
              Questions, feedback, or want to join the waitlist?
            </h1>
            <p className="mt-3 text-slate-600">Send us a note and we'll get back to you.</p>
          </div>

          <form onSubmit={submit} className="mt-10 space-y-3 rounded-2xl border bg-white p-6 shadow-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-slate-700 space-y-1">
                <span>Name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-200"
                  placeholder="Your name"
                />
              </label>
              <label className="text-sm text-slate-700 space-y-1">
                <span>Email *</span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-200"
                  type="email"
                  placeholder="you@example.com"
                  required
                />
              </label>
            </div>
            <label className="text-sm text-slate-700 space-y-1">
              <span>Organisation (optional)</span>
              <input
                value={organisation}
                onChange={(e) => setOrganisation(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-200"
                placeholder="Provider name"
              />
            </label>
            <label className="text-sm text-slate-700 space-y-1">
              <span>Message</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-200 min-h-[140px]"
                placeholder="How we can help"
              />
            </label>
            {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
            {status ? <p className="text-sm font-medium text-teal-800">{status}</p> : null}
            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
              >
                Send message
              </button>
            </div>
          </form>
        </div>
      </main>
    </MarketingLayout>
  );
}

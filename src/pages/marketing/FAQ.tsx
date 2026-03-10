import { useState } from "react";
import { Link } from "react-router-dom";
import MarketingLayout from "./MarketingLayout";
import { useLoading } from "@/providers/LoadingProvider";

type ContactPayload = {
  name: string;
  email: string;
  organisation?: string;
  message?: string;
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-xl border bg-white px-5 py-4 shadow-sm">
      <summary className="cursor-pointer list-none font-semibold text-slate-900 flex items-center justify-between gap-4">
        <span>{q}</span>
        <span className="text-teal-700 group-open:rotate-180 transition">⌄</span>
      </summary>
      <p className="mt-3 text-sm text-slate-600 leading-relaxed">{a}</p>
    </details>
  );
}

export default function FAQ() {
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
      setStatus("Thanks for reaching out. We'll reply from info@mockofsted.co.uk.");
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
              FAQ
            </div>
            <h1 className="mt-4 font-display text-3xl md:text-4xl font-bold text-slate-900">
              Facts & questions
            </h1>
            <p className="mt-3 text-slate-600">
              If you can’t find an answer, email{" "}
              <a className="text-teal-700 underline" href="mailto:info@mockofsted.co.uk">
                info@mockofsted.co.uk
              </a>.
            </p>
          </div>

          <div className="mt-10 space-y-3">
            <FaqItem q="What is MockOfsted?" a="A practice simulator for inspection-style questions. Answer by voice or text, then get feedback tied to what you actually said." />
            <FaqItem q="Who is it for?" a="Residential care leaders and key staff preparing for inspection: Registered Managers, Responsible Individuals, Service Managers, Team Leaders, and supervisors." />
            <FaqItem q="Do I need an account?" a="You can explore the product, but an account is needed to save reports and keep session history." />
            <FaqItem q="Does it cover supported living?" a="Yes. Sessions include both children's home standards and supported living standards." />
            <FaqItem q="Can I use real names or details?" a="No. Do not include names, addresses, staff names, or identifying location details." />
            <FaqItem q="How does the feedback work?" a="It focuses on clarity, evidence, and impact. You’ll see strengths, gaps, and priority actions based on your response." />
            <FaqItem q="Is this official Ofsted guidance?" a="No. It’s a practice and professional development tool, not official Ofsted guidance." />
            <FaqItem q="How long is a session?" a="Short, focused practice. You can pause and return, or run multiple sessions back-to-back." />
            <FaqItem q="Can teams practice together?" a="Yes. Teams can take turns answering in the same session and compare reports. For multi-home licensing, contact us." />
            <FaqItem q="What’s included in the plan?" a="Unlimited practice, full inspection reports, and session history. Cancel any time." />
            <FaqItem q="Can I cancel anytime?" a="Yes. You can cancel your subscription at any time." />
          </div>

          <div className="mt-12">
            <div className="text-center">
              <h2 className="font-display text-2xl font-bold text-slate-900 md:text-3xl">
                Still have questions?
              </h2>
              <p className="mt-2 text-slate-600">
                Send us a note and we’ll get back to you.
              </p>
            </div>

            <form onSubmit={submit} className="mt-6 space-y-3 rounded-2xl border bg-white p-6 shadow-sm">
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
                  placeholder="How can we help?"
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

          <div className="mt-10 flex justify-center">
            <Link
              to="/pricing"
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              View pricing
            </Link>
          </div>
        </div>
      </main>
    </MarketingLayout>
  );
}

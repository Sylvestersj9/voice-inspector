import { Link } from "react-router-dom";
import MarketingLayout from "./MarketingLayout";

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
              <a className="text-teal-700 underline" href="mailto:reports@ziantra.co.uk">
                reports@ziantra.co.uk
              </a>.
            </p>
          </div>

          <div className="mt-10 space-y-3">
            <FaqItem q="What is Voice Inspector?" a="A practice simulator for SCCIF-style inspection questions. Answer by voice or text, then get feedback tied to what you actually said." />
            <FaqItem q="Do I need an account?" a="During beta you can practice without billing. Login supports history and upcoming personalised features." />
            <FaqItem q="Can I use real names or details?" a="No. Do not include names, addresses, staff names, or identifying location details." />
            <FaqItem q="How does the feedback work?" a="It focuses on structure and evidence: Process → Evidence → Impact → Review. It highlights what landed well and what was missing, with phrasing templates." />
            <FaqItem q="What’s in the paid plan?" a="Report uploads for tailored recommendations, knowledge base, action plans, progress tracking, and admin tools (in development). Pricing will be announced later." />
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

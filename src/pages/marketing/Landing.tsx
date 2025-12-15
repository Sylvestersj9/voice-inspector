import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Mic,
  FileText,
  Sparkles,
  BookOpen,
  BarChart3,
  MessageSquareText,
} from "lucide-react";
import MarketingLayout from "./MarketingLayout";

const email = "reports@ziantra.co.uk";

type SectionTitleProps = {
  eyebrow?: string;
  title: string;
  desc?: string;
};

function SectionTitle({ eyebrow, title, desc }: SectionTitleProps) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow ? (
        <div className="inline-flex items-center rounded-full bg-teal-50 px-4 py-1.5 text-sm font-medium text-teal-800 ring-1 ring-teal-100">
          {eyebrow}
        </div>
      ) : null}
      <h2 className="mt-4 font-display text-2xl font-bold text-slate-900 md:text-3xl">
        {title}
      </h2>
      {desc ? <p className="mt-2 text-slate-600">{desc}</p> : null}
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="h-10 w-10 rounded-xl bg-teal-50 ring-1 ring-teal-100 flex items-center justify-center">
        {icon}
      </div>
      <div className="mt-4 font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-sm leading-relaxed text-slate-600">{desc}</div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-xl border bg-white px-5 py-4 shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-900">
        <span>{q}</span>
        <span className="text-teal-700 transition group-open:rotate-180">⌄</span>
      </summary>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">{a}</p>
    </details>
  );
}

export default function Landing() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="px-4 pt-8 pb-14">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="inline-flex items-center rounded-full bg-teal-50 px-4 py-1.5 text-sm font-medium text-teal-800 ring-1 ring-teal-100">
              Children’s Home Inspection Practice
            </div>

            <h1 className="mt-5 font-display text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
              Prepare for Ofsted conversations with calm, confident answers.
            </h1>

            <p className="mt-4 leading-relaxed text-slate-600">
              Practice five SCCIF-style questions, respond by voice or text, and receive AI feedback that focuses on what you actually said —
              with clearer structure, stronger evidence, and inspector-ready phrasing.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
              >
                Start practice (beta) <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
              >
                Login / Sign up
              </Link>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-teal-700" />
                Do not include names or identifying details
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-700" />
                Works with voice or text
              </span>
              <span className="inline-flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-teal-700" />
                Practical, actionable feedback
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-[28px] bg-gradient-to-br from-teal-50 via-white to-emerald-50 blur-[1px]" />
            <div className="relative rounded-[28px] overflow-hidden border bg-white p-3 shadow-sm">
              <img
                src="/screenshots/how-it-works.png"
                alt="How it works: answer questions, record or type, receive evaluation and action plan"
                style={{
                  width: "100%",
                  height: "auto",
                  borderRadius: "16px",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* About / Feature grid */}
      <section id="about" className="bg-slate-50 px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <SectionTitle
            eyebrow="Better in every run"
            title="Feedback that is actually useful in inspection conversations"
            desc="Practice that feels real — guidance that tightens your answers without fluff."
          />

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard icon={<Mic className="h-5 w-5 text-teal-700" />} title="Voice-first practice" desc="Record like a real inspection conversation, then edit the transcript before evaluation." />
            <FeatureCard icon={<MessageSquareText className="h-5 w-5 text-teal-700" />} title="Inspector-style structure" desc="Process → Evidence → Impact → Review — mapped back to what you said." />
            <FeatureCard icon={<ShieldCheck className="h-5 w-5 text-teal-700" />} title="Safeguarding-safe by design" desc="Clear prompts to avoid identifying details, plus safer wording guidance." />
            <FeatureCard icon={<BookOpen className="h-5 w-5 text-teal-700" />} title="Knowledge base (coming)" desc="What inspectors listen for plus evidence examples per topic." />
            <FeatureCard icon={<FileText className="h-5 w-5 text-teal-700" />} title="Upload reports (paid)" desc="Tailored recommendations from your anonymised Ofsted reports." />
            <FeatureCard icon={<BarChart3 className="h-5 w-5 text-teal-700" />} title="Progress tracking (paid)" desc="Trends across domains, repeated gaps, and actions over time." />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <SectionTitle
            eyebrow="How it works"
            title="A simple flow that feels like the real thing"
            desc="Practice, improve, and repeat — with a clear report at the end."
          />

          <div className="mt-10 grid gap-6 lg:grid-cols-2 lg:items-center">
            <div className="space-y-4">
              {[
                { icon: <Mic className="h-5 w-5 text-teal-700" />, title: "1) Respond by voice or text", desc: "Choose voice (recommended) or type your response. Edit before evaluation." },
                { icon: <Sparkles className="h-5 w-5 text-teal-700" />, title: "2) Get focused feedback", desc: "Strengths, gaps, actions, follow-up prompts, and example phrasing." },
                { icon: <CheckCircle2 className="h-5 w-5 text-teal-700" />, title: "3) Receive a final summary", desc: "Top strengths, priority gaps, and actions after all five questions." },
              ].map((s, i) => (
                <div key={i} className="flex gap-4 rounded-2xl border bg-white p-5 shadow-sm">
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-teal-50 ring-1 ring-teal-100 flex items-center justify-center">
                    {s.icon}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{s.title}</div>
                    <div className="mt-1 text-sm text-slate-600">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-[28px] border bg-gradient-to-br from-teal-50 via-white to-emerald-50 p-6 shadow-sm">
              <img
                src="/screenshots/second section.png"
                alt="How it works: responding by voice or text, receiving feedback, and a final inspection summary"
                style={{
                  width: "100%",
                  height: "auto",
                  borderRadius: "16px",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ preview */}
      <section className="bg-slate-50 px-4 py-14">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-center">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="flex flex-col items-center text-center space-y-3 max-w-xl">
              <SectionTitle eyebrow="FAQ" title="Quick answers" desc="Full FAQ is on the FAQ page." />
              <div className="flex flex-wrap justify-center gap-3">
                <Link to="/faq" className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50">
                  View all FAQs
                </Link>
                <Link to="/pricing" className="rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-700">
                  See pricing
                </Link>
              </div>
              <div className="text-sm text-slate-600">
                Questions? Email{" "}
                <a className="text-teal-700 underline" href={`mailto:${email}`}>
                  {email}
                </a>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <FaqItem q="Do I need an account?" a="During beta you can practice without billing. Login supports history and future personalised features." />
            <FaqItem q="Is it safe for safeguarding?" a="Yes — but do not include names, addresses, staff names, or identifying location details." />
            <FaqItem q="What will Pro add?" a="Report uploads, tailored recommendations, knowledge base, progress tracking, and admin tools (in development)." />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-14">
        <div className="mx-auto max-w-6xl rounded-[28px] border bg-gradient-to-br from-teal-50 via-white to-emerald-50 p-8 shadow-sm md:p-10">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="font-display text-2xl font-bold text-slate-900 md:text-3xl">Get started in seconds</div>
              <p className="mt-3 text-slate-600">
                Run the five-question simulator now. Login when you want saved history and personalised features as we ship them.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link to="/login" className="rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-700">
                  Start practice <ArrowRight className="ml-2 inline h-4 w-4" />
                </Link>
                <Link
                  to="/login"
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                >
                  Login / Sign up
                </Link>
              </div>
              <p className="mt-4 text-xs text-slate-500">Do not include names or identifying details about children, staff, or locations.</p>
            </div>
            <div className="rounded-2xl border bg-white p-6">
              <img
                src="/screenshots/Get started.png"
                alt="Get started with the five-question simulator"
                style={{
                  width: "100%",
                  height: "auto",
                  borderRadius: "16px",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                }}
              />
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

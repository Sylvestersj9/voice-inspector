import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, BookOpen, CalendarDays, ClipboardList } from "lucide-react";
import MarketingLayout from "./marketing/MarketingLayout";

export default function Landing() {
  return (
    <MarketingLayout>
      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section className="px-4 pt-10 pb-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center rounded-full bg-teal-50 px-4 py-1.5 text-sm font-semibold text-teal-800 ring-1 ring-teal-100">
            Ofsted Inspection Practice · Children's Homes
          </div>
          <h1 className="mt-6 font-display text-4xl font-bold leading-tight text-slate-900 md:text-5xl lg:text-6xl">
            Practice your Ofsted inspection{" "}
            <span className="text-teal-600">before the inspector arrives.</span>
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-600 max-w-2xl mx-auto">
            InspectReady simulates real inspection conversations across children's homes and supported
            living standards. Answer by voice or text, receive professional feedback, full report — in
            minutes.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors"
            >
              Start your free trial <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-base font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              See pricing
            </Link>
          </div>
          <p className="mt-3 text-sm text-slate-500">
            3-day free trial. Up to 5 sessions per day (15 total). No card upfront.
          </p>
        </div>
      </section>

      {/* ── Pain points ───────────────────────────────────────────────────────── */}
      <section className="bg-slate-50 px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center mb-10">
            <h2 className="font-display text-2xl font-bold text-slate-900 md:text-3xl">
              Residential care leaders deserve inspection confidence
              <span className="mt-2 block text-lg font-medium text-slate-700 md:text-xl">
                Registered Managers, Responsible Individuals, Service Managers, Team Leaders &amp; key
                staff — prepare together.
              </span>
            </h2>
            <p className="mt-2 text-slate-600">
              Ofsted inspections are high-stakes. Yet most managers have no way to rehearse before the
              day.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 ring-1 ring-amber-100">
                <span className="text-xl" role="img" aria-label="Clock">⏰</span>
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">Unannounced inspections now standard</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Ofsted shifted to mostly unannounced children's home inspections (2014+ intensified). Zero
                notice.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 ring-1 ring-red-100">
                <span className="text-xl" role="img" aria-label="Warning">⚠️</span>
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">Limiting judgements end careers</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Protection of Children is limiting — Inadequate drags entire grade down.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 ring-1 ring-slate-200">
                <span className="text-xl" role="img" aria-label="Money bag">💰</span>
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">Mock inspections cost £800–£2k/day</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Human consultants = expensive, inflexible. Self-practice = inconsistent.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────────── */}
      <section className="px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center mb-10">
            <div className="inline-flex items-center rounded-full bg-teal-50 px-4 py-1.5 text-sm font-semibold text-teal-800 ring-1 ring-teal-100 mb-4">
              How it works
            </div>
            <h2 className="font-display text-2xl font-bold text-slate-900 md:text-3xl">
              A full mock inspection in under 30 minutes
            </h2>
            <p className="mt-2 text-slate-600">
              Real inspection conversations covering core standards. Questions rotate from our extensive
              bank — every session different.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                step: "01",
                emoji: "🎤",
                emojiLabel: "Microphone",
                title: "🎤 Practice inspection conversations",
                desc: "Realistic questions from children's homes and supported living standards — by voice or text. Extensive rotating bank keeps sessions fresh.",
              },
              {
                step: "02",
                emoji: "📊",
                emojiLabel: "Bar chart",
                title: "Get scored feedback",
                desc: "Your answer is evaluated against SCCIF criteria. You receive a 1–4 score, clear strengths and gaps, a follow-up question, and an inspector note.",
              },
              {
                step: "03",
                emoji: "📋",
                emojiLabel: "Clipboard",
                title: "📋 Your inspection report",
                desc: "Overall provisional grade, domain breakdown, strengths, priority actions — based on your session.",
              },
            ].map((s) => (
              <div key={s.step} className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="absolute -top-3 left-6 rounded-full bg-teal-600 px-3 py-0.5 text-xs font-bold text-white">
                  {s.step}
                </div>
                <div className="mt-2 flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 ring-1 ring-teal-100">
                  <span className="text-xl" role="img" aria-label={s.emojiLabel}>{s.emoji}</span>
                </div>
                <h3 className="mt-4 font-semibold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-5 py-3 text-sm text-amber-800 max-w-2xl text-center">
              <strong>Important:</strong> Practice tool only. Not official Ofsted guidance. Feedback based
              solely on your responses.
            </div>
          </div>
        </div>
      </section>

      {/* ── Free Ofsted Prep Tools ────────────────────────────────────────────── */}
      <section className="bg-teal-50 px-4 py-14 border-y border-teal-100">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center mb-10">
            <div className="inline-flex items-center rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-teal-800 ring-1 ring-teal-200 mb-4">
              Free tools
            </div>
            <h2 className="font-display text-2xl font-bold text-slate-900 md:text-3xl">
              Free Ofsted Prep Tools
            </h2>
            <p className="mt-2 text-slate-600">
              No account needed. Start building inspection confidence right now.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Card 1 */}
            <Link
              to="/tools#quiz"
              className="group rounded-2xl border border-teal-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-teal-400 transition-all"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-100 ring-1 ring-teal-200 group-hover:bg-teal-600 transition-colors">
                <ClipboardList className="h-5 w-5 text-teal-700 group-hover:text-white transition-colors" />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">QS Readiness Quiz</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Answer 9 self-assessment questions — one per Quality Standard. Get instant gap scores
                across all SCCIF domains in under 2 minutes.
              </p>
              <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-teal-700 group-hover:gap-2 transition-all">
                Start quiz <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>

            {/* Card 2 */}
            <Link
              to="/tools#generator"
              className="group rounded-2xl border border-teal-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-teal-400 transition-all"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 ring-1 ring-amber-200 group-hover:bg-amber-500 transition-colors">
                <BookOpen className="h-5 w-5 text-amber-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">Domain Question Generator</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Pick any Quality Standard and generate 10 targeted practice questions drawn from the
                real SCCIF inspection framework.
              </p>
              <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-amber-700 group-hover:gap-2 transition-all">
                Generate questions <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>

            {/* Card 3 */}
            <Link
              to="/tools#calendar"
              className="group rounded-2xl border border-teal-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-teal-400 transition-all"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 ring-1 ring-slate-200 group-hover:bg-slate-700 transition-colors">
                <CalendarDays className="h-5 w-5 text-slate-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">Monthly Prep Calendar</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Automatically plan your practice sessions across the month. Rotates domain focus so you
                build confidence across every Quality Standard.
              </p>
              <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-slate-700 group-hover:gap-2 transition-all">
                Plan my month <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          </div>

          <div className="mt-8 text-center">
            <Link
              to="/tools"
              className="inline-flex items-center gap-2 rounded-xl border border-teal-300 bg-white px-6 py-3 text-sm font-semibold text-teal-700 hover:bg-teal-50 transition-colors"
            >
              See the full free tools suite <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── What's covered ────────────────────────────────────────────────────── */}
      <section className="bg-slate-50 px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center mb-10">
            <h2 className="font-display text-2xl font-bold text-slate-900 md:text-3xl">
              Core Standards Covered
            </h2>
            <p className="mt-2 text-slate-600">Children's Homes + Supported Living</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: "Quality of Care", tag: "Core Standard" },
              { label: "Views/Wishes", tag: "Core Standard" },
              { label: "Education", tag: "Core Standard" },
              { label: "Enjoyment", tag: "Core Standard" },
              { label: "Health", tag: "Core Standard" },
              { label: "Relationships", tag: "Core Standard" },
              { label: "Protection (Limiting)", tag: "LIMITING", highlight: true },
              { label: "Leadership", tag: "Core Standard" },
              { label: "Care Planning", tag: "Core Standard" },
            ].map((d) => (
              <div
                key={d.label}
                className={[
                  "flex items-center justify-between gap-3 rounded-xl border px-4 py-3",
                  d.highlight ? "border-red-200 bg-red-50" : "border-slate-200 bg-white",
                ].join(" ")}
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2
                    className={`h-4 w-4 shrink-0 ${d.highlight ? "text-red-500" : "text-teal-600"}`}
                  />
                  <span className="text-sm font-medium text-slate-800">{d.label}</span>
                </div>
                <span
                  className={[
                    "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold",
                    d.highlight ? "bg-red-100 text-red-700" : "bg-teal-50 text-teal-700",
                  ].join(" ")}
                >
                  {d.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────────────── */}
      <section className="px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center mb-10">
            <h2 className="font-display text-2xl font-bold text-slate-900 md:text-3xl">Simple pricing</h2>
            <p className="mt-2 text-slate-600">One plan. Full access. Cancel any time.</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr]">
            <div className="rounded-2xl border-2 border-teal-600 bg-white p-8 shadow-lg text-center">
              <div className="inline-flex items-center rounded-full bg-teal-600 px-3 py-1 text-xs font-bold text-white mb-4">
                Individual
              </div>
              <div className="mt-2 flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold text-slate-900">£29</span>
                <span className="text-slate-500">/month</span>
              </div>
              <p className="mt-2 text-sm text-slate-600">Unlimited sessions · Full reports · Cancel anytime</p>

              <ul className="mt-6 space-y-2.5 text-left text-sm">
                {[
                  "All core standards",
                  "Voice and text responses",
                  "Scored feedback per question",
                  "Follow-up question and inspector note",
                  "Full inspection report after each session",
                  "Session history",
                  "3-day free trial — up to 5 sessions per day (15 total)",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                    <span className="text-slate-700">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/login"
                className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-teal-600 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors"
              >
                Start free trial <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <p className="mt-3 text-xs text-slate-500">
                3-day free trial. Up to 5 sessions per day (15 total). No card upfront.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8">
              <h3 className="font-semibold text-slate-900">Everything you need to prepare</h3>
              <p className="mt-2 text-sm text-slate-600">
                Designed for real inspection readiness — fast, consistent practice without scheduling or
                external consultants.
              </p>

              <ul className="mt-5 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                {[
                  "Realistic inspection conversations",
                  "Rotating question bank",
                  "Provisional grade and domain breakdown",
                  "Strengths and priority actions",
                  "Practice by voice or text",
                  "Unlimited practice after subscribing",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-teal-600 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 rounded-xl bg-white px-4 py-3 text-sm text-slate-700 border border-slate-200">
                <div className="font-semibold text-slate-900">Best for</div>
                <div className="mt-1">
                  Registered Managers, Responsible Individuals, Service Managers, Team Leaders &amp; key
                  staff.
                </div>
              </div>

              <div className="mt-4 grid gap-2 text-xs text-slate-500">
                <div>Monthly plan · Cancel any time</div>
                <div>Start in minutes · No setup calls</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────────── */}
      <section className="bg-teal-600 px-4 py-14">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-bold text-white md:text-4xl">
            Ready to practise before the inspector arrives?
          </h2>
          <p className="mt-4 text-teal-100">Start 3-day free trial. No card needed.</p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3.5 text-base font-semibold text-teal-700 shadow-sm hover:bg-teal-50 transition-colors"
            >
              Start free trial <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center rounded-xl border border-teal-400 px-6 py-3.5 text-base font-semibold text-white hover:bg-teal-700 transition-colors"
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

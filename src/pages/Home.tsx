import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Quote, Rss } from "lucide-react";
import MarketingLayout from "./marketing/MarketingLayout";
import { LOCAL_POSTS } from "@/lib/blogPosts";

export default function Landing() {
  return (
    <MarketingLayout>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="px-4 pt-12 pb-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center rounded-full bg-teal-50 px-4 py-1.5 text-sm font-semibold text-teal-800 ring-1 ring-teal-100">
            Inspection Prep · SCCIF Training · For All
          </div>
          <h1 className="mt-6 font-display text-4xl font-bold leading-tight text-slate-900 md:text-5xl lg:text-6xl">
            Ofsted ready.{" "}
            <span className="text-teal-600">Standards prepared. Confidence built.</span>
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-600 max-w-2xl mx-auto">
            MockOfsted simulates real SCCIF inspection conversations across all 9 Quality
            Standards. Perfect for inspections, fit-person interviews, and leadership preparation.
            Answer by voice or text, get scored feedback, and receive a full provisional report — in under 30 minutes.
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
            3-day free trial · 2 sessions/day · no card upfront
          </p>
        </div>
      </section>

      {/* ── Pain points ───────────────────────────────────────────────────────── */}
      <section className="bg-slate-50 px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center mb-10">
            <h2 className="font-display text-2xl font-bold text-slate-900 md:text-3xl">
              Residential care leaders deserve inspection confidence
            </h2>
            <p className="mt-2 text-slate-600">
              Care leaders, deputies, RIs — most have no structured way to rehearse
              before the day.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                emoji: "⏰", label: "Clock",
                title: "Unannounced inspections now standard",
                body: "Ofsted shifted to mostly unannounced children's home visits. Zero notice. No time to prepare on the day.",
                bg: "bg-amber-50 ring-amber-100",
              },
              {
                emoji: "⚠️", label: "Warning",
                title: "Limiting judgements end careers",
                body: "Protection of Children is the limiting judgement. One Inadequate answer can drag every other grade down.",
                bg: "bg-red-50 ring-red-100",
              },
              {
                emoji: "💰", label: "Cost",
                title: "Mock inspections cost £800–£2k/day",
                body: "Human consultants are expensive and inflexible. Ad-hoc self-practice is inconsistent and unmeasured.",
                bg: "bg-slate-100 ring-slate-200",
              },
            ].map((p) => (
              <div key={p.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${p.bg}`}>
                  <span className="text-xl" role="img" aria-label={p.label}>{p.emoji}</span>
                </div>
                <h3 className="mt-4 font-semibold text-slate-900">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{p.body}</p>
              </div>
            ))}
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
              Every session draws from a rotating bank of SCCIF-grounded questions — no two
              sessions identical.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                step: "01", emoji: "🎤", emojiLabel: "Microphone",
                title: "Practice inspection conversations",
                desc: "Realistic questions across all 9 Quality Standards, delivered by voice or text. Mandatory domains — including Protection of Children — always covered.",
              },
              {
                step: "02", emoji: "📊", emojiLabel: "Scoring",
                title: "Get scored feedback",
                desc: "Each answer is evaluated against SCCIF criteria. You receive a 1–4 band score, specific strengths and gaps, a follow-up question, and an inspector note.",
              },
              {
                step: "03", emoji: "📋", emojiLabel: "Report",
                title: "Receive your inspection report",
                desc: "Overall provisional grade, domain breakdown, key strengths, and priority actions — based entirely on your session.",
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
            <p className="rounded-xl bg-amber-50 border border-amber-200 px-5 py-3 text-sm text-amber-800 max-w-2xl text-center">
              <strong>Practice tool only.</strong> Not official Ofsted guidance. Feedback is
              based solely on your responses and does not reflect a full inspection outcome.
            </p>
          </div>
        </div>
      </section>

      {/* ── Quality Standards covered ─────────────────────────────────────────── */}
      <section className="bg-slate-50 px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center mb-10">
            <h2 className="font-display text-2xl font-bold text-slate-900 md:text-3xl">
              All 9 Quality Standards. Every session.
            </h2>
            <p className="mt-2 text-slate-600">
              Mandatory domains are always covered. Optional domains rotate to build breadth.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: "Quality and Purpose of Care",         tag: "Core Standard",      highlight: false },
              { label: "Children's Views, Wishes & Feelings", tag: "Core Standard",      highlight: false },
              { label: "Education",                           tag: "Core Standard",      highlight: false },
              { label: "Enjoyment and Achievement",           tag: "Core Standard",      highlight: false },
              { label: "Health and Wellbeing",                tag: "Core Standard",      highlight: false },
              { label: "Positive Relationships",              tag: "Core Standard",      highlight: false },
              { label: "Protection of Children",              tag: "Limiting Judgement", highlight: true  },
              { label: "Leadership and Management",           tag: "Core Standard",      highlight: false },
              { label: "Care Planning",                       tag: "Core Standard",      highlight: false },
            ].map((d) => (
              <div
                key={d.label}
                className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
                  d.highlight ? "border-red-200 bg-red-50" : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className={`h-4 w-4 shrink-0 ${d.highlight ? "text-red-500" : "text-teal-600"}`} />
                  <span className="text-sm font-medium text-slate-800">{d.label}</span>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                  d.highlight ? "bg-red-100 text-red-700" : "bg-teal-50 text-teal-700"
                }`}>
                  {d.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Level 5 proof / built-by section ─────────────────────────────────── */}
      <section className="px-4 py-14">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 md:p-10 shadow-sm">
            <div className="grid gap-8 md:grid-cols-[auto_1fr] md:items-start">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-teal-600 text-white text-2xl font-bold font-display">
                ✓
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-teal-600 mb-2">
                  Built by a children's home leader — not a vendor
                </p>
                <blockquote className="relative">
                  <Quote className="absolute -left-1 -top-1 h-6 w-6 text-slate-200" aria-hidden="true" />
                  <p className="pl-6 text-slate-700 leading-relaxed">
                    I built MockOfsted because I needed it. As a residential care leader myself,
                    I knew the questions inspectors ask — and I knew that no affordable tool
                    existed to practise answering them under pressure. Every question in this
                    simulator reflects real SCCIF lines of enquiry. Every scoring rubric is grounded
                    in how judgements are actually formed.
                  </p>
                </blockquote>
                <div className="mt-5 flex flex-wrap gap-4">
                  {[
                    { stat: "9",    desc: "Quality Standards covered" },
                    { stat: "10+",  desc: "Homes validated in beta"   },
                    { stat: "SCCIF",desc: "Framework-native scoring"  },
                  ].map((s) => (
                    <div key={s.stat} className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-center min-w-[90px]">
                      <div className="font-display text-xl font-bold text-teal-600">{s.stat}</div>
                      <div className="mt-0.5 text-xs text-slate-500">{s.desc}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-5">
                  <Link
                    to="/about"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-900"
                  >
                    Read the full story <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Blog teaser ────────────────────────────────────────────────────────── */}
      <section className="bg-teal-50 border-y border-teal-100 px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-7">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-800 mb-2">
                <Rss className="h-3 w-3" /> Weekly from GOV.UK / Ofsted RSS
              </div>
              <h2 className="font-display text-2xl font-bold text-slate-900">
                Latest SCCIF &amp; Ofsted Updates
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Auto-updated every Sunday. Sourced and summarised for care leaders.
              </p>
            </div>
            <Link
              to="/blog"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-900 shrink-0"
            >
              All articles <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {LOCAL_POSTS.slice(0, 3).map((post) => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="group rounded-xl border border-teal-100 bg-white p-4 shadow-sm hover:shadow-md hover:border-teal-300 transition-all"
              >
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold mb-2 ${post.tagColour}`}>
                  {post.tag}
                </span>
                <p className="text-sm font-semibold text-slate-800 group-hover:text-teal-700 transition-colors leading-snug line-clamp-2">
                  {post.title}
                </p>
                <p className="mt-1.5 text-xs text-slate-400">
                  {new Date(post.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing snapshot ─────────────────────────────────────────────────── */}
      <section className="bg-slate-50 px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center mb-10">
            <h2 className="font-display text-2xl font-bold text-slate-900 md:text-3xl">
              Simple pricing
            </h2>
            <p className="mt-2 text-slate-600">Start free. Subscribe when ready. Cancel any time.</p>
          </div>
          <div className="grid gap-6 lg:grid-cols-2 max-w-3xl mx-auto">
            {/* Solo */}
            <div className="rounded-2xl border-2 border-teal-600 bg-white p-7 shadow-lg">
              <div className="inline-flex items-center rounded-full bg-teal-600 px-3 py-0.5 text-xs font-bold text-white mb-3">
                Solo
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-slate-900">£29</span>
                <span className="text-slate-500">/month</span>
              </div>
              <p className="mt-1 text-sm text-slate-500">One user · unlimited sessions</p>
              <ul className="mt-5 space-y-2 text-sm text-slate-700">
                {[
                  "All 9 Quality Standards",
                  "Voice and text responses",
                  "Scored feedback per question",
                  "Full inspection report per session",
                  "Session history",
                  "3-day free trial (6 sessions)",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link
                to="/login"
                className="mt-7 inline-flex w-full items-center justify-center rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
              >
                Start free trial <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
            {/* Team */}
            <div className="relative rounded-2xl border-2 border-amber-400 bg-white p-7 shadow-lg">
              <div className="absolute -top-3 left-6 rounded-full bg-amber-400 px-3 py-0.5 text-xs font-bold text-amber-900">
                Most Popular
              </div>
              <div className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-3 py-0.5 text-xs font-bold text-amber-800 mb-3">
                Team
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-slate-900">£89</span>
                <span className="text-slate-500">/month</span>
              </div>
              <p className="mt-1 text-sm text-slate-500">Up to 5 staff · one home</p>
              <ul className="mt-5 space-y-2 text-sm text-slate-700">
                {[
                  "Everything in Solo",
                  "5 individual staff accounts",
                  "Team dashboard — shared results",
                  "Shared session history",
                  "Priority support",
                  "3-day free trial included",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link
                to="/contact"
                className="mt-7 inline-flex w-full items-center justify-center rounded-xl bg-amber-400 py-3 text-sm font-semibold text-amber-900 hover:bg-amber-500 transition-colors"
              >
                Get team access <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── V2 teaser ────────────────────────────────────────────────────────── */}
      <section className="px-4 py-16 bg-white border-t border-slate-100">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-400 bg-teal-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-teal-700 mb-5">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
              V2 Soon
            </div>
            <h2 className="font-display text-2xl font-bold text-slate-900 md:text-3xl">
              Version 2 is coming soon
            </h2>
            <p className="mt-3 text-slate-500 max-w-xl mx-auto">
              Tailored Ofsted prep that adapts to your home.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                title: "Previous Report Analysis",
                desc: "Upload your last Ofsted report → AI identifies gaps → generates targeted practice questions for your specific weaknesses.",
              },
              {
                title: "Templates Gallery",
                desc: "100+ free templates — Risk Assessment STAR, Reg 44, incidents — constantly updated. Paid users always get the latest.",
              },
              {
                title: "Incident Pattern AI",
                desc: "Upload redacted incident reports → auto-detects patterns → generates prevention plans, risk assessment updates, and support plan amendments.",
              },
              {
                title: "Adaptive Learning",
                desc: "Tracks your weak areas across sessions → prioritises the inspector questions you're most likely to face next.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="group relative rounded-2xl border border-slate-200 bg-slate-50 p-6 transition-all duration-200 hover:border-teal-200 hover:bg-teal-50/40 hover:shadow-md"
              >
                <div className="absolute top-4 right-4 rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal-600">
                  V2
                </div>
                <h3 className="font-semibold text-slate-900 pr-10">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-sm italic text-slate-400">
            Not generic. Built to make your home inspection-ready.
          </p>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────────── */}
      <section className="bg-teal-600 px-4 py-14">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-bold text-white md:text-4xl">
            Ready to practise before the inspector arrives?
          </h2>
          <p className="mt-4 text-teal-100">3-day free trial. No card needed.</p>
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

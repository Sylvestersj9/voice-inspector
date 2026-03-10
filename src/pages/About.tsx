import { Link } from "react-router-dom";
import { ArrowRight, Mic, BarChart3, Zap, Smartphone, Quote } from "lucide-react";
import MarketingLayout from "./marketing/MarketingLayout";

const features = [
  {
    icon: Mic,
    title: "Realistic Inspector Q&A",
    desc: "Simulate voice or text answers under real pressure. Questions drawn from live SCCIF lines of enquiry — not textbook scenarios.",
  },
  {
    icon: BarChart3,
    title: "SCCIF-Native Scoring",
    desc: "Every answer scored against all 9 Quality Standards using the same framework Ofsted inspectors apply. No guesswork.",
  },
  {
    icon: Zap,
    title: "Actionable Gap Analysis",
    desc: "Instant, specific feedback that names the gap, explains why it matters, and tells you what to evidence before inspection day.",
  },
  {
    icon: Smartphone,
    title: "Practice Anywhere",
    desc: "Mobile-first design. Fit a session into a lunch break, commute, or late evening — whenever you have 20 minutes and a quiet space.",
  },
];

const testimonials = [
  {
    quote: "Finally something that feels like the real thing. The follow-up questions caught me off guard — just like an inspector would.",
    name: "Deputy Manager",
    location: "Manchester",
  },
  {
    quote: "Exposed gaps we'd completely missed in our internal audits. We fixed three QS7 weaknesses before the inspection came.",
    name: "Home Leader",
    location: "Leeds",
  },
  {
    quote: "We went from Good to Outstanding. MockOfsted was part of that journey — it kept us sharp and honest about our evidence.",
    name: "Registered Manager",
    location: "Birmingham",
  },
];

const stats = [
  { value: "10+", label: "Homes beta-tested" },
  { value: "9",   label: "Quality Standards covered" },
  { value: "3",   label: "Days free trial" },
];

export default function About() {
  return (
    <MarketingLayout>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="about-hero px-4 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="inline-flex items-center rounded-full bg-white/80 px-4 py-1.5 text-sm font-semibold text-teal-800 ring-1 ring-teal-200 shadow-sm mb-6">
            Built by a children's home leader — not a vendor
          </div>
          <h1 className="font-display text-4xl font-bold text-slate-900 md:text-5xl leading-tight">
            Trusted by care leaders.<br className="hidden sm:block" /> Built from the inside.
          </h1>
          <p className="mt-5 text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            MockOfsted exists because no affordable, realistic inspection practice tool did. We built the one we wished existed — grounded in SCCIF, not guesswork.
          </p>

          {/* Stats row */}
          <div className="mt-10 flex flex-wrap justify-center gap-6">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl bg-white border border-slate-200 shadow-sm px-6 py-4 text-center min-w-[110px]">
                <div className="font-display text-2xl font-bold text-teal-600">{s.value}</div>
                <div className="mt-0.5 text-xs text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Founder story ────────────────────────────────────────────────────── */}
      <section className="px-4 py-16 bg-white">
        <div className="mx-auto max-w-2xl">
          <div className="inline-flex items-center rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-teal-700 ring-1 ring-teal-100 mb-4">
            Our story
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-900 md:text-3xl">
            Why MockOfsted exists
          </h2>

          <div className="mt-6 space-y-4 text-slate-600 leading-relaxed">
            <p>
              Ofsted unannounced inspections hit hard. You never know when — and that uncertainty keeps everyone on edge. Mock inspections cost thousands and take weeks to book. Peer reviews vary wildly. Endless SCCIF reading doesn't simulate the real pressure of an inspector probing your answers.
            </p>
            <p>
              I built MockOfsted because I needed it. As a residential care leader, I knew the questions inspectors ask — and I knew that no affordable tool existed to practise answering them under pressure. Every question in this simulator reflects real SCCIF lines of enquiry. Every scoring rubric is grounded in how judgements are actually formed.
            </p>
            <p>
              After 12+ years in children's homes — from youth support to deputy and senior leadership — I pressure-tested this with real leaders across England. The results spoke for themselves: homes that practised consistently went into inspections sharper, calmer, and better evidenced.
            </p>
            <p className="font-medium text-slate-800">
              I use it myself. It helped accelerate one home from Good to Outstanding by exposing blind spots months before the inspection arrived.
            </p>
          </div>

          {/* Credibility card */}
          <div className="mt-8 rounded-2xl bg-teal-50 border border-teal-100 px-6 py-5 flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white text-lg">
              ✓
            </div>
            <div>
              <p className="font-semibold text-slate-900">Tested in real homes</p>
              <p className="mt-1 text-sm text-slate-600">
                Beta-tested with 10+ leaders across England. SCCIF-native from day one — not retrofitted. Covering every standard, not just the common ones.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features grid ────────────────────────────────────────────────────── */}
      <section className="px-4 py-16 bg-slate-50 border-y border-slate-100">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="font-display text-2xl font-bold text-slate-900 md:text-3xl">
              Everything you need to walk in confident
            </h2>
            <p className="mt-3 text-slate-500 max-w-lg mx-auto">
              One tool. All 9 Quality Standards. Real inspector pressure — at a fraction of the cost of a mock inspection.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 mb-4">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm">{f.title}</h3>
                <p className="mt-2 text-xs text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────────── */}
      <section className="px-4 py-16 bg-white">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="font-display text-2xl font-bold text-slate-900 md:text-3xl">
              What care leaders say
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="testimonial-card rounded-2xl border border-slate-200 bg-slate-50 p-6 relative">
                <Quote className="absolute top-5 right-5 h-6 w-6 text-teal-100" aria-hidden="true" />
                <p className="text-slate-700 text-sm leading-relaxed">"{t.quote}"</p>
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-xs font-semibold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.location}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-slate-400">
            Testimonials from beta participants. Names and locations anonymised.
          </p>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="px-4 py-16 bg-teal-600">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-2xl font-bold text-white md:text-3xl">
            Ready to walk into your next inspection confident?
          </h2>
          <p className="mt-4 text-teal-100 leading-relaxed">
            3-day free trial. No credit card required. All 9 Quality Standards from day one.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-xl bg-white px-7 py-3 text-sm font-semibold text-teal-700 shadow-sm hover:bg-teal-50 transition-colors"
            >
              Start free trial <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center rounded-xl border border-teal-400 bg-transparent px-7 py-3 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
            >
              Get in touch
            </Link>
          </div>
        </div>
      </section>

    </MarketingLayout>
  );
}

import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, Users, Server, Mail } from "lucide-react";
import MarketingLayout from "./marketing/MarketingLayout";

const CONTACT_EMAIL = "hello@inspectready.co.uk";

export default function About() {
  return (
    <MarketingLayout>
      <title>About InspectReady — Built by a Manager, for Managers</title>

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section className="px-4 pt-10 pb-16 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="inline-flex items-center rounded-full bg-teal-50 px-4 py-1.5 text-sm font-semibold text-teal-800 ring-1 ring-teal-100 mb-5">
            Our story
          </div>
          <h1 className="font-display text-4xl font-bold text-slate-900 md:text-5xl">
            Why InspectReady?{" "}
            <span className="text-teal-600">Built by a Level 5 Manager for Managers.</span>
          </h1>
          <p className="mt-5 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Not a consultancy. Not a compliance vendor. A practice tool built from the inside out — by
            someone who has sat in that room with an Ofsted inspector.
          </p>
        </div>
      </section>

      {/* ── My Story ──────────────────────────────────────────────────────────── */}
      <section className="px-4 pb-16">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 md:p-10 shadow-sm space-y-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 ring-1 ring-teal-100">
              <span className="text-2xl" role="img" aria-label="Person">👤</span>
            </div>

            <h2 className="font-display text-2xl font-bold text-slate-900">My Story</h2>

            <p className="text-slate-600 leading-relaxed">
              I started in youth work — evening sessions, detached outreach, slowly building enough
              trust with young people for them to tell you what was really going on. That work never
              felt like a job. It felt like something that mattered.
            </p>

            <p className="text-slate-600 leading-relaxed">
              Over time I moved into residential care, took on a management role, and eventually became
              a registered manager of a children's home in England. That's when the reality of Ofsted
              hit me properly. Not as an abstract concept but as an unannounced knock on the door at
              8:45am with a young person still in bed who'd had a difficult night.
            </p>

            <p className="text-slate-600 leading-relaxed">
              The existing preparation options were poor. Expensive consultants who gave you a
              tick-list. Self-practice that drifted. Teams too stretched to run effective mock
              exercises. I kept thinking: there has to be a better way to rehearse those conversations
              — not memorise answers, but genuinely practise thinking clearly under pressure about
              things that actually matter.
            </p>

            <p className="text-slate-600 leading-relaxed">
              InspectReady came out of that frustration. I built the first version for my own team,
              grounded entirely in the SCCIF framework, covering all nine Quality Standards including
              Protection of Children — the limiting judgement that can overturn every other good grade.
              The question bank draws on real inspection themes. The scoring reflects how inspectors
              actually form judgements, not how compliance documents are written.
            </p>

            <p className="text-slate-600 leading-relaxed">
              This isn't about scripting perfect answers. It's about building the muscle memory of
              thinking clearly, confidently, and accurately about your practice — so that when an
              inspector asks you something at 9am, you're not searching for words.
            </p>
          </div>
        </div>
      </section>

      {/* ── Validated ─────────────────────────────────────────────────────────── */}
      <section className="bg-slate-50 px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center mb-10">
            <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-teal-50 ring-1 ring-teal-100 mb-4">
              <Users className="h-6 w-6 text-teal-700" />
            </div>
            <h2 className="font-display text-2xl font-bold text-slate-900 md:text-3xl">
              Tested Across Real Homes
            </h2>
            <p className="mt-2 text-slate-600">
              InspectReady was developed with input from registered managers across England before
              public launch.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                stat: "10+",
                label: "Children's homes in beta",
                detail:
                  "Managers across supported living and residential settings used early versions and gave direct feedback on question accuracy, scoring, and report usefulness.",
              },
              {
                stat: "All 9",
                label: "Quality Standards covered",
                detail:
                  "Every domain from Quality and Purpose of Care to Care Planning — including Protection of Children, the limiting judgement that shapes the overall grade.",
              },
              {
                stat: "SCCIF",
                label: "Framework-native scoring",
                detail:
                  "Questions, rubrics, and feedback are grounded in the Social Care Common Inspection Framework — not generic quality frameworks or internal compliance checklists.",
              },
            ].map((item) => (
              <div key={item.stat} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="font-display text-3xl font-bold text-teal-600">{item.stat}</div>
                <div className="mt-1 font-semibold text-slate-900">{item.label}</div>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5 md:px-8 md:py-6">
            <div className="flex items-start gap-4">
              <ShieldCheck className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900">Honest about what this is</p>
                <p className="mt-1 text-sm text-amber-800 leading-relaxed">
                  InspectReady is a professional development tool. It does not replace Ofsted, does not
                  provide official compliance advice, and cannot predict inspection outcomes. Every
                  evaluation is generated from your responses only. Use it to practise — not to
                  benchmark or certify.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tech ──────────────────────────────────────────────────────────────── */}
      <section className="px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center mb-10">
            <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-slate-100 ring-1 ring-slate-200 mb-4">
              <Server className="h-6 w-6 text-slate-600" />
            </div>
            <h2 className="font-display text-2xl font-bold text-slate-900 md:text-3xl">
              How It's Built
            </h2>
            <p className="mt-2 text-slate-600">
              Simple architecture. UK data infrastructure. No unnecessary complexity.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "UK data infrastructure",
                detail:
                  "All user data, session records, and reports are stored in Supabase's EU (London) region. No data leaves the UK without explicit user action.",
                icon: "🇬🇧",
              },
              {
                title: "SCCIF-native question bank",
                detail:
                  "Questions, scoring rubrics, and follow-up themes are written specifically for children's homes in England — not adapted from generic care frameworks.",
                icon: "📋",
              },
              {
                title: "Voice and text responses",
                detail:
                  "Answer by speaking or typing. Transcription uses Deepgram's speech recognition. Neither recording nor transcript is retained beyond the session.",
                icon: "🎤",
              },
              {
                title: "Inspection-grade scoring",
                detail:
                  "Responses are evaluated against domain-specific criteria. Scores map to the 1–4 band system (Inadequate → Outstanding) used in SCCIF judgements.",
                icon: "📊",
              },
              {
                title: "Session privacy",
                detail:
                  "Each session belongs to the authenticated user only. Row-level security is enforced at the database level — no admin access to individual session content.",
                icon: "🔐",
              },
              {
                title: "No tracking or ads",
                detail:
                  "No third-party advertising. No behavioural tracking. Usage analytics are minimal, anonymised, and used only to improve the product.",
                icon: "🚫",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="text-2xl mb-3" role="img" aria-label={item.title}>{item.icon}</div>
                <h3 className="font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact ───────────────────────────────────────────────────────────── */}
      <section className="bg-slate-50 px-4 py-14">
        <div className="mx-auto max-w-2xl text-center">
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-teal-50 ring-1 ring-teal-100 mb-4">
            <Mail className="h-6 w-6 text-teal-700" />
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-900">Get in Touch</h2>
          <p className="mt-3 text-slate-600 leading-relaxed">
            Question about InspectReady? Feedback on the simulator? Interested in a team or
            multi-home plan? I read every message and reply personally.
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors"
          >
            <Mail className="h-4 w-4" />
            {CONTACT_EMAIL}
          </a>
          <p className="mt-3 text-sm text-slate-500">Or use the <Link to="/contact" className="text-teal-700 hover:underline">contact form</Link>.</p>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────────── */}
      <section className="bg-teal-600 px-4 py-14 text-center">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-3xl font-bold text-white">
            Ready to practise with confidence?
          </h2>
          <p className="mt-3 text-teal-100">3-day free trial. No card. Cancel any time.</p>
          <Link
            to="/login"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-teal-700 shadow-sm hover:bg-teal-50 transition-colors"
          >
            Start free trial <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
}

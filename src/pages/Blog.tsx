import { Link } from "react-router-dom";
import { ArrowRight, Clock, BookOpen } from "lucide-react";
import MarketingLayout from "./marketing/MarketingLayout";

const POSTS = [
  {
    slug: "sccif-2026-changes",
    tag: "Inspection Framework",
    tagColour: "bg-teal-50 text-teal-700",
    title: "SCCIF 2026: What's Changing and What Isn't",
    excerpt:
      "Ofsted's updated Social Care Common Inspection Framework brings sharper focus on relationships, de-escalation evidence, and the quality of return-home interviews. We break down what matters for registered managers.",
    readTime: "6 min read",
    date: "March 2026",
    icon: "📋",
  },
  {
    slug: "qs7-safeguarding-deep-dive",
    tag: "QS7 — Protection",
    tagColour: "bg-red-50 text-red-700",
    title: "QS7 Safeguarding Deep Dive: The Questions Inspectors Actually Ask",
    excerpt:
      "Protection of Children is the limiting judgement — Inadequate here overrides every other domain. This guide works through the 10 most common QS7 lines of enquiry and what inspectors want to hear.",
    readTime: "9 min read",
    date: "February 2026",
    icon: "🛡️",
  },
  {
    slug: "unannounced-prep-guide",
    tag: "Inspection Readiness",
    tagColour: "bg-amber-50 text-amber-700",
    title: "Unannounced Inspection Prep: A Practical Guide for Registered Managers",
    excerpt:
      "You won't get notice. So the preparation has to be embedded, not bolted on at the last minute. This guide covers the eight things that experienced managers do differently — and how to build the same habits in your team.",
    readTime: "8 min read",
    date: "January 2026",
    icon: "⏰",
  },
];

export default function Blog() {
  return (
    <MarketingLayout>
      <title>Ofsted Insights for Children's Home Managers | InspectReady Blog</title>

      {/* Hero */}
      <section className="px-4 pt-10 pb-14 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="inline-flex items-center rounded-full bg-teal-50 px-4 py-1.5 text-sm font-semibold text-teal-800 ring-1 ring-teal-100 mb-5">
            <BookOpen className="mr-1.5 h-3.5 w-3.5" />
            Insights &amp; Guides
          </div>
          <h1 className="font-display text-4xl font-bold text-slate-900 md:text-5xl">
            Ofsted Insights for Children's Home Managers
          </h1>
          <p className="mt-5 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Practical guidance on SCCIF, inspection readiness, and quality standards — written for
            registered managers who don't have time for vague advice.
          </p>
        </div>
      </section>

      {/* Post cards */}
      <section className="px-4 pb-16">
        <div className="mx-auto max-w-4xl space-y-6">
          {POSTS.map((post) => (
            <article
              key={post.slug}
              className="group rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm hover:shadow-md hover:border-teal-200 transition-all"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
                {/* Icon */}
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-2xl">
                  <span role="img" aria-label={post.title}>{post.icon}</span>
                </div>

                <div className="flex-1 min-w-0">
                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${post.tagColour}`}>
                      {post.tag}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="h-3 w-3" />
                      {post.readTime}
                    </span>
                    <span className="text-xs text-slate-400">{post.date}</span>
                  </div>

                  <h2 className="font-display text-lg font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                    {post.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{post.excerpt}</p>

                  {/* Coming soon badge */}
                  <div className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500">
                    Full article coming soon
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Subscribe strip */}
      <section className="bg-teal-50 border-y border-teal-100 px-4 py-12">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-2xl font-bold text-slate-900">
            New guides every month
          </h2>
          <p className="mt-2 text-slate-600 text-sm leading-relaxed">
            Practical SCCIF insight, inspection question analysis, and readiness frameworks — straight
            to your inbox. No spam. Unsubscribe any time.
          </p>

          <form
            onSubmit={(e) => e.preventDefault()}
            className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center"
          >
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 max-w-xs rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder-slate-400 shadow-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors"
            >
              Subscribe <ArrowRight className="h-4 w-4" />
            </button>
          </form>
          <p className="mt-2 text-xs text-slate-400">
            You'll also get early access to new InspectReady features.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-teal-600 px-4 py-14 text-center">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-3xl font-bold text-white">
            Reading about it is good. Practising it is better.
          </h2>
          <p className="mt-3 text-teal-100">
            Run a full mock inspection session in under 30 minutes — free trial, no card needed.
          </p>
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

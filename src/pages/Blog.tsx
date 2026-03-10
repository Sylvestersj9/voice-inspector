// src/pages/Blog.tsx — Public blog listing
// Posts sourced from:
//   1. Supabase blog_posts table (autopilot weekly feed)
//   2. LOCAL_POSTS fallback (static editorial content)
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Calendar, ExternalLink, Rss } from "lucide-react";
import MarketingLayout from "./marketing/MarketingLayout";
import { supabase } from "@/lib/supabase";
import { getAllPosts, type BlogPost } from "@/lib/blogPosts";

// ── Subscribe form ─────────────────────────────────────────────────────────────
function SubscribeForm() {
  const [email, setEmail]     = useState("");
  const [status, setStatus]   = useState<"idle" | "busy" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("busy");
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const anonKey     = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) as string;
      const res = await fetch(`${supabaseUrl}/functions/v1/send-feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: anonKey },
        body: JSON.stringify({ type: "subscribe", email: email.trim(), name: "", message: "Blog subscription" }),
      });
      if (res.ok) {
        setStatus("done");
        setMessage("Subscribed — we'll send new posts straight to your inbox.");
        setEmail("");
      } else {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Server error");
      }
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong. Try again.");
    }
  };

  return (
    <section className="bg-teal-50 border-y border-teal-100 px-4 py-12">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-2xl font-bold text-slate-900">
          New articles every week
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Practical SCCIF updates, inspection analysis, and readiness guides — straight to your
          inbox. Sourced weekly from GOV.UK / Ofsted RSS. No spam.
        </p>

        {status === "done" ? (
          <p className="mt-6 rounded-xl bg-teal-100 px-5 py-3 text-sm font-semibold text-teal-800">
            {message}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 max-w-xs rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder-slate-400 shadow-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
            />
            <button
              type="submit"
              disabled={status === "busy"}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors disabled:opacity-60"
            >
              {status === "busy" ? "Subscribing…" : <>Subscribe <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>
        )}

        {status === "error" && (
          <p className="mt-3 text-sm text-red-600">{message}</p>
        )}

        <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <Rss className="h-3 w-3" />
          Weekly via GOV.UK / Ofsted RSS · autopilot
        </div>
      </div>
    </section>
  );
}

// ── Post card ──────────────────────────────────────────────────────────────────
function PostCard({ post }: { post: BlogPost }) {
  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm hover:shadow-md hover:border-teal-200 transition-all">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${post.tagColour}`}>
          {post.tag}
        </span>
        <span className="flex items-center gap-1 text-xs text-slate-400">
          <Calendar className="h-3 w-3" />
          {new Date(post.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
        </span>
        <span className="text-xs text-slate-400">{post.sourceLabel}</span>
      </div>

      <h2 className="font-display text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors leading-snug">
        {post.title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600 line-clamp-3">{post.excerpt}</p>

      <div className="mt-4">
        {post.isLocal ? (
          <Link
            to={`/blog/${post.slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-900"
          >
            Read article <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <a
            href={post.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            Read on {post.sourceLabel} <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </article>
  );
}

// ── Blog listing page ──────────────────────────────────────────────────────────
export default function Blog() {
  const [dbPosts, setDbPosts]   = useState<BlogPost[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    supabase
      .from("blog_posts")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const mapped: BlogPost[] = data.map((row) => ({
            slug:        row.slug,
            title:       row.title,
            date:        row.published_at,
            sourceLabel: row.source_name,
            sourceUrl:   row.source_url,
            excerpt:     row.excerpt,
            tag:         row.tags?.[0] ?? "Inspection Updates",
            tagColour:   tagColour(row.tags?.[0] ?? ""),
            readTime:    "4 min read",
            isLocal:     false,
          }));
          setDbPosts(mapped);
        }
        setLoading(false);
      });
  }, []);

  // Merge DB posts + static local posts, deduplicated, newest first
  const staticPosts = getAllPosts();
  const dbSlugs     = new Set(dbPosts.map((p) => p.slug));
  const allPosts    = [
    ...dbPosts,
    ...staticPosts.filter((p) => !dbSlugs.has(p.slug)),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 12);

  return (
    <MarketingLayout>
      {/* SEO */}
      <title>Ofsted &amp; SCCIF Updates for Children's Homes | MockOfsted Blog</title>
      <meta
        name="description"
        content="Weekly Ofsted and SCCIF inspection updates, QS guidance, and readiness articles for children's homes and supported living leaders."
      />
      <link rel="canonical" href="https://mockofsted.co.uk/blog" />
      <meta property="og:title" content="MockOfsted Blog — Ofsted & SCCIF Updates" />
      <meta property="og:description" content="Weekly inspection updates sourced from GOV.UK / Ofsted RSS. SCCIF guidance for care leaders." />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://mockofsted.co.uk/blog" />

      {/* Hero */}
      <section className="px-4 pt-10 pb-12 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="inline-flex items-center rounded-full bg-teal-50 px-4 py-1.5 text-sm font-semibold text-teal-800 ring-1 ring-teal-100 mb-5">
            <BookOpen className="mr-1.5 h-3.5 w-3.5" />
            Ofsted &amp; SCCIF Updates
          </div>
          <h1 className="font-display text-4xl font-bold text-slate-900 md:text-5xl">
            Ofsted &amp; SCCIF Updates for Children's Homes
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Practical inspection intelligence for care leaders — sourced weekly from
            GOV.UK and Ofsted, summarised for practice relevance.
          </p>
          <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <Rss className="h-3 w-3" />
            Auto-updated every Sunday from GOV.UK / Ofsted RSS feeds
          </div>
        </div>
      </section>

      {/* Post grid */}
      <section className="px-4 pb-16">
        <div className="mx-auto max-w-5xl">
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-48 rounded-2xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {allPosts.map((post) => <PostCard key={post.slug} post={post} />)}
            </div>
          )}
        </div>
      </section>

      {/* Subscribe strip */}
      <SubscribeForm />

      {/* Simulator CTA */}
      <section className="bg-teal-600 px-4 py-14 text-center">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-3xl font-bold text-white">
            Reading about it is good. Practising it is better.
          </h2>
          <p className="mt-3 text-teal-100">
            Run a full mock inspection in under 30 minutes — free trial, no card needed.
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

function tagColour(tag: string): string {
  if (tag.includes("QS7") || tag.includes("Protect"))  return "bg-red-50 text-red-700";
  if (tag.includes("Leader"))                           return "bg-blue-50 text-blue-700";
  if (tag.includes("SCCIF") || tag.includes("Frame"))  return "bg-teal-50 text-teal-700";
  if (tag.includes("Supported"))                        return "bg-indigo-50 text-indigo-700";
  if (tag.includes("Monitoring") || tag.includes("Reg")) return "bg-amber-50 text-amber-700";
  if (tag.includes("Foster") || tag.includes("Place"))  return "bg-purple-50 text-purple-700";
  return "bg-slate-100 text-slate-600";
}

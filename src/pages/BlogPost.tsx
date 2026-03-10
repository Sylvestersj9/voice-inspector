// src/pages/BlogPost.tsx — Dynamic blog post renderer
// Handles both:
//   1. Local authored posts (src/content/blog/*.tsx) — full prose component
//   2. DB autopilot posts (blog_posts table) — rendered from summary_md
import { Suspense, lazy, useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { ArrowLeft, Calendar, ExternalLink } from "lucide-react";
import MarketingLayout from "./marketing/MarketingLayout";
import { supabase } from "@/lib/supabase";
import { getPostBySlug } from "@/lib/blogPosts";

// ── Static map: slug → lazy component (Vite tree-shakes unused posts) ─────────
const BLOG_COMPONENT_MAP: Record<string, React.LazyExoticComponent<() => JSX.Element>> = {
  "sccif-stability-2025":          lazy(() => import("@/content/blog/sccif-stability-2025")),
  "supported-accomm-inspections":  lazy(() => import("@/content/blog/supported-accomm-inspections")),
  "qs7-safeguarding":              lazy(() => import("@/content/blog/qs7-safeguarding")),
  "homes-regs-monitoring":         lazy(() => import("@/content/blog/homes-regs-monitoring")),
  "foster-reforms-2026":           lazy(() => import("@/content/blog/foster-reforms-2026")),
  "unannounced-inspection-prep":   lazy(() => import("@/content/blog/unannounced-inspection-prep")),
};

// ── Renders markdown-ish summary from DB (no remark/rehype needed) ─────────────
function MarkdownText({ text }: { text: string }) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="space-y-4">
      {paragraphs.map((para, i) => (
        <p key={i} className="text-slate-600 leading-relaxed">
          {para}
        </p>
      ))}
    </div>
  );
}

// ── DB post renderer ──────────────────────────────────────────────────────────
type DbPost = {
  slug: string;
  title: string;
  source_name: string;
  source_url: string;
  published_at: string;
  summary_md: string;
  tags: string[];
};

function DbPostView({ post }: { post: DbPost }) {
  return (
    <div>
      <MarkdownText text={post.summary_md} />

      <div className="mt-6 rounded-xl bg-slate-50 border border-slate-200 px-5 py-4 text-sm text-slate-600">
        <p className="font-semibold text-slate-700 mb-1">Source</p>
        <a
          href={post.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-teal-700 hover:underline"
        >
          {post.source_name} <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <p className="mt-2 text-xs text-slate-400">
          Auto-summarised by Claude from GOV.UK / Ofsted RSS. Always verify against the source.
        </p>
      </div>

      <div className="mt-8 rounded-xl bg-teal-50 border border-teal-100 px-5 py-4">
        <p className="text-sm font-semibold text-teal-800">
          Practice the QS standards mentioned in this article.
        </p>
        <p className="mt-1 text-sm text-slate-600">
          MockOfsted simulates real SCCIF inspection conversations — all 9 Quality Standards.
        </p>
        <Link
          to="/app"
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
        >
          Practice QS → start session
        </Link>
      </div>
    </div>
  );
}

// ── Article shell (shared layout) ─────────────────────────────────────────────
function ArticleShell({
  title,
  date,
  sourceLabel,
  sourceUrl,
  tag,
  children,
}: {
  title: string;
  date: string;
  sourceLabel: string;
  sourceUrl: string;
  tag: string;
  children: React.ReactNode;
}) {
  const formattedDate = new Date(date).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <MarketingLayout>
      <title>{title} | MockOfsted Blog</title>
      <meta name="description" content={`${title} — SCCIF inspection guidance for children's homes and supported living leaders.`} />
      <link rel="canonical" href={`https://mockofsted.co.uk/blog/${tag}`} />
      <meta property="og:title" content={`${title} | MockOfsted Blog`} />
      <meta property="og:type" content="article" />
      <meta property="og:url" content={`https://mockofsted.co.uk/blog`} />

      <article className="px-4 py-12">
        <div className="mx-auto max-w-2xl">
          {/* Back */}
          <Link
            to="/blog"
            className="mb-8 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to blog
          </Link>

          {/* Header */}
          <header className="mb-8">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="rounded-full bg-teal-50 px-3 py-0.5 text-xs font-semibold text-teal-700">
                {tag}
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Calendar className="h-3 w-3" /> {formattedDate}
              </span>
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                {sourceLabel}
              </a>
            </div>
            <h1 className="font-display text-2xl font-bold text-slate-900 md:text-3xl leading-tight">
              {title}
            </h1>
          </header>

          {/* Body */}
          {children}

          {/* Disclaimer */}
          <p className="text-xs text-gray-500 mt-8 p-4 bg-gray-50 rounded">
            AI-summarised from official Ofsted sources. Always verify against primary guidance.
          </p>

          {/* Footer nav */}
          <div className="mt-8 border-t border-slate-100 pt-8">
            <Link
              to="/blog"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> All articles
            </Link>
          </div>
        </div>
      </article>
    </MarketingLayout>
  );
}

// ── Main page component ────────────────────────────────────────────────────────
export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [dbPost, setDbPost]       = useState<DbPost | null>(null);
  const [dbLoading, setDbLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => {
        setDbPost(data ?? null);
        setDbLoading(false);
      });
  }, [slug]);

  if (!slug) return <Navigate to="/blog" replace />;

  // Check static map first
  const LocalComponent = BLOG_COMPONENT_MAP[slug];
  const staticMeta     = getPostBySlug(slug);

  if (LocalComponent && staticMeta) {
    return (
      <ArticleShell
        title={staticMeta.title}
        date={staticMeta.date}
        sourceLabel={staticMeta.sourceLabel}
        sourceUrl={staticMeta.sourceUrl}
        tag={staticMeta.tag}
      >
        <Suspense fallback={<div className="h-48 animate-pulse bg-slate-100 rounded-xl" />}>
          <LocalComponent />
        </Suspense>
      </ArticleShell>
    );
  }

  // DB autopilot post
  if (dbLoading) {
    return (
      <MarketingLayout>
        <div className="mx-auto max-w-2xl px-4 py-16">
          <div className="space-y-4">
            <div className="h-6 w-1/3 animate-pulse rounded bg-slate-100" />
            <div className="h-10 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      </MarketingLayout>
    );
  }

  if (dbPost) {
    return (
      <ArticleShell
        title={dbPost.title}
        date={dbPost.published_at}
        sourceLabel={dbPost.source_name}
        sourceUrl={dbPost.source_url}
        tag={dbPost.tags?.[0] ?? "Inspection Updates"}
      >
        <DbPostView post={dbPost} />
      </ArticleShell>
    );
  }

  return <Navigate to="/blog" replace />;
}

// ── blog-autopilot edge function ──────────────────────────────────────────────
// Runs every Sunday at 02:00 UTC (via pg_cron) or on-demand via POST.
//
// Pipeline:
//   1. Fetch HTML/RSS from 4 trusted GOV.UK / Ofsted sources
//   2. Extract new articles (published in the last 7 days)
//   3. For each new article: call Claude Haiku to produce a 150-word summary
//   4. Upsert into blog_posts table (slug-deduplicated)
//
// Required Supabase secrets:
//   ANTHROPIC_API_KEY  — Claude API key (set via: supabase secrets set ANTHROPIC_API_KEY=...)
//   SUPABASE_URL       — auto-injected
//   SUPABASE_SERVICE_ROLE_KEY — auto-injected
//
// Deploy: supabase functions deploy blog-autopilot --no-verify-jwt

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Trusted sources ────────────────────────────────────────────────────────────
const SOURCES = [
  {
    name: "GOV.UK — Ofsted",
    url: "https://www.gov.uk/government/organisations/ofsted.atom",
    type: "atom" as const,
  },
  {
    name: "Social Care Inspection Blog",
    url: "https://socialcareinspection.blog.gov.uk/feed/",
    type: "rss" as const,
  },
  {
    name: "GOV.UK Ofsted RSS",
    url: "https://www.gov.uk/government/organisations/ofsted.rss",
    type: "rss" as const,
  },
  {
    name: "GOV.UK — Supported Accommodation SCCIF",
    url: "https://www.gov.uk/government/publications/social-care-common-inspection-framework-sccif-supported-accommodation",
    type: "html" as const, // no RSS; we extract page metadata
  },
] as const;

type ArticleRaw = {
  title: string;
  link: string;
  pubDate: string; // ISO
  sourceName: string;
  sourceUrl: string;
  rawText: string; // first ~800 chars of content for Claude
};

// ── XML/HTML parsers (pure regex — no DOM in Deno edge) ───────────────────────
function extractRssItems(xml: string, sourceName: string, sourceUrl: string): ArticleRaw[] {
  const items: ArticleRaw[] = [];
  const itemBlocks = xml.match(/<item[\s\S]*?<\/item>/g) ?? [];
  for (const block of itemBlocks.slice(0, 8)) {
    const title   = (block.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/))?.[1]?.trim() ?? "";
    const link    = (block.match(/<link[^>]*>([\s\S]*?)<\/link>/))?.[1]?.trim() ?? "";
    const pubDate = (block.match(/<pubDate>([\s\S]*?)<\/pubDate>/))?.[1]?.trim() ?? "";
    const desc    = (block.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/))?.[1] ?? "";
    if (!title || !link) continue;
    items.push({
      title,
      link,
      pubDate: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      sourceName,
      sourceUrl,
      rawText: desc.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 800),
    });
  }
  return items;
}

function extractAtomItems(xml: string, sourceName: string, sourceUrl: string): ArticleRaw[] {
  const items: ArticleRaw[] = [];
  const entryBlocks = xml.match(/<entry[\s\S]*?<\/entry>/g) ?? [];
  for (const block of entryBlocks.slice(0, 8)) {
    const title   = (block.match(/<title[^>]*>([\s\S]*?)<\/title>/))?.[1]?.trim() ?? "";
    const link    = (block.match(/<link[^>]*href="([^"]+)"/))?.[1]?.trim() ?? "";
    const updated = (block.match(/<updated>([\s\S]*?)<\/updated>/))?.[1]?.trim() ?? "";
    const content = (block.match(/<(?:content|summary)[^>]*>([\s\S]*?)<\/(?:content|summary)>/))?.[1] ?? "";
    if (!title || !link) continue;
    items.push({
      title,
      link,
      pubDate: updated ? new Date(updated).toISOString() : new Date().toISOString(),
      sourceName,
      sourceUrl,
      rawText: content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 800),
    });
  }
  return items;
}

function extractHtmlMeta(html: string, sourceName: string, sourceUrl: string): ArticleRaw[] {
  // For static pages (e.g. SCCIF guidance), extract the <title> and first <p>
  const title   = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/))?.[1]?.trim() ?? sourceName;
  const paras   = html.match(/<p[^>]*>([\s\S]*?)<\/p>/g) ?? [];
  const rawText = paras
    .slice(0, 4)
    .map((p) => p.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
    .join(" ")
    .slice(0, 800);
  if (!rawText) return [];
  return [{
    title,
    link: sourceUrl,
    pubDate: new Date().toISOString(),
    sourceName,
    sourceUrl,
    rawText,
  }];
}

// ── Claude summariser ──────────────────────────────────────────────────────────
async function summariseWithClaude(article: ArticleRaw, anthropicKey: string): Promise<string> {
  const prompt = `You are writing a concise blog summary for MockOfsted — a practice tool for registered managers of children's homes in England preparing for Ofsted SCCIF inspections.

Summarise this article in exactly 150 words for an audience of registered managers. Focus on:
- What changed or what the finding is
- Why it matters for SCCIF inspection preparation
- One specific action the manager can take

Article title: ${article.title}
Source: ${article.sourceName}
Content: ${article.rawText}

Write in plain English. No bullet points. No headers. Start with the most important fact.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return (data.content?.[0]?.text ?? "").trim();
}

// ── Slug generator ─────────────────────────────────────────────────────────────
function toSlug(title: string, date: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60)
    .replace(/-$/, "");
  const year = date.slice(0, 4);
  return `${base}-${year}`;
}

// ── Tag classifier ─────────────────────────────────────────────────────────────
function classifyTags(title: string, text: string): string[] {
  const combined = `${title} ${text}`.toLowerCase();
  const tags: string[] = [];
  if (/qs7|safeguarding|protect/i.test(combined))      tags.push("QS7 — Protection");
  if (/qs8|leadership|management/i.test(combined))     tags.push("Leadership");
  if (/supported.accomm|semi.independent/i.test(combined)) tags.push("Supported Accommodation");
  if (/regulation.44|monitoring.visit|r44/i.test(combined)) tags.push("Regulatory Monitoring");
  if (/sccif|quality.standard/i.test(combined))        tags.push("SCCIF Framework");
  if (/foster|placement/i.test(combined))              tags.push("Placements");
  if (tags.length === 0) tags.push("Inspection Updates");
  return tags;
}

// ── Is article recent (within 8 days to catch edge of weekly run) ─────────────
function isRecent(pubDate: string): boolean {
  const age = Date.now() - new Date(pubDate).getTime();
  return age < 8 * 24 * 60 * 60 * 1000;
}

// ── Main handler ───────────────────────────────────────────────────────────────
Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY") ?? Deno.env.get("CLAUDE_API_KEY");
  if (!anthropicKey) {
    return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not set" }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const results: { slug: string; status: string }[] = [];
  let fetched = 0;
  let published = 0;

  for (const source of SOURCES) {
    let raw: ArticleRaw[] = [];

    try {
      const res = await fetch(source.url, {
        headers: { "User-Agent": "MockOfsted-Blog-Bot/1.0 (+https://mockofsted.co.uk)" },
        signal: AbortSignal.timeout(12_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();

      if (source.type === "rss")  raw = extractRssItems(text, source.name, source.url);
      if (source.type === "atom") raw = extractAtomItems(text, source.name, source.url);
      if (source.type === "html") raw = extractHtmlMeta(text, source.name, source.url);

      fetched += raw.length;
    } catch (err) {
      results.push({ slug: source.name, status: `fetch-error: ${err}` });
      continue;
    }

    // Filter to recent articles only on scheduled runs; process all on manual trigger
    const isScheduled = req.headers.get("x-scheduled-job") === "1";
    const articles = isScheduled ? raw.filter((a) => isRecent(a.pubDate)) : raw;

    for (const article of articles.slice(0, 3)) {
      const slug = toSlug(article.title, article.pubDate);

      // Skip if already stored
      const { data: existing } = await supabase
        .from("blog_posts")
        .select("slug")
        .eq("slug", slug)
        .maybeSingle();
      if (existing) { results.push({ slug, status: "skipped-exists" }); continue; }

      // Summarise
      let summaryMd = "";
      try {
        summaryMd = await summariseWithClaude(article, anthropicKey);
      } catch (err) {
        summaryMd = article.rawText.slice(0, 400);
        results.push({ slug, status: `claude-fallback: ${err}` });
      }

      const excerpt = summaryMd.split(". ").slice(0, 2).join(". ").slice(0, 220) + "…";
      const tags    = classifyTags(article.title, summaryMd);

      const { error } = await supabase.from("blog_posts").upsert({
        slug,
        title:        article.title,
        source_name:  article.sourceName,
        source_url:   article.link,
        published_at: article.pubDate,
        summary_md:   summaryMd,
        excerpt,
        tags,
      }, { onConflict: "slug" });

      if (error) {
        results.push({ slug, status: `db-error: ${error.message}` });
      } else {
        published++;
        results.push({ slug, status: "published" });
      }
    }
  }

  return new Response(
    JSON.stringify({ ok: true, fetched, published, results }),
    { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
  );
});

// supabase/functions/blog-sync/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// AUTO-RUNS WEEKLY via pg_cron (Sunday 02:00 UTC).
// Can also be triggered manually: POST /functions/v1/blog-sync
//
// Pipeline:
//   1. Fetch RSS / Atom / HTML from 4 trusted GOV.UK / Ofsted sources
//   2. Parse items (pure regex — no DOM, no extra deps)
//   3. Filter by relevance keywords
//   4. Skip slugs already in blog_posts
//   5. Summarise each new article with Claude Haiku (150 words)
//   6. INSERT into blog_posts (slug-unique, error-resilient per source)
//
// Required Supabase secrets (set via CLI):
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//   SUPABASE_URL               → auto-injected by runtime
//   SUPABASE_SERVICE_ROLE_KEY  → auto-injected by runtime
//
// Deploy:
//   supabase functions deploy blog-sync --no-verify-jwt
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ParsedItem {
  title: string;
  url: string;
  date: string;   // ISO 8601
  content: string; // raw text, max ~800 chars for Claude
}

interface Source {
  name: string;
  url: string;
  kind: "rss" | "atom" | "html";
}

// ── Sources ───────────────────────────────────────────────────────────────────

const SOURCES: Source[] = [
  {
    name: "GOV.UK SCCIF Children's Homes",
    url: "https://www.gov.uk/government/publications/social-care-common-inspection-framework-sccif-childrens-homes",
    kind: "html",
  },
  {
    name: "Ofsted Social Care Blog",
    url: "https://socialcareinspection.blog.gov.uk/feed/",
    kind: "rss",
  },
  {
    name: "GOV.UK Ofsted",
    url: "https://www.gov.uk/government/organisations/ofsted.rss",
    kind: "rss",
  },
  {
    name: "SCCIF Supported Accommodation",
    url: "https://www.gov.uk/government/publications/social-care-common-inspection-framework-sccif-supported-accommodation",
    kind: "html",
  },
];

const KEYWORDS = [
  "children", "homes", "sccif", "inspection", "supported accommodation",
  "safeguarding", "ofsted", "quality standard", "registered manager",
  "children's home", "residential care",
];

// ── Parsers ───────────────────────────────────────────────────────────────────

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ")
    .replace(/&#\d+;/g, "").replace(/\s+/g, " ").trim();
}

function cdata(s: string): string {
  return s.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim();
}

function tag(block: string, t: string): string {
  const m = block.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)<\\/${t}>`, "i"));
  return m ? cdata(stripTags(m[1])) : "";
}

function attr(block: string, t: string, a: string): string {
  const m = block.match(new RegExp(`<${t}[^>]*${a}="([^"]+)"`, "i"));
  return m ? m[1].trim() : "";
}

function parseRss(xml: string): ParsedItem[] {
  const items: ParsedItem[] = [];
  for (const block of (xml.match(/<item[\s\S]*?<\/item>/gi) ?? [])) {
    const title   = tag(block, "title");
    const link    = tag(block, "link") || attr(block, "link", "href");
    const pubDate = tag(block, "pubDate") || tag(block, "dc:date");
    const desc    = tag(block, "description") || tag(block, "content:encoded");
    if (!title || !link) continue;
    items.push({
      title,
      url: link,
      date: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      content: desc.slice(0, 800),
    });
  }
  return items;
}

function parseAtom(xml: string): ParsedItem[] {
  const items: ParsedItem[] = [];
  for (const block of (xml.match(/<entry[\s\S]*?<\/entry>/gi) ?? [])) {
    const title   = tag(block, "title");
    const link    = attr(block, "link", "href") || tag(block, "link");
    const updated = tag(block, "updated") || tag(block, "published");
    const summary = tag(block, "summary") || tag(block, "content");
    if (!title || !link) continue;
    items.push({
      title,
      url: link,
      date: updated ? new Date(updated).toISOString() : new Date().toISOString(),
      content: summary.slice(0, 800),
    });
  }
  return items;
}

function parseHtml(html: string, sourceUrl: string): ParsedItem[] {
  // GOV.UK guidance pages — extract <title> + intro paragraphs as the "item"
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title      = titleMatch ? stripTags(titleMatch[1]).replace(/\s*-\s*GOV\.UK.*$/i, "").trim() : "";
  const paras      = (html.match(/<p[^>]*>[\s\S]*?<\/p>/gi) ?? [])
    .slice(0, 5)
    .map((p) => stripTags(p))
    .filter((p) => p.length > 40)
    .join(" ")
    .slice(0, 800);
  if (!title || !paras) return [];
  return [{ title, url: sourceUrl, date: new Date().toISOString(), content: paras }];
}

function parse(text: string, kind: Source["kind"], sourceUrl: string): ParsedItem[] {
  if (kind === "rss")  return parseRss(text);
  if (kind === "atom") return parseAtom(text);
  return parseHtml(text, sourceUrl);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

function isRelevant(title: string): boolean {
  const lower = title.toLowerCase();
  return KEYWORDS.some((kw) => lower.includes(kw));
}

function extractTags(title: string, content: string): string[] {
  const combined = `${title} ${content}`.toLowerCase();
  const tags: string[] = [];
  if (/qs7|safeguarding|protect/i.test(combined))          tags.push("QS7 — Protection");
  if (/qs8|leadership|management/i.test(combined))         tags.push("Leadership");
  if (/supported.accomm|semi.independent/i.test(combined)) tags.push("Supported Accommodation");
  if (/regulation.44|monitoring.visit|reg 44/i.test(combined)) tags.push("Regulatory Monitoring");
  if (/sccif|quality.standard/i.test(combined))            tags.push("SCCIF Framework");
  if (/foster|placement/i.test(combined))                   tags.push("Placements");
  return tags.length ? tags : ["Inspection Updates"];
}

// ── Claude summariser ─────────────────────────────────────────────────────────

async function callClaudeSummarize(
  content: string,
  title: string,
  apiKey: string,
): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `You are writing a concise update for MockOfsted — a practice tool for registered managers of children's homes preparing for Ofsted SCCIF inspections.

Summarise this article in exactly 3 short paragraphs (~150 words total) for an audience of registered managers. Cover:
1. What changed or what the key finding is
2. Why it matters for SCCIF inspection preparation
3. One concrete action the manager can take

Title: ${title}
Content: ${content}

Write in plain English. No bullet points. No headers. Be specific and direct.`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const text: string = data?.content?.[0]?.text ?? "";
  if (!text) throw new Error("Empty Claude response");
  return text.trim();
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request): Promise<Response> => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, apikey, content-type",
      },
    });
  }

  const anthropicKey =
    Deno.env.get("ANTHROPIC_API_KEY") ?? Deno.env.get("CLAUDE_API_KEY") ?? "";

  if (!anthropicKey) {
    return json({ error: "ANTHROPIC_API_KEY secret not set" }, 500);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  // Load existing slugs once (cheap, avoids per-item DB round-trips)
  const { data: existingRows, error: fetchErr } = await supabase
    .from("blog_posts")
    .select("slug");

  if (fetchErr) {
    return json({ error: `DB read failed: ${fetchErr.message}` }, 500);
  }

  const existingSlugs = new Set((existingRows ?? []).map((r: { slug: string }) => r.slug));

  let newPosts = 0;
  let skipped  = 0;
  const log: string[] = [];

  for (const source of SOURCES) {
    let items: ParsedItem[] = [];

    // ── Fetch source ──
    try {
      const res = await fetch(source.url, {
        headers: { "User-Agent": "MockOfsted-BlogSync/1.0 (+https://mockofsted.co.uk)" },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      items = parse(text, source.kind, source.url);
      log.push(`✓ ${source.name}: ${items.length} items parsed`);
    } catch (e) {
      log.push(`✗ ${source.name} fetch failed: ${e}`);
      continue; // error-resilient — skip to next source
    }

    // ── Process latest 3 per source ──
    for (const item of items.slice(0, 3)) {
      const slug = slugify(item.title);

      // Skip if already stored
      if (existingSlugs.has(slug)) {
        skipped++;
        continue;
      }

      // Skip if not relevant
      if (!isRelevant(item.title)) {
        skipped++;
        log.push(`  skip (irrelevant): "${item.title}"`);
        continue;
      }

      // Summarise with Claude
      let summaryMd = "";
      try {
        summaryMd = await callClaudeSummarize(item.content, item.title, anthropicKey);
      } catch (e) {
        // Fallback to raw content if Claude fails
        summaryMd = item.content.slice(0, 400);
        log.push(`  ⚠ Claude failed for "${item.title}": ${e} — using raw content`);
      }

      // Build excerpt: first sentence of summary, capped at 220 chars
      const excerpt = (summaryMd.split(/\.\s+/)[0] ?? summaryMd).slice(0, 220) + "…";

      const { error: insertErr } = await supabase.from("blog_posts").insert({
        slug,
        title:        item.title,
        source_name:  source.name,
        source_url:   item.url,
        published_at: item.date,
        summary_md:   summaryMd,
        excerpt,
        tags:         extractTags(item.title, summaryMd),
      });

      if (insertErr) {
        log.push(`  ✗ insert failed for "${slug}": ${insertErr.message}`);
      } else {
        existingSlugs.add(slug); // prevent duplicate within same run
        newPosts++;
        log.push(`  + inserted: "${item.title}"`);
      }
    }
  }

  return json({ newPosts, skipped, log });
});

// ── Util ──────────────────────────────────────────────────────────────────────

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

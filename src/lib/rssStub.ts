// ── RSS stub for dev · swap with real fetcher in prod / n8n pipeline ──────────
//
// n8n weekly automation:
//   Trigger: Schedule (every Monday 06:00 UTC)
//   Nodes:   HTTP Request → parse RSS XML → Supabase upsert → POST /api/revalidate
//   Feeds:   gov.uk/ofsted, socialcareinspection.blog.gov.uk, ofsted.gov.uk/news,
//            socialcareskills.co.uk, delphi.care/blog_articles
//
// Until the n8n pipeline is live, getAllRssItems() returns static stubs so the
// blog renders fully in dev and on first deploy.

export type RssItem = {
  slug: string;
  title: string;
  link: string;
  pubDate: string; // ISO date
  source: string; // domain key used for filtering
  sourceLabel: string; // display label
  excerpt: string;
  tag: string;
};

// ── Source registry (add new feeds here) ──────────────────────────────────────
export const RSS_SOURCES = [
  {
    id: "govuk-ofsted",
    label: "GOV.UK — Ofsted",
    url: "https://www.gov.uk/government/organisations/ofsted.atom",
  },
  {
    id: "social-care-inspection-blog",
    label: "Social Care Inspection Blog",
    url: "https://socialcareinspection.blog.gov.uk/feed/",
  },
  {
    id: "ofsted-news",
    label: "Ofsted News",
    url: "https://www.ofsted.gov.uk/news/rss",
  },
  {
    id: "social-care-skills",
    label: "Social Care Skills",
    url: "https://www.socialcareskills.co.uk/feed/",
  },
  {
    id: "delphi-care",
    label: "Delphi Care",
    url: "https://delphi.care/blog_articles/rss",
  },
] as const;

// ── Static stubs (6 items, one per source + extras) ───────────────────────────
export const RSS_STUBS: RssItem[] = [
  {
    slug: "rss-ofsted-report-card-update-2025",
    title: "Ofsted Confirms Social Care Inspection Framework Unchanged for 2025–26",
    link: "https://www.gov.uk/government/organisations/ofsted",
    pubDate: "2025-11-10",
    source: "govuk-ofsted",
    sourceLabel: "GOV.UK — Ofsted",
    excerpt:
      "Ofsted has confirmed that the Social Care Common Inspection Framework (SCCIF) and its four-point judgement scale remain unchanged for children's homes in 2025–26. The report-card reform announced for schools does not apply to social care inspection.",
    tag: "Inspection Updates",
  },
  {
    slug: "rss-sci-blog-leadership-jan-2026",
    title: "What Inspectors Look for in Children's Home Leadership",
    link: "https://socialcareinspection.blog.gov.uk",
    pubDate: "2026-01-08",
    source: "social-care-inspection-blog",
    sourceLabel: "Social Care Inspection Blog",
    excerpt:
      "A senior HMI explains the three questions always asked of registered managers when assessing leadership quality — and why documentation alone never substitutes for a manager who can articulate their practice.",
    tag: "Leadership & Management",
  },
  {
    slug: "rss-ofsted-news-supported-accomm-outcomes",
    title: "Supported Accommodation: First Full Year of Inspection Outcomes Published",
    link: "https://www.ofsted.gov.uk/news",
    pubDate: "2025-10-22",
    source: "ofsted-news",
    sourceLabel: "Ofsted News",
    excerpt:
      "Ofsted has published the first full year of inspection outcomes under the supported accommodation regime introduced in April 2023. One in five providers required improvement — with safeguarding and oversight the most common shortfalls.",
    tag: "Supported Accommodation",
  },
  {
    slug: "rss-scs-workforce-evidence-2025",
    title: "Workforce Development Records: The Most Under-Evidenced QS Area in 2025",
    link: "https://www.socialcareskills.co.uk",
    pubDate: "2025-12-03",
    source: "social-care-skills",
    sourceLabel: "Social Care Skills",
    excerpt:
      "An analysis of published Ofsted children's home inspection reports shows that training records and competency evidence remain the most consistently weak area under QS8. Here is what inspectors are looking for.",
    tag: "Workforce",
  },
  {
    slug: "rss-delphi-reg44-2025",
    title: "Regulation 44 Reports: What Monitoring Must Now Include",
    link: "https://delphi.care/blog_articles",
    pubDate: "2025-09-15",
    source: "delphi-care",
    sourceLabel: "Delphi Care",
    excerpt:
      "Ofsted inspectors are increasingly scrutinising Regulation 44 independent person reports. Recent inspection findings highlight that superficial or insufficiently evidenced reports are being flagged as leadership concerns under QS8.",
    tag: "Regulatory Monitoring",
  },
  {
    slug: "rss-ofsted-unannounced-2026",
    title: "Unannounced Inspection Frequency Increases for RI-Rated Homes",
    link: "https://www.gov.uk/government/organisations/ofsted",
    pubDate: "2026-02-01",
    source: "govuk-ofsted",
    sourceLabel: "GOV.UK — Ofsted",
    excerpt:
      "Ofsted's operational guidance for 2026 confirms that homes previously rated Requires Improvement will face shorter intervals before unannounced follow-up inspections. Registered managers should review continuous readiness protocols.",
    tag: "Inspection Updates",
  },
];

/**
 * In prod, n8n upserts fresh items into a Supabase `rss_items` table.
 * This function would query that table. For now returns filtered stubs.
 *
 * To wire prod: replace body with a Supabase select from `rss_items`
 * filtered by `source` and `pub_date >= now() - interval '30 days'`.
 */
export async function fetchRssFeed(sourceId: string): Promise<RssItem[]> {
  if (import.meta.env.PROD) {
    // TODO: query supabase `rss_items` table filtered by source
    console.warn("[rssStub] Prod RSS query not wired — returning stubs for", sourceId);
  }
  return RSS_STUBS.filter((item) => item.source === sourceId);
}

/** All items, newest first */
export function getAllRssItems(): RssItem[] {
  return [...RSS_STUBS].sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime(),
  );
}

// ── Blog post registry — local authored + RSS feed items ─────────────────────
//
// Local posts live in src/content/blog/[slug].tsx and are fully rendered.
// RSS items link out to source. Both appear in the blog listing.
//
// To add a new authored post:
//   1. Create src/content/blog/[slug].tsx
//   2. Add an entry to LOCAL_POSTS below
//   3. Add the slug to BLOG_COMPONENT_MAP in src/pages/BlogPost.tsx

import { getAllRssItems, type RssItem } from "./rssStub";

export type BlogPost = {
  slug: string;
  title: string;
  date: string; // ISO 8601
  sourceLabel: string;
  sourceUrl: string;
  excerpt: string;
  tag: string;
  tagColour: string;
  readTime: string;
  isLocal: boolean; // true → /blog/[slug] renders full post; false → links to sourceUrl
};

export const LOCAL_POSTS: BlogPost[] = [
  {
    slug: "sccif-stability-2025",
    title: "SCCIF in 2025–26: What's Changed, What Hasn't, and What's Next",
    date: "2026-01-15",
    sourceLabel: "GOV.UK — Ofsted",
    sourceUrl:
      "https://www.gov.uk/government/publications/social-care-common-inspection-framework-sccif-childrens-homes",
    excerpt:
      "Despite sector-wide reform discussions, the core SCCIF Quality Standards have remained stable. Here's what registered managers need to know — and what the 2025 'Big Review' findings mean for children's home inspections going forward.",
    tag: "SCCIF Framework",
    tagColour: "bg-teal-50 text-teal-700",
    readTime: "5 min read",
    isLocal: true,
  },
  {
    slug: "supported-accomm-inspections",
    title: "Supported Accommodation Inspections: The 3-Outcome Framework Explained",
    date: "2026-01-28",
    sourceLabel: "Ofsted & Social Care Inspection Blog",
    sourceUrl: "https://socialcareinspection.blog.gov.uk",
    excerpt:
      "Ofsted's inspection regime for 16–17 year old supported accommodation uses three outcomes — Good, Requires Improvement, Inadequate. For children's home managers overseeing transitions, this framework is now essential knowledge.",
    tag: "Supported Accommodation",
    tagColour: "bg-blue-50 text-blue-700",
    readTime: "6 min read",
    isLocal: true,
  },
  {
    slug: "qs7-safeguarding",
    title: "QS7 Protection of Children: Evidence That Actually Satisfies Inspectors",
    date: "2026-02-10",
    sourceLabel: "Ofsted SCCIF",
    sourceUrl:
      "https://www.gov.uk/government/publications/social-care-common-inspection-framework-sccif-childrens-homes",
    excerpt:
      "QS7 is the limiting judgement. One Inadequate here overrides every other domain. This post breaks down the five evidence categories inspectors consistently probe — and the gaps that most commonly drag a home down.",
    tag: "QS7 — Protection",
    tagColour: "bg-red-50 text-red-700",
    readTime: "7 min read",
    isLocal: true,
  },
  {
    slug: "homes-regs-monitoring",
    title: "Regulation 44 Monitoring Visits: What Inspectors Expect in 2026",
    date: "2026-02-20",
    sourceLabel: "Delphi Care / CHR 2015",
    sourceUrl: "https://delphi.care/blog_articles",
    excerpt:
      "Regulation 44 independent person visits are a basic compliance requirement, yet inspectors regularly find reports that are superficial or poorly timed. Here is exactly what must be documented — and why frequency and follow-through matter.",
    tag: "Regulatory Monitoring",
    tagColour: "bg-amber-50 text-amber-700",
    readTime: "5 min read",
    isLocal: true,
  },
  {
    slug: "foster-reforms-2026",
    title: "Fostering Reforms 2026: What the Placement Shortage Means for Children's Homes",
    date: "2026-03-01",
    sourceLabel: "Social Care Skills / GOV.UK",
    sourceUrl: "https://www.socialcareskills.co.uk",
    excerpt:
      "The 2026 fostering sufficiency gap means more children with complex trauma histories are entering residential care. This post examines the inspection implications — particularly for QS1 (Quality and Purpose of Care), QS5 (Health), and QS7 (Protection).",
    tag: "Sector Context",
    tagColour: "bg-purple-50 text-purple-700",
    readTime: "6 min read",
    isLocal: true,
  },
  {
    slug: "unannounced-inspection-prep",
    title: "Unannounced Ofsted Inspection: A 7-Step Readiness Framework for Children's Homes",
    date: "2026-03-10",
    sourceLabel: "MockOfsted Editorial",
    sourceUrl: "https://www.gov.uk/government/publications/social-care-common-inspection-framework-sccif-childrens-homes",
    excerpt:
      "Every Ofsted inspection is unannounced. This framework covers the seven areas where readiness lapses most often occur — from QS7 evidence to Regulation 44 quality, staffing records, and the single most effective preparation tool most homes overlook.",
    tag: "Inspection Readiness",
    tagColour: "bg-emerald-50 text-emerald-700",
    readTime: "8 min read",
    isLocal: true,
  },
];

function rssItemToPost(item: RssItem): BlogPost {
  return {
    slug: item.slug,
    title: item.title,
    date: item.pubDate,
    sourceLabel: item.sourceLabel,
    sourceUrl: item.link,
    excerpt: item.excerpt,
    tag: item.tag,
    tagColour: "bg-slate-100 text-slate-600",
    readTime: "3 min read",
    isLocal: false,
  };
}

const LOCAL_SLUGS = new Set(LOCAL_POSTS.map((p) => p.slug));

/** All posts (local + RSS), newest first */
export function getAllPosts(): BlogPost[] {
  const rssPosts = getAllRssItems()
    .filter((item) => !LOCAL_SLUGS.has(item.slug))
    .map(rssItemToPost);

  return [...LOCAL_POSTS, ...rssPosts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return getAllPosts().find((p) => p.slug === slug);
}

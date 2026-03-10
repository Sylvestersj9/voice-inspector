// src/content/blog/sccif-stability-2025.tsx
// Source: GOV.UK / Ofsted — SCCIF Children's Homes guidance, 2025
import { Link } from "react-router-dom";

export const meta = {
  slug: "sccif-stability-2025",
  title: "SCCIF in 2025–26: What's Changed, What Hasn't, and What's Next",
  date: "2026-01-15",
  sourceLabel: "GOV.UK — Ofsted",
  sourceUrl:
    "https://www.gov.uk/government/publications/social-care-common-inspection-framework-sccif-childrens-homes",
  tag: "SCCIF Framework",
};

export default function Post() {
  return (
    <div>
      <p className="text-slate-600 leading-relaxed">
        The Social Care Common Inspection Framework (SCCIF) has been Ofsted's primary tool for
        inspecting children's homes since 2019. Despite significant sector pressure for reform —
        particularly following the 2023 "Big Review" triggered by concerns about inspection
        impact — the nine Quality Standards and four-point judgement scale for children's homes
        have remained substantively unchanged. Here is what registered managers need to understand
        heading into 2026.
      </p>

      <h2 className="mt-7 mb-3 font-display text-xl font-bold text-slate-900">
        What the 2023–24 reform process did and didn't change
      </h2>
      <p className="text-slate-600 leading-relaxed">
        Ofsted's "Big Review" led to the announcement of a new "report card" model for school
        inspections, replacing the single-word judgement in schools. This reform does not apply
        to children's homes. SCCIF continues to use Outstanding, Good, Requires Improvement, and
        Inadequate as its four inspection outcomes. The nine Quality Standards — QS1 through QS9 —
        remain legally grounded in the Children's Homes (England) Regulations 2015 (Schedule 1)
        and have not been substantively amended. Ofsted did publish updated guidance on how
        evidence is weighted, placing greater emphasis on inspectors hearing directly from children
        and staff rather than relying on documentary compliance alone.
      </p>

      <h2 className="mt-7 mb-3 font-display text-xl font-bold text-slate-900">
        What has shifted in practice
      </h2>
      <p className="text-slate-600 leading-relaxed">
        While the framework itself is stable, inspection practice has evolved. Inspectors are
        increasingly focused on whether registered managers can articulate their practice — not
        just produce policies. The ability to explain, in plain language, how the home uses
        evidence to improve outcomes for individual children has become a stronger differentiator
        between Good and Outstanding. Homes that treat QS compliance as a documentation exercise
        rather than a living practice are more likely to receive challenge under QS8 (Leadership
        and Management). Additionally, Ofsted has clarified that the grading methodology for
        follow-up inspections will consider the trajectory of improvement — not just the snapshot
        on the day — meaning managers at Requires Improvement homes face greater scrutiny of
        their self-evaluation and action planning.
      </p>

      <h2 className="mt-7 mb-3 font-display text-xl font-bold text-slate-900">
        What to expect in 2026
      </h2>
      <p className="text-slate-600 leading-relaxed">
        The government's review of the Children's Homes Regulations is ongoing, and further
        guidance on monitoring visits (Regulation 44) is expected. However, no change to the QS
        structure is anticipated before 2027 at the earliest. The practical implication for
        registered managers is that preparation should focus on depth, not breadth — being able
        to account in detail for QS7 (Protection of Children, the limiting judgement) and QS8
        (Leadership), while demonstrating that the remaining standards are embedded in daily
        practice rather than annual policy reviews.
      </p>

      <div className="mt-8 rounded-xl bg-teal-50 border border-teal-100 px-5 py-4">
        <p className="text-sm font-semibold text-teal-800">
          Ready to practise answering SCCIF questions under pressure?
        </p>
        <p className="mt-1 text-sm text-slate-600">
          MockOfsted simulates real inspection conversations across all 9 Quality Standards.
          3-day free trial — no card required.
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

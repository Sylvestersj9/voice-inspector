// src/content/blog/supported-accomm-inspections.tsx
// Sources: Ofsted.gov.uk, socialcareinspection.blog.gov.uk, SCCIF Supported Accommodation 2023
import { Link } from "react-router-dom";

export const meta = {
  slug: "supported-accomm-inspections",
  title: "Supported Accommodation Inspections: The 3-Outcome Framework Explained",
  date: "2026-01-28",
  sourceLabel: "Ofsted & Social Care Inspection Blog",
  sourceUrl: "https://socialcareinspection.blog.gov.uk",
  tag: "Supported Accommodation",
};

export default function Post() {
  return (
    <div>
      <p className="text-slate-600 leading-relaxed">
        In April 2023 Ofsted began inspecting supported accommodation providers — settings housing
        16 and 17 year olds who are looked-after or care leavers in semi-independent living
        arrangements. For registered managers of children's homes, this matters in two ways:
        some of your young people will transition to supported accommodation, and the inspection
        framework governing where they go is structurally different from the one you operate under.
      </p>

      <h2 className="mt-7 mb-3 font-display text-xl font-bold text-slate-900">
        Three outcomes, not four
      </h2>
      <p className="text-slate-600 leading-relaxed">
        The SCCIF for supported accommodation uses a three-outcome framework: Good, Requires
        Improvement, and Inadequate. There is no Outstanding grade. This reflects both the relative
        infancy of the regulated sector and the recognition that the evidence base for excellence
        in supported accommodation is still developing. Inspectors assess against the four
        Supported Accommodation Regulations 2023 standards — Quality of Care, Safeguarding,
        Leadership and Management, and Accommodation. The absence of an Outstanding grade means
        providers cannot rely on historical reputation; every inspection is a performance review
        against a baseline of Good.
      </p>

      <h2 className="mt-7 mb-3 font-display text-xl font-bold text-slate-900">
        Why children's home managers need to understand this
      </h2>
      <p className="text-slate-600 leading-relaxed">
        When a young person moves from your registered children's home to supported
        accommodation, your obligations under care planning (QS9) include ensuring that the
        receiving placement is appropriate and that the transition is managed. Inspectors have
        increasingly questioned registered managers about whether they have scrutinised the Ofsted
        registration status and most recent inspection outcome of supported accommodation
        placements before a young person moved. A home that routinely places young people into
        supported accommodation that subsequently receives Inadequate judgements may face questions
        under QS8 (Leadership and Management) about the quality of placement decision-making.
        Checking Ofsted's registration and inspection records for supported accommodation settings
        before approving a placement is now considered good practice.
      </p>

      <h2 className="mt-7 mb-3 font-display text-xl font-bold text-slate-900">
        Transition planning as QS9 evidence
      </h2>
      <p className="text-slate-600 leading-relaxed">
        The care plan requirement for transitions out of children's homes into supported
        accommodation should document: the reason the move is in the young person's best interests,
        their views on the placement (including any concerns), the support arrangements in place
        at the receiving setting, and what staying close or Staying Put options were considered.
        Inspectors at children's homes are asking about recent care leavers — not just current
        residents — so maintaining records of transition quality is important. A useful habit is
        a brief post-move review at 4 and 12 weeks that records the young person's views on their
        new setting and whether any concerns were escalated.
      </p>

      <div className="mt-8 rounded-xl bg-teal-50 border border-teal-100 px-5 py-4">
        <p className="text-sm font-semibold text-teal-800">
          QS9 Care Planning is covered in every MockOfsted session.
        </p>
        <p className="mt-1 text-sm text-slate-600">
          Practise explaining your transition planning approach under inspector-style questioning.
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

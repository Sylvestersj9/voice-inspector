// src/content/blog/foster-reforms-2026.tsx
// Sources: Social Care Skills, GOV.UK Fostering Sufficiency Strategy 2022+
import { Link } from "react-router-dom";

export const meta = {
  slug: "foster-reforms-2026",
  title: "Fostering Reforms 2026: What the Placement Shortage Means for Children's Homes",
  date: "2026-03-01",
  sourceLabel: "Social Care Skills / GOV.UK",
  sourceUrl: "https://www.socialcareskills.co.uk",
  tag: "Sector Context",
};

export default function Post() {
  return (
    <div>
      <p className="text-slate-600 leading-relaxed">
        The fostering sector in England has faced a persistent recruitment and retention crisis
        since at least 2018. The government's Fostering Sufficiency Strategy, published in 2022,
        acknowledged that England needs at least 9,000 new foster carers. While recruitment
        campaigns have had some impact, the structural gap — particularly for children with complex
        trauma histories, sibling groups, and teenagers — has not closed. The practical
        consequence for registered children's home managers is that their homes are increasingly
        receiving children for whom the foster care system had no suitable placement. This shift
        has direct implications for how inspectors assess care quality, safeguarding, and
        leadership.
      </p>

      <h2 className="mt-7 mb-3 font-display text-xl font-bold text-slate-900">
        QS1: Quality and Purpose of Care under pressure
      </h2>
      <p className="text-slate-600 leading-relaxed">
        Quality Standard 1 requires that care is provided in a way that is consistent with the
        home's statement of purpose and meets each child's assessed needs. As placement complexity
        increases — more children with diagnosed SEMH needs, histories of exploitation, or
        multi-agency involvement — inspectors are asking harder questions about whether the
        statement of purpose accurately reflects the children being admitted, and whether care
        plans are sufficiently individualised. A statement of purpose written for a home that
        traditionally cared for children with moderate needs may not adequately describe the
        interventions in place for a cohort with significantly higher complexity. Keeping the
        statement of purpose current with the actual population is a basic but often overlooked
        task.
      </p>

      <h2 className="mt-7 mb-3 font-display text-xl font-bold text-slate-900">
        QS5 and QS7: Health and safeguarding intensity
      </h2>
      <p className="text-slate-600 leading-relaxed">
        Children who have experienced placement breakdown — including failed foster placements —
        often arrive in children's homes with unmet health needs, disrupted education, and
        elevated exploitation risks. Inspectors are paying closer attention to whether health
        assessments are completed promptly on admission, whether dental and CAMHS referrals are
        followed up, and whether exploitation risk assessments are updated when a child's
        circumstances change. Under QS7 (the limiting judgement), homes receiving children with
        known CSE or CCE histories from foster placement breakdowns need to demonstrate that their
        safeguarding response has been recalibrated — not simply that previous risk assessments
        were transferred from the placing authority.
      </p>

      <h2 className="mt-7 mb-3 font-display text-xl font-bold text-slate-900">
        What inspectors are asking leaders
      </h2>
      <p className="text-slate-600 leading-relaxed">
        The placement sufficiency pressures have prompted inspectors to ask registered managers
        directly about how they handle requests for admissions that may be outside their home's
        usual operating parameters. Strong leaders can articulate how they assess whether a
        proposed placement is appropriate — including when they have declined a placement, and
        why. The ability to describe a recent placement decision in detail (the child's needs, the
        home's capacity, the admission decision and rationale) is increasingly seen as evidence of
        sound QS8 leadership. Managers who accept every referral without documented assessment
        face scrutiny about whether they are placing commercial interests above children's
        welfare.
      </p>

      <div className="mt-8 rounded-xl bg-teal-50 border border-teal-100 px-5 py-4">
        <p className="text-sm font-semibold text-teal-800">
          MockOfsted covers QS1, QS5, QS7, and QS8 in every session.
        </p>
        <p className="mt-1 text-sm text-slate-600">
          Practise explaining complex placement decisions and safeguarding escalation under
          realistic inspection questioning.
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

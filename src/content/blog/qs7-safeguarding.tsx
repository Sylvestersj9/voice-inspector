// src/content/blog/qs7-safeguarding.tsx
// Source: Ofsted SCCIF Children's Homes — QS7 Protection of Children
import { Link } from "react-router-dom";

export const meta = {
  slug: "qs7-safeguarding",
  title: "QS7 Protection of Children: Evidence That Actually Satisfies Inspectors",
  date: "2026-02-10",
  sourceLabel: "Ofsted SCCIF",
  sourceUrl:
    "https://www.gov.uk/government/publications/social-care-common-inspection-framework-sccif-childrens-homes",
  tag: "QS7 — Protection",
};

export default function Post() {
  return (
    <div>
      <p className="text-slate-600 leading-relaxed">
        Quality Standard 7 — Protection of Children — is the limiting judgement in children's
        home inspections. If an inspector judges your home Inadequate on QS7, the overall
        inspection outcome is Inadequate regardless of how well every other standard is met. This
        is not a technicality. It reflects the fundamental principle that a home where children
        are not protected cannot compensate with strong education support or positive relationships.
        Understanding what inspectors actually look for — and why certain responses satisfy them —
        is worth more than any policy document.
      </p>

      <h2 className="mt-7 mb-3 font-display text-xl font-bold text-slate-900">
        The five evidence categories inspectors probe
      </h2>

      <div className="space-y-4 mt-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="font-semibold text-slate-800">1. Safeguarding training and competency</p>
          <p className="mt-1 text-sm text-slate-600 leading-relaxed">
            Inspectors check that all staff hold appropriate safeguarding training — typically
            level 2 as a minimum, with the Designated Safeguarding Lead (usually the registered
            manager) holding level 3. Critically, they test whether staff can explain the
            safeguarding process without prompting. A staff member who cannot articulate what
            they would do if they suspected abuse is evidence of training that hasn't translated
            into practice, regardless of what the training record says.
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="font-semibold text-slate-800">2. Missing from home (MFH) protocols</p>
          <p className="mt-1 text-sm text-slate-600 leading-relaxed">
            Return-to-home (RTH) interviews must be completed within 72 hours of a young person
            returning after a missing episode. Inspectors check this consistently and check
            quality: interviews conducted by the reporting officer are flagged as poor practice.
            The interview must be conducted by someone independent of the missing episode, and
            the record must show the young person's view of why they went missing and any
            concerns raised. Outstanding homes use RTH interviews to update risk assessments.
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="font-semibold text-slate-800">3. Child sexual exploitation and criminal exploitation</p>
          <p className="mt-1 text-sm text-slate-600 leading-relaxed">
            Every young person in your home should have a current CSE and CCE risk assessment that
            is reviewed after any concern or missing episode. Inspectors ask managers to walk them
            through a recent case. If the risk assessment was last updated six months ago and the
            young person has had three missing episodes since, that is a direct QS7 concern. The
            assessment should be a live working document, not a completed form.
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="font-semibold text-slate-800">4. Referrals and information sharing</p>
          <p className="mt-1 text-sm text-slate-600 leading-relaxed">
            Records of all safeguarding concerns, referrals to children's services, and LADO
            contacts must be retrievable. Inspectors are not just checking that referrals were
            made — they want to see that the home followed up, and that the response from external
            agencies was appropriately challenged where necessary. A home that made a referral,
            received no response, and closed the concern without escalation will receive adverse
            comment under QS7.
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="font-semibold text-slate-800">5. Allegations management</p>
          <p className="mt-1 text-sm text-slate-600 leading-relaxed">
            Allegations against staff must be referred to the LADO. Records of how allegations
            were managed, including any outcomes and whether staff returned to work, are reviewed.
            Inspectors are alert to any indication that allegations were minimised or managed
            internally rather than referred appropriately.
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-xl bg-red-50 border border-red-100 px-5 py-4">
        <p className="text-sm font-semibold text-red-800">
          QS7 is covered in every MockOfsted session — it is always a mandatory domain.
        </p>
        <p className="mt-1 text-sm text-slate-600">
          Practise articulating your safeguarding evidence under the kind of follow-up questioning
          inspectors actually use.
        </p>
        <Link
          to="/app"
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
        >
          Practice QS7 → start session
        </Link>
      </div>
    </div>
  );
}

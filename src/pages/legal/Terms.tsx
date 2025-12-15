import MarketingLayout from "../marketing/MarketingLayout";

export default function Terms() {
  return (
    <MarketingLayout>
      <main className="px-4 py-14">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="text-center">
            <div className="inline-flex items-center rounded-full bg-teal-50 px-4 py-1.5 text-sm font-medium text-teal-800 ring-1 ring-teal-100">
              Terms of Use & Conditions
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold text-slate-900 md:text-4xl">
              Terms of Use & Conditions
            </h1>
            <p className="mt-3 text-slate-600">
              Comprehensive terms for using Voice Inspector. Please read carefully before using the service.
            </p>
          </div>

          <div className="rounded-[28px] border bg-white p-6 shadow-sm ring-2 ring-teal-200">
            <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-6">
              <div className="text-xs text-slate-500">
                Last updated: 15 December 2025. If you do not agree, do not use the service.
              </div>
              <Section title="1. Introduction">
                <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                  <li>These Terms of Use form a binding agreement between you and Ziantra Ltd (“we”, “us”, “our”).</li>
                  <li>By accessing or using Voice Inspector, you confirm you accept these terms. If you do not agree, do not use the service.</li>
                  <li>Definitions: “Service” means the Voice Inspector SaaS platform; “Content” means prompts, outputs, and materials made available by the Service; “You” or “User” means the organisation or individual using the Service.</li>
                </ul>
              </Section>

              <Section title="2. Description of the Service">
                <p className="text-sm text-slate-700">
                  Voice Inspector is an AI-assisted practice, simulation, and evaluation platform for Ofsted-style inspection questions. It is provided solely for training, preparation, and support. It does not replace professional advice or regulatory processes.
                </p>
              </Section>

              <Section title="3. No Professional Advice">
                <p className="text-sm text-slate-700">
                  The Service does not provide legal, regulatory, safeguarding, compliance, or professional advice. You must seek independent professional judgement for any decisions affecting children, staff, or regulatory compliance.
                </p>
              </Section>

              <Section title="4. No Guarantee of Outcomes">
                <p className="text-sm text-slate-700">
                  We do not guarantee Ofsted ratings, judgements, compliance results, or inspection outcomes. Ofsted inspections rely on human judgement, context, and evidence outside the Service.
                </p>
              </Section>

              <Section title="5. Human-in-the-Loop Requirement">
                <p className="text-sm text-slate-700">
                  All AI outputs must be reviewed, validated, and contextualised by qualified humans. You must apply your own professional judgement at all times.
                </p>
              </Section>

              <Section title="6. User Accounts & Responsibilities">
                <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                  <li>Provide accurate information and keep account credentials secure.</li>
                  <li>You are responsible for all activity under your account.</li>
                  <li>Do not share credentials or allow unauthorised access.</li>
                </ul>
              </Section>

              <Section title="7. Subscriptions & Payments">
                <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                  <li>Paid plans, when available, use recurring billing via Stripe.</li>
                  <li>Prices and features may change; no pricing guarantees.</li>
                  <li>No refunds unless required by law. Taxes and fees may apply.</li>
                </ul>
              </Section>

              <Section title="8. Acceptable Use">
                <p className="text-sm text-slate-700">
                  You must comply with our Acceptable Use Policy. Do not use the Service unlawfully, to share identifiable child data, to reverse engineer, to abuse AI systems, or to build competing services.
                </p>
              </Section>

              <Section title="9. Intellectual Property">
                <p className="text-sm text-slate-700">
                  The Service, content, and technology are owned by Ziantra Ltd or its licensors. You receive a limited, revocable, non-transferable licence to use the Service. No ownership is transferred.
                </p>
              </Section>

              <Section title="10. Data & AI Outputs">
                <p className="text-sm text-slate-700">
                  AI-generated outputs may be inaccurate, incomplete, or inappropriate. You are responsible for verifying outputs and ensuring they are suitable for your use.
                </p>
              </Section>

              <Section title="11. Availability & Changes">
                <p className="text-sm text-slate-700">
                  The Service is provided “as is” and “as available”. We do not guarantee uptime. Features may change, be suspended, or removed at any time.
                </p>
              </Section>

              <Section title="12. Suspension & Termination">
                <p className="text-sm text-slate-700">
                  We may suspend or terminate access for breach of these terms, misuse, or non-payment. You may stop using the Service at any time. Provisions on liability, intellectual property, and indemnity survive termination.
                </p>
              </Section>

              <Section title="13. Limitation of Liability">
                <p className="text-sm text-slate-700">
                  To the fullest extent permitted by law, we are not liable for indirect, consequential, special, or punitive damages; loss of revenue, data, or business; or any inspection outcomes, Ofsted ratings, enforcement action, or reputational damage. The Service is an assistance tool only.
                </p>
              </Section>

              <Section title="14. Indemnity">
                <p className="text-sm text-slate-700">
                  You agree to indemnify and hold harmless Ziantra Ltd from claims, losses, and costs arising from your misuse of the Service, breach of these terms, or violation of law.
                </p>
              </Section>

              <Section title="15. Governing Law">
                <p className="text-sm text-slate-700">These terms are governed by the laws of England and Wales. Courts of England and Wales have exclusive jurisdiction.</p>
              </Section>

              <Section title="16. Contact Information">
                <p className="text-sm text-slate-700">
                  For questions about these terms, contact reports@ziantra.co.uk or use the contact page.
                </p>
              </Section>
            </div>
          </div>
        </div>
      </main>
    </MarketingLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

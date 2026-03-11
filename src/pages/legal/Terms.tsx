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
              Comprehensive terms for using MockOfsted. Please read carefully before using the service.
            </p>
          </div>

          <div className="rounded-[28px] border bg-white p-6 shadow-sm ring-2 ring-teal-200">
            <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-6">
              <div className="text-xs text-slate-500">
                Last updated: 11 March 2026. If you do not agree, do not use the service.
              </div>
              <Section title="1. Introduction">
                <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                  <li>These Terms of Use form a binding agreement between you and MockOfsted (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;).</li>
                  <li>By accessing or using MockOfsted, you confirm you accept these terms. If you do not agree, do not use the service.</li>
                  <li>Definitions: &quot;Service&quot; means the MockOfsted SaaS platform; &quot;Content&quot; means prompts, outputs, and materials made available by the Service; &quot;You&quot; or &quot;User&quot; means the organisation or individual using the Service.</li>
                </ul>
              </Section>

              <Section title="2. Description of the Service">
                <p className="text-sm text-slate-700">
                  MockOfsted is an AI-assisted practice, simulation, and evaluation platform for Ofsted-style inspection questions. It is provided solely for training, preparation, and support. It does not replace professional advice or regulatory processes.
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
                  The Service, content, and technology are owned by MockOfsted or its licensors. You receive a limited, revocable, non-transferable license to use the Service. No ownership is transferred.
                </p>
              </Section>

              <Section title="10. Data & AI Outputs">
                <p className="text-sm text-slate-700">
                  AI-generated outputs may be inaccurate, incomplete, or inappropriate. You are responsible for verifying outputs and ensuring they are suitable for your use.
                </p>
              </Section>

              <Section title="11. Availability & Changes">
                <p className="text-sm text-slate-700">
                  The Service is provided "as is" and "as available". We do not guarantee uptime. Features may change, be suspended, or removed at any time.
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
                  You agree to indemnify and hold harmless MockOfsted from claims, losses, and costs arising from your misuse of the Service, breach of these terms, or violation of law.
                </p>
              </Section>

              <Section title="15. Governing Law">
                <p className="text-sm text-slate-700">These terms are governed by the laws of England and Wales. Courts of England and Wales have exclusive jurisdiction.</p>
              </Section>

              <Section title="16. Third-Party Services & Links">
                <p className="text-sm text-slate-700 mb-3">
                  MockOfsted integrates with or links to third-party services including:
                </p>
                <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                  <li>Supabase (authentication & storage)</li>
                  <li>Google OAuth (authentication)</li>
                  <li>Stripe (payment processing)</li>
                  <li>Anthropic Claude (AI feedback generation)</li>
                  <li>Deepgram (speech-to-text transcription)</li>
                  <li>Resend (email delivery)</li>
                </ul>
                <p className="text-sm text-slate-700 mt-3">
                  These third parties operate under their own terms of service and privacy policies. We are not responsible for their content, availability, or conduct. Your use of third-party services is at your own risk and subject to their terms. We recommend reviewing their policies before use.
                </p>
              </Section>

              <Section title="17. Limitation of Liability - CRITICAL">
                <p className="text-sm text-slate-700 mb-3">
                  <strong>TO THE FULLEST EXTENT PERMITTED BY LAW:</strong>
                </p>
                <p className="text-sm text-slate-700 mb-3">
                  MOCKOFSTED AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR:
                </p>
                <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                  <li><strong>Indirect, incidental, special, consequential, or punitive damages</strong> including loss of revenue, profit, data, business opportunity, or goodwill</li>
                  <li><strong>Direct damages</strong> exceeding the amount you paid for the Service in the past 12 months</li>
                  <li><strong>Inspection outcomes:</strong> Ofsted ratings, judgements, grades, or results of any kind</li>
                  <li><strong>Regulatory action:</strong> Enforcement notices, suspension orders, or formal action by regulators</li>
                  <li><strong>Business loss:</strong> Loss of income, closure of business, loss of customers or reputation</li>
                  <li><strong>Employment loss:</strong> Job loss, termination, or loss of professional standing of staff</li>
                  <li><strong>AI errors:</strong> Inaccurate feedback, incorrect scores, or harmful AI outputs</li>
                  <li><strong>Service unavailability:</strong> Downtime, interruption, or suspension of the Service</li>
                  <li><strong>Data loss:</strong> Unauthorized access, deletion, or corruption of data</li>
                  <li><strong>Third-party conduct:</strong> Actions or content of third-party processors or service providers</li>
                  <li><strong>Impact on children:</strong> Consequences to children or families arising from inspection outcomes</li>
                </ul>
                <p className="text-sm text-slate-700 mt-3">
                  This limitation applies even if we have been advised of the possibility of such damages.
                </p>
              </Section>

              <Section title="18. Indemnification">
                <p className="text-sm text-slate-700">
                  You agree to indemnify, defend, and hold harmless MockOfsted, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from or related to:
                </p>
                <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                  <li>Your breach of these Terms or any applicable law</li>
                  <li>Your misuse of the Service or content</li>
                  <li>Your violation of another person's rights</li>
                  <li>Data or content you submit to the Service</li>
                  <li>Your use of third-party services or content</li>
                  <li>Claims related to inspection outcomes or regulatory action arising from your use of the Service</li>
                  <li>Safeguarding decisions made based on MockOfsted outputs</li>
                </ul>
              </Section>

              <Section title="19. Dispute Resolution & Arbitration">
                <p className="text-sm text-slate-700 mb-2">
                  <strong>Informal Resolution:</strong> Before pursuing formal legal action, you agree to attempt informal resolution by contacting info@mockofsted.co.uk within 30 days of the dispute. We will attempt to resolve the matter within 60 days.
                </p>
                <p className="text-sm text-slate-700 mb-2">
                  <strong>Jurisdiction & Governing Law:</strong> These terms are governed by and construed in accordance with the laws of England and Wales, without regard to its conflict of law principles.
                </p>
                <p className="text-sm text-slate-700">
                  <strong>Exclusive Jurisdiction:</strong> You irrevocably submit to the exclusive jurisdiction of the courts of England and Wales for any legal proceedings arising from these terms or your use of the Service.
                </p>
              </Section>

              <Section title="20. Waiver & Severability">
                <p className="text-sm text-slate-700 mb-2">
                  Our failure to enforce any provision of these terms does not constitute a waiver of that provision or any other provision.
                </p>
                <p className="text-sm text-slate-700">
                  If any provision of these terms is held invalid or unenforceable, the remaining provisions continue in full force. The invalid provision is severed and construed to the maximum extent legally possible.
                </p>
              </Section>

              <Section title="21. Assignment">
                <p className="text-sm text-slate-700">
                  You may not assign these terms or your rights/obligations under them without our written consent. We may assign these terms to affiliates, successors, or acquirers without restriction. Any attempted assignment by you without consent is void.
                </p>
              </Section>

              <Section title="22. Entire Agreement">
                <p className="text-sm text-slate-700">
                  These Terms, along with our Privacy Policy, Disclaimer, Acceptable Use Policy, and any other policies referenced, constitute the entire agreement between you and MockOfsted regarding the Service. They supersede all prior agreements, understandings, and representations. No prior conversations, representations, or agreements modify these terms.
                </p>
              </Section>

              <Section title="23. Service Modifications & Discontinuation">
                <p className="text-sm text-slate-700 mb-2">
                  We reserve the right to:
                </p>
                <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                  <li>Modify, add, remove, or suspend features or functionality at any time without notice</li>
                  <li>Change pricing or subscription terms with 30 days' notice</li>
                  <li>Discontinue the Service or any part of it with 30 days' notice (90 days if discontinuing entire Service)</li>
                  <li>Implement rate limits, usage caps, or other restrictions</li>
                </ul>
                <p className="text-sm text-slate-700 mt-3">
                  We will not be liable for any loss, damage, or inconvenience caused by modifications or discontinuation.
                </p>
              </Section>

              <Section title="24. Government & Regulatory Compliance">
                <p className="text-sm text-slate-700">
                  Your use of MockOfsted must comply with all applicable laws, regulations, and statutory duties, including but not limited to UK GDPR, Data Protection Act 2018, Childcare Act 2006, Children Act 1989 and 2004, Care Act 2014, Ofsted regulations, and all equalities legislation. MockOfsted does not provide legal or regulatory advice.
                </p>
              </Section>

              <Section title="25. No Employment or Partnership">
                <p className="text-sm text-slate-700">
                  These terms do not create an employment relationship, partnership, joint venture, or agency between you and MockOfsted. You are an independent user of the Service.
                </p>
              </Section>

              <Section title="26. Acknowledgement & Acceptance">
                <p className="font-semibold text-slate-900 text-sm">
                  BY ACCESSING OR USING MOCKOFSTED, YOU ACKNOWLEDGE THAT YOU HAVE READ THESE TERMS IN FULL, UNDERSTAND ALL LIMITATIONS AND DISCLAIMERS, ACCEPT ALL ASSOCIATED RISKS, AND AGREE TO BE BOUND BY THESE TERMS. IF YOU DO NOT AGREE WITH ANY PART OF THESE TERMS, DO NOT USE THE SERVICE.
                </p>
              </Section>

              <Section title="Contact & Legal Inquiries">
                <p className="text-sm text-slate-700">
                  <strong>For legal or contractual matters:</strong> Contact info@mockofsted.co.uk or use the contact form at /contact. For formal legal notices, you may send correspondence to the registered office address on file.
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

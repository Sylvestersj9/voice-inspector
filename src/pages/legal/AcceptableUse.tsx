import MarketingLayout from "../marketing/MarketingLayout";

export default function AcceptableUse() {
  return (
    <MarketingLayout>
      <main className="px-4 py-14">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="text-center">
            <div className="inline-flex items-center rounded-full bg-teal-50 px-4 py-1.5 text-sm font-medium text-teal-800 ring-1 ring-teal-100">
              Acceptable Use Policy
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold text-slate-900 md:text-4xl">Acceptable Use Policy</h1>
            <p className="mt-3 text-slate-600">Standards for safe, lawful, and fair use of MockOfsted.</p>
          </div>

          <div className="rounded-[28px] border bg-white p-6 shadow-sm ring-2 ring-teal-200">
            <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-6 text-sm text-slate-700">
              <div className="text-xs text-slate-500">
                Last updated: 11 March 2026. If you do not agree, do not use the service.
              </div>
              <Section title="1. Permitted Uses">
                <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                  <li>Use the Service for lawful training, simulation, practice, and preparation for Ofsted inspection conversations.</li>
                  <li>Use the Service to prepare and build confidence as a childcare professional.</li>
                  <li>Maintain strict anonymisation and avoid identifiable details about children, families, staff members, or specific locations.</li>
                  <li>Follow all applicable laws, safeguarding rules, regulations, and your organisational policies.</li>
                  <li>Share findings, insights, or feedback internally within your organisation for professional development purposes.</li>
                  <li>Use the tools and features as designed and documented.</li>
                </ul>
              </Section>

              <Section title="2. Prohibited Uses - Unlawful Activity">
                <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                  <li>Any unlawful, illegal, or criminal activity</li>
                  <li>Harassment, discrimination, abuse, bullying, or defamation of any individual or group</li>
                  <li>Threats, violence, or intimidation</li>
                  <li>Obscene, pornographic, or sexually explicit content</li>
                  <li>Activities that violate local, national, or international laws</li>
                </ul>
              </Section>

              <Section title="3. Prohibited Uses - Safeguarding & Data Protection">
                <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                  <li><strong>Identifiable child data:</strong> Do not submit names, ages, photos, or identifiable information about children</li>
                  <li><strong>Confidential case details:</strong> Do not share safeguarding concerns, incident records, or confidential case information</li>
                  <li><strong>Family information:</strong> Do not disclose family names, addresses, social media, or personal circumstances</li>
                  <li><strong>Staff data:</strong> Do not share staff names, performance reviews, disciplinary matters, or personal details</li>
                  <li><strong>Protected information:</strong> Do not share medical records, behavioral data, or any legally protected information</li>
                  <li><strong>Breach of confidentiality:</strong> Do not use the Service in ways that breach privacy obligations or professional confidentiality duties</li>
                  <li><strong>Unauthorised data processing:</strong> Do not upload data without appropriate authority or necessary consents</li>
                </ul>
              </Section>

              <Section title="4. Prohibited Uses - AI System Misuse">
                <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                  <li>Attempting to manipulate, trick, or poison the AI system (prompt injection, jailbreaking)</li>
                  <li>Attempting to extract, reverse engineer, or steal AI models, training data, or system prompts</li>
                  <li>Using the Service to build, train, or develop competing AI systems or models</li>
                  <li>Attempting to generate outputs specifically to use them to train other AI systems</li>
                  <li>Attempting to bypass security, rate limits, authentication, or other technical controls</li>
                  <li>Automated scraping, bulk downloading, or mass extraction of content or outputs</li>
                </ul>
              </Section>

              <Section title="5. Prohibited Uses - Platform Misuse">
                <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                  <li>Unauthorized account access; sharing credentials; allowing others to use your account</li>
                  <li>Creating multiple accounts to circumvent limits, trial restrictions, or payment obligations</li>
                  <li>Reselling, redistributing, or commercially exploiting access to the Service</li>
                  <li>Impersonating other users, staff, or Ofsted inspectors</li>
                  <li>Submitting false, misleading, or fraudulent information on account signup or profile</li>
                  <li>Interfering with or disrupting the Service, infrastructure, or other users&apos; access</li>
                  <li>Attempting to exploit security vulnerabilities or access restricted areas</li>
                  <li>Using automation, bots, or scripts to access the Service without authorization</li>
                </ul>
              </Section>

              <Section title="6. Prohibited Uses - Content & Harmful Material">
                <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                  <li>Uploading malware, viruses, or any code designed to harm systems or users</li>
                  <li>Submitting content that promotes illegal activity, violence, or discrimination</li>
                  <li>Hate speech, slurs, or dehumanising language targeting protected groups</li>
                  <li>Misinformation, disinformation, or deliberately false regulatory information</li>
                  <li>Content violating intellectual property, copyright, or trademark rights</li>
                  <li>Spam, phishing, or social engineering attempts</li>
                </ul>
              </Section>

              <Section title="7. Prohibited Uses - Commercial Misuse">
                <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                  <li>Reselling or commercial redistribution of MockOfsted or its outputs</li>
                  <li>Using MockOfsted outputs to create competing commercial products or services</li>
                  <li>Using MockOfsted to provide professional consultation or services to third parties</li>
                  <li>Licensure violations: attempting to claim MockOfsted as evidence of professional certification or qualification</li>
                </ul>
              </Section>

              <Section title="8. Fair Usage">
                <p className="text-sm text-slate-700 mb-3">
                  To ensure fair access for all users:
                </p>
                <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                  <li>Do not make excessive automated requests or API calls that could degrade service quality</li>
                  <li>Do not overload the Service with unreasonable volumes of traffic or requests</li>
                  <li>Do not continuously spam or repeatedly submit identical or similar requests</li>
                  <li>Use reasonable judgment regarding frequency and volume of usage</li>
                </ul>
                <p className="text-sm text-slate-700 mt-3">
                  We reserve the right to throttle, rate-limit, or restrict usage that violates fair use principles. Rate limits are applied per IP and per account.
                </p>
              </Section>

              <Section title="9. Reporting Requirements">
                <p className="text-sm text-slate-700">
                  If you become aware of a breach of this policy, security vulnerability, or misuse of the Service, you must report it promptly to info@mockofsted.co.uk. Provide:
                </p>
                <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                  <li>Detailed description of the issue or violation</li>
                  <li>Evidence or examples (screenshots, account details, timing)</li>
                  <li>Your contact information</li>
                  <li>Any other context that would help investigation</li>
                </ul>
              </Section>

              <Section title="10. Monitoring & Enforcement">
                <p className="text-sm text-slate-700 mb-3">
                  MockOfsted reserves the right to:
                </p>
                <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                  <li>Monitor account activity for policy violations</li>
                  <li>Review usage patterns, submitted content, and API calls for compliance</li>
                  <li>Investigate suspected violations or misuse</li>
                  <li>Preserve evidence related to violations</li>
                  <li>Cooperate with law enforcement when legally required</li>
                </ul>
              </Section>

              <Section title="11. Suspension & Termination">
                <p className="text-sm text-slate-700 mb-3">
                  For violations of this Acceptable Use Policy, we may:
                </p>
                <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                  <li><strong>Warn you</strong> of the violation and request compliance</li>
                  <li><strong>Restrict access</strong> to certain features or rate-limit your requests</li>
                  <li><strong>Suspend your account</strong> temporarily or indefinitely</li>
                  <li><strong>Terminate your account</strong> and delete associated data</li>
                  <li><strong>Report to authorities</strong> if illegal activity is suspected</li>
                  <li><strong>Pursue legal action</strong> to recover losses or enforce our rights</li>
                </ul>
                <p className="text-sm text-slate-700 mt-3">
                  Account termination may result in loss of all session data, reports, and user content. Repeated or severe violations may result in permanent bans.
                </p>
              </Section>

              <Section title="12. No Compensation for Enforcement">
                <p className="text-sm text-slate-700">
                  You acknowledge that enforcement actions (including suspension or termination) may occur without advance notice for serious violations, and that you will not be compensated for loss of service access, data, or trial days due to enforcement actions.
                </p>
              </Section>

              <Section title="13. Policy Changes">
                <p className="text-sm text-slate-700">
                  We may update this Acceptable Use Policy at any time. Material changes will be communicated via email or in-app notification. Continued use of the Service after changes indicates your acceptance of the updated policy.
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
      <div className="text-sm text-slate-700">{children}</div>
    </section>
  );
}

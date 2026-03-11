import MarketingLayout from "../marketing/MarketingLayout";
import { LegalSection } from "@/components/legal/LegalSection";
import { LEGAL_PAGES_UPDATED, CONTACT_EMAIL, LEGAL_PAGES_FOOTER } from "@/lib/legal";

export default function Privacy() {
  return (
    <MarketingLayout>
      <main className="px-4 py-14">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="text-center">
            <div className="inline-flex items-center rounded-full bg-teal-50 px-4 py-1.5 text-sm font-medium text-teal-800 ring-1 ring-teal-100">
              Privacy Policy
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold text-slate-900 md:text-4xl">Privacy Policy</h1>
            <p className="mt-3 text-slate-600">How we collect, use, and protect your data when using MockOfsted.</p>
          </div>

          <div className="rounded-[28px] border bg-white p-6 shadow-sm ring-2 ring-teal-200">
            <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-6">
              <div className="text-xs text-slate-500">
                Last updated: {LEGAL_PAGES_UPDATED}. UK GDPR and Data Protection Act 2018 compliant. {LEGAL_PAGES_FOOTER}
              </div>
              <LegalSection title="1. Introduction & Scope">
                <p className="text-sm text-slate-700">
                  This Privacy Policy explains how MockOfsted (&quot;we&quot;, &quot;us&quot;) processes personal data when you use MockOfsted. It applies to all users of the Service.
                </p>
              </LegalSection>

              <LegalSection title="2. Data We Collect">
                <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                  <li>Account data: name, email address, organisation, and profile details you provide.</li>
                  <li>Usage data: interactions within the product, device/browser information, timestamps, and feature usage to improve the Service.</li>
                  <li>Communications: messages you send us (support, feedback, waitlist/contact forms).</li>
                </ul>
              </LegalSection>

              <LegalSection title="3. Authentication Providers">
                <p className="text-sm text-slate-700">
                  Authentication is handled through Supabase and may include Google OAuth. These providers receive the information necessary to authenticate you (e.g., email, identity token).
                </p>
              </LegalSection>

              <LegalSection title="4. AI Processing">
                <p className="text-sm text-slate-700">
                  Responses and transcripts may be processed by trusted third-party AI providers to generate feedback. We use data minimisation where possible and advise you to avoid including identifiable details.
                </p>
              </LegalSection>

              <LegalSection title="5. How We Use Data">
                <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                  <li>To provide, operate, and secure the Service.</li>
                  <li>To improve features, quality, and reliability.</li>
                  <li>To communicate with you (support, updates, feedback responses).</li>
                  <li>To comply with legal obligations.</li>
                </ul>
              </LegalSection>

              <LegalSection title="6. Legal Basis (UK GDPR)">
                <p className="text-sm text-slate-700">
                  We process personal data under UK GDPR on the basis of contract (to provide the Service), legitimate interests (service improvement, security), and consent where required (e.g., certain communications).
                </p>
              </LegalSection>

              <LegalSection title="7. Data Storage & Security">
                <p className="text-sm text-slate-700">
                  Data is stored with Supabase and related cloud infrastructure. We use reasonable technical and organisational measures to protect data, but no system is entirely secure.
                </p>
              </LegalSection>

              <LegalSection title="8. Cookies & Analytics">
                <p className="text-sm text-slate-700">
                  We use essential cookies and local storage for authentication and session continuity. Analytics are collected via PostHog, hosted on US servers (us.i.posthog.com), and are consent-gated — no analytics data is captured until you accept the cookie banner. You can opt out at any time via the banner.
                </p>
              </LegalSection>

              <LegalSection title="9. Data Retention">
                <p className="text-sm text-slate-700">
                  We retain data only as long as necessary for the purposes described or as required by law. Account and session data is deleted within 30 days of subscription cancellation. You may request earlier deletion via /profile or by emailing {CONTACT_EMAIL}.
                </p>
              </LegalSection>

              <LegalSection title="10. User Rights (UK GDPR)">
                <p className="text-sm text-slate-700">
                  You may request access, rectification, erasure, restriction, data portability, or object to processing where applicable. To exercise rights, contact us using the details below.
                </p>
              </LegalSection>

              <LegalSection title="11. International Transfers">
                <p className="text-sm text-slate-700">
                  Where data is transferred outside the UK/EEA, we rely on appropriate safeguards (such as standard contractual clauses) or equivalent lawful mechanisms.
                </p>
              </LegalSection>

              <LegalSection title="12. Changes to this Policy">
                <p className="text-sm text-slate-700">
                  We may update this policy. Material changes will be signposted within the Service. Continued use after changes means you accept the updated policy.
                </p>
              </LegalSection>

              <LegalSection title="13. Data Processors & Third Parties">
                <p className="text-sm text-slate-700 mb-3">
                  We use the following third-party processors to deliver the Service:
                </p>
                <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                  <li><strong>Supabase (Authentication & Storage)</strong> — stores account data, session data, and responses under Data Processing Agreement</li>
                  <li><strong>Anthropic Claude API</strong> — processes your responses and transcripts to generate feedback; data is not retained for model training</li>
                  <li><strong>Deepgram (Speech-to-Text)</strong> — transcribes voice recordings; audio is deleted after processing</li>
                  <li><strong>Google OAuth</strong> — facilitates third-party authentication via your Google account</li>
                  <li><strong>Stripe</strong> — processes payment information under Payment Card Industry (PCI) compliance</li>
                  <li><strong>Resend (Email Delivery)</strong> — sends transactional emails (welcome, notifications, confirmations)</li>
                  <li><strong>PostHog Analytics</strong> — collects anonymised usage analytics (US-hosted, consent-gated)</li>
                  <li><strong>Sentry (Error Tracking)</strong> — monitors platform errors and performance issues</li>
                </ul>
                <p className="text-sm text-slate-700 mt-3">
                  All processors maintain appropriate safeguards under UK GDPR. You can request details of our Data Processing Agreements.
                </p>
              </LegalSection>

              <LegalSection title="14. Data Retention Schedules">
                <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                  <li><strong>Account Data:</strong> Retained for duration of service; deleted within 30 days of account termination</li>
                  <li><strong>Session & Response Data:</strong> Retained for 12 months from creation for compliance and audit purposes; deleted on request</li>
                  <li><strong>Voice Recordings:</strong> Transcribed by Deepgram and deleted immediately; transcripts retained per session retention policy</li>
                  <li><strong>Contact Form Submissions:</strong> Retained for 12 months; deleted on request</li>
                  <li><strong>Analytics Data:</strong> PostHog retention policy applies (30 days default, configurable)</li>
                  <li><strong>Payment & Billing Data:</strong> Retained for 6 years per UK tax and accounting regulations</li>
                  <li><strong>Access Logs & Error Logs:</strong> Retained for 90 days for security and debugging purposes</li>
                </ul>
              </LegalSection>

              <LegalSection title="15. Automated Decision-Making & Profiling">
                <p className="text-sm text-slate-700">
                  We do not use fully automated decision-making for consequential decisions about you (e.g., account suspension). Trial eligibility checks and scoring are algorithmic but not profiling. You have the right to request human review of any automated decision.
                </p>
              </LegalSection>

              <LegalSection title="16. Data Subject Rights Requests">
                <p className="text-sm text-slate-700 mb-3">
                  Under UK GDPR, you have the right to:
                </p>
                <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                  <li><strong>Access (SAR):</strong> Obtain a copy of your personal data in a portable format</li>
                  <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
                  <li><strong>Erasure (Right to be Forgotten):</strong> Delete data where no legal basis remains (subject to exceptions)</li>
                  <li><strong>Restrict Processing:</strong> Suspend processing of your data while you dispute it</li>
                  <li><strong>Data Portability:</strong> Receive your data in a structured, machine-readable format</li>
                  <li><strong>Object to Processing:</strong> Opt-out of legitimate interest processing (where an alternative exists)</li>
                  <li><strong>Withdraw Consent:</strong> Revoke consent-based processing at any time</li>
                </ul>
                <p className="text-sm text-slate-700 mt-3">
                  Submit requests via /contact or {CONTACT_EMAIL}. We aim to respond within 30 calendar days. Requests may require proof of identity. Some rights are subject to legal exceptions (e.g., contractual retention, legal obligation).
                </p>
              </LegalSection>

              <LegalSection title="17. Children's Data">
                <p className="text-sm text-slate-700">
                  MockOfsted is intended for adults (18+) managing childcare settings. We do not knowingly collect data from children. If a child's identifiable information is submitted within responses, you are responsible for obtaining appropriate parental/guardian consent and for anonymisation. We recommend avoiding submission of any personal data relating to identified children.
                </p>
              </LegalSection>

              <LegalSection title="18. Breach Notification">
                <p className="text-sm text-slate-700">
                  If we discover a data breach affecting your personal data, we will notify you without undue delay (and, where legally required, within 72 hours of discovery) via email or in-app notification. Notifications will include information on the breach, likely impact, and steps to mitigate risk.
                </p>
              </LegalSection>

              <LegalSection title="19. Data Protection Officer & Complaints">
                <p className="text-sm text-slate-700 mb-2">
                  <strong>Questions & Complaints:</strong> Email {CONTACT_EMAIL} with &quot;Privacy Request&quot; in the subject line.
                </p>
                <p className="text-sm text-slate-700">
                  <strong>ICO Complaint:</strong> If dissatisfied with our response, you can lodge a complaint with the Information Commissioner's Office (ICO) at www.ico.org.uk.
                </p>
              </LegalSection>

              <LegalSection title="20. Contact Details">
                <p className="text-sm text-slate-700">
                  <strong>Data Controller:</strong> MockOfsted Ltd, {CONTACT_EMAIL}
                </p>
                <p className="text-sm text-slate-700 mt-2">
                  For privacy questions, data subject access requests, or complaints, contact us at {CONTACT_EMAIL} or use /contact. We aim to respond within 5 business days.
                </p>
              </LegalSection>
            </div>
          </div>
        </div>
      </main>
    </MarketingLayout>
  );
}

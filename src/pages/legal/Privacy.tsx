import MarketingLayout from "../marketing/MarketingLayout";

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
            <p className="mt-3 text-slate-600">How we collect, use, and protect your data when using Voice Inspector.</p>
          </div>

          <div className="rounded-[28px] border bg-white p-6 shadow-sm ring-2 ring-teal-200">
            <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-6">
              <div className="text-xs text-slate-500">
                Last updated: 15 December 2025. If you do not agree, do not use the service.
              </div>
              <Section title="1. Introduction & Scope">
                <p className="text-sm text-slate-700">
                  This Privacy Policy explains how Ziantra Ltd (“we”, “us”) processes personal data when you use Voice Inspector. It applies to all users of the Service.
                </p>
              </Section>

              <Section title="2. Data We Collect">
                <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                  <li>Account data: name, email address, organisation, and profile details you provide.</li>
                  <li>Usage data: interactions within the product, device/browser information, timestamps, and feature usage to improve the Service.</li>
                  <li>Communications: messages you send us (support, feedback, waitlist/contact forms).</li>
                </ul>
              </Section>

              <Section title="3. Authentication Providers">
                <p className="text-sm text-slate-700">
                  Authentication is handled through Supabase and may include Google OAuth. These providers receive the information necessary to authenticate you (e.g., email, identity token).
                </p>
              </Section>

              <Section title="4. AI Processing">
                <p className="text-sm text-slate-700">
                  Responses and transcripts may be processed by trusted third-party AI providers to generate feedback. We use data minimisation where possible and advise you to avoid including identifiable details.
                </p>
              </Section>

              <Section title="5. How We Use Data">
                <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                  <li>To provide, operate, and secure the Service.</li>
                  <li>To improve features, quality, and reliability.</li>
                  <li>To communicate with you (support, updates, feedback responses).</li>
                  <li>To comply with legal obligations.</li>
                </ul>
              </Section>

              <Section title="6. Legal Basis (UK GDPR)">
                <p className="text-sm text-slate-700">
                  We process personal data under UK GDPR on the basis of contract (to provide the Service), legitimate interests (service improvement, security), and consent where required (e.g., certain communications).
                </p>
              </Section>

              <Section title="7. Data Storage & Security">
                <p className="text-sm text-slate-700">
                  Data is stored with Supabase and related cloud infrastructure. We use reasonable technical and organisational measures to protect data, but no system is entirely secure.
                </p>
              </Section>

              <Section title="8. Cookies & Local Storage">
                <p className="text-sm text-slate-700">
                  We use essential cookies/local storage for authentication and session continuity. We do not rely on heavy marketing trackers.
                </p>
              </Section>

              <Section title="9. Data Retention">
                <p className="text-sm text-slate-700">
                  We retain data only as long as necessary for the purposes described or as required by law. You may request deletion of your account data, subject to legal obligations.
                </p>
              </Section>

              <Section title="10. User Rights (UK GDPR)">
                <p className="text-sm text-slate-700">
                  You may request access, rectification, erasure, restriction, data portability, or object to processing where applicable. To exercise rights, contact us using the details below.
                </p>
              </Section>

              <Section title="11. International Transfers">
                <p className="text-sm text-slate-700">
                  Where data is transferred outside the UK/EEA, we rely on appropriate safeguards (such as standard contractual clauses) or equivalent lawful mechanisms.
                </p>
              </Section>

              <Section title="12. Changes to this Policy">
                <p className="text-sm text-slate-700">
                  We may update this policy. Material changes will be signposted within the Service. Continued use after changes means you accept the updated policy.
                </p>
              </Section>

              <Section title="13. Contact Details">
                <p className="text-sm text-slate-700">
                  For privacy questions or requests, email reports@ziantra.co.uk or use the contact form.
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

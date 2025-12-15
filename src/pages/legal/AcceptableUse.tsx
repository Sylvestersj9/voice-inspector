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
            <p className="mt-3 text-slate-600">Standards for safe, lawful, and fair use of Voice Inspector.</p>
          </div>

          <div className="rounded-[28px] border bg-white p-6 shadow-sm ring-2 ring-teal-200">
            <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-6 text-sm text-slate-700">
              <div className="text-xs text-slate-500">
                Last updated: 15 December 2025. If you do not agree, do not use the service.
              </div>
              <Section title="Permitted use">
                <ul className="list-disc space-y-2 pl-5">
                  <li>Use the Service for training, simulation, and preparation for inspection conversations.</li>
                  <li>Maintain anonymisation; avoid identifiable details about children, staff, or locations.</li>
                  <li>Follow all applicable laws, safeguarding rules, and organisational policies.</li>
                </ul>
              </Section>

              <Section title="Prohibited use">
                <ul className="list-disc space-y-2 pl-5">
                  <li>Unlawful activity or content; harassment, discrimination, or abuse.</li>
                  <li>Safeguarding misuse: sharing identifiable child data, confidential case details, or protected information.</li>
                  <li>Uploading sensitive personal data improperly or without authority.</li>
                  <li>Attempting to manipulate, poison, or attack AI systems or infrastructure.</li>
                  <li>Reverse engineering, bypassing security, or using the Service to build competing models.</li>
                </ul>
              </Section>

              <Section title="Fair usage">
                <p>Do not overload the Service with excessive automated calls or unreasonable volumes of requests. We may throttle or limit usage to protect service quality.</p>
              </Section>

              <Section title="Enforcement actions">
                <p>We may suspend, restrict, or terminate access for violations of this policy, suspected abuse, or risk to the platform, users, or third parties.</p>
              </Section>

              <Section title="Reporting misuse">
                <p>Report concerns to reports@ziantra.co.uk. Provide as much detail as possible so we can investigate promptly.</p>
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

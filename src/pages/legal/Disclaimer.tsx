import MarketingLayout from "../marketing/MarketingLayout";

export default function Disclaimer() {
  return (
    <MarketingLayout>
      <main className="px-4 py-14">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="text-center">
            <div className="inline-flex items-center rounded-full bg-teal-50 px-4 py-1.5 text-sm font-medium text-teal-800 ring-1 ring-teal-100">
              Important Regulatory &amp; AI Disclaimer
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold text-slate-900 md:text-4xl">
              Important Regulatory &amp; AI Disclaimer
            </h1>
            <p className="mt-3 text-slate-600">
              Voice Inspector is an assistance, training, and simulation tool only. Human review and professional judgement are mandatory.
            </p>
          </div>

          <div className="rounded-[28px] border bg-white p-6 shadow-sm ring-2 ring-teal-200">
            <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-4 text-sm text-slate-700">
              <div className="text-xs text-slate-500">
                Last updated: 15 December 2025. If you do not agree, do not use the service.
              </div>
              <p>This platform does not replace professional judgement, regulatory advice, or safeguarding decisions.</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>No guarantee of Ofsted ratings, judgements, or inspection outcomes.</li>
                <li>Ofsted inspections are conducted by humans using contextual evidence beyond any software tool.</li>
                <li>Users remain fully responsible for compliance, evidence, policies, and operational decisions.</li>
                <li>AI outputs may contain errors, omissions, or inaccuracies. Human review is mandatory.</li>
                <li>Do not rely solely on AI outputs for safeguarding, regulatory, or operational decisions.</li>
                <li>No liability is accepted for inspection outcomes, enforcement action, business loss, or reputational impact.</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </MarketingLayout>
  );
}

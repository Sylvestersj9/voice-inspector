import { ArrowRight, Check } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import MarketingLayout from "./MarketingLayout";
import { useAuth } from "@/auth/AuthProvider";

type TierProps = {
  title: string;
  badge: string;
  subtitle: string;
  price?: string;
  features: string[];
  ctaLabel: string;
  onCta: () => void;
  highlighted?: boolean;
  note?: string;
};

function Tier({ title, badge, subtitle, price, features, ctaLabel, onCta, highlighted, note }: TierProps) {
  return (
    <div className={["rounded-[28px] border bg-white p-7 shadow-sm", highlighted ? "ring-2 ring-teal-200" : ""].join(" ")}>
      <div className="inline-flex items-center rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800 ring-1 ring-teal-100">
        {badge}
      </div>

      <h2 className="mt-4 font-display text-2xl font-bold text-slate-900">{title}</h2>
      <p className="mt-2 text-slate-600">{subtitle}</p>
      {price ? <div className="mt-3 text-3xl font-bold text-slate-900">{price}</div> : null}

      <div className="mt-6 space-y-3">
        {features.map((f, i) => (
          <div key={i} className="flex items-start gap-2 text-sm text-slate-700">
            <Check className="mt-0.5 h-4 w-4 text-teal-700" />
            <span>{f}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onCta}
        className={[
          "mt-7 inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition",
          highlighted ? "bg-teal-600 text-white hover:bg-teal-700" : "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
        ].join(" ")}
      >
        {ctaLabel} <ArrowRight className="ml-2 h-4 w-4" />
      </button>

      {note ? <p className="mt-3 text-center text-xs text-slate-500">{note}</p> : null}
    </div>
  );
}

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleUpgrade = () => {
    if (!user) {
      navigate("/login?next=/pricing");
      return;
    }
    // Placeholder: if Stripe checkout wired, launch here. For now keep user on pricing.
    navigate("/pricing");
  };

  return (
    <MarketingLayout>
      <main className="px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <div className="inline-flex items-center rounded-full bg-teal-50 px-4 py-1.5 text-sm font-medium text-teal-800 ring-1 ring-teal-100">
              Pricing
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold text-slate-900 md:text-4xl">
              Start free in beta. Upgrade when you want tailored support.
            </h1>
            <p className="mt-3 text-slate-600">
              We’re gathering feedback to ship the best possible product for children’s homes and supported living teams.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <Tier
              title="Beta (Free)"
              badge="Open access beta"
              subtitle="5 fixed questions to practise without billing while we collect feedback."
              features={[
                "5 fixed SCCIF-style questions",
                "Single session",
                "Basic evaluation & limited summary",
                "No exports",
                "No action plan tracking",
                "No Ofsted report upload",
              ]}
              ctaLabel="Sign in to upgrade"
              onCta={() => navigate("/login?next=/pricing")}
            />

            <Tier
              title="Inspection Ready Pro"
              badge="£29/month"
              subtitle="For teams who want personalised improvement plans, uploads, and exports."
              price="£29/mo"
              features={[
                "Unlimited simulations",
                "Theme-based questions",
                "Ofsted PDF report upload & analysis",
                "Tailored questions from reports",
                "Full action plan creation & tracking",
                "Exports (summary & action plan)",
                "Saved sessions and progress",
              ]}
              ctaLabel={user ? "Upgrade to Pro – £29/month" : "Sign in to upgrade"}
              onCta={handleUpgrade}
              highlighted
              note="Cancel anytime. Prices exclude VAT if applicable."
            />
          </div>

          <div className="mt-10 rounded-2xl border bg-slate-50 p-6 text-sm text-slate-700">
            <div className="font-semibold text-slate-900">Important</div>
            <div className="mt-2">Do not include names or identifying details about children, staff, or locations.</div>
            <div className="mt-2">
              Need a procurement or team plan?{" "}
              <Link to="/contact" className="text-teal-700 underline">
                Contact us
              </Link>
              .
            </div>
          </div>
        </div>
      </main>
    </MarketingLayout>
  );
}

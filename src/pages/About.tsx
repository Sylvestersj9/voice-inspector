import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import MarketingLayout from "./marketing/MarketingLayout";

export default function About() {
  return (
    <MarketingLayout>
      <div className="px-4 py-16">
        <div className="mx-auto max-w-2xl">
          <div className="inline-flex items-center rounded-full bg-teal-50 px-4 py-1.5 text-sm font-semibold text-teal-800 ring-1 ring-teal-100">
            About
          </div>

          <h1 className="mt-4 font-display text-3xl font-bold text-slate-900 md:text-4xl">
            Created by a residential care manager, for care leaders preparing for Ofsted.
          </h1>

          <p className="mt-5 text-lg text-slate-600 leading-relaxed">
            Ofsted unannounced inspections hit hard—you never know when, and that uncertainty keeps everyone on edge. Mock inspections cost thousands and take weeks to book; peer reviews vary wildly; endless SCCIF reading doesn't simulate the real inspector's probing questions under pressure.
          </p>

          <p className="mt-4 text-slate-600 leading-relaxed">
            After 12+ years in children's homes—from youth support to deputy and manager roles—I built MockOfsted because nothing existed to instantly pressure-test your readiness. This tool simulates live inspector Q&A (voice/text), scores against all 9 Quality Standards, and flags gaps with actionable feedback.
          </p>

          <p className="mt-4 text-slate-600 leading-relaxed">
            I use it myself: It accelerated my home from Good to Outstanding in months by exposing blind spots early.
          </p>

          <div className="mt-8 rounded-2xl bg-teal-50 border border-teal-100 px-6 py-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white text-lg font-bold font-display">
                ✓
              </div>
              <div>
                <p className="font-semibold text-slate-900">Tested in real homes</p>
                <p className="mt-1 text-sm text-slate-600">
                  Beta-tested with 10+ leaders across England. SCCIF-native, covering every standard—not a checklist, but your sparring partner for confidence.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors"
            >
              Start free trial <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Get in touch
            </Link>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}

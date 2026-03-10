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
            Built by a Level 5 manager, for Level 5 managers.
          </h1>

          <p className="mt-5 text-lg text-slate-600 leading-relaxed">
            MockOfsted started because I couldn't find a realistic way to prepare for Ofsted. Mock inspections are expensive, peer feedback is inconsistent, and re-reading the SCCIF doesn't replicate the pressure of an inspector in the room.
          </p>

          <p className="mt-4 text-slate-600 leading-relaxed">
            After 12 years in residential care — youth work, deputy manager, then registered manager — I built the tool I wished existed. Something that asks the actual questions, challenges weak answers, and gives honest feedback against every Quality Standard.
          </p>

          <div className="mt-8 rounded-2xl bg-teal-50 border border-teal-100 px-6 py-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white text-lg font-bold font-display">
                L5
              </div>
              <div>
                <p className="font-semibold text-slate-900">Validated in real homes</p>
                <p className="mt-1 text-sm text-slate-600">
                  Beta-tested with 10+ registered managers across England before public launch. All 9 Quality Standards covered. SCCIF-native from day one — not retrofitted.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-3 text-slate-600 leading-relaxed">
            <p>
              <strong className="text-slate-800">What it is:</strong> A practice tool that simulates Ofsted questioning — voice or text — and scores your answers against the same framework inspectors use.
            </p>
            <p>
              <strong className="text-slate-800">What it isn't:</strong> A compliance checklist, a legal guarantee, or a replacement for proper preparation. It's a sparring partner.
            </p>
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

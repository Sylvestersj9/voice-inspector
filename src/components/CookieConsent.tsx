import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getConsent, setConsent, initPostHog } from "@/lib/analytics";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = getConsent();
    if (consent === null) {
      // Slight delay so the page renders first
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
    if (consent === "accepted") {
      initPostHog();
    }
  }, []);

  if (!visible) return null;

  const accept = () => {
    setConsent("accepted");
    setVisible(false);
  };

  const decline = () => {
    setConsent("declined");
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 sm:pb-6"
    >
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-xl px-5 py-4 sm:flex sm:items-center sm:justify-between sm:gap-6">
        <p className="text-sm text-slate-600 leading-relaxed">
          We use analytics cookies to understand how MockOfsted is used and improve the experience.
          Your data stays in Europe.{" "}
          <Link to="/privacy" className="text-teal-700 underline underline-offset-2 hover:text-teal-900">
            Privacy policy
          </Link>
          .
        </p>
        <div className="mt-3 flex shrink-0 items-center gap-2.5 sm:mt-0">
          <button
            onClick={decline}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight } from "lucide-react";

type Props = { children: React.ReactNode };

const email = "reports@ziantra.co.uk";
const OVERLAY_MS = 1700;
let hasShownInitialLoad = false;

function LoadingOverlay({ visible }: { visible: boolean }) {
  return (
    <div
      className={[
        "fixed inset-0 z-[9000] flex items-center justify-center bg-white/80 backdrop-blur-sm transition-opacity duration-300",
        visible ? "opacity-100" : "pointer-events-none opacity-0",
      ].join(" ")}
      aria-live="polite"
      aria-busy={visible}
      role="status"
    >
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-6 py-5 shadow-lg ring-1 ring-slate-200">
        <div className="loader h-8 w-8" aria-hidden="true" />
        <div className="text-sm font-semibold text-slate-800">Loading...</div>
      </div>
    </div>
  );
}

export default function MarketingLayout({ children }: Props) {
  const location = useLocation();
  const [isTop, setIsTop] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [fadeIn, setFadeIn] = useState(!hasShownInitialLoad);

  useEffect(() => {
    const onScroll = () => setIsTop(window.scrollY < 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLink = (to: string, label: string) => (
    <Link to={to} className="text-sm font-semibold text-slate-700 transition hover:text-slate-900">
      {label}
    </Link>
  );

  // Show a brief loading overlay + fade transition on route changes (after first render)
  useEffect(() => {
    if (!hasShownInitialLoad) {
      hasShownInitialLoad = true;
      setFadeIn(true);
      return;
    }

    setTransitioning(true);
    setFadeIn(false);

    const fadeTimer = window.setTimeout(() => setFadeIn(true), 180);
    const hideTimer = window.setTimeout(() => setTransitioning(false), OVERLAY_MS);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, [location.pathname, location.search]);

  return (
    <div className="min-h-screen bg-white">
      {/* Announcement bar */}
      <div className="border-b border-emerald-100 bg-emerald-50">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2 text-sm font-semibold text-emerald-800">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-600" />
          Open access beta - no account or billing required while we collect feedback.
        </div>
      </div>

      {/* Header */}
      <header
        className={[
          "px-4",
          isTop ? "bg-white" : "border-b border-slate-100 bg-white/90 backdrop-blur",
        ].join(" ")}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between py-5">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-teal-600/15 ring-1 ring-teal-200">
              <img src="/logo.svg" alt="Voice Inspector" className="h-9 w-9 object-contain" />
            </div>
            <div className="font-display font-bold text-slate-900">Voice Inspector</div>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {navLink("/", "Home")}
            {navLink("/pricing", "Pricing")}
            {navLink("/faq", "FAQ")}
            {navLink("/contact", "Contact")}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden sm:inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              Login
            </Link>
            <Link
              to="/pricing"
              className="hidden sm:inline-flex items-center justify-center rounded-xl border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800 hover:bg-teal-100"
            >
              Upgrade
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
            >
              Start free beta <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main
        className={`transition-opacity duration-500 ${fadeIn ? "opacity-100" : "opacity-0"}`}
        aria-busy={transitioning}
      >
        {children}
      </main>

      <LoadingOverlay visible={transitioning} />

      {/* Footer */}
      <footer className="mt-12 border-t bg-white px-4 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="font-display font-bold text-slate-900">Voice Inspector</div>
            <div className="mt-1 text-sm text-slate-600">Ofsted inspection practice simulator.</div>
            <div className="mt-2 text-sm text-slate-600">
              Contact:{" "}
              <Link className="text-teal-700 underline" to="/contact">
                {email}
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm font-semibold text-slate-700">
            <Link to="/" className="hover:text-slate-900">
              Home
            </Link>
            <Link to="/pricing" className="hover:text-slate-900">
              Pricing
            </Link>
            <Link to="/faq" className="hover:text-slate-900">
              FAQ
            </Link>
            <Link to="/contact" className="hover:text-slate-900">
              Contact
            </Link>
            <Link to="/terms" className="hover:text-slate-900">
              Terms
            </Link>
            <Link to="/privacy" className="hover:text-slate-900">
              Privacy
            </Link>
            <Link to="/disclaimer" className="hover:text-slate-900">
              Disclaimer
            </Link>
            <Link to="/acceptable-use" className="hover:text-slate-900">
              Acceptable Use
            </Link>
            <Link to="/login" className="hover:text-slate-900">
              Login
            </Link>
            <Link to="/login" className="hover:text-slate-900">
              Simulator
            </Link>
          </div>
        </div>
        <div className="mx-auto mt-6 max-w-6xl text-xs text-slate-500">
          Based on Ofsted&apos;s Social Care Common Inspection Framework (SCCIF).
        </div>
      </footer>
    </div>
  );
}

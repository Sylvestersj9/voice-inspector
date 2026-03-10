import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight } from "lucide-react";

type Props = { children: React.ReactNode };

const CONTACT_EMAIL = "info@mockofsted.co.uk";

export default function MarketingLayout({ children }: Props) {
  const location = useLocation();
  const [isTop, setIsTop] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsTop(window.scrollY < 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-white font-body">
      {/* Header */}
      <header
        className={[
          "sticky top-0 z-50 px-4 transition-all duration-200",
          isTop
            ? "bg-white"
            : "border-b border-slate-100 bg-white/95 backdrop-blur-sm shadow-sm",
        ].join(" ")}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600">
              <svg viewBox="0 0 32 32" fill="none" className="h-5 w-5" aria-hidden="true">
                <path
                  d="M16 4L4 10v12l12 6 12-6V10L16 4z"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  fill="none"
                />
                <path d="M16 4v18M4 10l12 6 12-6" stroke="white" strokeWidth="2" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-display text-lg font-bold text-slate-900">MockOfsted</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-7 md:flex">
            <Link to="/" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">Home</Link>
            <Link to="/pricing" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">Pricing</Link>
            <Link to="/about" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">About</Link>
            <Link to="/blog" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">Blog</Link>
            <Link to="/faq" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">FAQ</Link>
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-2.5">
            <Link
              to="/login"
              className="hidden sm:inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Log in
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors"
            >
              Try free <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-slate-50 px-4 pt-10 pb-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-8 md:flex-row md:justify-between">
            <div className="max-w-xs">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600">
                  <svg viewBox="0 0 32 32" fill="none" className="h-4 w-4" aria-hidden="true">
                    <path d="M16 4L4 10v12l12 6 12-6V10L16 4z" stroke="white" strokeWidth="2" strokeLinejoin="round" fill="none"/>
                    <path d="M16 4v18M4 10l12 6 12-6" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="font-display font-bold text-slate-900">MockOfsted</span>
              </div>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Realistic Ofsted inspection practice for registered managers of children's homes in England.
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Contact:{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-teal-700 hover:underline">
                  {CONTACT_EMAIL}
                </a>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Product</div>
                <div className="flex flex-col gap-2 text-sm">
                  <Link to="/" className="text-slate-600 hover:text-slate-900">Home</Link>
                  <Link to="/pricing" className="text-slate-600 hover:text-slate-900">Pricing</Link>
                  <Link to="/login" className="text-slate-600 hover:text-slate-900">Log in</Link>
                  <Link to="/login" className="text-slate-600 hover:text-slate-900">Sign up</Link>
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Company</div>
                <div className="flex flex-col gap-2 text-sm">
                  <Link to="/about" className="text-slate-600 hover:text-slate-900">About</Link>
                  <Link to="/blog" className="text-slate-600 hover:text-slate-900">Blog</Link>
                  <Link to="/faq" className="text-slate-600 hover:text-slate-900">FAQ</Link>
                  <Link to="/contact" className="text-slate-600 hover:text-slate-900">Contact</Link>
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Legal</div>
                <div className="flex flex-col gap-2 text-sm">
                  <Link to="/terms" className="text-slate-600 hover:text-slate-900">Terms</Link>
                  <Link to="/privacy" className="text-slate-600 hover:text-slate-900">Privacy</Link>
                  <Link to="/disclaimer" className="text-slate-600 hover:text-slate-900">Disclaimer</Link>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <p className="text-xs text-slate-500 leading-relaxed">
              <strong>Disclaimer:</strong> MockOfsted is a practice and professional development tool. It does not constitute official Ofsted guidance or legal compliance advice. All evaluations are AI-generated based on your answers only and do not reflect a full Ofsted inspection.
            </p>
            <p className="mt-2 text-xs text-slate-400">
              © {new Date().getFullYear()} MockOfsted. Built for registered managers of children's homes in England.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

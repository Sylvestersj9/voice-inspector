import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LogOut, Menu, X } from "lucide-react";

interface AppNavProps {
  isPaid: boolean;
  onSignOut: () => void;
  /** Optional session controls (Restart / Stop) rendered between nav and right icons */
  extraControls?: React.ReactNode;
  /** Extra class names on the <header> — e.g. "print-hide" for the report page */
  headerClassName?: string;
}

export default function AppNav({
  isPaid,
  onSignOut,
  extraControls,
  headerClassName = "",
}: AppNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();

  // Close on outside click
  useEffect(() => {
    if (!mobileOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [mobileOpen]);

  // Close on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const navLink = (to: string, label: string) => {
    const active = pathname === to || (to === "/app" && pathname === "/app");
    return (
      <Link
        to={to}
        className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          active
            ? "bg-slate-100 text-slate-900"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header
      className={`sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-sm ${headerClassName}`}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">

        {/* ── Left: Logo + always-visible links ───────────────────────────── */}
        <div className="flex items-center gap-4">
          {/* Logo */}
          <Link to="/app" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600">
              <svg viewBox="0 0 32 32" fill="none" className="h-4 w-4" aria-hidden="true">
                <path
                  d="M16 4L4 10v12l12 6 12-6V10L16 4z"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  fill="none"
                />
                <path
                  d="M16 4v18M4 10l12 6 12-6"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="font-display font-bold text-slate-900">InspectReady</span>
          </Link>

          {/* Practice + Dashboard — hidden on mobile, flex on md+ */}
          <nav className="hidden items-center gap-1 md:flex">
            {navLink("/app", "Practice")}
            {navLink("/app/dashboard", "Dashboard")}
          </nav>
        </div>

        {/* ── Right: session controls + desktop logout + mobile hamburger ── */}
        <div className="flex items-center gap-2">
          {/* Session-specific controls (Restart / Stop on simulator) */}
          {extraControls}

          {/* Desktop-only logout */}
          <button
            onClick={onSignOut}
            title="Sign out"
            className="hidden md:inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only">Sign out</span>
          </button>

          {/* Mobile hamburger — md:hidden */}
          <div className="relative md:hidden" ref={menuRef}>
            <button
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>

            {/* Dropdown */}
            <div
              className={`absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg transition-all duration-200 ${
                mobileOpen
                  ? "pointer-events-auto translate-y-0 opacity-100"
                  : "pointer-events-none -translate-y-1 opacity-0"
              }`}
            >
              <div className="p-2 space-y-0.5">
                {/* Mobile-only nav links */}
                <Link
                  to="/app"
                  className={`flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    pathname === "/app"
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Practice
                </Link>
                <Link
                  to="/app/dashboard"
                  className={`flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    pathname === "/app/dashboard"
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Dashboard
                </Link>

                <div className="my-1 border-t border-slate-100" />

                <Link
                  to="/app/profile"
                  className={`flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    pathname === "/app/profile"
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Profile
                </Link>

                {!isPaid && (
                  <Link
                    to="/pricing"
                    className="flex w-full items-center rounded-lg px-3 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50 transition-colors"
                  >
                    Subscribe
                  </Link>
                )}

                <div className="my-1 border-t border-slate-100" />

                <button
                  onClick={() => {
                    setMobileOpen(false);
                    onSignOut();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

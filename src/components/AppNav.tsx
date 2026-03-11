import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Menu, X, User, CreditCard, Settings, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

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
  const [billingLoading, setBillingLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email ?? null);
        const { data: profile } = await supabase
          .from("users")
          .select("name")
          .eq("id", user.id)
          .maybeSingle();
        setUserName(profile?.name ?? null);
      }
    }
    getUser();
  }, []);

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

  const handleBillingPortal = async () => {
    setBillingLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("billing-portal", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Could not get billing portal URL");
      }
    } catch (err) {
      console.error("Billing portal error:", err);
      toast.error("Failed to open billing portal. Please try again.");
    } finally {
      setBillingLoading(false);
    }
  };

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

  const initials = userName 
    ? userName.split(" ").map(n => n[0]).join("").toUpperCase()
    : userEmail ? userEmail[0].toUpperCase() : "U";

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
              <svg viewBox="0 0 32 32" fill="none" className="h-5 w-5" aria-hidden="true">
                <path d="M16 2C16 2 6 8 6 14C6 19 16 26 16 26C16 26 26 19 26 14C26 8 16 2 16 2Z" fill="white"/>
                <g stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none">
                  <path d="M11 16L13.5 19L20 11"/>
                </g>
              </svg>
            </div>
            <span className="font-display font-bold text-slate-900">MockOfsted</span>
          </Link>

          {/* Practice + Dashboard — hidden on mobile, flex on md+ */}
          <nav className="hidden items-center gap-1 md:flex">
            {navLink("/app", "Practice")}
            {navLink("/app/dashboard", "Dashboard")}
          </nav>
        </div>

        {/* ── Right: session controls + desktop dropdown + mobile hamburger ── */}
        <div className="flex items-center gap-2">
          {/* Session-specific controls (Restart / Stop on simulator) */}
          {extraControls}

          {/* Desktop Dropdown */}
          <div className="hidden md:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full border border-slate-200 p-1 pr-3 hover:bg-slate-50 transition-colors outline-none">
                  <Avatar className="h-7 w-7 border border-slate-100">
                    <AvatarFallback className="bg-teal-50 text-teal-700 text-[10px] font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-semibold text-slate-700">Account</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-1">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userName || "User"}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userEmail}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/app/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleBillingPortal} disabled={billingLoading}>
                  {billingLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="mr-2 h-4 w-4" />
                  )}
                  <span>Billing & Subscription</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onSignOut} className="text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

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
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    pathname === "/app/profile"
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <User className="h-4 w-4" />
                  Profile
                </Link>

                <button
                  onClick={handleBillingPortal}
                  disabled={billingLoading}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
                >
                  {billingLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4" />
                  )}
                  Billing
                </button>

                {!isPaid && (
                  <Link
                    to="/app/paywall"
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
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
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

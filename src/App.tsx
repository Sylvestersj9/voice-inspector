import { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import * as Sentry from "@sentry/react";
import RequireAuth from "./auth/RequireAuth";
import PageTransition from "./components/PageTransition";
import { ErrorBoundary } from "./components/ErrorBoundary";
import CookieConsent from "./components/CookieConsent";
import { trackPageView } from "./lib/analytics";

const Login = lazy(() => import("./pages/Login"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const Index = lazy(() => import("./pages/Index"));
const Home = lazy(() => import("./pages/Home"));
const Pricing = lazy(() => import("./pages/marketing/Pricing"));
const FAQ = lazy(() => import("./pages/marketing/FAQ"));
const Contact = lazy(() => import("./pages/Contact"));
const Terms = lazy(() => import("./pages/legal/Terms"));
const Privacy = lazy(() => import("./pages/legal/Privacy"));
const Disclaimer = lazy(() => import("./pages/legal/Disclaimer"));
const AcceptableUse = lazy(() => import("./pages/legal/AcceptableUse"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Report = lazy(() => import("./pages/app/Report"));
const Paywall = lazy(() => import("./pages/app/Paywall"));
const Profile = lazy(() => import("./pages/app/Profile"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const About = lazy(() => import("./pages/About"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));

function AppRoutes() {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        {/* Public */}
        <Route path="/" element={<PageTransition><Home /></PageTransition>} />
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
        <Route path="/pricing" element={<PageTransition><Pricing /></PageTransition>} />
        <Route path="/faq" element={<PageTransition><FAQ /></PageTransition>} />
        <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
        <Route path="/terms" element={<PageTransition><Terms /></PageTransition>} />
        <Route path="/privacy" element={<PageTransition><Privacy /></PageTransition>} />
        <Route path="/disclaimer" element={<PageTransition><Disclaimer /></PageTransition>} />
        <Route path="/acceptable-use" element={<PageTransition><AcceptableUse /></PageTransition>} />
        <Route path="/about" element={<PageTransition><About /></PageTransition>} />
        <Route path="/blog" element={<PageTransition><Blog /></PageTransition>} />
        <Route path="/blog/:slug" element={<PageTransition><BlogPost /></PageTransition>} />

        {/* Protected app */}
        <Route
          path="/app"
          element={
            <RequireAuth>
              <PageTransition><Index /></PageTransition>
            </RequireAuth>
          }
        />
        <Route
          path="/app/dashboard"
          element={
            <RequireAuth>
              <PageTransition><Dashboard /></PageTransition>
            </RequireAuth>
          }
        />
        <Route
          path="/app/report/:sessionId"
          element={
            <RequireAuth>
              <PageTransition><Report /></PageTransition>
            </RequireAuth>
          }
        />
        <Route
          path="/app/paywall"
          element={
            <RequireAuth>
              <PageTransition><Paywall /></PageTransition>
            </RequireAuth>
          }
        />
        <Route
          path="/app/profile"
          element={
            <RequireAuth>
              <PageTransition><Profile /></PageTransition>
            </RequireAuth>
          }
        />

        {/* Default */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<LoadingSpinner />}>
          <AppRoutes />
        </Suspense>
        <CookieConsent />
        {/* SENTRY TEST — remove after confirming */}
        <button
          onClick={() => Sentry.captureException(new Error("LAUNCH-READY TEST"))}
          style={{ position: "fixed", bottom: 8, right: 8, zIndex: 9999, fontSize: 10, opacity: 0.4, padding: "2px 6px", background: "#e11d48", color: "#fff", borderRadius: 4, border: "none", cursor: "pointer" }}
        >
          Sentry test
        </button>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

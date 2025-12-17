import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RequireAuth from "./auth/RequireAuth";

const Login = lazy(() => import("./pages/Login"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const Index = lazy(() => import("./pages/Index"));
const Landing = lazy(() => import("./pages/marketing/Landing"));
const Pricing = lazy(() => import("./pages/marketing/Pricing"));
const FAQ = lazy(() => import("./pages/marketing/FAQ"));
const Contact = lazy(() => import("./pages/Contact"));
const Terms = lazy(() => import("./pages/legal/Terms"));
const Privacy = lazy(() => import("./pages/legal/Privacy"));
const Disclaimer = lazy(() => import("./pages/legal/Disclaimer"));
const AcceptableUse = lazy(() => import("./pages/legal/AcceptableUse"));
const Sessions = lazy(() => import("./pages/Sessions"));
const Dashboard = lazy(() => import("./pages/Dashboard"));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="/acceptable-use" element={<AcceptableUse />} />

          {/* Protected ƒ?" REAL APP */}
          <Route
            path="/app"
            element={
              <RequireAuth>
                <Index />
              </RequireAuth>
            }
          />
          <Route
            path="/app/sessions"
            element={
              <RequireAuth>
                <Sessions />
              </RequireAuth>
            }
          />
          <Route
            path="/app/dashboard"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />

          {/* Default */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

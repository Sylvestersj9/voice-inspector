import React from "react";
import ReactDOM from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./auth/AuthProvider";
import { LoadingProvider } from "./providers/LoadingProvider";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 1.0,
  sendDefaultPii: true,
  enabled: !!import.meta.env.VITE_SENTRY_DSN,
  beforeSend(event) {
    // Ignore non-critical admin-notifications network errors
    if (
      event.exception &&
      event.exception.values?.[0]?.value?.includes("admin-notifications")
    ) {
      return null;
    }
    return event;
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <LoadingProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </LoadingProvider>
  </React.StrictMode>,
);

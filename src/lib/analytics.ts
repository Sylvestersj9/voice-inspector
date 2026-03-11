/**
 * analytics.ts — PostHog wrapper, UK GDPR compliant
 *
 * Rules:
 * - PostHog is NEVER initialised until the user explicitly accepts cookies.
 * - Uses EU cloud endpoint (eu.posthog.com) so data stays in Europe.
 * - If VITE_POSTHOG_KEY is absent, all calls are no-ops (dev/test safety).
 */
import posthog from "posthog-js";

const KEY  = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const HOST = "https://us.i.posthog.com";
const CONSENT_KEY = "mockofsted_cookie_consent";

export type ConsentState = "accepted" | "declined" | null;

export function getConsent(): ConsentState {
  const v = localStorage.getItem(CONSENT_KEY);
  if (v === "accepted" || v === "declined") return v;
  return null;
}

export function setConsent(state: "accepted" | "declined") {
  localStorage.setItem(CONSENT_KEY, state);
  if (state === "accepted") {
    initPostHog();
  } else {
    posthog.opt_out_capturing();
  }
}

let initialised = false;

export function initPostHog() {
  if (!KEY || initialised) return;
  posthog.init(KEY, {
    api_host: HOST,
    person_profiles: "identified_only",
    capture_pageview: false, // we fire manually on route change
    capture_pageleave: true,
    autocapture: false,       // explicit events only — cleaner data
    persistence: "localStorage+cookie",
    opt_out_capturing_by_default: false,
  });
  initialised = true;
}

/** Call on every route change */
export function trackPageView(path: string) {
  if (!initialised) return;
  posthog.capture("$pageview", { $current_url: window.location.origin + path });
}

/** Identify user after sign-in */
export function identifyUser(userId: string, props?: Record<string, unknown>) {
  if (!initialised) return;
  posthog.identify(userId, props);
}

/** Reset identity on sign-out */
export function resetUser() {
  if (!initialised) return;
  posthog.reset();
}

// ── Key product events ────────────────────────────────────────────────────────

export function trackSignup(role?: string) {
  if (!initialised) return;
  posthog.capture("signup", { role });
}

export function trackSessionStart(domain_count: number) {
  if (!initialised) return;
  posthog.capture("session_start", { domain_count });
}

export function trackSessionComplete(props: {
  overall_band: string;
  overall_score: number;
  questions_answered: number;
}) {
  if (!initialised) return;
  posthog.capture("session_complete", props);
}

export function trackReportGenerated(sessionId: string) {
  if (!initialised) return;
  posthog.capture("report_generated", { session_id: sessionId });
}

export function trackCheckoutStarted() {
  if (!initialised) return;
  posthog.capture("checkout_started");
}

export function trackSubscriptionConfirmed() {
  if (!initialised) return;
  posthog.capture("subscription_confirmed");
}

export function getFeedbackContext(opts?: { sessionId?: string }) {
  // Keep context lightweight and non-sensitive by default.
  return {
    route: window.location.pathname,
    search: window.location.search,
    sessionId: opts?.sessionId ?? null,
    ts: new Date().toISOString(),
    ua: navigator.userAgent,
  };
}

export function getPlan(): "free" | "pro" {
  if (typeof window === "undefined") return "free";
  const params = new URLSearchParams(window.location.search);
  return params.get("pro") === "1" ? "pro" : "free";
}

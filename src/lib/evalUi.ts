export type EvalBand =
  | "inadequate"
  | "requires_improvement"
  | "good"
  | "outstanding"
  | string;

export function normaliseBand(band?: string | null): EvalBand {
  return (band ?? "").toString().trim().toLowerCase().replace(/\s+/g, "_");
}

export function bandUi(band?: string | null) {
  const b = normaliseBand(band);

  let icon = "ℹ️";
  let tone: "danger" | "warn" | "success" | "info" = "info";
  let label = band ?? "Evaluation";

  if (b === "inadequate") {
    icon = "❗";
    tone = "danger";
    label = "Inadequate";
  } else if (b === "requires_improvement" || b === "requires-improvement") {
    icon = "⚠️";
    tone = "warn";
    label = "Requires improvement";
  } else if (b === "good") {
    icon = "✅";
    tone = "success";
    label = "Good";
  } else if (b === "outstanding") {
    icon = "⭐";
    tone = "success";
    label = "Outstanding";
  }

  return { icon, tone, label };
}

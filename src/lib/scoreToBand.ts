export const scoreToBand = (score: number): string => {
  if (score >= 10) return "Outstanding";
  if (score >= 7) return "Good";
  if (score >= 4) return "Requires Improvement";
  return "Inadequate";
};

/** User-facing label — shows "Needs Development" instead of "Inadequate" */
export const bandLabel = (band: string): string => {
  if (band === "Inadequate") return "Needs Development";
  return band;
};

/** Tailwind colour classes per band */
export const bandColour = (band: string): string => {
  switch (band) {
    case "Outstanding":
      return "text-emerald-700 bg-emerald-100";
    case "Good":
      return "text-teal-700 bg-teal-100";
    case "Requires Improvement":
      return "text-amber-700 bg-amber-100";
    case "Inadequate":
    default:
      return "text-red-700 bg-red-100";
  }
};

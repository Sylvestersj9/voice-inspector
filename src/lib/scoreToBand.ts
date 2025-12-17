export const scoreToBand = (score: number) => {
  if (score >= 85) return "Outstanding";
  if (score >= 70) return "Good";
  if (score >= 50) return "Requires improvement to be good";
  return "Needs development";
};

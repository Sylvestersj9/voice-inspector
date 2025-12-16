export type EvalArrays = {
  strengths?: unknown;
  gaps?: unknown;
  follow_up_questions?: unknown;
};

const cleanList = (value: unknown) =>
  Array.isArray(value)
    ? value.map((v) => (v ?? "").toString().trim()).filter(Boolean)
    : [];

export function normalizeEvaluationArrays(input: EvalArrays) {
  const strengths = cleanList(input.strengths);
  const gaps = cleanList(input.gaps);
  const followUps = cleanList(input.follow_up_questions);

  return {
    strengths:
      strengths.length > 0
        ? strengths
        : [
            "The response demonstrates initial engagement with the question and provides a starting point for further development.",
          ],
    gaps: gaps.length > 0 ? gaps : ["Add clear evidence, escalation routes, and measurable impact on children."],
    follow_up_questions:
      followUps.length > 0
        ? followUps
        : [
            "Can you give a recent, specific example of this in practice?",
            "Who would you escalate this to, and why?",
            "How do you know this approach is effective?",
          ],
  };
}

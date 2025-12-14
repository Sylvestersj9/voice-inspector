type PromptInput = {
  domainName: string;
  questionText: string;
  guidance?: string | null;
  answerText?: string | null;
  transcript?: string | null;
  evidenceNotes?: string | null;
};

export function buildEvaluationPrompt(input: PromptInput): string {
  const { domainName, questionText, guidance, answerText, transcript, evidenceNotes } = input;
  return `
You are an Ofsted-style inspector evaluating an answer for a children's home inspection.
Score strictly on a 1–4 scale:
1 = Inadequate
2 = Requires Improvement
3 = Good
4 = Outstanding

Use Ofsted language. Be strict. Do not inflate scores.

Return ONLY valid JSON with keys: score, band, strengths, gaps, follow_up_questions.
No markdown, no extra text.

Context:
Domain: ${domainName}
Question: ${questionText}
Guidance: ${guidance || "(none)"}

Answer:
Text: ${answerText || "(none)"}
Transcript: ${transcript || "(none)"}
Evidence: ${evidenceNotes || "(none)"}
`.trim();
}

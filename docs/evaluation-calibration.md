## Evaluation calibration (rubric-first, substance-first)

**Purpose:** keep ratings consistent and fair for spoken or typed answers. Good substance should get good ratings; weak answers should not get inflated bands.

### Rubric (0–3 each, total 0–12)
- **Safeguarding & risk awareness** (0–3)
- **Practice & evidence** (examples, routines, records) (0–3)
- **Child-centred outcomes & impact** (0–3)
- **Leadership / learning / reflection** (oversight, what you’d improve) (0–3)

### Band mapping
- 0–3: Inadequate
- 4–6: Requires Improvement
- 7–9: Good
- 10–12: Outstanding

### Guardrails
- Red flags (unsafe practice, no safeguarding) cap band at *Requires Improvement*.
- If safeguarding + evidence + impact are strong (>=2 each) and no red flags, do not rate below *Good*.
- Focus on substance; spoken/transcribed answers should not be penalised for filler words or rough phrasing.

### Output shape (JSON from model)
```json
{
  "band": "Outstanding" | "Good" | "Requires Improvement" | "Inadequate",
  "score": number,
  "dimension_scores": { "safeguarding": number, "evidence": number, "impact": number, "reflection": number },
  "strengths": [ ... ],
  "gaps": [ ... ],
  "recommendations": [ ... ],
  "follow_up_questions": [ ... ],
  "red_flags": [ ... ],
  "summary": "..."
}
```

### Lists (length limits)
- Strengths: 2–4
- Gaps: 2–4
- Recommendations: 3–6 (practical)
- Follow-ups: 2–4 (probe gaps)

### Anchors (internal, not shown)
- Weak: vague, no safeguarding/evidence/impact ⇒ Inadequate/RI.
- Good: clear safeguarding steps, some evidence/outcomes, some learning ⇒ Good.
- Excellent: clear risk controls, specific evidence, outcomes shown, reflection loop ⇒ Outstanding.

### Voice tolerance
If `input_mode="voice"`, the prompt reminds the model not to penalise filler words or minor transcription noise; judge only the underlying practice and evidence.

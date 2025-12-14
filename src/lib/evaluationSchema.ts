import { z } from "zod";

export const judgementBandSchema = z.enum([
  "Outstanding",
  "Good",
  "Requires improvement to be good",
  "Inadequate",
]);

export const evaluationResultSchema = z.object({
  overall_judgement: judgementBandSchema,
  score4: z.number().min(1).max(4).optional(),
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  recommendations: z.array(z.string()).default([]),
  gaps: z.array(z.string()).default([]),
  riskFlags: z.array(z.string()).default([]),
  follow_up_questions: z.array(z.string()).default([]),
  recommendations_full: z.array(z.string()).default([]).optional(),
  what_inspector_wants_to_hear: z.string().optional(),
  evidence_to_quote_next_time: z.array(z.string()).default([]).optional(),
  action_plan_7_days: z.array(z.string()).default([]).optional(),
  action_plan_30_days: z.array(z.string()).default([]).optional(),
  debug: z.record(z.any()).optional(),
  rubric: z.record(z.any()).optional(),
  schemaVersion: z.string().optional(),
});

export type EvaluationResponse = z.infer<typeof evaluationResultSchema>;

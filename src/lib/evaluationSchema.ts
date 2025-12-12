import { z } from "zod";

export const judgementBandSchema = z.enum([
  "Outstanding",
  "Good",
  "Requires Improvement",
  "Inadequate",
]);

export const evaluationResultSchema = z.object({
  score: z.number().min(0).max(5),
  judgementBand: judgementBandSchema,
  strengths: z.array(z.string()).default([]),
  gaps: z.array(z.string()).default([]),
  riskFlags: z.array(z.string()).default([]),
  followUpQuestions: z.array(z.string()).default([]),
  recommendedActions: z.array(z.string()).default([]),
  frameworkAlignment: z.array(z.string()).default([]),
  missingExpectations: z.array(z.string()).default([]),
  evidenceUsed: z.array(z.string()).default([]),
  schemaVersion: z.string().optional(),
});

export type EvaluationResponse = z.infer<typeof evaluationResultSchema>;

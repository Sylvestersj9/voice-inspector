import { z } from "zod";

export const evaluationSchema = z.object({
  question_area: z.string(),

  overall_judgement: z.enum([
    "Outstanding",
    "Good",
    "Requires improvement to be good",
    "Inadequate",
  ]),

  score4: z.number().int().min(1).max(4),

  rationale: z.string(),

  rubric: z.object({
    risk_identification: z.object({
      band: z.string(),
      evidence: z.string(),
      missing: z.string().optional(),
    }),
    risk_assessment: z.object({
      band: z.string(),
      evidence: z.string(),
      missing: z.string().optional(),
    }),
    risk_management_in_out: z.object({
      band: z.string(),
      evidence: z.string(),
      missing: z.string().optional(),
    }),
    safeguarding_response: z.object({
      band: z.string(),
      evidence: z.string(),
      missing: z.string().optional(),
    }),
    effectiveness_checks: z.object({
      band: z.string(),
      evidence: z.string(),
      missing: z.string().optional(),
    }),
    child_voice_impact: z.object({
      band: z.string(),
      evidence: z.string(),
      missing: z.string().optional(),
    }),
  }),

  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  recommendations: z.array(z.string()).default([]),
  follow_up_questions: z.array(z.string()).default([]),
  next_actions: z.array(z.string()).default([]),
  confidence_band: z.enum(["borderline", "secure", "strong"]).optional(),
  note: z.string().optional(),

  debug: z
    .object({
      wordCount: z.number().optional(),
      evidenceOk: z.boolean().optional(),
      escalationOk: z.boolean().optional(),
      effectivenessOk: z.boolean().optional(),
      impactOk: z.boolean().optional(),
      evidenceHits: z.number().optional(),
      areaKey: z.string().optional(),
      hasEffectivenessText: z.boolean().optional(),
      hasEscalationText: z.boolean().optional(),
    })
    .optional(),
});

export type EvaluationResponse = z.infer<typeof evaluationSchema>;

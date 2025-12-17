import { z } from "zod";

const sentenceSchema = z.object({
  id: z.string(),
  text: z.string(),
});

const strengthSchema = z.object({
  evidence: z.array(z.string()),
  what_worked: z.string(),
  why_it_matters_to_ofsted: z.string(),
});

const weaknessSchema = z.object({
  evidence: z.array(z.string()),
  gap: z.string(),
  risk: z.string(),
  what_ofsted_expected: z.string(),
});

const sentenceImprovementSchema = z.object({
  sentence_id: z.string(),
  original: z.string(),
  issue: z.string(),
  better_version: z.string(),
  synonyms_or_phrases: z.array(z.string()),
  impact: z.string(),
});

const followUpSchema = z.object({
  question: z.string(),
  why: z.string(),
  what_good_looks_like: z.string(),
});

export const evaluationSchema = z.object({
  score: z.number().min(0).max(100),
  band: z.enum(["Inadequate", "Requires Improvement", "Good", "Outstanding"]),
  summary: z.string(),
  strengths: z.array(strengthSchema),
  weaknesses: z.array(weaknessSchema),
  sentence_improvements: z.array(sentenceImprovementSchema),
  missing_key_points: z.array(z.string()),
  follow_up_questions: z.array(followUpSchema),
  score4: z.number().optional(),
  judgement_band: z.string().optional(),
  original_answer: z.string().optional(),
  sentences: z.array(sentenceSchema).optional(),
  question: z.string().optional(),
  question_area: z.string().optional(),
  plan: z.string().optional(),
  debug: z.any().optional(),
});

export type EvaluationResponse = z.infer<typeof evaluationSchema>;

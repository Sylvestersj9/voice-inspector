export interface OfstedQuestion {
  id: number;
  domain: string;
  question: string;
  shortTitle: string;
}

export const ofstedQuestions: OfstedQuestion[] = [
  {
    id: 1,
    domain: "Safeguarding and Risk",
    question: "How do you identify, assess and manage risks to ensure children are safe in and outside the home, and how do you know your safeguarding practice is effective?",
    shortTitle: "Safeguarding",
  },
  {
    id: 2,
    domain: "Children's Progress and Experiences",
    question: "Can you talk through how well the children living here are progressing in education, health and emotional wellbeing, and what evidence you use to judge their progress over time?",
    shortTitle: "Progress",
  },
  {
    id: 3,
    domain: "Children's Voice and Participation",
    question: "How do children influence day-to-day decisions in the home and their own plans, and how do you show that their views are listened to and acted on?",
    shortTitle: "Voice",
  },
  {
    id: 4,
    domain: "Staffing, Training and Culture",
    question: "How do you ensure staffing levels, skills and supervision are sufficient to meet each child's needs, and how do you build a positive, consistent staff culture?",
    shortTitle: "Staffing",
  },
  {
    id: 5,
    domain: "Leadership, Management and Quality Assurance",
    question: "What are the key strengths and weaknesses of this home, and how do you use monitoring, review and learning from incidents or complaints to drive continuous improvement?",
    shortTitle: "Leadership",
  },
];

export type JudgementBand = "Outstanding" | "Good" | "Requires improvement to be good" | "Inadequate";

export interface EvaluationResult {
  score?: number;
  score4?: number;
  judgementBand: JudgementBand;
  strengths: string[];
  gaps: string[];
  weaknesses?: string[];
  recommendations?: string[];
  riskFlags: string[];
  followUpQuestions: string[];
  recommendedActions: string[];
  whatInspectorWantsToHear?: string;
  evidenceToQuoteNextTime?: string[];
  actionPlan7Days?: string[];
  actionPlan30Days?: string[];
  debug?: Record<string, unknown>;
  frameworkAlignment?: string[];
  missingExpectations?: string[];
  evidenceUsed?: string[];
}

export function getJudgementBand(score: number): JudgementBand {
  if (score >= 3.75) return "Outstanding";
  if (score >= 2.75) return "Good";
  if (score >= 1.5) return "Requires improvement to be good";
  return "Inadequate";
}

export function getJudgementColor(band: JudgementBand): string {
  switch (band) {
    case "Outstanding":
      return "outstanding";
    case "Good":
      return "good";
    case "Requires Improvement":
      return "requires-improvement";
    case "Inadequate":
      return "inadequate";
  }
}

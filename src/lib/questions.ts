export type Domain =
  | "Safeguarding"
  | "Leadership"
  | "CarePlanning"
  | "StaffPractice"
  | "Outcomes"
  | "RiskMissingExploitation";

export type BankQuestion = { id: string; domain: Domain; text: string };

export const questionBank: BankQuestion[] = [
  // Safeguarding
  { id: "sg-1", domain: "Safeguarding", text: "Talk me through the last safeguarding incident: how it was identified, recorded, escalated, and what changed for the child as a result." },
  { id: "sg-2", domain: "Safeguarding", text: "How do staff recognise emerging risks (online, peers, community) and what tools or logs show you picked these up early?" },
  { id: "sg-3", domain: "Safeguarding", text: "When you disagreed with a partner agency decision, how did you challenge and evidence the outcome for the child?" },
  { id: "sg-4", domain: "Safeguarding", text: "How do you assure yourself that safety plans are followed on every shift and reviewed after incidents?" },
  { id: "sg-5", domain: "Safeguarding", text: "Explain your referral thresholds (MASH/LADO/police) and show a recent example where you escalated quickly." },
  { id: "sg-6", domain: "Safeguarding", text: "How do you capture and use child voice in safeguarding decisions, and where is that evidenced?" },
  // Leadership
  { id: "ld-1", domain: "Leadership", text: "What are the top three weaknesses in this home and what evidence shows your actions are reducing those risks?" },
  { id: "ld-2", domain: "Leadership", text: "How do you use audits, supervision, and dip-sampling to check consistency, and what changed after the last review?" },
  { id: "ld-3", domain: "Leadership", text: "Describe how you challenge underperformance and how you know the support plan worked." },
  { id: "ld-4", domain: "Leadership", text: "How do you ensure learning from incidents/complaints is embedded and tracked for impact?" },
  { id: "ld-5", domain: "Leadership", text: "Show me how you prioritise and track actions from monitoring visits or internal QA." },
  { id: "ld-6", domain: "Leadership", text: "How do you assure yourself that delegation to seniors is safe and evidenced?" },
  // Care planning
  { id: "cp-1", domain: "CarePlanning", text: "How do you know each child's plan is current, and what evidence shows the plan was adapted after new risks or progress?" },
  { id: "cp-2", domain: "CarePlanning", text: "Describe a recent placement match decision: what risks were considered and how did you mitigate them?" },
  { id: "cp-3", domain: "CarePlanning", text: "How do you involve children and families in reviews, and where is their feedback recorded and acted on?" },
  { id: "cp-4", domain: "CarePlanning", text: "What happens when a plan is not working—who is involved, how quickly, and what evidence shows the change made a difference?" },
  { id: "cp-5", domain: "CarePlanning", text: "How do you ensure education and health plans are implemented daily and monitored for impact?" },
  { id: "cp-6", domain: "CarePlanning", text: "Explain how you manage transitions (moves in/out): preparation, risk review, and follow-up on impact." },
  // Staff practice
  { id: "sp-1", domain: "StaffPractice", text: "How do you know staff follow safer working guidance on every shift—what checks or observations do you use?" },
  { id: "sp-2", domain: "StaffPractice", text: "Describe how supervision improves practice and give a recent example where it changed staff behaviour." },
  { id: "sp-3", domain: "StaffPractice", text: "How do you allocate shifts to manage risk and match skills, and how is this reviewed?" },
  { id: "sp-4", domain: "StaffPractice", text: "When staff practice fell short, what corrective action was taken and how did you evidence improvement?" },
  { id: "sp-5", domain: "StaffPractice", text: "How do new staff become competent quickly, and how do you test their understanding of key risks?" },
  { id: "sp-6", domain: "StaffPractice", text: "What learning themes have come from team meetings or debriefs, and how do you know they stuck?" },
  // Outcomes
  { id: "oc-1", domain: "Outcomes", text: "How do you measure progress in education, health, and emotional wellbeing, and what trends have you seen this term?" },
  { id: "oc-2", domain: "Outcomes", text: "Give an example where a child's outcome improved—what you did, evidence used, and how you tracked sustainability." },
  { id: "oc-3", domain: "Outcomes", text: "How do you know children feel safe and listened to, and where have you adapted practice based on their feedback?" },
  { id: "oc-4", domain: "Outcomes", text: "Describe how you respond when outcomes stall: who you involve, what you change, and how you review impact." },
  { id: "oc-5", domain: "Outcomes", text: "What data do you use (attendance, missing, incidents) to judge progress, and how does it inform plans?" },
  { id: "oc-6", domain: "Outcomes", text: "How do you evidence that your work has reduced risk-taking behaviours for a child?" },
  // Risk / missing / exploitation
  { id: "rm-1", domain: "RiskMissingExploitation", text: "How do you plan for missing/exploitation risks and what changed after the last missing episode?" },
  { id: "rm-2", domain: "RiskMissingExploitation", text: "Explain how you work with police and other agencies to disrupt exploitation—give a recent example." },
  { id: "rm-3", domain: "RiskMissingExploitation", text: "How do you use return home interviews to update plans, and where is that evidenced?" },
  { id: "rm-4", domain: "RiskMissingExploitation", text: "What patterns or hotspots have you identified for missing or exploitation, and what actions came from that analysis?" },
  { id: "rm-5", domain: "RiskMissingExploitation", text: "How do staff prepare children before community time to reduce risk, and how is this checked?" },
  { id: "rm-6", domain: "RiskMissingExploitation", text: "Describe a time you escalated concerns about exploitation—who you involved and the outcome." },
];

export const ofstedQuestions = questionBank.slice(0, 6).map((q, idx) => ({
  id: idx + 1,
  domain: q.domain,
  question: q.text,
  shortTitle: q.domain,
}));

export type JudgementBand =
  | "Outstanding"
  | "Good"
  | "Requires improvement to be good"
  | "Requires Improvement"
  | "Inadequate";

export interface EvaluationResult {
  score?: number;
  score4?: number;
  rawScore100?: number;
  judgementBand: JudgementBand;
  confidenceBand?: "borderline" | "secure" | "strong";
  note?: string;
  strengths: string[];
  relevance?: number;
  strengthsStructured?: Array<{
    evidence: string[];
    whatWorked: string;
    whyMatters: string;
  }>;
  gaps: string[];
  weaknesses?: string[];
  recommendations?: string[];
  riskFlags: string[];
  followUpQuestions: string[];
  recommendedActions: string[];
  whatInspectorWantsToHear?: string;
  weaknessesStructured?: Array<{
    evidence: string[];
    gap: string;
    risk: string;
    expected: string;
  }>;
  sentences?: Array<{ id: string; text: string }>;
  sentenceImprovements?: Array<{
    sentenceId: string;
    original: string;
    issue: string;
    betterVersion: string;
    synonymsOrPhrases: string[];
    impact: string;
  }>;
  missingKeyPoints?: string[];
  rawFollowUps?: Array<{ question: string; why: string; whatGoodLooksLike: string }>;
  rawSummary?: string;
  rawBand?: JudgementBand;
  debug?: Record<string, unknown>;
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

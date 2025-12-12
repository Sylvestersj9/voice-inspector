import { EvaluationResult } from "./questions";

export interface FollowUpContext {
  score: number;
  transcript: string;
  evaluation: EvaluationResult;
  domain: string;
  attemptIndex: number;
}

export interface FollowUpDecision {
  shouldFollowUp: boolean;
  reason: string;
  question: string;
}

const FOLLOW_UP_TEMPLATES = {
  noExample: "Can you give me a recent, specific example of this in practice – what you did, and what changed as a result?",
  noMonitoring: "How do you monitor the effectiveness of this approach, and how often?",
  noImpact: "What impact has this had for children, and how do you know?",
  safeguardingVague: "How do leaders audit safeguarding concerns and ensure appropriate escalation?",
};

export function detectFollowUpNeed(context: FollowUpContext): FollowUpDecision {
  const { score, transcript, evaluation, attemptIndex } = context;
  
  // Max 2 follow-ups per question
  if (attemptIndex >= 2) {
    return { shouldFollowUp: false, reason: "max_attempts", question: "" };
  }

  const lowerTranscript = transcript.toLowerCase();
  
  // Check for specific gaps that warrant follow-up
  
  // 1. Score <= 3 always gets a follow-up offer
  if (score <= 3) {
    // Determine the type of follow-up based on detected gaps
    
    // No concrete example detected
    const hasExample = /for example|recently|last month|last week|specific case|one child|one situation/i.test(transcript);
    if (!hasExample) {
      return {
        shouldFollowUp: true,
        reason: "no_example",
        question: FOLLOW_UP_TEMPLATES.noExample,
      };
    }

    // Monitoring unclear
    const hasMonitoring = /monitor|review|audit|check|track|measure|regular|weekly|monthly|supervision/i.test(transcript);
    if (!hasMonitoring) {
      return {
        shouldFollowUp: true,
        reason: "no_monitoring",
        question: FOLLOW_UP_TEMPLATES.noMonitoring,
      };
    }

    // Impact unclear  
    const hasImpact = /impact|outcome|result|improved|better|changed|difference|progress/i.test(transcript);
    if (!hasImpact) {
      return {
        shouldFollowUp: true,
        reason: "no_impact",
        question: FOLLOW_UP_TEMPLATES.noImpact,
      };
    }

    // Safeguarding vague (for safeguarding domain)
    if (context.domain.toLowerCase().includes('safeguard')) {
      const hasSafeguardingDetail = /designated|lado|escalate|threshold|strategy meeting|referral/i.test(transcript);
      if (!hasSafeguardingDetail) {
        return {
          shouldFollowUp: true,
          reason: "safeguarding_vague",
          question: FOLLOW_UP_TEMPLATES.safeguardingVague,
        };
      }
    }

    // Default follow-up for low scores
    return {
      shouldFollowUp: true,
      reason: "low_score",
      question: evaluation.followUpQuestions[0] || FOLLOW_UP_TEMPLATES.noExample,
    };
  }

  // Score > 3 but still might need follow-up for completeness
  if (score <= 4 && evaluation.gaps.length > 0) {
    // Check if the AI has suggested a follow-up
    if (evaluation.followUpQuestions.length > 0) {
      return {
        shouldFollowUp: true,
        reason: "has_gaps",
        question: evaluation.followUpQuestions[0],
      };
    }
  }

  return { shouldFollowUp: false, reason: "score_sufficient", question: "" };
}

export function getFollowUpLabel(attemptIndex: number, maxAttempts: number = 2): string {
  return `Follow-up ${attemptIndex} of ${maxAttempts}`;
}

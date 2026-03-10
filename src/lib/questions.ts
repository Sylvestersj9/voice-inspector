// InspectReady — Children's Home Inspection Question Bank
// Based on the 9 Quality Standards from Children's Homes (England) Regulations 2015
// 2 variants per domain — 1 randomly selected per session

export type Domain =
  | "QualityPurpose"
  | "ChildrenViews"
  | "Education"
  | "EnjoymentAchievement"
  | "HealthWellbeing"
  | "PositiveRelationships"
  | "ProtectionChildren"
  | "LeadershipManagement"
  | "CarePlanning";

export const DOMAIN_LABELS: Record<Domain, string> = {
  QualityPurpose: "Quality and Purpose of Care",
  ChildrenViews: "Children's Views, Wishes and Feelings",
  Education: "Education",
  EnjoymentAchievement: "Enjoyment and Achievement",
  HealthWellbeing: "Health and Wellbeing",
  PositiveRelationships: "Positive Relationships",
  ProtectionChildren: "Protection of Children",
  LeadershipManagement: "Leadership and Management",
  CarePlanning: "Care Planning",
};

export const DOMAIN_TAGS: Record<Domain, string> = {
  QualityPurpose: "Core Standard",
  ChildrenViews: "Core Standard",
  Education: "Core Standard",
  EnjoymentAchievement: "Core Standard",
  HealthWellbeing: "Core Standard",
  PositiveRelationships: "Core Standard",
  ProtectionChildren: "LIMITING JUDGEMENT",
  LeadershipManagement: "Core Standard",
  CarePlanning: "Core Standard",
};

export const DOMAIN_ORDER: Domain[] = [
  "QualityPurpose",
  "ChildrenViews",
  "Education",
  "EnjoymentAchievement",
  "HealthWellbeing",
  "PositiveRelationships",
  "ProtectionChildren",
  "LeadershipManagement",
  "CarePlanning",
];

export type BankQuestion = {
  id: string;
  domain: Domain;
  text: string;
  hint: string;
  followUpQuestions: string[];
};

export const questionBank: BankQuestion[] = [
  // ── Domain 1: Quality and Purpose of Care ────────────────────────────────
  {
    id: "qp-a",
    domain: "QualityPurpose",
    text: "How do you ensure your statement of purpose accurately reflects the care you actually deliver day to day — and when did you last review it?",
    hint: "Inspector is looking for evidence the SOP is a living document, not filed away. Reference specific review dates and examples of updates made.",
    followUpQuestions: [
      "What triggered the last update to your statement of purpose?",
      "How do you ensure all staff understand and work within it?",
      "What would you change about your current provision to better align with your stated purpose?",
    ],
  },
  {
    id: "qp-b",
    domain: "QualityPurpose",
    text: "How do you ensure the home's ethos and values are understood and lived by all staff — not just written in a policy?",
    hint: "Inspector wants to hear how values translate into daily practice. Think supervision, team meetings, induction, and observable staff behaviour.",
    followUpQuestions: [
      "How would a new member of staff learn what this home stands for?",
      "Can you give an example of a time staff practice didn't reflect your values and how you addressed it?",
      "How do young people experience the ethos of this home day to day?",
    ],
  },

  // ── Domain 2: Children's Views, Wishes and Feelings ──────────────────────
  {
    id: "cv-a",
    domain: "ChildrenViews",
    text: "How do you ensure young people's views genuinely influence decisions about their care — not just recorded but acted upon?",
    hint: "Inspector wants evidence of co-production, not consultation theatre. Think care plan reviews, house meetings, complaints outcomes, and changes made as a result of young people's feedback.",
    followUpQuestions: [
      "Give me a specific example where a young person's view changed something in the home.",
      "How do you evidence that wishes and feelings have been considered in decisions?",
      "What happens when a young person's wishes conflict with their safety?",
    ],
  },
  {
    id: "cv-b",
    domain: "ChildrenViews",
    text: "If I spoke to a young person in your home today, what would they tell me about how staff listen to them?",
    hint: "Think about this from the young person's perspective. Inspector may actually speak to young people — your answer must be honest and grounded in reality.",
    followUpQuestions: [
      "How do you support young people who find it difficult to express their views?",
      "How do you ensure quieter or more withdrawn young people have equal voice?",
      "What feedback have young people given you recently?",
    ],
  },

  // ── Domain 3: Education ───────────────────────────────────────────────────
  {
    id: "ed-a",
    domain: "Education",
    text: "How do you promote and support educational engagement for young people who are disengaged or have significant gaps in their schooling?",
    hint: "Think about what you do beyond getting them to school. Personal Education Plans, relationships with virtual school heads, celebrating progress however small.",
    followUpQuestions: [
      "What do you do when a young person refuses to attend school?",
      "How do you ensure PEPs are meaningful and not a tick-box exercise?",
      "How do you work with the virtual school head for looked-after children?",
    ],
  },
  {
    id: "ed-b",
    domain: "Education",
    text: "What do you do when a young person arrives at your home with no school place arranged?",
    hint: "Inspector wants to see urgency, advocacy, and a clear interim plan. How quickly do you act and who do you contact?",
    followUpQuestions: [
      "How do you ensure education continues during the gap between admission and a school place being secured?",
      "What is your relationship with the local authority education team?",
      "How do you document and evidence educational provision for a child without a school place?",
    ],
  },

  // ── Domain 4: Enjoyment and Achievement ──────────────────────────────────
  {
    id: "ea-a",
    domain: "EnjoymentAchievement",
    text: "How do you ensure young people have access to hobbies and activities that are genuinely meaningful to them — not just what is convenient for the home?",
    hint: "Inspector is looking for individualised provision, not a standard activity rota. Think about how you find out what each young person enjoys and how you resource it.",
    followUpQuestions: [
      "Give me an example of an activity or interest you supported for a young person that required real effort to arrange.",
      "How do you balance risk management with allowing young people age-appropriate freedom?",
      "How do you ensure young people with no prior experience of hobbies or interests are supported to discover them?",
    ],
  },
  {
    id: "ea-b",
    domain: "EnjoymentAchievement",
    text: "How do you balance keeping young people safe with allowing them the freedom to have normal experiences for their age?",
    hint: "Inspector wants to see proportionate risk management, not blanket restriction. Think about individual risk assessments, the child's right to a childhood, and how you make decisions.",
    followUpQuestions: [
      "Can you give an example of a risk you agreed to take with a young person and how you managed it?",
      "How do you involve young people in their own risk assessments?",
      "What would you do if a young person wanted to do something their placing authority had restricted?",
    ],
  },

  // ── Domain 5: Health and Wellbeing ───────────────────────────────────────
  {
    id: "hw-a",
    domain: "HealthWellbeing",
    text: "How do you ensure young people's physical and mental health needs are identified and actively addressed from day one of placement?",
    hint: "Think about health assessments at admission, GP and dentist registration, CAMHS referral pathways, and how health needs in the referral are actioned immediately.",
    followUpQuestions: [
      "What is your process for ensuring a child is registered with a GP within the first week of placement?",
      "How do you manage health needs that were not identified in the referral?",
      "How do you record and monitor health appointments and follow-up actions?",
    ],
  },
  {
    id: "hw-b",
    domain: "HealthWellbeing",
    text: "A young person has been waiting six months for a CAMHS assessment and their mental health is visibly deteriorating — what do you do?",
    hint: "Inspector wants to see advocacy, escalation, and creative interim support. Waiting passively is not an acceptable answer.",
    followUpQuestions: [
      "How do you document deteriorating mental health in the absence of a formal diagnosis?",
      "Who would you escalate to if CAMHS wait times were causing risk?",
      "What interim emotional support do you put in place while waiting for specialist services?",
    ],
  },

  // ── Domain 6: Positive Relationships ─────────────────────────────────────
  {
    id: "pr-a",
    domain: "PositiveRelationships",
    text: "How do you support young people to maintain safe and meaningful relationships with family members and people who are important to them?",
    hint: "Think about contact arrangements, how you manage risk around family contact, and how you support young people emotionally around family relationships.",
    followUpQuestions: [
      "How do you manage contact with birth family when there are safeguarding concerns?",
      "How do you support a young person who is grieving the loss of family relationships?",
      "How do you record and review contact arrangements as the young person's needs change?",
    ],
  },
  {
    id: "pr-b",
    domain: "PositiveRelationships",
    text: "How do your staff build genuine trusted relationships with young people — and how do you evidence that those relationships are having a positive impact?",
    hint: "Inspector wants to see relationship-based practice, not procedural compliance. Think about keyworker systems, continuity of staffing, and observable outcomes.",
    followUpQuestions: [
      "How do you ensure continuity of relationships when staff leave or shift patterns change?",
      "How do you evidence the impact of staff-young person relationships on outcomes?",
      "What do you do when a young person refuses to engage with their allocated keyworker?",
    ],
  },

  // ── Domain 7: Protection of Children (LIMITING JUDGEMENT) ────────────────
  {
    id: "pc-a",
    domain: "ProtectionChildren",
    text: "How do you identify and respond to signs that a young person may be at risk of child sexual exploitation, criminal exploitation, or radicalisation?",
    hint: "Inspector wants to see specific indicators you look for, your referral pathway, multi-agency communication, and how risk information transfers across shifts.",
    followUpQuestions: [
      "What specific behavioural indicators would trigger a MASH referral?",
      "How is exploitation risk information communicated between day and night shifts?",
      "Can you evidence a recent example where you escalated a concern about a young person's safety outside the home?",
    ],
  },
  {
    id: "pc-b",
    domain: "ProtectionChildren",
    text: "Walk me through your missing from care protocol from the moment a young person is unaccounted for to when they return and the return home interview is completed.",
    hint: "Inspector wants a clear timeline with decision-making owners at each stage. Who decides what, and when? How is the return home interview conducted and by whom?",
    followUpQuestions: [
      "Who holds responsibility for decision-making during a missing episode on a night shift?",
      "How do you identify and respond to patterns in missing episodes for a young person?",
      "What does a high-quality return home interview look like and how do you record the outcomes?",
    ],
  },

  // ── Domain 8: Leadership and Management ──────────────────────────────────
  {
    id: "lm-a",
    domain: "LeadershipManagement",
    text: "How do you use your Regulation 44 and Regulation 45 reports to drive genuine improvement — and give me a specific example of a change you made as a direct result?",
    hint: "Inspector wants to see the quality improvement loop: findings, actions, follow-through, and measurable impact on children's experience. Not just a filed report.",
    followUpQuestions: [
      "How do you ensure Regulation 44 visitors have genuine independence and are not just confirming what you want to hear?",
      "What was the most significant finding from your last Regulation 45 report and what changed as a result?",
      "How do you share learning from Regulation 44 and 45 findings with your staff team?",
    ],
  },
  {
    id: "lm-b",
    domain: "LeadershipManagement",
    text: "How do you quality assure the practice of your staff team on a day-to-day basis — beyond formal supervision?",
    hint: "Think about observation of practice, handover quality, daily log review, how you pick up on drift in standards before it becomes a problem.",
    followUpQuestions: [
      "How would you know if a staff member's practice was deteriorating between supervision sessions?",
      "What do you do when you observe practice that does not meet the standard you expect?",
      "How do you ensure agency or bank staff maintain the same standards as permanent staff?",
    ],
  },

  // ── Domain 9: Care Planning ───────────────────────────────────────────────
  {
    id: "cp-a",
    domain: "CarePlanning",
    text: "How are young people meaningfully involved in their own care plans — and how do you ensure they genuinely understand and shape what is in them?",
    hint: "Inspector wants co-production evidence, not just a signature on a document. Think about accessibility, language, and how you adapt the process for young people with communication needs.",
    followUpQuestions: [
      "If an inspector spoke to a young person in your home, could they explain what their care plan says about them?",
      "How do you adapt the care planning process for young people with communication difficulties or learning needs?",
      "How do you handle a young person who refuses to engage with their care plan review?",
    ],
  },
  {
    id: "cp-b",
    domain: "CarePlanning",
    text: "How do you ensure care plans are reviewed and updated when a young person's needs change significantly — not just at formal review dates?",
    hint: "Inspector wants to see responsive, dynamic care planning. Think about what triggers an unplanned review and how quickly that translates into updated documentation.",
    followUpQuestions: [
      "Give me an example of when you updated a care plan outside of the formal review cycle and what triggered it.",
      "How do you ensure the placing authority is informed and aligned when care plans are updated?",
      "How do you ensure all staff are aware of significant changes to a care plan in a timely way?",
    ],
  },

  // ── Domain 9 continued ────────────────────────────────────────────────────
  {
    id: "cp-c",
    domain: "CarePlanning",
    text: "How do you ensure a young person placed at short notice receives the same quality of assessment and care planning as a planned placement?",
    hint: "Inspector wants to see that emergency doesn't mean poor planning. Think about your admissions process, what you gather on day one, and how quickly you complete the initial placement plan.",
    followUpQuestions: [
      "What is the minimum information you need before accepting an emergency placement?",
      "How do you risk assess a short-notice placement for existing young people in the home?",
      "How quickly do you expect an initial placement plan to be completed and who is responsible?",
    ],
  },
  {
    id: "cp-d",
    domain: "CarePlanning",
    text: "How do you manage the transition out of your home — whether to independence, family reunification, or another placement — through the care planning process?",
    hint: "Think about how far in advance you start transition planning, who is involved, and how you support young people emotionally and practically through leaving.",
    followUpQuestions: [
      "How do you support a young person who doesn't want to leave?",
      "What does a good pathway plan look like and how do you contribute to it?",
      "How do you maintain contact with young people who have left to monitor how the transition went?",
    ],
  },

  // ── Domain 1 additional ───────────────────────────────────────────────────
  {
    id: "qp-c",
    domain: "QualityPurpose",
    text: "Describe the atmosphere in your home. What would a visitor notice about the culture and environment within the first five minutes of arriving?",
    hint: "Inspector wants to understand your ethos in practice. Think about staff-young people interactions, warmth, the physical environment, noise levels, and how young people have influenced their home.",
    followUpQuestions: [
      "How do young people influence the physical environment and décor of the home?",
      "How does the atmosphere in your home change when you're not present?",
      "What would you want a young person to feel the moment they walked through the door for the first time?",
    ],
  },
  {
    id: "qp-d",
    domain: "QualityPurpose",
    text: "How do you ensure your home genuinely feels like a home for the young people living there — not just a care setting?",
    hint: "Think about personalisation of bedrooms, food choices, daily routines that young people shape, and how much say they have in household decisions.",
    followUpQuestions: [
      "How do young people influence the food, routines, and household decisions in your home?",
      "What would a young person say makes your home feel different from other placements they've had?",
      "How do you balance the regulatory requirements of running a registered home with creating a normal home environment?",
    ],
  },

  // ── Domain 2 additional ───────────────────────────────────────────────────
  {
    id: "cv-c",
    domain: "ChildrenViews",
    text: "What is your complaints process, and can you give me a specific example of a complaint from a young person that led to a meaningful change in your home?",
    hint: "Inspector wants to see the complaints process as a genuine tool for improvement, not just a compliance mechanism. A real example with a real outcome is essential.",
    followUpQuestions: [
      "How do you ensure young people know how to complain and feel safe doing so?",
      "What happens when a complaint is made about a specific member of staff?",
      "How do you record and review complaints patterns over time?",
    ],
  },
  {
    id: "cv-d",
    domain: "ChildrenViews",
    text: "How do you ensure young people in your home understand their rights — including the right to independent advocacy?",
    hint: "Think about how rights are explained accessibly, how advocacy services are made available, and whether young people know how to contact Ofsted directly.",
    followUpQuestions: [
      "How do you explain a young person's right to complain to Ofsted in a way they can understand?",
      "Have you ever supported a young person to access independent advocacy, and what did that look like?",
      "How do you ensure young people know their rights without it feeling like a legal briefing?",
    ],
  },

  // ── Domain 3 additional ───────────────────────────────────────────────────
  {
    id: "ed-c",
    domain: "Education",
    text: "How do you ensure young people who are not in mainstream education still have structured, meaningful daytime provision?",
    hint: "Inspector expects you to know exactly what each young person does during school hours. Staying in bed is not an acceptable answer — what is your plan?",
    followUpQuestions: [
      "What does a typical weekday look like for a young person without a school place?",
      "How do you document and evidence educational provision when there is no school placement?",
      "How do you advocate for alternative provision when a young person has been out of education for months?",
    ],
  },
  {
    id: "ed-d",
    domain: "Education",
    text: "How do you work collaboratively with the virtual school head to ensure educational outcomes improve for young people in your home?",
    hint: "Think about the frequency and quality of communication, how you contribute to PEPs, what you ask the VSH for, and whether you challenge them when needed.",
    followUpQuestions: [
      "How often do you speak directly with the virtual school head and what do those conversations cover?",
      "Have you ever disagreed with the virtual school head's approach — and if so, how did you handle it?",
      "How do you ensure PEPs reflect the young person's actual aspirations and not just school targets?",
    ],
  },

  // ── Domain 4 additional ───────────────────────────────────────────────────
  {
    id: "ea-c",
    domain: "EnjoymentAchievement",
    text: "Tell me about a young person in your home who has had a significant achievement recently. How did you support that and how was it celebrated?",
    hint: "Be specific — inspector wants a real example, not a generic answer. The achievement doesn't have to be academic. Think about personal milestones for a young person who may never have been celebrated before.",
    followUpQuestions: [
      "How do you record and evidence achievements for young people in their care records?",
      "How do you celebrate achievements in ways that are meaningful to the individual young person?",
      "How do you support young people who find it hard to recognise or accept their own achievements?",
    ],
  },
  {
    id: "ea-d",
    domain: "EnjoymentAchievement",
    text: "How do you ensure young people in your home have access to cultural, creative, or sporting opportunities that are genuinely meaningful to them — and how were those opportunities identified?",
    hint: "Inspector is looking for individualised provision driven by young people's interests, not a standard activity rota imposed by the home.",
    followUpQuestions: [
      "How do you identify what activities or interests a young person has — particularly if they've never had the opportunity to explore them?",
      "What do you do when cost or transport is a barrier to a young person pursuing an interest?",
      "How do you ensure these activities aren't cancelled when staffing is tight?",
    ],
  },

  // ── Domain 5 additional ───────────────────────────────────────────────────
  {
    id: "hw-c",
    domain: "HealthWellbeing",
    text: "How do you promote healthy lifestyles and positive physical health for young people who may have experienced significant neglect or deprivation?",
    hint: "Think about food, sleep, dental health, exercise — and how you normalise these things without being judgmental about young people's histories or families.",
    followUpQuestions: [
      "How do you support a young person who has never had a routine around food or sleep?",
      "How do you manage dental health for young people who have had no previous dental care?",
      "How do you talk to young people about physical health in a way that feels supportive rather than critical of their past?",
    ],
  },
  {
    id: "hw-d",
    domain: "HealthWellbeing",
    text: "Walk me through your medication management process — how do you ensure it is safe, well-documented, and understood by the young person themselves?",
    hint: "Inspector wants specifics: who administers, storage, recording systems, PRN protocols, error reporting, and whether young people understand what they are taking and why.",
    followUpQuestions: [
      "What happens when a medication error occurs — walk me through the process from discovery to resolution?",
      "How do you ensure young people are involved in decisions about their own medication?",
      "How do you manage medication for young people who refuse to take it?",
    ],
  },

  // ── Domain 6 additional ───────────────────────────────────────────────────
  {
    id: "pr-c",
    domain: "PositiveRelationships",
    text: "How do you manage situations where peer relationships between young people in your home become harmful or damaging — including peer-on-peer abuse?",
    hint: "Think about placement compatibility, risk assessment of relationships, how you respond to peer-on-peer concerns, and how you maintain safety for all young people.",
    followUpQuestions: [
      "How do you assess the compatibility of young people before accepting a new placement?",
      "What would you do if a young person disclosed that another young person in the home had harmed them?",
      "How do you support both a victim and a perpetrator of peer-on-peer abuse within the same home?",
    ],
  },
  {
    id: "pr-d",
    domain: "PositiveRelationships",
    text: "How do you support young people who have no meaningful positive relationships outside the home — and what do you do to help them build them?",
    hint: "Think about what you actively do to help isolated young people form connections — community involvement, mentoring, reconnection with family, peer groups.",
    followUpQuestions: [
      "How do you support a young person who has been rejected by or estranged from their entire family?",
      "What community connections have you helped a young person make during their time in your home?",
      "How do you ensure the relationships young people build in your home can continue when they leave?",
    ],
  },

  // ── Domain 7 additional ───────────────────────────────────────────────────
  {
    id: "pc-c",
    domain: "ProtectionChildren",
    text: "How do you ensure your staff are equipped to recognise and respond to online exploitation risks — including grooming, harmful content, and county lines recruitment online?",
    hint: "Think about online safety training, device policies, proportionate monitoring, and how staff actually have these conversations with young people.",
    followUpQuestions: [
      "How do you manage young people's access to devices and social media in a way that is proportionate and rights-respecting?",
      "What training have staff received on online exploitation in the last 12 months?",
      "How do you talk to a young person about online safety without it feeling like surveillance?",
    ],
  },
  {
    id: "pc-d",
    domain: "ProtectionChildren",
    text: "A young person returns home late at night in a distressed state and begins to make a partial disclosure about something that has happened to them. Walk me through exactly what happens next.",
    hint: "Inspector wants a clear, child-centred response: immediate welfare, who you contact, when, recording, forensic awareness, and how you balance the young person's wishes with their safety.",
    followUpQuestions: [
      "At what point does a partial disclosure become a referral to children's services?",
      "How do you ensure the young person's account is preserved and not contaminated by excessive questioning?",
      "How do you support the young person through the night while also meeting your statutory obligations?",
    ],
  },

  // ── Domain 8 additional ───────────────────────────────────────────────────
  {
    id: "lm-c",
    domain: "LeadershipManagement",
    text: "How do you identify and address poor practice in your staff team before it becomes embedded or causes harm to young people?",
    hint: "Think beyond formal supervision — observation of practice, handover quality, daily log review, informal conversations, what you notice and how quickly you act.",
    followUpQuestions: [
      "How would you know if a member of staff's practice was deteriorating between supervision sessions?",
      "What does your capability process look like in practice — and have you ever used it?",
      "How do you address poor practice in agency or bank staff who are not directly employed by you?",
    ],
  },
  {
    id: "lm-d",
    domain: "LeadershipManagement",
    text: "How do you ensure your staffing model genuinely supports the needs of the specific young people in your home — including at night, at weekends, and during school hours?",
    hint: "Think about rota design, skill mix, agency use, and whether the right staff are on at the right time given the individual needs of current young people.",
    followUpQuestions: [
      "How do you adjust your staffing model when the needs of young people in the home change significantly?",
      "How do you manage continuity of care during periods of high staff absence or turnover?",
      "What is your approach to managing agency use and ensuring agency staff maintain your home's standards?",
    ],
  },
];

export type JudgementBand =
  | "Outstanding"
  | "Good"
  | "Requires Improvement"
  | "Inadequate";

export interface EvaluationResult {
  score: number;
  band: JudgementBand;
  summary: string;
  strengths: string[];
  gaps: string[];
  followUpQuestion: string;
  inspectorNote: string;
  riskFlags?: string[];
}

export function getJudgementBand(score: number): JudgementBand {
  if (score >= 3.5) return "Outstanding";
  if (score >= 2.5) return "Good";
  if (score >= 1.5) return "Requires Improvement";
  return "Inadequate";
}

export function getJudgementColor(band: JudgementBand): string {
  switch (band) {
    case "Outstanding": return "outstanding";
    case "Good": return "good";
    case "Requires Improvement": return "requires-improvement";
    case "Inadequate": return "inadequate";
    default: return "requires-improvement";
  }
}

export function getBandColorClass(band: string): string {
  switch (band) {
    case "Outstanding": return "bg-emerald-50 text-emerald-800 border-emerald-200";
    case "Good": return "bg-teal-50 text-teal-800 border-teal-200";
    case "Requires Improvement": return "bg-amber-50 text-amber-800 border-amber-200";
    case "Inadequate": return "bg-red-50 text-red-800 border-red-200";
    default: return "bg-slate-50 text-slate-800 border-slate-200";
  }
}

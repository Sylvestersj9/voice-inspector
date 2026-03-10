// InspectReady — Fit Person Interview Question Bank
// For managers registering a new children's home or supported accommodation
// 8 question areas, 3 variants each, 1 randomly selected per session

export type FitPersonArea =
  | "Regulations"
  | "Safeguarding"
  | "Leadership"
  | "TraumaInformed"
  | "StatementOfPurpose"
  | "MultiAgency"
  | "QualityAssurance"
  | "SeriousIncident";

export const FIT_PERSON_AREA_LABELS: Record<FitPersonArea, string> = {
  Regulations: "Knowledge of Regulations and Quality Standards",
  Safeguarding: "Safeguarding and Risk Management",
  Leadership: "Leadership Philosophy and Staff Management",
  TraumaInformed: "Trauma-Informed and Attachment-Based Care",
  StatementOfPurpose: "Statement of Purpose and Home Vision",
  MultiAgency: "Multi-Agency Working and Partnerships",
  QualityAssurance: "Quality Assurance and Continuous Improvement",
  SeriousIncident: "Handling Serious Incidents and Placement Breakdown",
};

export type FitPersonQuestion = {
  id: string;
  area: FitPersonArea;
  text: string;
  hint: string;
  followUpQuestions: string[];
};

export const fitPersonQuestionBank: FitPersonQuestion[] = [
  // ── Area 1: Knowledge of Regulations and Quality Standards ────────────────
  {
    id: "fp-reg-1",
    area: "Regulations",
    text: "The Children's Homes (England) Regulations 2015 set out nine quality standards. Walk me through the ones you consider most important for the type of home you are proposing to register — and explain why.",
    hint: "Demonstrate deep knowledge of the regulations, not just a list. Explain how the standards interrelate, why certain standards are particularly critical for your proposed home type, and what good practice looks like in each area.",
    followUpQuestions: [
      "Which quality standard do you think is most commonly misunderstood by new managers — and why?",
      "How would you know if your home was genuinely meeting the Protection of Children standard rather than just complying with it on paper?",
      "What changes in the 2015 regulations most significantly changed how children's homes operate, in your view?",
    ],
  },
  {
    id: "fp-reg-2",
    area: "Regulations",
    text: "If Ofsted conducted an unannounced inspection of your home on its first day of operation, what evidence would you want them to see — and what would you be most concerned might not yet be in place?",
    hint: "Show honest self-awareness alongside knowledge of regulatory requirements. Demonstrate you understand what inspectors look for beyond compliance paperwork.",
    followUpQuestions: [
      "What systems or processes would be your top priority to establish in week one?",
      "How would you ensure young people could meaningfully engage with the inspection from day one?",
      "What would you do if you identified a compliance gap during the inspection?",
    ],
  },
  {
    id: "fp-reg-3",
    area: "Regulations",
    text: "Ofsted introduced the Social Care Common Inspection Framework (SCCIF) in 2019. How does the SCCIF shape how you would approach leadership and governance in your proposed home?",
    hint: "Demonstrate understanding of the SCCIF's emphasis on impact rather than compliance, how judgements are made, and what Outstanding leadership looks like under the framework.",
    followUpQuestions: [
      "What is the difference between a home that is compliant and one that is Outstanding under the SCCIF?",
      "How does the SCCIF's focus on the lived experience of children influence your approach to quality assurance?",
      "What would you do if your Regulation 45 self-assessment and Ofsted's judgement were significantly different?",
    ],
  },

  // ── Area 2: Safeguarding and Risk Management ──────────────────────────────
  {
    id: "fp-sg-1",
    area: "Safeguarding",
    text: "What is your personal safeguarding philosophy — and how would you ensure that philosophy is reflected in the culture of every shift in your proposed home?",
    hint: "Go beyond stating you take safeguarding seriously. Articulate a specific philosophy, how it translates into daily practice, and how you would embed it from day one.",
    followUpQuestions: [
      "How would you respond if you discovered that a member of staff had failed to record a safeguarding concern they had observed?",
      "How do you ensure that safeguarding does not become procedural compliance rather than genuine protection?",
      "What would you do if the placing authority disagreed with your safeguarding risk assessment for a young person?",
    ],
  },
  {
    id: "fp-sg-2",
    area: "Safeguarding",
    text: "Describe how you would approach risk management for a young person admitted with a known history of exploitation — what would your first 30 days look like?",
    hint: "Show your understanding of contextual safeguarding, how you would build trust while managing risk, the multi-agency work required, and your approach to missing from care protocols.",
    followUpQuestions: [
      "How would you balance the young person's rights and autonomy with your duty to protect them?",
      "What multi-agency relationships would you activate in the first week, and why?",
      "How would you approach the return home interview if the young person went missing in the first month?",
    ],
  },
  {
    id: "fp-sg-3",
    area: "Safeguarding",
    text: "You receive a referral for a young person. The referral documents are incomplete and the placing authority is unable to provide a full risk assessment before the admission date. What do you do?",
    hint: "Demonstrate your knowledge of when it is safe to proceed with an admission and when it is not, your responsibilities under the regulations, and how you advocate for proper process without leaving a young person homeless.",
    followUpQuestions: [
      "At what point would you refuse an admission on safeguarding grounds?",
      "How would you document your decision and who would you notify?",
      "How would you support your staff team to prepare for the admission despite incomplete information?",
    ],
  },

  // ── Area 3: Leadership Philosophy and Staff Management ────────────────────
  {
    id: "fp-lead-1",
    area: "Leadership",
    text: "What is your leadership philosophy — and how do you put it into practice when managing a residential staff team?",
    hint: "Articulate a specific, coherent leadership philosophy. Give examples of how it has shaped your management style, your relationships with staff, and outcomes for young people.",
    followUpQuestions: [
      "Give an example of a leadership decision you made that was unpopular with staff but that you believed was right — what happened?",
      "How do you manage a staff member who is technically competent but who challenges your leadership?",
      "What is the most important thing a Registered Manager can do to retain a high-quality residential staff team?",
    ],
  },
  {
    id: "fp-lead-2",
    area: "Leadership",
    text: "Describe how you would build a staff team from scratch for your proposed home. What qualities would you prioritise, and how would you develop those staff once recruited?",
    hint: "Show your understanding of safer recruitment, the values and qualities you would look for beyond qualifications, and your approach to induction, supervision, and professional development.",
    followUpQuestions: [
      "What is the single most important quality you look for in a residential care worker — and how do you assess it at interview?",
      "How would you structure induction to ensure a new member of staff is safe to work with young people from day one?",
      "What would you do if you realised during a probationary period that a member of staff did not share your home's values?",
    ],
  },
  {
    id: "fp-lead-3",
    area: "Leadership",
    text: "As Registered Manager, how would you maintain oversight and quality assurance of practice when you are not present — including nights, weekends, and periods of annual leave?",
    hint: "Describe your on-call arrangements, how you quality assure records, who holds delegated authority, and your approach to maintaining standards across all shifts.",
    followUpQuestions: [
      "How would you ensure a night staff member, alone at 3am, knows what to do in a safeguarding emergency?",
      "What would your on-call structure look like for your proposed home?",
      "How do you prevent standards from slipping when you are absent?",
    ],
  },

  // ── Area 4: Trauma-Informed and Attachment-Based Care ─────────────────────
  {
    id: "fp-ti-1",
    area: "TraumaInformed",
    text: "What does trauma-informed care mean to you in practice — and how would you ensure your proposed home operates from a genuinely trauma-informed base?",
    hint: "Go beyond theory. Show how trauma-informed principles would shape your environment, your staff approach, daily routines, and how you would handle conflict and distress.",
    followUpQuestions: [
      "How would you help a staff member who intellectually understands trauma-informed care but struggles to apply it when a young person is being abusive towards them?",
      "How would you design your home's environment and routines to be genuinely trauma-informed?",
      "What training would you require all staff to complete, and why?",
    ],
  },
  {
    id: "fp-ti-2",
    area: "TraumaInformed",
    text: "How would you support a young person who has experienced developmental trauma and presents with significant emotional and behavioural difficulties — including frequent physical aggression?",
    hint: "Show your understanding of the neuroscience of trauma, your approach to behaviour support planning, de-escalation, and how you would protect both the young person and your staff.",
    followUpQuestions: [
      "How would you approach developing a behaviour support plan for this young person?",
      "What de-escalation approaches would you use, and how would you ensure staff apply them consistently?",
      "How would you manage the impact on the rest of your staff team of a highly demanding placement?",
    ],
  },
  {
    id: "fp-ti-3",
    area: "TraumaInformed",
    text: "How do you understand attachment theory — and how would attachment-based practice be visible in your proposed home on a typical day?",
    hint: "Demonstrate genuine understanding of attachment theory and how it translates into keyworker relationships, routines, consistency, and the relational approach of your staff.",
    followUpQuestions: [
      "How would you ensure your keyworker system genuinely reflects attachment principles?",
      "What would you do if a young person formed an unhealthy or unsafe attachment to a member of staff?",
      "How would you support a young person through a planned move away from your home in a way that is attachment-aware?",
    ],
  },

  // ── Area 5: Statement of Purpose and Home Vision ──────────────────────────
  {
    id: "fp-sop-1",
    area: "StatementOfPurpose",
    text: "Tell me about the vision for your proposed home — who would it serve, what would make it distinctive, and how would you know it was achieving its purpose?",
    hint: "Articulate a clear, specific vision. Show you have thought beyond compliance to what genuinely good, distinctive care looks like for the young people your home would serve.",
    followUpQuestions: [
      "What would young people who had lived in your home say about it five years after they had left?",
      "How would your home be different from other registered children's homes in your area?",
      "What would you not compromise on, even under financial or placement pressure?",
    ],
  },
  {
    id: "fp-sop-2",
    area: "StatementOfPurpose",
    text: "Your statement of purpose is a legal requirement. How would you ensure it is more than a compliance document — that it genuinely shapes how your home operates day to day?",
    hint: "Show how the statement connects to recruitment, induction, staff supervision, placement decisions, and the daily lived experience of young people.",
    followUpQuestions: [
      "How would you involve staff and young people in reviewing your statement of purpose?",
      "What would trigger an unplanned review of your statement of purpose?",
      "Give an example of a placement you would decline based on your stated purpose — and why.",
    ],
  },
  {
    id: "fp-sop-3",
    area: "StatementOfPurpose",
    text: "What type of children would your proposed home be best placed to support — and what would make your home unsuitable for certain young people?",
    hint: "Demonstrate a clear, honest understanding of your home's capacity and limitations. Show this is grounded in realistic assessment rather than commercial pressure.",
    followUpQuestions: [
      "How would you decline a referral for a young person you did not think your home could safely support?",
      "How would you handle a situation where a placed young person's needs significantly exceeded what your home could safely manage?",
      "How would your admission criteria reflect your trauma-informed approach?",
    ],
  },

  // ── Area 6: Multi-Agency Working and Partnerships ─────────────────────────
  {
    id: "fp-ma-1",
    area: "MultiAgency",
    text: "Multi-agency working is central to good care for looked-after children. How would you approach building relationships with placing authorities, virtual school heads, CAMHS, and other partners from the moment your home opens?",
    hint: "Show that you understand your home's role within a wider system. Demonstrate proactive relationship building and how you would advocate for young people within that system.",
    followUpQuestions: [
      "What would you do if a placing authority consistently failed to engage with your care planning or attend reviews?",
      "How would you build a productive relationship with a virtual school head who was resistant or unresponsive?",
      "Give an example of a situation where multi-agency relationships made a significant positive difference for a young person.",
    ],
  },
  {
    id: "fp-ma-2",
    area: "MultiAgency",
    text: "How would you advocate for a young person within a multi-agency context when you believed their needs were not being met by other services?",
    hint: "Show that you understand when and how to challenge other agencies professionally, how to document your concerns, and how to escalate when needed.",
    followUpQuestions: [
      "Give an example of a situation where you had to challenge a decision made by another professional — what happened?",
      "How do you maintain good working relationships with agencies you have had to challenge?",
      "When would you consider escalating concerns about a placing authority to Ofsted or another body?",
    ],
  },
  {
    id: "fp-ma-3",
    area: "MultiAgency",
    text: "How would you prepare for and contribute to looked-after child reviews, strategy meetings, and child protection conferences in a way that genuinely represents the young person's interests?",
    hint: "Show that you understand your role in these forums, how you prepare, how you ensure the young person's voice is represented, and how you follow up on actions.",
    followUpQuestions: [
      "How do you ensure a young person's views are genuinely represented at their looked-after child review?",
      "What do you do after a meeting to ensure actions are followed up?",
      "How do you manage a situation where you disagree with the outcomes of a strategy meeting?",
    ],
  },

  // ── Area 7: Quality Assurance and Continuous Improvement ──────────────────
  {
    id: "fp-qa-1",
    area: "QualityAssurance",
    text: "What quality assurance systems would you put in place from day one — and how would you ensure they drive genuine improvement rather than just producing paperwork?",
    hint: "Describe specific systems — record audits, observation of practice, young people's feedback mechanisms, Regulation 44 preparation — and how they would connect to real practice change.",
    followUpQuestions: [
      "How would you use your Regulation 44 visitor to maximum effect?",
      "What is the most important thing a Regulation 45 should achieve?",
      "Give an example of a quality assurance system you have used that genuinely improved outcomes.",
    ],
  },
  {
    id: "fp-qa-2",
    area: "QualityAssurance",
    text: "How would you write a Regulation 45 self-evaluation that is genuinely honest rather than a marketing document for your home?",
    hint: "Show that you understand the purpose of the Regulation 45, how you would gather evidence including from young people and staff, and how you would acknowledge genuine weaknesses.",
    followUpQuestions: [
      "What would you include in a Regulation 45 about something your home had not yet got right?",
      "How would you involve young people in your Regulation 45 self-evaluation process?",
      "How would you respond if your Regulation 44 visitor strongly disagreed with your self-evaluation?",
    ],
  },
  {
    id: "fp-qa-3",
    area: "QualityAssurance",
    text: "How do you use learning from incidents, complaints, and near-misses to drive continuous improvement — and how would you embed this from the start of your home's operation?",
    hint: "Describe your approach to debriefs, learning reviews, how you share learning with the team, and how you track whether changes are sustained over time.",
    followUpQuestions: [
      "Give an example of a near-miss from your previous experience that led to a significant improvement.",
      "How do you ensure debriefs after serious incidents are genuinely reflective rather than defensive?",
      "How do you track whether a change introduced after an incident has actually been embedded into practice?",
    ],
  },

  // ── Area 8: Handling Serious Incidents and Placement Breakdown ────────────
  {
    id: "fp-si-1",
    area: "SeriousIncident",
    text: "Walk me through how you would manage a serious incident in your home — from the initial response through to the final notification, debrief, and learning review.",
    hint: "Demonstrate your knowledge of notification requirements, your immediate management response, how you support young people and staff, and how you extract learning without blame.",
    followUpQuestions: [
      "What are the notification requirements for a serious incident under Regulation 40?",
      "How do you support staff who have been involved in a traumatic incident?",
      "What would a learning review after a serious incident look like in your home?",
    ],
  },
  {
    id: "fp-si-2",
    area: "SeriousIncident",
    text: "A placement breaks down unexpectedly — the young person needs to move within 24 hours. Walk me through how you would manage this situation.",
    hint: "Show your knowledge of the young person's rights during an unplanned move, your notification and documentation responsibilities, how you support the young person, and how you review what led to the breakdown.",
    followUpQuestions: [
      "What are your legal responsibilities when a placement breaks down?",
      "How would you ensure the young person's experience of the move is as safe as possible?",
      "How would you review what happened to learn from the placement breakdown?",
    ],
  },
  {
    id: "fp-si-3",
    area: "SeriousIncident",
    text: "Ofsted requires notification for a range of serious events. Tell me about the events that would trigger a Regulation 40 notification — and describe a situation where you have made such a notification or where you believe one should have been made.",
    hint: "Demonstrate detailed knowledge of Regulation 40 notification requirements. Show that you understand the purpose of notifications and how you would approach them honestly and transparently.",
    followUpQuestions: [
      "What events under Regulation 40 do managers most commonly fail to notify about — and why do you think that happens?",
      "How quickly after a serious event would you make an initial notification to Ofsted?",
      "What does a good notification include — and what should you never omit?",
    ],
  },
];

export const FIT_PERSON_AREA_ORDER: FitPersonArea[] = [
  "Regulations",
  "Safeguarding",
  "Leadership",
  "TraumaInformed",
  "StatementOfPurpose",
  "MultiAgency",
  "QualityAssurance",
  "SeriousIncident",
];

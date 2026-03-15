// MockOfsted — Children's Home Inspection Question Bank
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
  | "CarePlanning"
  // Supported Accommodation domains (England 2023 Regulations):
  | "SA_LeadershipManagement"
  | "SA_Protection"
  | "SA_Accommodation"
  | "SA_Support";

export type FacilityType = "childrens_home" | "supported_accommodation";

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
  // Supported Accommodation domains:
  SA_LeadershipManagement: "Leadership and Management",
  SA_Protection: "Protection",
  SA_Accommodation: "Accommodation",
  SA_Support: "Support",
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
  // Supported Accommodation:
  SA_LeadershipManagement: "Core Standard",
  SA_Protection: "LIMITING JUDGEMENT",
  SA_Accommodation: "Core Standard",
  SA_Support: "Core Standard",
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

export const SA_DOMAIN_ORDER: Domain[] = [
  "SA_LeadershipManagement",
  "SA_Protection",
  "SA_Accommodation",
  "SA_Support",
];

export type PracticeMode = "inspection" | "fit_person" | "ri";

export type BankQuestion = {
  id: string;
  domain: Domain;
  text: string;
  hint: string;
  followUpQuestions: string[];
  mode?: PracticeMode; // inspection (RM/Deputy), interview (fit-person), ri (Responsible Individual)
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
    mode: "inspection",
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
    mode: "fit_person",
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
    mode: "ri",
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
    mode: "ri",
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
    mode: "inspection",
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
    mode: "inspection",
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
  {
    id: "cp-e",
    domain: "CarePlanning",
    text: "Describe how you assess and match the risk profile of a young person being admitted to your home — particularly young people showing challenging behaviour — and what proactive steps ensure placement stability?",
    hint: "Inspector wants to see evidence-based placement decisions that minimise unplanned endings. Show how you assess compatibility with existing young people, what support structures you put in place, and how you prevent placement breakdown.",
    followUpQuestions: [
      "How do you decide whether your home is the right placement for a young person with specific risk factors or challenging needs?",
      "What early warning signs would tell you a placement is beginning to break down — and what interventions would you implement?",
      "How do you measure and evidence the stability of your placements over time?",
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
  {
    id: "qp-e",
    domain: "QualityPurpose",
    text: "How does your day-to-day practice reflect the ethos in your Statement of Purpose, particularly for young people with complex or challenging needs?",
    hint: "Inspector wants to see lived values, not just written statements. Reference specific ways your care approach translates your stated purpose into action for individual young people's identified needs.",
    followUpQuestions: [
      "Walk me through how your Statement of Purpose guides the care of a young person with significant trauma or behavioural needs.",
      "How do your daily records demonstrate that you're delivering on your stated purpose?",
      "How do you adapt your approach to ensure your purpose is achieved for each individual young person?",
    ],
  },

  // ── Domain 2 additional ───────────────────────────────────────────────────
  {
    mode: "inspection",
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
    mode: "fit_person",
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
  {
    mode: "inspection",
    id: "cv-e",
    domain: "ChildrenViews",
    text: "Describe the feedback loop when a young person raises a concern — from the moment they express it through to the action taken and feedback back to them?",
    hint: "Inspector wants to see evidence of a complete cycle: listening, responding, explaining why action was or wasn't taken, and showing the young person they were genuinely heard. Non-speaking children must have alternative communication methods documented.",
    followUpQuestions: [
      "How do you ensure young people understand the outcome of their feedback, even if you couldn't do exactly what they asked?",
      "Walk me through how you gather feedback from young people with complex communication needs.",
      "How do you evidence that feedback from young people has shaped decisions in your home?",
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
  {
    id: "ed-e",
    domain: "Education",
    text: "Describe how you track and measure a specific young person's educational progress in their Personal Education Plan, and what impact have you had on improving their outcomes?",
    hint: "Inspector wants to see active tracking of PEP goals, your advocacy when progress stalls, and concrete evidence of impact. You should be able to cite specific improvements attributable to your involvement.",
    followUpQuestions: [
      "How do you hold the school and Virtual School Head accountable if a young person isn't progressing towards their PEP targets?",
      "What support do you provide at home to reinforce educational progress made at school?",
      "How do you document your contribution to educational outcomes in case records?",
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
  {
    id: "ea-e",
    domain: "EnjoymentAchievement",
    text: "Describe evidence of meaningful community participation for a young person in your home — how have you prevented them becoming isolated and what talents or interests have developed since their arrival?",
    hint: "Inspector wants to see pro-active work to build young people's social networks and identity within their community. Evidence could include clubs, voluntary work, community events, peer groups, mentoring, or newly discovered talents.",
    followUpQuestions: [
      "How do you assess a young person's risk of isolation and what actions do you take to prevent it?",
      "Tell me about a specific young person whose interests or talents have expanded during their time with you.",
      "How do you evidence young people's participation in community activities in their care records?",
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
  {
    id: "hw-e",
    domain: "HealthWellbeing",
    text: "Describe how you would identify and escalate a young person's mental health delay or deterioration to CAMHS, and what you do while waiting for assessment or if the wait is too long?",
    hint: "Inspector wants to see knowledge of escalation pathways, documentation of deteriorating mental health, evidence of advocacy when access is delayed, and interim trauma-informed support measures in place.",
    followUpQuestions: [
      "How do you document and evidence mental health concerns that haven't yet been formally diagnosed?",
      "Who would you escalate to if CAMHS wait times were putting a young person at risk?",
      "What interim support and monitoring do you put in place while a young person waits for specialist mental health intervention?",
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
  {
    id: "pr-e",
    domain: "PositiveRelationships",
    text: "Describe a recent incident involving conflict or escalation between young people. Walk me through your trauma-informed de-escalation approach and how you supported restorative work afterwards?",
    hint: "Inspector wants to see understanding of trauma-informed practice, de-escalation techniques, and restorative approaches (not punishment). Show how you help young people repair relationships and learn from incidents.",
    followUpQuestions: [
      "How do you teach your staff the difference between de-escalation and confrontation?",
      "What does restorative work look like for young people who have harmed each other in your home?",
      "How do you evidence and record the impact of your restorative approaches in case files?",
    ],
  },

  // ── Domain 7 additional ───────────────────────────────────────────────────
  {
    mode: "ri",
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
    mode: "ri",
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
  {
    mode: "ri",
    id: "pc-e",
    domain: "ProtectionChildren",
    text: "Describe the full evidence trail for a recent missing from care episode in your home — from initial absence through to return, escalations, safeguarding concerns raised, and the return home interview outcome?",
    hint: "Inspector wants to see clear accountability at each stage: initial decision (who, when, actions taken), multi-agency communication, risk identification, escalation decision-making, and learning captured from the episode.",
    followUpQuestions: [
      "How do you distinguish between a young person being safely at a known location versus a genuine missing episode requiring police involvement?",
      "What safeguarding concerns were identified or explored during this missing episode?",
      "What patterns have you identified in this young person's missing episodes and how are they being addressed?",
    ],
  },

  // ── 10 NEW RI-SPECIFIC QUESTIONS (Regulation 44 Oversight) ─────────────────────
  {
    mode: "ri",
    id: "ri-a",
    domain: "LeadershipManagement",
    text: "The regulations are clear that the independent person must not have a financial interest or connection that compromises their impartiality. How have you, as the Responsible Individual, rigorously assured yourself that your appointed Regulation 44 visitor remains completely independent and capable of making an impartial judgement on the quality of your home's care?",
    hint: "Inspector wants to see evidence of due diligence: how you appointed them, what checks you ran, ongoing verification of impartiality, and what conflicts of interest safeguards are in place.",
    followUpQuestions: [
      "Walk me through the process you used to select and appoint your Regulation 44 visitor.",
      "What specific checks did you conduct to verify their independence?",
      "How do you re-verify impartiality at the start of each year?",
    ],
  },
  {
    mode: "ri",
    id: "ri-b",
    domain: "ProtectionChildren",
    text: "The Regulation 44 visitor is legally required to form an opinion on whether children are being effectively safeguarded. When you read their monthly reports, how do you verify that their assessment of your safeguarding culture, including how staff reflect on incidents, is accurate and matches your own understanding of the home?",
    hint: "Inspector wants to see cross-checking: evidence you've independently verified their findings, that you understand the safeguarding gaps they've identified, and that you're triangulating their view with other quality indicators.",
    followUpQuestions: [
      "Can you give me an example where the visitor's safeguarding assessment challenged or prompted you to take action?",
      "How do you verify findings from their interviews with children and staff?",
      "What safeguarding metrics or indicators do you track independently to validate their conclusions?",
    ],
  },
  {
    mode: "ri",
    id: "ri-c",
    domain: "LeadershipManagement",
    text: "When the independent visitor recommends actions for improvement, the registered person must consider whether or not to follow them up. Can you walk me through your exact process for tracking these recommendations, and provide a recent example where you challenged the Registered Manager to ensure a Regulation 44 action was closed effectively?",
    hint: "Inspector wants to see accountability: a tracked log of recommendations, deadlines for closure, evidence of challenge and follow-up, and learning captured from the improvement actions.",
    followUpQuestions: [
      "Show me your tracking system for Regulation 44 recommendations — how do you ensure none fall through the cracks?",
      "Can you evidence a recent conversation where you held the RM accountable for closing a recommendation?",
      "What happens if a recommendation is not implemented — how do you escalate?",
    ],
  },
  {
    mode: "ri",
    id: "ri-d",
    domain: "ChildrenViews",
    text: "During their visits, the independent person must interview children in private, if they consent, to ascertain their views, wishes, and feelings. How do you assure yourself that the visitor is successfully engaging with the children—including those who are non-speaking—and not just relying on staff accounts?",
    hint: "Inspector wants to see proactive engagement: how you've briefed the visitor on each child's communication needs, evidence of child voice captured in reports, and how you verify children felt heard.",
    followUpQuestions: [
      "How do you ensure the visitor understands the communication needs of non-verbal or pre-verbal children before they arrive?",
      "What evidence is there in their reports that children have been meaningfully consulted?",
      "How do you follow up with children after their Regulation 44 interview to verify they felt listened to?",
    ],
  },
  {
    mode: "ri",
    id: "ri-e",
    domain: "ProtectionChildren",
    text: "Regulation 44 visits require the scrutiny of high-risk records, including missing-from-care logs, return home interviews, and records of physical restraint. How do you use the independent visitor's feedback on these specific records to ensure your staff are managing complex behaviour and risks safely?",
    hint: "Inspector wants to see: evidence the visitor has reviewed high-risk records, their findings on quality/timeliness, and what action you've taken to close gaps in recording or practice.",
    followUpQuestions: [
      "What high-risk records has the visitor reviewed in the last 12 months, and what did they find?",
      "Have they ever identified gaps in your restraint records or missing-episode documentation?",
      "How have you used their feedback to drive training or practice improvement?",
    ],
  },
  {
    mode: "ri",
    id: "ri-f",
    domain: "LeadershipManagement",
    text: "We require the Regulation 44 report to be sent to Ofsted before the end of the month that follows the month of the visit. What administrative grip do you have in place to ensure these reports are never delayed, and that you and the manager have commented on them promptly before submission?",
    hint: "Inspector wants to see: a tracking system with clear deadlines, evidence of timely submission to Ofsted, documented comments on each report, and escalation procedures if delays occur.",
    followUpQuestions: [
      "How do you track Regulation 44 submission deadlines to Ofsted?",
      "Can you show me the comments you and the RM have made on the last three Regulation 44 reports?",
      "What would you do if the visitor's report was delayed and you were at risk of missing the Ofsted deadline?",
    ],
  },
  {
    mode: "ri",
    id: "ri-g",
    domain: "QualityPurpose",
    text: "You receive monthly Regulation 44 reports and must also complete your own six-monthly Regulation 45 quality of care review. How do you triangulate the independent visitor's findings with your own internal audits to identify hidden weaknesses and drive continuous improvement across the service?",
    hint: "Inspector wants to see: evidence you're using Reg 44 data to inform your Reg 45 process, gaps identified through triangulation, and improvement actions arising from combined intelligence.",
    followUpQuestions: [
      "How does the Regulation 44 data feed into your Regulation 45 six-monthly review?",
      "Can you give me an example where the visitor's insights revealed a gap that your internal audit had missed?",
      "What improvement actions have you driven specifically because of insights from Regulation 44 reports?",
    ],
  },
  {
    mode: "ri",
    id: "ri-h",
    domain: "ProtectionChildren",
    text: "If the Regulation 44 visitor were to uncover a serious child protection concern or significantly poor practice during an unannounced visit, what is the agreed escalation protocol between them, the Registered Manager, and yourself to ensure immediate action is taken?",
    hint: "Inspector wants to see: a documented protocol with clear escalation steps, defined roles and timelines, and evidence it has been used (or clear understanding of how it would work).",
    followUpQuestions: [
      "Walk me through the steps you would take if the visitor uncovers a serious safeguarding concern.",
      "Who do they contact first — you, the RM, the Local Authority?",
      "What is your absolute deadline for acting on serious concerns identified during Regulation 44 visits?",
    ],
  },
  {
    mode: "ri",
    id: "ri-i",
    domain: "HealthWellbeing",
    text: "The independent visitor must inspect the premises to identify any damage, unsafe equipment, or hazards. If a Regulation 44 report highlights a delay in repairs or an environmental hazard, how do you hold your maintenance teams and the Registered Manager accountable for fixing this speedily?",
    hint: "Inspector wants to see: a repairs tracking system, prioritization of safety-critical repairs, accountability mechanisms (timelines, escalation), and evidence of swift action on hazards.",
    followUpQuestions: [
      "Show me your repairs tracking system — how do priority repairs from Regulation 44 visits get prioritized?",
      "What happens if a repair flagged in a Regulation 44 report is still outstanding weeks later?",
      "How quickly would you expect a fire hazard or safety-critical repair to be fixed?",
    ],
  },
  {
    mode: "ri",
    id: "ri-j",
    domain: "LeadershipManagement",
    text: "As the provider, you have the right to comment on the Regulation 44 report, but you must not alter the independent person's findings. If you strongly disagreed with a criticism made by the independent visitor regarding the conduct of the home, how would you formally document your response without compromising the integrity of their report?",
    hint: "Inspector wants to see: a documented response process that protects the visitor's integrity while allowing you to present your perspective, and understanding of the regulatory boundary.",
    followUpQuestions: [
      "Can you walk me through the process for formally commenting on a Regulation 44 report?",
      "How do you ensure your comments don't undermine the independence or integrity of the report?",
      "Has there been an instance where you've felt the need to comment critically on the visitor's findings — and how did you handle it?",
    ],
  },

  // ── Domain 8 additional ───────────────────────────────────────────────────
  {
    mode: "fit_person",
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
    mode: "fit_person",
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
  {
    mode: "fit_person",
    id: "lm-e",
    domain: "LeadershipManagement",
    text: "Describe a recent finding from your Regulation 44 or 45 independent visitor or Regulatory report. How did that finding drive improvement and what evidence shows the outcome has changed children's experience?",
    hint: "Inspector wants to see findings that translate to action and demonstrable impact on young people's lives. Show the full improvement cycle: finding identified → action plan → implementation → measurement of impact → embedding of learning.",
    followUpQuestions: [
      "How do you use Annex A and risk assessment data to align your daily practice with regulatory findings?",
      "How do you ensure findings from compliance visits result in real changes, not just tokenistic actions?",
      "How do you share learning from regulatory reports with your entire staff team and measure their understanding?",
    ],
  },

  // ── FIT-PERSON QUESTIONNAIRE (10 questions, GOV.UK sources) ──────────────────
  {
    id: "fp-a",
    domain: "LeadershipManagement",
    text: "How does your previous experience in residential care transfer to the role of registered manager, and how will it enable you to lead the home effectively?",
    hint: "Evidence of relevant experience, understanding of leadership role, clear examples of how experience translates to RM responsibilities.",
    followUpQuestions: ["What specific residential care experience do you have?", "How did you apply those lessons in previous roles?", "What challenges in RM leadership do you feel most prepared to handle?"],
    mode: "fit_person",
  },
  {
    id: "fp-b",
    domain: "LeadershipManagement",
    text: "How will you ensure that the home consistently complies with the Children's Homes (England) Regulations 2015, the Quality Standards, and the Care Standards Act 2000?",
    hint: "Understanding of regulatory framework, knowledge of compliance mechanisms, evidence of governance structures.",
    followUpQuestions: ["How do you stay current with regulatory changes?", "What systems will you use to monitor compliance?", "How would you address a compliance gap?"],
    mode: "fit_person",
  },
  {
    id: "fp-c",
    domain: "ProtectionChildren",
    text: "Can you explain how you would identify, assess, and manage risks to safeguard children, and take appropriate action to protect them?",
    hint: "Clear risk assessment processes, safeguarding knowledge, understanding of escalation procedures and multi-agency working.",
    followUpQuestions: ["What is your safeguarding knowledge based on?", "How would you assess risk in a specific scenario?", "Who would you escalate to and when?"],
    mode: "fit_person",
  },
  {
    id: "fp-d",
    domain: "PositiveRelationships",
    text: "How will you ensure that your staff understand attachment and trauma, and use positive, relationship-based approaches to behaviour support?",
    hint: "Knowledge of trauma-informed care, staff training plans, supervision approach, understanding of therapeutic parenting.",
    followUpQuestions: ["How will you train staff on attachment and trauma?", "What behaviour support approaches align with your understanding?", "How will you supervise these practices?"],
    mode: "fit_person",
  },
  {
    id: "fp-e",
    domain: "LeadershipManagement",
    text: "How will you implement and use quality assurance systems to evaluate the outcomes for children and drive continuous improvement in the home?",
    hint: "Understanding of QA frameworks, data collection methods, how improvements are identified and actioned.",
    followUpQuestions: ["What QA systems will you use?", "How will you measure outcomes for children?", "How do findings translate to improvements?"],
    mode: "fit_person",
  },
  {
    id: "fp-f",
    domain: "LeadershipManagement",
    text: "How will you supervise and manage staff performance to ensure they have the right skills and resilience to meet the complex needs of the children?",
    hint: "Supervision approach, staff development planning, understanding of resilience and burnout, performance management processes.",
    followUpQuestions: ["What is your supervision model?", "How do you develop staff skills?", "How do you support staff resilience?"],
    mode: "fit_person",
  },
  {
    id: "fp-g",
    domain: "CarePlanning",
    text: "Can you give an example of how you would engage, coordinate, and if necessary, challenge multi-agency partners to help children thrive?",
    hint: "Understanding of integrated working, advocacy for children, examples of coordination or challenge, knowledge of key agencies.",
    followUpQuestions: ["Tell me about a time you coordinated multi-agency work.", "How have you challenged partners?", "What agencies are key for your home's children?"],
    mode: "fit_person",
  },
  {
    id: "fp-h",
    domain: "QualityPurpose",
    text: "How will you ensure that the day-to-day care provided strictly reflects the ethos, objectives, and needs outlined in the home's Statement of Purpose?",
    hint: "Understanding of Statement of Purpose, how daily practice aligns with stated ethos, examples of practice reflecting purpose.",
    followUpQuestions: ["What will your home's Statement of Purpose include?", "How will staff know if they're living it?", "How will you monitor alignment?"],
    mode: "fit_person",
  },
  {
    id: "fp-i",
    domain: "ChildrenViews",
    text: "How do you plan to build strong relationships with children and ensure their views, wishes, and feelings actively shape decisions about their care?",
    hint: "Child-centred approach, understanding of participation, mechanisms for gathering views, examples of views influencing decisions.",
    followUpQuestions: ["How will you build relationships with children?", "What mechanisms will you use to gather their views?", "Can you give an example of a decision shaped by child input?"],
    mode: "fit_person",
  },
  {
    id: "fp-j",
    domain: "CarePlanning",
    text: "How will you ensure that the arrangements you make for the residential staff meet the specific needs of the children identified in their care plans?",
    hint: "Understanding of care planning process, staffing model linked to children's needs, contingency planning for complex presentations.",
    followUpQuestions: ["How will you assess staffing needs based on children's care plans?", "What if a child's needs change significantly?", "How will you maintain stability in staffing?"],
    mode: "fit_person",
  },

  // ── NEW INSPECTION QUESTIONS (45 questions, 5 per quality standard) ─────────────
  // Quality & Purpose (5 new)
  {
    id: "qp-f",
    domain: "QualityPurpose",
    text: "Describe evidence for how staff understand and apply the home's statement of purpose in their daily interactions with the children.",
    hint: "Look for specific examples of how SOP guides daily decisions, staff induction materials, team meeting discussions, observable alignment between stated purpose and actual practice.",
    followUpQuestions: ["Give a specific example from this week.", "How do new staff learn the purpose?", "How do you check staff understand it?"],
    mode: "inspection",
  },
  {
    id: "qp-g",
    domain: "QualityPurpose",
    text: "Describe evidence for how you ensure children are provided with the physical necessities and personal items they need to live comfortably and feel a sense of belonging.",
    hint: "Evidence of personalised spaces, clothing and belongings management, comfort items, bedroom decoration, recognition of individual preferences.",
    followUpQuestions: ["Show me evidence of how a child's space reflects their personality.", "How do you manage clothing and personal items?", "What happens for emergency admissions?"],
    mode: "inspection",
  },
  {
    id: "qp-h",
    domain: "QualityPurpose",
    text: "Describe evidence for how the home's daily routines offer continuity and security, helping to repair earlier damage to a child's self-esteem.",
    hint: "Predictable routines, consistency in staffing, security-providing relationships, therapeutic language, recognition of trauma, visual schedules if needed.",
    followUpQuestions: ["Describe your typical day routine.", "How do you maintain continuity with staff changes?", "How do routines specifically support children with trauma histories?"],
    mode: "inspection",
  },
  {
    id: "qp-i",
    domain: "QualityPurpose",
    text: "Describe evidence for how any specialist care or therapy provided within the home is approved, delivered by suitably qualified individuals, and kept under review by the placing authority.",
    hint: "Records of therapy provision, qualifications of therapists, evidence of placement authority oversight, outcomes monitoring, integration with care plans.",
    followUpQuestions: ["What specialist services are currently being provided?", "Who delivers them and what are their qualifications?", "How is impact on the child measured?"],
    mode: "inspection",
  },
  {
    id: "qp-j",
    domain: "QualityPurpose",
    text: "Describe evidence for how you ensure safety measures, such as alarms or locks, remain necessary and proportionate without creating an institutional feel in the home.",
    hint: "Records of risk assessments driving security measures, regular reviews of restrictions, balance between security and homely feel, child and family input into proportionality.",
    followUpQuestions: ["What safety measures are in place currently?", "When were they last reviewed?", "How do children and families view them?"],
    mode: "inspection",
  },

  // Children's Views (5 new)
  {
    id: "cv-f",
    domain: "ChildrenViews",
    text: "Describe evidence for how staff help each child to understand how their privacy will be respected and the specific circumstances when it may have to be limited.",
    hint: "Induction materials, discussion records, evidence in children's guides, understanding of confidentiality, examples of privacy-respecting practice, clear explanation of safeguarding limits.",
    followUpQuestions: ["How do you explain privacy boundaries to children?", "Can you describe a time privacy had to be limited?", "How was the child prepared for that?"],
    mode: "inspection",
  },
  {
    id: "cv-g",
    domain: "ChildrenViews",
    text: "Describe evidence for how you ensure the children's guide is explained to each child in a format appropriate to their communication needs shortly after their arrival.",
    hint: "Records of induction, adapted versions (visual, Braille, large print, easy read, translated), key staff involvement, child comprehension checks.",
    followUpQuestions: ["How many children currently have adapted guides?", "Who ensures children understand the content?", "What feedback have children given on the guide?"],
    mode: "inspection",
  },
  {
    id: "cv-h",
    domain: "ChildrenViews",
    text: "Describe evidence for how the views of others with a significant relationship to the child, including family members, are regularly sought and taken into account in daily care.",
    hint: "Records of contact with family/carers, evidence of their input into decisions, communication protocols, examples of family views influencing care, inclusion in meetings.",
    followUpQuestions: ["Who are the key relationships for children in your care?", "How often do you seek their input?", "Can you describe how family input recently changed a care decision?"],
    mode: "inspection",
  },
  {
    id: "cv-i",
    domain: "ChildrenViews",
    text: "Describe evidence for how children's feedback and comments directly influenced the latest revisions of your children's guide or complaints procedure.",
    hint: "Records of children's feedback, meeting minutes showing discussion of suggestions, documented changes made in response, evidence shared back with children.",
    followUpQuestions: ["When was the guide last updated?", "What changes were based on child feedback?", "How did you communicate those changes back to children?"],
    mode: "inspection",
  },
  {
    id: "cv-j",
    domain: "ChildrenViews",
    text: "Describe evidence for how regular house meetings or daily consultations are actively used to shape the overall ethos and routine of the home.",
    hint: "Records of meetings, agenda-setting including children's suggestions, visible impact on decisions, diverse child participation, follow-up on promised actions.",
    followUpQuestions: ["How often do you hold house meetings?", "Who attends?", "Describe a recent decision made based on meeting feedback."],
    mode: "inspection",
  },

  // Education (5 new)
  {
    id: "ed-f",
    domain: "Education",
    text: "Describe evidence for how staff actively support children to develop independent study skills and complete homework within the home's learning environment.",
    hint: "Records of homework support, designated study space, staff knowledge of children's learning needs, evidence of skill-building not just task-completion, liaison with schools.",
    followUpQuestions: ["How is homework supported in the home?", "What independent study skills are you teaching?", "How do you track progress in learning?"],
    mode: "inspection",
  },
  {
    id: "ed-g",
    domain: "Education",
    text: "Describe evidence for how the home promotes opportunities for children to learn informally outside of standard formal school hours.",
    hint: "Records of enrichment activities, educational visits, project-based learning, staff interest in children's curiosities, integration of learning into daily life and routines.",
    followUpQuestions: ["Can you describe an informal learning opportunity from this week?", "Who initiates these opportunities?", "How do you evaluate their impact?"],
    mode: "inspection",
  },
  {
    id: "ed-h",
    domain: "Education",
    text: "Describe evidence for how staff communicate the value of education, learning, and employment to children who may be currently disengaged from schooling.",
    hint: "Examples of motivational conversations, links to career aspirations, celebration of learning achievements, mentoring relationships with staff who model lifelong learning.",
    followUpQuestions: ["Which children are at risk of disengagement?", "How do you support them specifically?", "What careers or aspirations are you helping them explore?"],
    mode: "inspection",
  },
  {
    id: "ed-i",
    domain: "Education",
    text: "Describe evidence for how staff support a child who is excluded from school to access interim educational support and return to formal education as quickly as possible.",
    hint: "Protocols for managing exclusions, liaison with local authority, alternative provision arrangements, evidence of return planning, advocacy for child to school.",
    followUpQuestions: ["If exclusion were to occur, what would your process be?", "Who would oversee the interim education?", "How would you support reintegration?"],
    mode: "inspection",
  },
  {
    id: "ed-j",
    domain: "Education",
    text: "Describe evidence for how each child is provided with access to appropriate equipment, facilities, and safe internet resources to support their learning at home.",
    hint: "Inventory of learning resources, age-appropriate technology, safe internet access controls, adaptations for different learning styles, regular updates to resources.",
    followUpQuestions: ["What learning equipment is available?", "How do you ensure internet safety?", "How often do you update resources?"],
    mode: "inspection",
  },

  // Enjoyment & Achievement (5 new)
  {
    id: "ea-f",
    domain: "EnjoymentAchievement",
    text: "Describe evidence for how you help children make a positive contribution to the home and the wider community, such as through volunteering or community projects.",
    hint: "Records of community involvement, volunteering opportunities, children's roles in home maintenance/decision-making, social action projects, evidence of impact.",
    followUpQuestions: ["What community activities are children involved in?", "How do children contribute to the home?", "What skills are they developing through contribution?"],
    mode: "inspection",
  },
  {
    id: "ea-g",
    domain: "EnjoymentAchievement",
    text: "Describe evidence for how staff actively support children to make and sustain healthy friendships with peers both inside and outside the home.",
    hint: "Records of friendship support, supervised contact facilitation, social skills teaching, monitoring of relationships, intervention in conflicts, celebrating positive friendships.",
    followUpQuestions: ["How do you support friendships between children?", "How do you enable friendships outside the home?", "How do you address unhealthy relationships?"],
    mode: "inspection",
  },
  {
    id: "ea-h",
    domain: "EnjoymentAchievement",
    text: "Describe evidence for how staff encourage children to try new activities that expand their current interests, preferences, and skills.",
    hint: "Records of new activity trials, staff facilitating exploration, budget for varied activities, evidence of interest expansion, following child-led discovery.",
    followUpQuestions: ["Describe a new activity a child tried recently.", "How do you decide what to try?", "What happened after the first attempt?"],
    mode: "inspection",
  },
  {
    id: "ea-i",
    domain: "EnjoymentAchievement",
    text: "Describe evidence for how you adapt recreational activities to ensure that children with specific physical, emotional, or communication needs can still participate safely.",
    hint: "Individualised activity adaptations, accessibility modifications, risk assessments for each child, staff training in adaptations, including all children despite differences.",
    followUpQuestions: ["Give examples of activity adaptations you've made.", "How do you assess what adaptations are needed?", "How do you involve children in planning adaptations?"],
    mode: "inspection",
  },
  {
    id: "ea-j",
    domain: "EnjoymentAchievement",
    text: "Describe evidence for how the home goes beyond the basic expectations of a child's relevant plans to provide enriching creative, intellectual, or physical opportunities.",
    hint: "Evidence of above-and-beyond activities, investment in enrichment, examples of creative/intellectual/physical experiences, child and family feedback on enrichment.",
    followUpQuestions: ["Describe an enriching activity beyond what was planned.", "Who initiated it?", "What impact did it have on the child?"],
    mode: "inspection",
  },

  // Health & Wellbeing (5 new)
  {
    id: "hw-f",
    domain: "HealthWellbeing",
    text: "Describe evidence for how each child is promptly registered with a general medical practitioner and a registered dental practitioner upon admission.",
    hint: "Registration records, timescales for registration post-admission, evidence of communication with practitioners, inclusion in induction process.",
    followUpQuestions: ["How quickly are children registered after arrival?", "How do you manage emergency admissions?", "What is your protocol if a child has no permanent address?"],
    mode: "inspection",
  },
  {
    id: "hw-g",
    domain: "HealthWellbeing",
    text: "Describe evidence for how staff help children understand their own health needs so they can make informed, age-appropriate choices about their physical and mental well-being.",
    hint: "Health education records, conversations about medication/conditions, involving children in health decision-making, age-appropriate health literacy, supporting self-care.",
    followUpQuestions: ["How do you teach children about their health conditions?", "How do children participate in health decisions?", "What health literacy outcomes are you aiming for?"],
    mode: "inspection",
  },
  {
    id: "hw-h",
    domain: "HealthWellbeing",
    text: "Describe evidence for how staff develop a child's understanding of personal, sexual, and social relationships in a way that is appropriate to their age and development.",
    hint: "RSE curriculum, planned conversations, staff training, age-appropriate resources, record of discussions, safeguarding of vulnerable learners, parent communication.",
    followUpQuestions: ["What RSE approach do you use?", "How is it tailored to age and development?", "How do you address concerning behaviours or knowledge?"],
    mode: "inspection",
  },
  {
    id: "hw-i",
    domain: "HealthWellbeing",
    text: "Describe evidence for how the home's arrangements for managing and safely storing medication promote children's independence wherever possible.",
    hint: "Medication protocols, evidence of gradual independence (self-administration for appropriate children), storage systems, staff knowledge, regular reviews of independence plans.",
    followUpQuestions: ["Who currently self-administers medication?", "What training have they received?", "How do you assess readiness for self-administration?"],
    mode: "inspection",
  },
  {
    id: "hw-j",
    domain: "HealthWellbeing",
    text: "Describe evidence for how the home takes a whole-home approach to promoting healthy lifestyles, such as involving children in planning nutritious meals and taking regular exercise.",
    hint: "Nutritional evidence (menu planning records, dietary assessment), exercise opportunities, children's involvement in food choices, modelling of healthy behaviours by staff.",
    followUpQuestions: ["How are children involved in meal planning?", "What physical activities are available?", "How do you promote healthy choices?"],
    mode: "inspection",
  },

  // Positive Relationships (5 new)
  {
    id: "pr-f",
    domain: "PositiveRelationships",
    text: "Describe evidence for how staff encourage children to take responsibility for their own behaviour in accordance with their age, abilities, and understanding.",
    hint: "Records of responsibility-building, age-appropriate expectations, consequences linked to learning, recognition of effort, graduated responsibility opportunities.",
    followUpQuestions: ["Give examples of age-appropriate responsibilities.", "How do you teach responsibility for behaviour?", "How do children respond to this approach?"],
    mode: "inspection",
  },
  {
    id: "pr-g",
    domain: "PositiveRelationships",
    text: "Describe evidence for how you help children develop and practice the skills needed to resolve conflicts positively without harm to themselves or others.",
    hint: "Records of conflict resolution teaching, staff facilitation of peer conflict, emotional regulation support, restorative approaches, practice opportunities, measuring effectiveness.",
    followUpQuestions: ["Describe a recent conflict resolution.", "How did children learn this skill?", "What restorative practices do you use?"],
    mode: "inspection",
  },
  {
    id: "pr-h",
    domain: "PositiveRelationships",
    text: "Describe evidence for how staff demonstrate they have the skills to recognise early indications of bullying and intervene effectively to protect children.",
    hint: "Staff training records, bullying incident responses, evidence of early intervention, protective actions taken, support for victims, restorative work with perpetrators.",
    followUpQuestions: ["How is bullying defined in your home?", "How do staff identify early signs?", "Describe your response to a recent bullying incident."],
    mode: "inspection",
  },
  {
    id: "pr-i",
    domain: "PositiveRelationships",
    text: "Describe evidence for how staff consistently use specific, planned de-escalation techniques to avoid confrontations and the use of physical restraint.",
    hint: "De-escalation training records, low restraint use data, staff confidence in techniques, environmental adjustments, calm approaches, recognition of triggers.",
    followUpQuestions: ["What de-escalation techniques do staff use?", "What training have they received?", "When was restraint last used and why?"],
    mode: "inspection",
  },
  {
    id: "pr-j",
    domain: "PositiveRelationships",
    text: "Describe evidence for how staff interpret children's previous experiences and trauma to understand the triggers behind their current emotions and behaviour.",
    hint: "Trauma-informed understanding in behaviour records, staff knowledge of children's histories, identifying triggers, therapeutic responses, restorative not punitive approaches.",
    followUpQuestions: ["Describe a child's trauma history.", "How does this inform your approach?", "What helps this child feel safe when triggered?"],
    mode: "inspection",
  },

  // Protection of Children (5 new)
  {
    id: "pc-f",
    domain: "ProtectionChildren",
    text: "Describe evidence for how staff support each child to understand how they can manage their own safety and risks when spending time outside of the home.",
    hint: "Safety conversations records, risk assessments for community access, graduated independence, teaching about stranger danger/exploitation risks, feedback from children.",
    followUpQuestions: ["What safety skills are you teaching?", "How do children practice these?", "How do you judge readiness for independence?"],
    mode: "inspection",
  },
  {
    id: "pc-g",
    domain: "ProtectionChildren",
    text: "Describe evidence for how staff manage relationships between the children living in the home to effectively prevent them from harming or bullying each other.",
    hint: "Risk assessments of child-to-child dynamics, supervision strategies, safeguarding measures, positive relationship building, training for staff, monitoring effectiveness.",
    followUpQuestions: ["How do you assess risk between children?", "What supervision level is needed?", "Have there been concerning dynamics and how were they managed?"],
    mode: "inspection",
  },
  {
    id: "pc-h",
    domain: "ProtectionChildren",
    text: "Describe evidence for how staff demonstrate familiarity with the home's whistleblowing and child protection policies, particularly regarding actions to take if they suspect a colleague of abuse.",
    hint: "Staff training records, policy accessibility, staff interviews confirm knowledge, procedures known for escalation, external support services identified, fearless speaking up culture.",
    followUpQuestions: ["What would you do if you suspected a colleague?", "Who would you report to?", "What protections exist for whistleblowers?"],
    mode: "inspection",
  },
  {
    id: "pc-i",
    domain: "ProtectionChildren",
    text: "Describe evidence for how the premises are actively maintained and regularly reviewed to protect children from avoidable hazards to their health and safety.",
    hint: "Maintenance logs, risk assessments of premises, remedial actions taken, equipment checks, safe spaces, accessible emergency exits, regular inspection records.",
    followUpQuestions: ["When was the last full health and safety check?", "What hazards were identified?", "How were they addressed?"],
    mode: "inspection",
  },
  {
    id: "pc-j",
    domain: "ProtectionChildren",
    text: "Describe evidence for how the home's safeguarding arrangements protect children from the risks of sexual exploitation, radicalisation, and cyber-bullying while using the internet.",
    hint: "Internet safety policies, parental controls, staff knowledge of online risks, teaching children about risks, monitoring of online activity, escalation procedures.",
    followUpQuestions: ["What internet safety education is provided?", "How do you monitor online activity?", "Have you identified concerns and how were they handled?"],
    mode: "inspection",
  },

  // Leadership & Management (5 new)
  {
    id: "lm-f",
    domain: "LeadershipManagement",
    text: "Describe evidence for how you ensure the home has a stable and sufficient workforce that provides continuity of care and avoids over-reliance on external agency staff.",
    hint: "Staffing records, staff turnover data, recruitment and retention strategies, agency staff usage analysis, impact on children, staff feedback.",
    followUpQuestions: ["What is your current staff turnover?", "How many agency staff do you use?", "What is your retention strategy?"],
    mode: "inspection",
  },
  {
    id: "lm-g",
    domain: "LeadershipManagement",
    text: "Describe evidence for how leaders understand the specific impact that the quality of care is having on the progress of children and use this knowledge to inform continuous improvement.",
    hint: "Data collection on child outcomes, impact analysis, improvement planning linked to data, evidence of changes made, outcomes monitoring.",
    followUpQuestions: ["How do you measure quality impact?", "What data are you tracking?", "Describe a recent improvement based on data."],
    mode: "inspection",
  },
  {
    id: "lm-h",
    domain: "LeadershipManagement",
    text: "Describe evidence for how practice in the home is continually informed and improved by taking into account current research and developments in residential childcare.",
    hint: "Evidence of engagement with research, training on new approaches, implementation of evidence-based practices, networking with other homes, conference attendance.",
    followUpQuestions: ["What research informs your practice?", "How do you stay current?", "Describe a practice change based on research."],
    mode: "inspection",
  },
  {
    id: "lm-i",
    domain: "LeadershipManagement",
    text: "Describe evidence for how the home's business continuity and workforce plans ensure children's needs continue to be safely met during unexpected staff absences or vacancies.",
    hint: "Business continuity plan, succession planning, emergency staffing protocols, flexible workforce arrangements, training depth across staff, testing of plans.",
    followUpQuestions: ["What happens if you're suddenly absent?", "How is the home covered?", "Have you tested these arrangements?"],
    mode: "inspection",
  },
  {
    id: "lm-j",
    domain: "LeadershipManagement",
    text: "Describe evidence for how the registered provider ensures the home is properly resourced and financially viable to deliver the outcomes set out in the statement of purpose.",
    hint: "Budget evidence, resource allocation, financial monitoring, links between funding and outcomes, evidence of sustainable model, investment in improvement.",
    followUpQuestions: ["How is the home financed?", "How do you allocate resources?", "What investments have been made to support outcomes?"],
    mode: "inspection",
  },

  // Care Planning (5 new)
  {
    id: "cp-f",
    domain: "CarePlanning",
    text: "Describe evidence for how arrangements ensure the effective and sensitive induction of a child into the home, especially when arriving as an emergency placement.",
    hint: "Induction protocol, individualised welcome, key worker relationships, settling-in support, family communication, records of child's experience, feedback.",
    followUpQuestions: ["Walk me through your induction process.", "How do you adapt for emergency arrivals?", "How do you know a child is settled?"],
    mode: "inspection",
  },
  {
    id: "cp-g",
    domain: "CarePlanning",
    text: "Describe evidence for how staff proactively help each child to access, understand, and contribute to their own case records in an age-appropriate way.",
    hint: "Access to records, summary versions, life story work, involvement in reviews, understanding of information, age-appropriate language, record of contributions.",
    followUpQuestions: ["How do children access their records?", "How are records explained to them?", "How do children contribute to them?"],
    mode: "inspection",
  },
  {
    id: "cp-h",
    domain: "CarePlanning",
    text: "Describe evidence for how the home challenges the placing authority by requesting a formal review of a child's plan if the current care provided is inadequate to meet their needs.",
    hint: "Records of challenge raised, rationale documented, formal review requests, advocacy for children, examples of successful challenge, communication with authorities.",
    followUpQuestions: ["If a child's needs changed, how would you escalate?", "Can you describe a time you challenged a plan?", "What was the outcome?"],
    mode: "inspection",
  },
  {
    id: "cp-i",
    domain: "CarePlanning",
    text: "Describe evidence for how you ensure that every child admitted falls strictly within the range of needs the home is registered to accommodate, as outlined in the statement of purpose.",
    hint: "Matching criteria, admissions policy, assessment against SOP, placement matching documentation, examples of declined placements, liaison with placing authorities.",
    followUpQuestions: ["What range of needs does your registration cover?", "How do you assess whether a child fits?", "Have you declined a placement? Why?"],
    mode: "inspection",
  },
  {
    id: "cp-j",
    domain: "CarePlanning",
    text: "Describe evidence for how staff support a child when they are preparing to leave the home, ensuring the transition promotes a positive ending and helps build their life story.",
    hint: "Transition planning, life story work, leaving care support, celebration of achievements, staying connected if possible, aftercare contact, preparing for next placement.",
    followUpQuestions: ["How do you prepare children for leaving?", "What life story work is done?", "How do you maintain connection after leaving?"],
    mode: "inspection",
  },

  // ── Supported Accommodation (SA) Questions ─────────────────────────────────────
  // England Regulations 2023 — 4 standards for 16/17-year-olds in supported accommodation

  // SA_LeadershipManagement (Regulation 4)
  {
    id: "sa-lm-a",
    domain: "SA_LeadershipManagement",
    text: "Show me the evidence that you have a firm grip on the service's current risk profile, including how data is analysed for themes, and how it matches your internal daily logs.",
    hint: "Risk profile analysis should include patterns in incident logs, safeguarding concerns, placement stability, and staff turnover. How do you track trends? How does this inform service improvements?",
    followUpQuestions: [
      "What data do you analyse to understand your risk profile?",
      "Can you describe a theme you identified and how you addressed it?",
      "How frequently do you review this analysis?",
    ],
    mode: "inspection",
  },
  {
    id: "sa-lm-b",
    domain: "SA_LeadershipManagement",
    text: "How does your workforce plan and training matrix guarantee that staff have the specific, up-to-date skills required to manage the complex needs of the young people currently accommodated here?",
    hint: "Supported Accommodation requires distinct skills: independent living coaching, therapeutic relationships with adolescents approaching adulthood, harm reduction, exploitation awareness, tenancy support. What training have staff completed?",
    followUpQuestions: [
      "What specific skills does your current cohort of young people require from staff?",
      "How do you identify and address training gaps?",
      "How do you ensure training translates into changed practice?",
    ],
    mode: "inspection",
  },
  {
    id: "sa-lm-c",
    domain: "SA_LeadershipManagement",
    text: "Describe evidence for how you ensure the service has a stable and sufficient workforce that provides continuity of support and avoids over-reliance on external agency staff.",
    hint: "Continuity of relationships is crucial for young people in SA. How do you retain permanent staff? What is your agency staff ratio? How do you manage impact of staff changes on young people?",
    followUpQuestions: [
      "What percentage of your staffing is permanent vs. agency?",
      "How do you monitor continuity for individual young people?",
      "What strategies do you use to retain experienced staff?",
    ],
    mode: "inspection",
  },
  {
    id: "sa-lm-d",
    domain: "SA_LeadershipManagement",
    text: "Describe evidence for how the service's business continuity and workforce plans ensure young people's needs continue to be safely met during unexpected staff absences or vacancies.",
    hint: "Business continuity plans should detail how support is maintained when staff are absent (illness, emergency, turnover). How are gaps filled? How is quality maintained under pressure?",
    followUpQuestions: [
      "What happens when a key staff member is suddenly unavailable?",
      "How do you communicate changes to young people?",
      "Can you walk me through a recent example?",
    ],
    mode: "inspection",
  },
  {
    id: "sa-lm-e",
    domain: "SA_LeadershipManagement",
    text: "Describe evidence for how the registered provider ensures the setting is properly resourced and financially viable to deliver the outcomes set out in your statement of purpose.",
    hint: "Financial viability directly impacts quality. Are resources adequate for the young people's needs? How is funding used? What constraints exist? How do you manage budget pressures?",
    followUpQuestions: [
      "How is funding allocated across the service?",
      "Have resource constraints affected your ability to deliver support?",
      "How do you plan for future sustainability?",
    ],
    mode: "inspection",
  },

  // SA_Protection (Regulation 5)
  {
    id: "sa-pc-a",
    domain: "SA_Protection",
    text: "Walk me through a recent safeguarding concern. How do your records demonstrate the 'concern → decision → referral → outcome' loop, including timely escalation to the accommodating local authority and the resulting practice changes?",
    hint: "Show the golden thread: What was the concern? What decision did you make? Who did you contact and when? What was the outcome? What changed in practice as a result? This demonstrates real safeguarding, not just policy.",
    followUpQuestions: [
      "Can you walk me through the timeline of a specific referral?",
      "How did you support the young person through that process?",
      "What practice changes resulted from that concern?",
    ],
    mode: "inspection",
  },
  {
    id: "sa-pc-b",
    domain: "SA_Protection",
    text: "How does your Location Risk Assessment directly inform the daily safeguarding strategies for young people vulnerable to criminal or sexual exploitation in this specific community, and how often is it reviewed?",
    hint: "SA is about knowing the specific neighbourhood risks (grooming gangs, drug dealing, street exploitation). How does your risk assessment translate into concrete daily safeguarding actions? How is it kept current?",
    followUpQuestions: [
      "What are the specific risks in this community for this age group?",
      "How do staff use this risk assessment daily?",
      "When was it last reviewed? What changed?",
    ],
    mode: "inspection",
  },
  {
    id: "sa-pc-c",
    domain: "SA_Protection",
    text: "Show me the evidence that your staff vetting and recruitment files are entirely robust, including DBS checks and verified, written explanations for any gaps in employment for the adults supporting these young people.",
    hint: "Vetting must be rigorous. Show DBS checks, references verified in writing, explanations for employment gaps obtained in interviews and recorded. This protects young people from harm from unsafe adults.",
    followUpQuestions: [
      "How do you verify employment histories?",
      "How do you handle gaps in employment?",
      "Show me an example of a robust file.",
    ],
    mode: "inspection",
  },
  {
    id: "sa-pc-d",
    domain: "SA_Protection",
    text: "Describe evidence for how staff support each young person to understand how they can manage their own safety and risks when spending time outside of the setting.",
    hint: "Young people in SA have freedom to spend time in the community. How do staff support them to recognise and manage risks? Do they have conversations about exploitation, peer pressure, substance misuse, financial safety?",
    followUpQuestions: [
      "How do staff prepare young people for safe community independence?",
      "How do you adapt this support to each young person's vulnerabilities?",
      "Can you describe a conversation a staff member had with a young person about safety?",
    ],
    mode: "inspection",
  },
  {
    id: "sa-pc-e",
    domain: "SA_Protection",
    text: "Describe evidence for how the service's safeguarding arrangements protect young people from the risks of sexual exploitation, radicalisation, and cyber-bullying while using the internet.",
    hint: "16/17-year-olds use the internet independently. How do staff support them to recognise grooming online, radicalisation propaganda, peer bullying? What monitoring or access controls exist? How do you balance safety with age-appropriate autonomy?",
    followUpQuestions: [
      "What training have staff received on online exploitation?",
      "How do you monitor young people's online safety without overly controlling?",
      "Can you describe how you've supported a young person around internet safety concerns?",
    ],
    mode: "inspection",
  },

  // SA_Accommodation (Regulation 6)
  {
    id: "sa-ac-a",
    domain: "SA_Accommodation",
    text: "Show me the evidence of how you have adapted the physical environment of the setting to meet the specific physical or safety needs of the young people currently living here, ensuring it remains homely rather than institutional.",
    hint: "Accommodation should feel like a home, not an institution. How have you personalised spaces? What safety adaptations are in place (handrails, accessible bathrooms, secure storage)? How do you balance safety with homeliness?",
    followUpQuestions: [
      "How is the accommodation different from an institutional setting?",
      "What adaptations have been made for specific young people's needs?",
      "How do young people personalise their spaces?",
    ],
    mode: "inspection",
  },
  {
    id: "sa-ac-b",
    domain: "SA_Accommodation",
    text: "Describe evidence for how you ensure young people are provided with the physical necessities and basic items (like bedding, towels, and kitchen equipment) they need to live comfortably and feel a sense of belonging.",
    hint: "Basic comfort items matter. Do young people have clean, comfortable bedding? Toiletries? Kitchen equipment to cook? Evidence includes purchasing records, young people's feedback, and observations during visits.",
    followUpQuestions: [
      "How do you ensure young people have the basics they need?",
      "What happens if something breaks or runs out?",
      "How do you check what young people actually need?",
    ],
    mode: "inspection",
  },
  {
    id: "sa-ac-c",
    domain: "SA_Accommodation",
    text: "Describe evidence for how you ensure safety measures, such as alarms, locks, or CCTV, remain necessary and proportionate without creating an institutional feel in the setting.",
    hint: "Safety measures must be proportionate and justified. Are they genuinely needed? Could they be scaled back as young people develop independence? Are they causing institutional atmosphere? Show me the rationale.",
    followUpQuestions: [
      "Why do you have the safety measures you do?",
      "How do you review whether they remain proportionate?",
      "Have any been removed as young people became more independent?",
    ],
    mode: "inspection",
  },
  {
    id: "sa-ac-d",
    domain: "SA_Accommodation",
    text: "Describe evidence for how the premises are actively maintained and regularly reviewed to protect young people from avoidable hazards to their health and safety.",
    hint: "Regular maintenance prevents hazards. Show gas safety certs, electrical testing, damp surveys, pest control, responsive repairs. How often are premises inspected? What records show action taken?",
    followUpQuestions: [
      "What is your maintenance schedule?",
      "How do you track and respond to repair requests?",
      "Can you show me records of recent maintenance?",
    ],
    mode: "inspection",
  },
  {
    id: "sa-ac-e",
    domain: "SA_Accommodation",
    text: "Describe evidence for how arrangements ensure the effective and sensitive induction of a young person into the accommodation, especially when arriving as an emergency placement.",
    hint: "First impressions matter. How do you welcome a young person? What information do they get? How is the accommodation shown to them? How do staff support settling in? Evidence includes induction checklists, welcome packs, settling-in reviews.",
    followUpQuestions: [
      "What does your induction process look like?",
      "How do you adapt for emergency arrivals?",
      "How do you know a young person is settling in well?",
    ],
    mode: "inspection",
  },

  // SA_Support (Regulation 7)
  {
    id: "sa-sp-a",
    domain: "SA_Support",
    text: "Show me the evidence of how you are actively supporting [Young Person's Name] to prepare for their transition to adult living or a new tenancy, including the practical (cooking, budgeting) and emotional independent living skills they are developing.",
    hint: "Focus on a specific young person. What are their transition goals? What practical skills are they building (cooking, budgeting, cleaning)? What emotional skills (managing stress, problem-solving, seeking help)? Show evidence of progress.",
    followUpQuestions: [
      "What are their transition goals after the accommodation?",
      "Which practical skills are they working on right now?",
      "How do you measure whether they're developing these skills?",
    ],
    mode: "inspection",
  },
  {
    id: "sa-sp-b",
    domain: "SA_Support",
    text: "Show me how you support older young people in their transition to further education, training, or employment, and how their own aspirations are documented in their plan for support.",
    hint: "Young people in SA need support to progress beyond just survival to meaningful adult roles. How do you help them pursue education, training, apprenticeships, employment? What's documented about their aspirations?",
    followUpQuestions: [
      "How many young people are currently in education, training, or employment?",
      "How did you support them to achieve that?",
      "What happens if they're not in education/training/employment?",
    ],
    mode: "inspection",
  },
  {
    id: "sa-sp-c",
    domain: "SA_Support",
    text: "Show me how you support young people to prepare for their statutory review meetings, including evidence that they were explicitly offered independent advocacy support to ensure their voice was heard.",
    hint: "Young people must be centred in their own planning. Are they prepared before reviews? Do they have independent advocacy? Can they articulate their views? Is their voice genuinely heard or just recorded?",
    followUpQuestions: [
      "How do you prepare young people for reviews?",
      "How is independent advocacy offered to them?",
      "Can you describe how a young person's view changed their support plan?",
    ],
    mode: "inspection",
  },
  {
    id: "sa-sp-d",
    domain: "SA_Support",
    text: "How do you track and evidence measurable improvements in a young person's physical or emotional well-being from the point of their initial baseline health assessment?",
    hint: "Baseline assessment establishes starting point (mental health, physical health, substance misuse, peer relationships, education engagement). How do you track progress? What evidence shows improvement or decline?",
    followUpQuestions: [
      "How do you baseline a young person's health when they arrive?",
      "How often do you review and track changes?",
      "Can you describe a young person whose wellbeing improved significantly?",
    ],
    mode: "inspection",
  },
  {
    id: "sa-sp-e",
    domain: "SA_Support",
    text: "Describe evidence for how staff encourage young people to take responsibility for their own behaviour, independent routines, and choices in accordance with their age, abilities, and understanding.",
    hint: "Building autonomy is central to SA. How do staff support young people to self-regulate, manage routines (meals, sleep, hygiene), make choices? How is this balanced with guidance and boundaries?",
    followUpQuestions: [
      "How do you help young people develop self-responsibility?",
      "What routines do they manage independently?",
      "How do staff support them when they make poor choices?",
    ],
    mode: "inspection",
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

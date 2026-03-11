/**
 * Shared legal page constants and configuration
 * Ensures consistency across all legal pages (Privacy, Terms, Disclaimer, Acceptable Use)
 */

export const LEGAL_PAGES_UPDATED = "11 March 2026";
export const LEGAL_PAGES_FOOTER = "If you do not agree, do not use the service.";
export const CONTACT_EMAIL = "info@mockofsted.co.uk";
export const CONTACT_FORM_URL = "/contact";

export const LEGAL_PAGE_HEADER = {
  privacy: {
    badge: "Privacy Policy",
    title: "Privacy Policy",
    description: "How we collect, use, and protect your data when using MockOfsted.",
  },
  terms: {
    badge: "Terms of Use & Conditions",
    title: "Terms of Use & Conditions",
    description: "Comprehensive terms for using MockOfsted. Please read carefully before using the service.",
  },
  disclaimer: {
    badge: "Important Regulatory & AI Disclaimer",
    title: "Important Regulatory & AI Disclaimer",
    description: "MockOfsted is a training and simulation platform. Professional judgement is required at all times. This platform carries important disclaimers regarding its use and limitations.",
  },
  acceptableUse: {
    badge: "Acceptable Use Policy",
    title: "Acceptable Use Policy",
    description: "Standards for safe, lawful, and fair use of MockOfsted.",
  },
};

export const LEGAL_LAST_UPDATED_TEXT = `Last updated: ${LEGAL_PAGES_UPDATED}. ${LEGAL_PAGE_HEADER.privacy ? "UK GDPR and Data Protection Act 2018 compliant." : ""} ${LEGAL_PAGES_FOOTER}`;

/**
 * Common liability disclaimer language reused across pages
 */
export const NO_LIABILITY_DISCLAIMERS = {
  inspection_outcomes: [
    "Ofsted ratings, judgements, grades, or outcomes (whether positive or negative)",
    "Regulatory enforcement action, notices to improve, or suspension",
    "Business loss, closure, reputational damage, or financial impact arising from inspection outcomes",
  ],
  ai_errors: [
    "Incorrect feedback, scores, or suggestions",
    "Inappropriate or offensive AI responses",
    "Reliance on inaccurate AI outputs leading to operational or compliance changes",
    "Time wasted, costs incurred, or decisions made based on AI outputs",
  ],
  regulatory_action: [
    "Compensation claims related to inspection results or regulatory action",
    "Loss of employment, income, or professional standing of staff members",
    "Impact on children, families, or settings as a consequence of inspection outcomes",
  ],
};

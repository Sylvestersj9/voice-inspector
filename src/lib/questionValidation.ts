/**
 * Question Bank Validation
 * Ensures all questions have required fields and validates data integrity
 */

import { questionBank, BankQuestion, Domain, DOMAIN_ORDER } from "./questions";

export interface ValidationError {
  id: string;
  field: string;
  error: string;
}

export function validateQuestionBank(): { valid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  const seenIds = new Set<string>();

  // Validate each question
  questionBank.forEach((q, index) => {
    // Check required fields
    if (!q.id) {
      errors.push({
        id: `[index ${index}]`,
        field: "id",
        error: "Missing required field 'id'",
      });
    }
    if (!q.domain) {
      errors.push({
        id: q.id || `[index ${index}]`,
        field: "domain",
        error: "Missing required field 'domain'",
      });
    }
    if (!q.text) {
      errors.push({
        id: q.id || `[index ${index}]`,
        field: "text",
        error: "Missing required field 'text'",
      });
    }
    if (!q.hint) {
      errors.push({
        id: q.id || `[index ${index}]`,
        field: "hint",
        error: "Missing required field 'hint'",
      });
    }
    if (!q.followUpQuestions || q.followUpQuestions.length === 0) {
      errors.push({
        id: q.id || `[index ${index}]`,
        field: "followUpQuestions",
        error: "Must have at least 1 follow-up question",
      });
    }

    // Check for duplicate IDs
    if (q.id) {
      if (seenIds.has(q.id)) {
        errors.push({
          id: q.id,
          field: "id",
          error: `Duplicate ID found (${q.id} used multiple times)`,
        });
      }
      seenIds.add(q.id);
    }

    // Validate domain is valid
    if (q.domain && !DOMAIN_ORDER.includes(q.domain as Domain)) {
      errors.push({
        id: q.id || `[index ${index}]`,
        field: "domain",
        error: `Invalid domain: ${q.domain}. Must be one of: ${DOMAIN_ORDER.join(", ")}`,
      });
    }

    // Validate mode if present
    if (q.mode && !["inspection", "fit_person", "ri"].includes(q.mode)) {
      errors.push({
        id: q.id || `[index ${index}]`,
        field: "mode",
        error: `Invalid mode: ${q.mode}. Must be one of: inspection, fit_person, ri`,
      });
    }

    // Text length validation
    if (q.text && q.text.length < 20) {
      errors.push({
        id: q.id || `[index ${index}]`,
        field: "text",
        error: "Question text must be at least 20 characters",
      });
    }
  });

  // Validate domain coverage
  const domainCounts: Record<Domain, number> = {} as Record<Domain, number>;
  DOMAIN_ORDER.forEach((d) => {
    domainCounts[d] = questionBank.filter((q) => q.domain === d).length;
  });

  Object.entries(domainCounts).forEach(([domain, count]) => {
    if (count === 0) {
      errors.push({
        id: "bank-coverage",
        field: "domain-coverage",
        error: `No questions found for domain: ${domain}`,
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Log validation results to console with helpful formatting
 */
export function logValidationResults(validation: ReturnType<typeof validateQuestionBank>): void {
  if (validation.valid) {
    console.log("✅ Question bank validation passed!");
    console.log(`Total questions: ${questionBank.length}`);

    // Show domain breakdown
    const domainCounts: Record<string, number> = {};
    questionBank.forEach((q) => {
      domainCounts[q.domain] = (domainCounts[q.domain] || 0) + 1;
    });

    console.log("Domain breakdown:");
    Object.entries(domainCounts)
      .sort()
      .forEach(([domain, count]) => {
        console.log(`  ${domain}: ${count} questions`);
      });

    return;
  }

  console.error("❌ Question bank validation FAILED!");
  console.error(`Found ${validation.errors.length} error(s):\n`);

  validation.errors.forEach((err) => {
    console.error(`  [${err.id}] ${err.field}: ${err.error}`);
  });
}

/**
 * Call during app initialization (in useEffect or critical startup hook)
 */
export function validateAndLogQuestionBank(): boolean {
  const validation = validateQuestionBank();
  logValidationResults(validation);
  return validation.valid;
}

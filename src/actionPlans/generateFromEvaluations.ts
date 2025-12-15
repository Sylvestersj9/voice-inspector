import type { ActionItem, ActionPriority } from "./types";

type EvalRow = {
  gaps?: string | null;
  follow_up_questions?: string | null;
  recommendations?: string | null;
  band?: string | null;
  inspection_session_questions?: { domain_name?: string | null } | null;
};

function parseStatements(raw?: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(/[\n\r;]|•|ГўВЂВў|-/)
    .map((s) => s.replace(/^[\s•-]+/, "").trim())
    .filter((s) => s.length > 3);
}

function priorityForIndex(idx: number): ActionPriority {
  if (idx <= 1) return "High";
  if (idx <= 3) return "Medium";
  return "Low";
}

export function generateActionsFromEvaluations(rows: EvalRow[]): ActionItem[] {
  const pool: string[] = [];

  rows.forEach((row) => {
    pool.push(...parseStatements(row.gaps));
    pool.push(...parseStatements(row.recommendations));
    pool.push(...parseStatements(row.follow_up_questions));
  });

  const unique = Array.from(new Set(pool)).filter(Boolean);

  while (unique.length < 3) {
    unique.push("Add an evidence review and strengthen documentation for a recent safeguarding scenario.");
  }

  const limited = unique.slice(0, 6);

  return limited.map((text, idx) => {
    const title = text.length > 80 ? `${text.slice(0, 77)}...` : text;
    return {
      title: title || "Action item",
      description: text,
      priority: priorityForIndex(idx),
      owner: "",
      due_date: null,
      status: "Open",
    };
  });
}

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { FeedbackDialog } from "@/feedback/FeedbackDialog";
import { useOnboardingChecklist } from "./useOnboardingChecklist";

type ChecklistItem = {
  id: string;
  label: string;
};

const items: ChecklistItem[] = [
  { id: "create_session", label: "Create a practice session" },
  { id: "answer_questions", label: "Answer the questions (voice or typing)" },
  { id: "run_evaluation", label: "Run evaluation" },
  { id: "review_summary", label: "Review the session summary" },
  { id: "send_feedback", label: "Send feedback" },
];

export function OnboardingChecklist() {
  const { state, progress, toggleItem, completeItem, dismiss } = useOnboardingChecklist();
  const [showFeedback, setShowFeedback] = useState(false);
  const allComplete = useMemo(() => progress.completed === progress.total, [progress.completed, progress.total]);

  useEffect(() => {
    if (allComplete) {
      const timer = setTimeout(() => dismiss(), 1200);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [allComplete, dismiss]);

  if (state.dismissed) return null;

  if (allComplete) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
        <div className="text-sm font-semibold text-emerald-900">All set - thanks!</div>
        <div className="text-xs text-emerald-800">You can hide this checklist once you've seen this message.</div>
        <Button variant="outline" size="sm" className="mt-3" onClick={dismiss}>
          Hide
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-slate-900">Private Beta checklist</div>
          <div className="text-xs text-slate-600">Helps us validate the flow. Takes ~5 minutes.</div>
        </div>
        <button type="button" onClick={dismiss} className="text-xs text-slate-500 hover:text-slate-700">
          Dismiss
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="text-xs font-semibold text-slate-700">
          {progress.completed}/{progress.total} complete
        </div>
        <Progress value={(progress.completed / progress.total) * 100} className="h-2 flex-1" />
      </div>

      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <label key={item.id} className="flex items-center gap-3 text-sm text-slate-800">
            <Checkbox
              checked={Boolean(state.items?.[item.id])}
              onCheckedChange={() => toggleItem(item.id)}
              className="h-4 w-4"
            />
            <span>{item.label}</span>
          </label>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={dismiss}>
          Dismiss
        </Button>
        <Button
          variant="default"
          size="sm"
          className="bg-[#0D9488] text-white hover:bg-[#0b7c73]"
          onClick={() => setShowFeedback(true)}
        >
          Send feedback
        </Button>
      </div>

      <FeedbackDialog
        open={showFeedback}
        onOpenChange={setShowFeedback}
        onSent={() => completeItem("send_feedback")}
      />
    </div>
  );
}

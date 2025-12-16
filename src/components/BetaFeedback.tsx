import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { sendFeedback } from "@/feedback/sendFeedback";
import { getFeedbackContext } from "@/feedback/feedbackContext";

type IssueType = "Bug" | "Confusing" | "Suggestion";

export function BetaFeedback() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<IssueType>("Bug");
  const [message, setMessage] = useState("");
  const [expected, setExpected] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!message.trim()) {
      toast({ title: "Add a brief description", description: "Please describe what happened." });
      return;
    }
    setSubmitting(true);
    try {
      await sendFeedback({
        message: `${type}: ${message}`,
        details: expected.trim() || undefined,
        expected: expected.trim() || undefined,
        context: getFeedbackContext(),
      });
      toast({ title: "Thanks - received." });
      setOpen(false);
      setMessage("");
      setExpected("");
      setType("Bug");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send feedback";
      toast({ title: "Could not submit", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-[#0D9488] hover:text-[#0b7c73]"
      >
        Report issue
      </button>

      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold text-slate-900">Report issue</div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800">Issue type</label>
                <select
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={type}
                  onChange={(e) => setType(e.target.value as IssueType)}
                >
                  <option value="Bug">Bug</option>
                  <option value="Confusing">Confusing</option>
                  <option value="Suggestion">Suggestion</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800">What happened?</label>
                <textarea
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Briefly describe the issue"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800">What did you expect? (optional)</label>
                <textarea
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  rows={2}
                  value={expected}
                  onChange={(e) => setExpected(e.target.value)}
                  placeholder="What outcome were you expecting?"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submit}
                  disabled={submitting}
                  className="rounded-lg bg-[#0D9488] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0b7c73] disabled:opacity-60"
                >
                  {submitting ? "Sending..." : "Submit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

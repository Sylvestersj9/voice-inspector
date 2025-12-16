import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { getFeedbackContext } from "./feedbackContext";
import { sendFeedback } from "./sendFeedback";

type FeedbackDialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  sessionId?: string;
  userId?: string | null;
  onSent?: () => void;
};

const ratingOptions = [1, 2, 3, 4, 5];

export function FeedbackDialog({ open, onOpenChange, trigger, sessionId, userId, onSent }: FeedbackDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [details, setDetails] = useState("");
  const [expected, setExpected] = useState("");
  const [includeContext, setIncludeContext] = useState(true);
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const actualOpen = open ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const context = useMemo(() => (includeContext ? getFeedbackContext({ sessionId }) : undefined), [includeContext, sessionId]);

  useEffect(() => {
    if (!actualOpen) {
      setMessage("");
      setDetails("");
      setExpected("");
      setRating(undefined);
      setIncludeContext(true);
    }
  }, [actualOpen]);

  const submit = async () => {
    try {
      setLoading(true);
      await sendFeedback({
        message,
        details: details.trim() || undefined,
        expected: expected.trim() || undefined,
        rating,
        context,
        userId,
      });
      toast({ title: "Thanks - sent!" });
      setOpen(false);
      onSent?.();
    } catch (err: unknown) {
      const description = err instanceof Error ? err.message : "Failed to send feedback";
      toast({ title: "Could not send", description, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const triggerNode = trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null;

  return (
    <Dialog open={actualOpen} onOpenChange={setOpen}>
      {triggerNode}
      <DialogContent className="max-w-xl sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send feedback</DialogTitle>
          <DialogDescription>Tell us what is working and what is confusing.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-800">Rating (optional)</Label>
            <div className="flex gap-2">
              {ratingOptions.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRating((prev) => (prev === r ? undefined : r))}
                  className={[
                    "h-8 w-8 rounded-full border text-sm font-semibold transition",
                    rating === r ? "border-[#0D9488] bg-[#0D9488] text-white" : "border-slate-200 text-slate-700",
                  ].join(" ")}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-800">What happened?</Label>
            <Textarea
              required
              minLength={10}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe the issue or suggestion (min 10 characters)"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-800">Additional details (optional)</Label>
            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Steps, frequency, or who was affected."
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-800">What did you expect? (optional)</Label>
            <Textarea
              value={expected}
              onChange={(e) => setExpected(e.target.value)}
              placeholder="What outcome were you expecting?"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <Checkbox checked={includeContext} onCheckedChange={(v) => setIncludeContext(Boolean(v))} />
            Include page/session info
          </label>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={loading} className="bg-[#0D9488] text-white hover:bg-[#0b7c73]">
              {loading ? "Sending..." : "Submit"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

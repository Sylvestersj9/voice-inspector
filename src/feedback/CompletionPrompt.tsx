import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { sendFeedback } from "./sendFeedback";
import { getFeedbackContext } from "./feedbackContext";

type Props = {
  sessionId?: string | null;
  userId?: string | null;
};

const storageKey = (id: string) => `feedback_prompted_${id}`;

export default function CompletionPrompt({ sessionId, userId }: Props) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!sessionId) return;
    const key = storageKey(sessionId);
    const seen = localStorage.getItem(key) === "1";
    if (!seen) setOpen(true);
  }, [sessionId]);

  if (!sessionId) return null;

  const handleClose = () => {
    localStorage.setItem(storageKey(sessionId), "1");
    setOpen(false);
  };

  const handleSend = async () => {
    try {
      setLoading(true);
      await sendFeedback({
        message: message || "Session completed.",
        rating,
        context: getFeedbackContext({ sessionId }),
        userId,
      });
      toast({ title: "Thanks — sent!" });
      handleClose();
    } catch (err: unknown) {
      const description = err instanceof Error ? err.message : "Failed to send feedback";
      toast({ title: "Could not send", description, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : handleClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quick one — how was this session?</DialogTitle>
          <DialogDescription>Two taps helps us improve.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRating((prev) => (prev === r ? undefined : r))}
                className={[
                  "h-9 w-9 rounded-full border text-sm font-semibold transition",
                  rating === r ? "border-[#0D9488] bg-[#0D9488] text-white" : "border-slate-200 text-slate-700",
                ].join(" ")}
              >
                {r}
              </button>
            ))}
          </div>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What could be better? (optional)"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              Not now
            </Button>
            <Button onClick={handleSend} disabled={loading} className="bg-[#0D9488] text-white hover:bg-[#0b7c73]">
              {loading ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

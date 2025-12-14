import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, Copy, Mail, MessageSquare } from "lucide-react";

export default function Account() {
  const [feedback, setFeedback] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(feedback || "Voice Inspector feedback");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy failed", error);
    }
  };

  const handleEmail = () => {
    const body = encodeURIComponent(
      feedback || "I have feedback about Voice Inspector (no account needed, open beta).",
    );
    window.location.href = `mailto:?subject=Voice Inspector feedback&body=${body}`;
  };

  return (
    <div className="min-h-screen gradient-hero py-8 px-4">
      <div className="container max-w-3xl mx-auto space-y-6">
        <div className="card-elevated p-6 space-y-3">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-primary">Open beta</p>
              <h1 className="font-display text-2xl font-bold text-foreground">Feedback & Access</h1>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Everything is unlocked and free while we gather feedback. No sign-in, no billing, and no limits on
            trying questions or saving sessions locally.
          </p>
        </div>

        <div className="card-elevated p-6 space-y-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">Share your thoughts</h2>
            <p className="text-sm text-muted-foreground">
              Drop any notes about the prompts, scoring, or UX. We do not send this anywhere automatically—copy it
              or start an email draft to share it with us however you prefer.
            </p>
          </div>

          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="What should we improve or change next?"
            className="min-h-[140px]"
          />

          <div className="flex flex-wrap gap-3">
            <Button onClick={handleCopy} className="gap-2">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy feedback"}
            </Button>
            <Button variant="outline" onClick={handleEmail} className="gap-2">
              <Mail className="h-4 w-4" />
              Start email draft
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Tip: include examples from your sessions (but never names or identifying details).
          </p>
        </div>
      </div>
    </div>
  );
}

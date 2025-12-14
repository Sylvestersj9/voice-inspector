import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Check, Home, Loader2, Mail, MessageCircle, MessageSquare } from "lucide-react";

type SubmitType = "feedback" | "contact";

interface SendResult {
  ok: boolean;
  message: string;
}

const emailAddress = "reports@ziantra.co.uk";

async function sendFeedback(payload: Record<string, string>, type: SubmitType): Promise<SendResult> {
  try {
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, ...payload }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || "Unable to send");
    }

    return { ok: true, message: "Thanks! We've received your message." };
  } catch (error) {
    // Fallback: open mail client so the user can still send
    const subject = type === "feedback" ? "Voice Inspector feedback" : "Voice Inspector contact";
    const body = Object.entries(payload)
      .filter(([, value]) => value)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n");
    window.location.href = `mailto:${emailAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to send via the service; opened your email client instead.",
    };
  }
}

export default function Account() {
  const [feedbackName, setFeedbackName] = useState("");
  const [feedbackEmail, setFeedbackEmail] = useState("");
  const [feedbackOrg, setFeedbackOrg] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState<string | null>(null);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  const [contactName, setContactName] = useState("");
  const [contactDetails, setContactDetails] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactStatus, setContactStatus] = useState<string | null>(null);
  const [contactSubmitting, setContactSubmitting] = useState(false);

  const handleFeedbackSubmit = async () => {
    if (!feedbackMessage.trim()) {
      setFeedbackStatus("Please add a message so we know what to improve.");
      return;
    }
    setFeedbackSubmitting(true);
    setFeedbackStatus(null);
    const result = await sendFeedback(
      {
        name: feedbackName.trim(),
        email: feedbackEmail.trim(),
        organization: feedbackOrg.trim(),
        message: feedbackMessage.trim(),
      },
      "feedback",
    );
    setFeedbackStatus(result.message);
    if (result.ok) {
      setFeedbackMessage("");
    }
    setFeedbackSubmitting(false);
  };

  const handleContactSubmit = async () => {
    if (!contactMessage.trim()) {
      setContactStatus("Please add a message so we can respond.");
      return;
    }
    setContactSubmitting(true);
    setContactStatus(null);
    const result = await sendFeedback(
      {
        name: contactName.trim(),
        details: contactDetails.trim(),
        message: contactMessage.trim(),
      },
      "contact",
    );
    setContactStatus(result.message);
    if (result.ok) {
      setContactMessage("");
    }
    setContactSubmitting(false);
  };

  return (
    <div className="min-h-screen gradient-hero py-8 px-4">
      <div className="container max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Link to="/">
            <Button variant="outline" size="sm" className="gap-2">
              <Home className="h-4 w-4" />
              Back to simulator
            </Button>
          </Link>
          <div className="text-right text-sm text-muted-foreground">
            Questions? Email{" "}
            <a href={`mailto:${emailAddress}`} className="text-primary underline">
              {emailAddress}
            </a>
          </div>
        </div>

        <div className="card-elevated p-6 space-y-3">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-primary">Open beta</p>
              <h1 className="font-display text-2xl font-bold text-foreground">Feedback & Contact</h1>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Everything is unlocked and free while we gather feedback. No sign-in, no billing. Share your thoughts or
            drop us a message anytime.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="card-elevated p-6 space-y-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-semibold text-foreground">Feedback form</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Optional details help us follow up, but you can leave them blank and still send feedback.
            </p>
            <div className="space-y-3">
              <Input placeholder="Name (optional)" value={feedbackName} onChange={(e) => setFeedbackName(e.target.value)} />
              <Input
                type="email"
                placeholder="Email (optional)"
                value={feedbackEmail}
                onChange={(e) => setFeedbackEmail(e.target.value)}
              />
              <Input
                placeholder="Organisation (optional)"
                value={feedbackOrg}
                onChange={(e) => setFeedbackOrg(e.target.value)}
              />
              <Textarea
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
                placeholder="What should we improve or change next?"
                className="min-h-[140px]"
              />
              <Button onClick={handleFeedbackSubmit} disabled={feedbackSubmitting} className="w-full gap-2">
                {feedbackSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Send feedback
              </Button>
              {feedbackStatus && (
                <p className="text-sm text-muted-foreground">{feedbackStatus}</p>
              )}
            </div>
          </div>

          <div className="card-elevated p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-semibold text-foreground">Contact</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Use this for quick questions or to ask for a demo. We reply from {emailAddress}.
            </p>
            <div className="space-y-3">
              <Input placeholder="Name (optional)" value={contactName} onChange={(e) => setContactName(e.target.value)} />
              <Input
                placeholder="How can we reach you? (optional)"
                value={contactDetails}
                onChange={(e) => setContactDetails(e.target.value)}
              />
              <Textarea
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="Your message"
                className="min-h-[140px]"
              />
              <Button onClick={handleContactSubmit} disabled={contactSubmitting} className="w-full gap-2">
                {contactSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Send message
              </Button>
              {contactStatus && (
                <p className="text-sm text-muted-foreground">{contactStatus}</p>
              )}
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          Prefer email? Reach us at{" "}
          <a href={`mailto:${emailAddress}`} className="text-primary underline">
            {emailAddress}
          </a>
        </div>
      </div>
    </div>
  );
}

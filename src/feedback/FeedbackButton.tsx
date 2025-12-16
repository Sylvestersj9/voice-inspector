import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeedbackDialog } from "./FeedbackDialog";

type Props = {
  sessionId?: string;
  userId?: string | null;
  onSent?: () => void;
};

export default function FeedbackButton({ sessionId, userId, onSent }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="fixed bottom-4 right-4 z-30">
        <Button
          size="sm"
          onClick={() => setOpen(true)}
          className="shadow-md bg-[#0D9488] text-white hover:bg-[#0b7c73]"
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          Feedback
        </Button>
      </div>
      <FeedbackDialog open={open} onOpenChange={setOpen} sessionId={sessionId} userId={userId} onSent={onSent} />
    </>
  );
}

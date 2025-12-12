import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Keyboard, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface InputMethodSelectorProps {
  onVoiceSelected: () => void;
  onTextSubmit: (text: string) => void;
  disabled?: boolean;
}

export function InputMethodSelector({ 
  onVoiceSelected, 
  onTextSubmit,
  disabled 
}: InputMethodSelectorProps) {
  const [mode, setMode] = useState<"choice" | "text">("choice");
  const [textInput, setTextInput] = useState("");

  const handleSubmitText = () => {
    if (textInput.trim().length >= 10) {
      onTextSubmit(textInput.trim());
      setTextInput("");
      setMode("choice");
    }
  };

  if (mode === "text") {
    return (
      <div className="p-6 space-y-4 animate-fade-in-up">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-foreground">Type Your Response</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMode("choice")}
            className="text-muted-foreground"
          >
            Back to options
          </Button>
        </div>
        
        <Textarea
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Type your answer to the inspection question here. Be detailed and provide specific examples where possible..."
          className="min-h-[200px] text-base leading-relaxed resize-none"
          disabled={disabled}
        />
        
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {textInput.length < 10 
              ? `Minimum 10 characters required (${textInput.length}/10)`
              : `${textInput.length} characters`
            }
          </p>
          <Button
            onClick={handleSubmitText}
            disabled={disabled || textInput.trim().length < 10}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            Submit for Evaluation
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 animate-fade-in-up">
      <div className="text-center mb-6">
        <h3 className="font-display text-lg font-semibold text-foreground mb-2">
          How would you like to respond?
        </h3>
        <p className="text-sm text-muted-foreground">
          Choose voice recording for a realistic inspection experience, or type your response
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Voice Recording Option */}
        <button
          onClick={onVoiceSelected}
          disabled={disabled}
          className={cn(
            "flex flex-col items-center gap-4 p-6 rounded-xl border-2 border-border",
            "bg-card hover:bg-accent hover:border-primary/50 transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "disabled:opacity-50 disabled:pointer-events-none"
          )}
        >
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Mic className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center">
            <p className="font-medium text-foreground mb-1">Voice Recording</p>
            <p className="text-sm text-muted-foreground">
              Record your answer like a real inspection
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
            Recommended
          </span>
        </button>

        {/* Text Input Option */}
        <button
          onClick={() => setMode("text")}
          disabled={disabled}
          className={cn(
            "flex flex-col items-center gap-4 p-6 rounded-xl border-2 border-border",
            "bg-card hover:bg-accent hover:border-primary/50 transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "disabled:opacity-50 disabled:pointer-events-none"
          )}
        >
          <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center">
            <Keyboard className="h-8 w-8 text-secondary-foreground" />
          </div>
          <div className="text-center">
            <p className="font-medium text-foreground mb-1">Type Response</p>
            <p className="text-sm text-muted-foreground">
              Write your answer as text
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
            Alternative
          </span>
        </button>
      </div>
    </div>
  );
}

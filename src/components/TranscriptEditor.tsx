import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Edit2, Check, X, Loader2 } from "lucide-react";

interface TranscriptEditorProps {
  transcript: string;
  onTranscriptChange: (transcript: string) => void;
  onSubmitForEvaluation: () => void;
  onRecordAgain: () => void;
  isLoading?: boolean;
}

export function TranscriptEditor({
  transcript,
  onTranscriptChange,
  onSubmitForEvaluation,
  onRecordAgain,
  isLoading,
}: TranscriptEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTranscript, setEditedTranscript] = useState(transcript);

  const handleSaveEdit = () => {
    onTranscriptChange(editedTranscript);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedTranscript(transcript);
    setIsEditing(false);
  };

  return (
    <div className="card-elevated p-6 animate-fade-in-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-semibold text-foreground">
          Your Transcribed Response
        </h3>
        {!isEditing && (
          <Button
            onClick={() => setIsEditing(true)}
            variant="ghost"
            size="sm"
            className="gap-2"
          >
            <Edit2 className="h-4 w-4" />
            Edit
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <Textarea
            value={editedTranscript}
            onChange={(e) => setEditedTranscript(e.target.value)}
            className="min-h-[200px] text-base leading-relaxed"
            placeholder="Your transcribed response..."
          />
          <div className="flex gap-2 justify-end">
            <Button onClick={handleCancelEdit} variant="outline" size="sm">
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} variant="default" size="sm">
              <Check className="h-4 w-4 mr-1" />
              Save Changes
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-muted/50 rounded-lg p-4 mb-6">
          <p className="text-foreground leading-relaxed whitespace-pre-wrap">
            {transcript}
          </p>
        </div>
      )}

      {!isEditing && (
        <div className="flex gap-3 justify-end border-t border-border pt-4 mt-4">
          <Button onClick={onRecordAgain} variant="outline">
            Record Again
          </Button>
          <Button
            onClick={() => onSubmitForEvaluation()}
            variant="default"
            disabled={isLoading || !transcript.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Evaluating...
              </>
            ) : (
              "Submit for Evaluation"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

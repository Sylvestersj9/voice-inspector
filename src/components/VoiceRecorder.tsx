import { Mic, Square, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { cn } from "@/lib/utils";

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  disabled?: boolean;
}

export function VoiceRecorder({ onRecordingComplete, disabled }: VoiceRecorderProps) {
  const {
    isRecording,
    recordingTime,
    audioBlob,
    audioUrl,
    error,
    startRecording,
    stopRecording,
    resetRecording,
    formatTime,
  } = useVoiceRecorder();

  const handleStopRecording = () => {
    stopRecording();
  };

  const handleUseRecording = () => {
    if (audioBlob) {
      onRecordingComplete(audioBlob);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 p-8">
        <div className="text-destructive text-center max-w-md">
          <p className="font-medium mb-2">Microphone Access Required</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
        <Button onClick={startRecording} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (audioBlob && audioUrl) {
    return (
      <div className="flex flex-col items-center gap-6 p-8 animate-fade-in-up">
        <div className="text-center">
          <p className="text-lg font-medium text-foreground mb-1">Recording Complete</p>
          <p className="text-sm text-muted-foreground">
            Duration: {formatTime(recordingTime)}
          </p>
        </div>
        
        <audio 
          src={audioUrl} 
          controls 
          className="w-full max-w-md rounded-lg"
        />
        
        <div className="flex gap-3">
          <Button 
            onClick={resetRecording} 
            variant="outline"
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Record Again
          </Button>
          <Button 
            onClick={handleUseRecording}
            variant="default"
            disabled={disabled}
          >
            Continue to Transcription
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 p-8">
      {/* Recording Timer */}
      {isRecording && (
        <div className="text-center animate-fade-in-up">
          <div className="text-4xl font-display font-semibold text-foreground tracking-tight">
            {formatTime(recordingTime)}
          </div>
          <p className="text-sm text-muted-foreground mt-2">Recording in progress...</p>
        </div>
      )}

      {/* Record Button */}
      <Button
        onClick={isRecording ? handleStopRecording : startRecording}
        variant={isRecording ? "recording" : "recording-start"}
        size="icon-xl"
        disabled={disabled}
        className={cn(
          "rounded-full transition-all duration-300",
          isRecording && "animate-recording-pulse"
        )}
      >
        {isRecording ? (
          <Square className="h-8 w-8" />
        ) : (
          <Mic className="h-8 w-8" />
        )}
      </Button>

      {/* Instructions */}
      <p className="text-sm text-muted-foreground text-center max-w-sm">
        {isRecording 
          ? "Click to stop recording when you've finished your answer"
          : "Click to start recording your response to the question above"
        }
      </p>
    </div>
  );
}

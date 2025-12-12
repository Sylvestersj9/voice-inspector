import { ofstedQuestions } from "@/lib/questions";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface ProgressIndicatorProps {
  currentQuestionIndex: number;
  completedQuestions: number[];
}

export function ProgressIndicator({ 
  currentQuestionIndex, 
  completedQuestions 
}: ProgressIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {ofstedQuestions.map((q, index) => {
        const isCompleted = completedQuestions.includes(index);
        const isCurrent = index === currentQuestionIndex;
        
        return (
          <div key={q.id} className="flex items-center">
            <div
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium transition-all duration-300",
                isCompleted && "bg-success text-success-foreground",
                isCurrent && !isCompleted && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                !isCurrent && !isCompleted && "bg-muted text-muted-foreground"
              )}
            >
              {isCompleted ? (
                <Check className="h-5 w-5" />
              ) : (
                index + 1
              )}
            </div>
            {index < ofstedQuestions.length - 1 && (
              <div 
                className={cn(
                  "w-8 h-0.5 mx-1 transition-all duration-300",
                  isCompleted ? "bg-success" : "bg-muted"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

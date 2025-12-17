import { BankQuestion } from "@/lib/questions";

interface QuestionCardProps {
  question: BankQuestion;
  currentIndex: number;
  totalQuestions: number;
}

export function QuestionCard({ question, currentIndex, totalQuestions }: QuestionCardProps) {
  const domainLabel = question.domain.replace(/([A-Z])/g, " $1").replace(/^\s/, "");

  return (
    <div className="card-elevated p-8 mb-8 animate-fade-in-up">
      <div className="flex items-center gap-3 mb-4">
        <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
          {currentIndex + 1}
        </span>
        <span className="text-sm font-medium text-muted-foreground">
          of {totalQuestions} questions
        </span>
        <span className="ml-auto px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium">
          {domainLabel}
        </span>
      </div>
      
      <h2 className="font-display text-xl md:text-2xl font-semibold text-foreground leading-relaxed text-balance">
        {question.text}
      </h2>
    </div>
  );
}

import { useNavigate } from "react-router-dom";
import FinalSummaryReport from "@/components/report/FinalSummaryReport";

type SummaryQuestion = {
  id: string;
  domain?: string | null;
  title?: string | null;
  question?: string | null;
};

type SummaryAnswer = {
  question_id: string;
  text?: string | null;
  transcript?: string | null;
};

type SummaryEvaluation = {
  question_id?: string;
  score?: number | null;
  band?: string | null;
  strengths?: string[] | string | null;
  gaps?: string[] | string | null;
  recommendations?: string[] | string | null;
  follow_up_questions?: string[] | string | null;
};

type SummaryProps = {
  questions: SummaryQuestion[];
  answers: SummaryAnswer[];
  evaluations: SummaryEvaluation[];
};

export default function Summary({ questions, answers, evaluations }: SummaryProps) {
  const nav = useNavigate();

  return (
    <FinalSummaryReport
      questions={questions}
      answers={answers}
      evaluations={evaluations}
      onPracticeAgain={() => nav("/app")}
    />
  );
}

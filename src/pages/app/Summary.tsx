import { useNavigate } from "react-router-dom";
import FinalSummaryReport from "@/components/report/FinalSummaryReport";

export default function Summary({ questions, answers, evaluations }: any) {
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

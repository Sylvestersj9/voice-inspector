import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Clock, Calendar, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getJudgementBand, ofstedQuestions } from "@/lib/questions";

interface Session {
  id: string;
  created_at: string;
  overall_score: number | null;
  overall_band: string | null;
}

interface SessionAnswer {
  id: string;
  question_id: number;
  question_domain: string;
  transcript: string;
  evaluation_json: any;
  attempt_index: number;
}

export default function History() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [sessionAnswers, setSessionAnswers] = useState<SessionAnswer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSessions(data);
    }
    setLoading(false);
  };

  const loadSessionDetails = async (sessionId: string) => {
    setSelectedSession(sessionId);
    const { data, error } = await supabase
      .from('session_answers')
      .select('*')
      .eq('session_id', sessionId)
      .order('question_id', { ascending: true })
      .order('attempt_index', { ascending: true });

    if (!error && data) {
      setSessionAnswers(data);
    }
  };

  const getScoreColor = (band: string | null) => {
    switch (band) {
      case "Outstanding": return "bg-success text-success-foreground";
      case "Good": return "bg-primary text-primary-foreground";
      case "Requires Improvement": return "bg-warning text-warning-foreground";
      case "Inadequate": return "bg-destructive text-destructive-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getWeakestDomain = (answers: SessionAnswer[]) => {
    if (answers.length === 0) return null;
    
    // Get best score per question (considering follow-ups)
    const questionScores = new Map<number, { domain: string; score: number }>();
    answers.forEach(a => {
      const score = a.evaluation_json?.score || 0;
      const existing = questionScores.get(a.question_id);
      if (!existing || score > existing.score) {
        questionScores.set(a.question_id, { domain: a.question_domain, score });
      }
    });

    let weakest = { domain: '', score: 6 };
    questionScores.forEach(({ domain, score }) => {
      if (score < weakest.score) {
        weakest = { domain, score };
      }
    });

    return weakest.score < 6 ? weakest.domain : null;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero py-8 px-4">
      <div className="container max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <Link to="/">
            <Button variant="outline" size="sm" className="gap-1">
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Session History</h1>
            <p className="text-sm text-muted-foreground">Review your past inspection simulations</p>
          </div>
          <div className="text-xs text-muted-foreground">
            Questions? <a className="text-primary underline" href="mailto:reports@ziantra.co.uk">reports@ziantra.co.uk</a>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="card-elevated p-12 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-display text-xl font-semibold text-foreground mb-2">No sessions yet</h2>
            <p className="text-muted-foreground mb-6">Complete an inspection simulation to see your history here.</p>
            <Link to="/">
              <Button>Start Simulation</Button>
            </Link>
          </div>
        ) : selectedSession ? (
          <div className="space-y-6 animate-fade-in-up">
            {/* Back to list */}
            <Button variant="ghost" size="sm" onClick={() => setSelectedSession(null)} className="gap-1">
              <ChevronLeft className="h-4 w-4" />
              Back to sessions
            </Button>

            {/* Session overview */}
            {sessions.find(s => s.id === selectedSession) && (
              <div className="card-elevated p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDate(sessions.find(s => s.id === selectedSession)!.created_at)}
                    </p>
                  </div>
                  <div className={cn(
                    "px-4 py-2 rounded-xl font-semibold",
                    getScoreColor(sessions.find(s => s.id === selectedSession)?.overall_band || null)
                  )}>
                    {sessions.find(s => s.id === selectedSession)?.overall_score?.toFixed(1) || 'N/A'} - {sessions.find(s => s.id === selectedSession)?.overall_band || 'N/A'}
                  </div>
                </div>
              </div>
            )}

            {/* Answers breakdown */}
            <div className="space-y-4">
              <h3 className="font-display text-lg font-semibold text-foreground">Question Responses</h3>
              
              {ofstedQuestions.map((q, idx) => {
                const answers = sessionAnswers.filter(a => a.question_id === q.id);
                const bestAnswer = answers.reduce<SessionAnswer | null>((best, curr) => {
                  if (!best) return curr;
                  return (curr.evaluation_json?.score || 0) > (best.evaluation_json?.score || 0) ? curr : best;
                }, null);

                if (!bestAnswer) return null;

                return (
                  <div key={q.id} className="card-elevated p-6 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Q{idx + 1} - {q.domain}</p>
                        <p className="font-medium text-foreground mt-1">{q.shortTitle}</p>
                      </div>
                      <div className={cn(
                        "px-3 py-1 rounded-lg text-sm font-semibold",
                        getScoreColor(bestAnswer.evaluation_json?.judgementBand)
                      )}>
                        {bestAnswer.evaluation_json?.score?.toFixed(1) || 'N/A'}
                      </div>
                    </div>

                    {/* Transcript */}
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Response</p>
                      <p className="text-sm text-foreground line-clamp-3">{bestAnswer.transcript}</p>
                    </div>

                    {/* Key feedback */}
                    {bestAnswer.evaluation_json?.strengths?.[0] && (
                      <p className="text-sm text-success">
                        <span className="font-medium">Strength:</span> {bestAnswer.evaluation_json.strengths[0]}
                      </p>
                    )}
                    {bestAnswer.evaluation_json?.gaps?.[0] && (
                      <p className="text-sm text-warning">
                        <span className="font-medium">Gap:</span> {bestAnswer.evaluation_json.gaps[0]}
                      </p>
                    )}

                    {answers.length > 1 && (
                      <p className="text-xs text-muted-foreground">
                        {answers.length - 1} follow-up attempt(s)
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => loadSessionDetails(session.id)}
                className="w-full card-elevated p-6 hover:border-primary/50 transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDate(session.created_at)}
                    </p>
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "px-3 py-1 rounded-lg text-sm font-semibold",
                        getScoreColor(session.overall_band)
                      )}>
                        {session.overall_score?.toFixed(1) || 'N/A'} - {session.overall_band || 'Incomplete'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

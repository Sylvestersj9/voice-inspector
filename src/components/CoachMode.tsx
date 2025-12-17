import { useEffect, useMemo, useRef, useState } from "react";

type Sentence = { id: string; text: string };

type Strength = {
  evidence: string[];
  whatWorked: string;
  whyMatters: string;
};

type Weakness = {
  evidence: string[];
  gap: string;
  risk: string;
  expected: string;
};

type Improvement = {
  sentenceId: string;
  original: string;
  issue: string;
  betterVersion: string;
  synonymsOrPhrases: string[];
  impact: string;
};

interface CoachModeProps {
  transcript: string;
  sentences?: Sentence[];
  strengths?: Strength[];
  weaknesses?: Weakness[];
  improvements?: Improvement[];
  registerJump?: (fn: (sentenceId: string) => void) => void;
}

const splitFallbackSentences = (text: string): Sentence[] => {
  const parts = (text || "")
    .split(/(?<=[.!?])\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (parts.length ? parts : [text || ""])
    .map((t, idx) => ({ id: `S${idx + 1}`, text: t }));
};

export function CoachMode({
  transcript,
  sentences,
  strengths,
  weaknesses,
  improvements,
  registerJump,
}: CoachModeProps) {
  const sentenceRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const sentencesToUse = useMemo(() => {
    if (Array.isArray(sentences) && sentences.length > 0) return sentences;
    return splitFallbackSentences(transcript);
  }, [sentences, transcript]);

  const handleJump = (sentenceId: string) => {
    const el = sentenceRefs.current[sentenceId];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightId(sentenceId);
    setTimeout(() => setHighlightId((prev) => (prev === sentenceId ? null : prev)), 1500);
  };

  useEffect(() => {
    if (registerJump) registerJump(handleJump);
  }, [registerJump]);

  const renderEvidenceChips = (evidence?: string[]) => {
    if (!evidence || evidence.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {evidence.map((e) => (
          <button
            key={e}
            onClick={() => handleJump(e)}
            className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition"
          >
            {e}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Transcript */}
      <div className="card-elevated p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-md font-semibold text-foreground">Transcript (numbered)</h3>
          <span className="text-xs text-muted-foreground">Tap S# to jump from improvements</span>
        </div>
        <div className="space-y-2 max-h-60 overflow-auto pr-2">
          {sentencesToUse.map((s) => (
            <div
              key={s.id}
              ref={(el) => { sentenceRefs.current[s.id] = el; }}
              className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                highlightId === s.id ? "bg-amber-50 border-amber-200" : "bg-muted/40 border-muted"
              }`}
            >
              <span className="font-semibold text-primary">{s.id}</span>
              <span className="text-foreground leading-snug">{s.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sentence improvements */}
      {improvements && improvements.length > 0 && (
        <div className="card-elevated p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-md font-semibold text-foreground">Sentence Improvements</h3>
            <span className="text-xs text-muted-foreground">Click to jump</span>
          </div>
          <div className="space-y-3">
            {improvements.map((imp, idx) => (
              <button
                key={`${imp.sentenceId}-${idx}`}
                onClick={() => handleJump(imp.sentenceId)}
                className="w-full text-left rounded-lg border bg-muted/40 hover:bg-muted transition p-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-primary">{imp.sentenceId}</span>
                  <span className="text-xs text-muted-foreground">{imp.issue}</span>
                </div>
                <div className="text-sm text-foreground mb-2">
                  <span className="font-medium">Original: </span>
                  {imp.original}
                </div>
                <div className="text-sm text-foreground mb-2">
                  <span className="font-medium text-primary">Better: </span>
                  {imp.betterVersion}
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {imp.synonymsOrPhrases?.map((syn, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
                      {syn}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Impact: {imp.impact}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Strengths */}
      {strengths && strengths.length > 0 && (
        <div className="card-elevated p-4 space-y-2">
          <h3 className="font-display text-md font-semibold text-foreground">Strengths (with evidence)</h3>
          {strengths.map((s, idx) => (
            <div key={idx} className="rounded-lg border bg-muted/40 p-3 text-sm">
              <p className="font-medium text-foreground">{s.whatWorked}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.whyMatters}</p>
              {renderEvidenceChips(s.evidence)}
            </div>
          ))}
        </div>
      )}

      {/* Weaknesses */}
      {weaknesses && weaknesses.length > 0 && (
        <div className="card-elevated p-4 space-y-2">
          <h3 className="font-display text-md font-semibold text-foreground">Weaknesses (with evidence)</h3>
          {weaknesses.map((w, idx) => (
            <div key={idx} className="rounded-lg border bg-muted/40 p-3 text-sm">
              <p className="font-medium text-foreground">{w.gap}</p>
              <p className="text-xs text-warning mt-1">Risk: {w.risk}</p>
              <p className="text-xs text-muted-foreground mt-1">What Ofsted expected: {w.expected}</p>
              {renderEvidenceChips(w.evidence)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

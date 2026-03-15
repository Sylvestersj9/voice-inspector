import { useState } from "react";
import { ArrowRight, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import MarketingLayout from "./MarketingLayout";

export default function Tools() {
  const [expandedTool, setExpandedTool] = useState<string | null>(null);
  const [interviewAnswers, setInterviewAnswers] = useState<Record<number, string>>({});
  const [showInterviewFeedback, setShowInterviewFeedback] = useState(false);
  const [riAnswers, setRiAnswers] = useState<Record<number, string>>({});
  const [showRiFeedback, setShowRiFeedback] = useState(false);

  const rmInterviewQuestions = [
    {
      id: 1,
      title: "Safeguarding & Child Protection",
      question: "Tell me about a time you've had to report a safeguarding concern. How did you handle it, and what was the outcome?",
      keyPoints: ["Clear reporting procedure", "Child's best interests", "Cooperation with authorities", "Documentation"],
      tips: "Demonstrate proactive safeguarding culture, not just compliance. Show you understand the serious nature of concerns."
    },
    {
      id: 2,
      title: "Leadership & Staff Development",
      question: "Describe how you've developed a member of staff from struggling to confident. What was your approach?",
      keyPoints: ["Supportive mentoring", "Clear expectations", "Regular feedback", "Celebrating progress"],
      tips: "Show investment in people development. Give specific examples of training, supervision, or feedback provided."
    },
    {
      id: 3,
      title: "Quality of Care & Standards",
      question: "Walk me through how you ensure consistent quality of care across your home. What's your process?",
      keyPoints: ["Regular audits/observations", "Staff training", "Child feedback", "Continuous improvement"],
      tips: "Explain your quality assurance systems. Show how you measure and improve care standards systematically."
    },
  ];

  const riInterviewQuestions = [
    {
      id: 1,
      title: "Regulatory Experience & Knowledge",
      question: "Describe your experience with inspecting or overseeing residential children's homes. What frameworks and standards guide your work?",
      keyPoints: ["SCCIF knowledge", "Inspection experience", "Regulatory compliance", "Quality judgment"],
      tips: "Show deep knowledge of SCCIF and how it applies in practice. Demonstrate ability to assess homes against standards fairly and accurately."
    },
    {
      id: 2,
      title: "Identifying & Addressing Safeguarding Risks",
      question: "Tell me about a time you identified a safeguarding concern or risk in a home you inspected. How did you handle escalation and follow-up?",
      keyPoints: ["Risk identification skills", "Clear escalation", "Child protection focus", "Proportionate action"],
      tips: "Show you put children's safety first. Explain how you balance supporting homes with enforcing standards. Give specific examples."
    },
    {
      id: 3,
      title: "Supporting Improvement & Leadership",
      question: "How do you approach feedback with home managers or leaders? Can you describe your approach to driving improvement?",
      keyPoints: ["Constructive feedback", "Partnership approach", "Evidence-based judgment", "Supporting not punishing"],
      tips: "Show you see inspection as a learning opportunity. Describe how you help homes improve while holding them to standards."
    },
  ];

  const toggleTool = (toolId: string) => {
    setExpandedTool(expandedTool === toolId ? null : toolId);
  };

  return (
    <MarketingLayout>
      {/* Hero Section */}
      <section className="px-4 pt-12 pb-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center rounded-full bg-teal-50 px-4 py-1.5 text-sm font-semibold text-teal-800 ring-1 ring-teal-100 mb-4">
            Free Tools · No Login Required
          </div>
          <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
            Practice tools to build confidence
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-600 max-w-2xl mx-auto">
            Inspection prep, interview practice, and leadership readiness tools — all free and available right here.
          </p>
        </div>
      </section>

      {/* Interview Prep Tool */}
      <section className="bg-teal-50 px-4 py-14 border-b border-teal-100">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-teal-200 bg-white shadow-sm overflow-hidden">
            {/* Tool Header */}
            <button
              onClick={() => toggleTool("interview")}
              className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 ring-1 ring-teal-200">
                  <span className="text-xl">🎯</span>
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-slate-900">RM Fit-Person Interview Simulator</h3>
                  <p className="text-sm text-slate-500 mt-1">Practice answering common Registered Manager interview questions</p>
                </div>
              </div>
              {expandedTool === "interview" ? (
                <ChevronUp className="h-5 w-5 text-slate-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate-400" />
              )}
            </button>

            {/* Tool Content */}
            {expandedTool === "interview" && (
              <div className="border-t border-slate-100 px-6 py-6 space-y-6">
                {/* Instructions */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-sm text-amber-900">
                    <strong>How it works:</strong> Read each question carefully, take 1-2 minutes to think, then write your answer.
                    Focus on real examples and specific actions you've taken.
                  </p>
                </div>

                {/* Questions */}
                <div className="space-y-4">
                  {rmInterviewQuestions.map((q, idx) => (
                    <div key={q.id} className="border border-slate-200 rounded-xl p-4">
                      {/* Question */}
                      <div>
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-teal-700 font-semibold text-sm flex-shrink-0">
                            {idx + 1}
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900">{q.title}</h4>
                            <p className="text-sm text-slate-600 mt-1 italic">{q.question}</p>
                          </div>
                        </div>

                        {/* Input */}
                        <textarea
                          value={interviewAnswers[q.id] || ""}
                          onChange={(e) => setInterviewAnswers({ ...interviewAnswers, [q.id]: e.target.value })}
                          placeholder="Type your answer here (aim for 2-3 sentences with specific examples)..."
                          className="w-full mt-3 p-3 rounded-lg border border-slate-200 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none resize-none"
                          rows={3}
                        />

                        {/* Guidance */}
                        <div className="mt-3 text-xs text-slate-600">
                          <p className="font-semibold mb-1">Examiners look for:</p>
                          <ul className="space-y-1">
                            {q.keyPoints.map((point) => (
                              <li key={point} className="flex items-start gap-1.5">
                                <CheckCircle2 className="h-3 w-3 text-teal-600 mt-0.5 flex-shrink-0" />
                                {point}
                              </li>
                            ))}
                          </ul>
                          <p className="mt-2 text-slate-500 italic">💡 {q.tips}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Feedback Button */}
                <button
                  onClick={() => setShowInterviewFeedback(!showInterviewFeedback)}
                  className="w-full px-4 py-3 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700 transition-colors"
                >
                  {showInterviewFeedback ? "Hide" : "Show"} Interview Preparation Tips
                </button>

                {/* Feedback */}
                {showInterviewFeedback && (
                  <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 space-y-3 text-sm">
                    <h4 className="font-semibold text-slate-900">Interview Preparation Guidance</h4>
                    <div className="space-y-2 text-slate-700">
                      <p>✓ <strong>Structure your answers:</strong> Situation → Action → Result (STAR method)</p>
                      <p>✓ <strong>Use specific examples:</strong> "In February 2024, I..." → not generic statements</p>
                      <p>✓ <strong>Show self-awareness:</strong> Acknowledge what you've learned and how you've grown</p>
                      <p>✓ <strong>Demonstrate values:</strong> Link your actions to safeguarding, quality, and children's wellbeing</p>
                      <p>✓ <strong>Be honest:</strong> If you lack experience in an area, explain how you'd approach it</p>
                      <p>✓ <strong>Ask clarifying questions:</strong> If unsure what the interviewer wants, ask for examples</p>
                    </div>
                  </div>
                )}

                {/* CTA */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
                  <span className="text-2xl">🎓</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Ready for mock inspections too?</p>
                    <p className="text-sm text-slate-600 mt-1">
                      Sign up for a free trial and practice full SCCIF inspections with AI scoring.
                    </p>
                    <a
                      href="/login"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-900 mt-2"
                    >
                      Start free trial <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* RI Interview Prep Tool */}
      <section className="bg-slate-50 px-4 py-14 border-b border-slate-200">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* Tool Header */}
            <button
              onClick={() => toggleTool("ri-interview")}
              className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 ring-1 ring-amber-200">
                  <span className="text-xl">📋</span>
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-slate-900">RI/NI Fit-Person Interview Simulator</h3>
                  <p className="text-sm text-slate-500 mt-1">Practice answering common Responsible Individual / Nominated Individual interview questions</p>
                </div>
              </div>
              {expandedTool === "ri-interview" ? (
                <ChevronUp className="h-5 w-5 text-slate-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate-400" />
              )}
            </button>

            {/* Tool Content */}
            {expandedTool === "ri-interview" && (
              <div className="border-t border-slate-100 px-6 py-6 space-y-6">
                {/* Instructions */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-sm text-amber-900">
                    <strong>How it works:</strong> Read each question carefully, take 1-2 minutes to think, then write your answer.
                    Focus on your regulatory experience and how you've driven improvements in homes.
                  </p>
                </div>

                {/* Questions */}
                <div className="space-y-4">
                  {riInterviewQuestions.map((q, idx) => (
                    <div key={q.id} className="border border-slate-200 rounded-xl p-4">
                      {/* Question */}
                      <div>
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700 font-semibold text-sm flex-shrink-0">
                            {idx + 1}
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900">{q.title}</h4>
                            <p className="text-sm text-slate-600 mt-1 italic">{q.question}</p>
                          </div>
                        </div>

                        {/* Input */}
                        <textarea
                          value={riAnswers[q.id] || ""}
                          onChange={(e) => setRiAnswers({ ...riAnswers, [q.id]: e.target.value })}
                          placeholder="Type your answer here (aim for 2-3 sentences with specific examples)..."
                          className="w-full mt-3 p-3 rounded-lg border border-slate-200 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none resize-none"
                          rows={3}
                        />

                        {/* Guidance */}
                        <div className="mt-3 text-xs text-slate-600">
                          <p className="font-semibold mb-1">Examiners look for:</p>
                          <ul className="space-y-1">
                            {q.keyPoints.map((point) => (
                              <li key={point} className="flex items-start gap-1.5">
                                <CheckCircle2 className="h-3 w-3 text-amber-600 mt-0.5 flex-shrink-0" />
                                {point}
                              </li>
                            ))}
                          </ul>
                          <p className="mt-2 text-slate-500 italic">💡 {q.tips}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Feedback Button */}
                <button
                  onClick={() => setShowRiFeedback(!showRiFeedback)}
                  className="w-full px-4 py-3 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700 transition-colors"
                >
                  {showRiFeedback ? "Hide" : "Show"} Interview Preparation Tips
                </button>

                {/* Feedback */}
                {showRiFeedback && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3 text-sm">
                    <h4 className="font-semibold text-slate-900">RI/NI Interview Preparation Guidance</h4>
                    <div className="space-y-2 text-slate-700">
                      <p>✓ <strong>Deep regulatory knowledge:</strong> Show you understand SCCIF and how it applies in practice</p>
                      <p>✓ <strong>Demonstrate judgment:</strong> Explain how you assess homes fairly and proportionately</p>
                      <p>✓ <strong>Child protection first:</strong> Show safeguarding is always your priority in every decision</p>
                      <p>✓ <strong>Evidence-based approach:</strong> Describe how you use evidence to make judgments</p>
                      <p>✓ <strong>Partnership mindset:</strong> Show you work WITH homes to improve, not just enforce</p>
                      <p>✓ <strong>Real examples:</strong> Use specific inspection scenarios or improvements you've witnessed</p>
                    </div>
                  </div>
                )}

                {/* CTA */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
                  <span className="text-2xl">🎓</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Want home-facing interview prep too?</p>
                    <p className="text-sm text-slate-600 mt-1">
                      Sign up for a free trial and help the homes you regulate practice their inspection responses.
                    </p>
                    <a
                      href="/login"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700 hover:text-amber-900 mt-2"
                    >
                      Start free trial <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Coming Soon */}
      <section className="px-4 py-14">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="font-display text-2xl font-bold text-slate-900">More tools coming soon</h2>
            <p className="text-slate-600 mt-2">We're building additional practice tools to support your journey</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {[
              {
                emoji: "📋",
                title: "QS Readiness Quiz",
                desc: "Self-assessment across all 9 Quality Standards with AI gap analysis",
              },
              {
                emoji: "📅",
                title: "12-Week Prep Calendar",
                desc: "Structured preparation plan with weekly focus areas and milestones",
              },
              {
                emoji: "✅",
                title: "SCCIF Audit Checklist",
                desc: "44-item checklist for gathering evidence across all Quality Standards",
              },
              {
                emoji: "📊",
                title: "Evidence Gallery",
                desc: "Templates and examples of excellent safeguarding and care evidence",
              },
            ].map((tool) => (
              <div
                key={tool.title}
                className="rounded-xl border border-slate-200 bg-slate-50 p-5 hover:border-teal-200 hover:bg-teal-50/30 transition-all"
              >
                <div className="text-3xl mb-2">{tool.emoji}</div>
                <h3 className="font-semibold text-slate-900">{tool.title}</h3>
                <p className="text-sm text-slate-600 mt-1">{tool.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-slate-900 px-4 py-14">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-bold text-white md:text-4xl">
            Combine free tools with full practice inspections
          </h2>
          <p className="mt-4 text-slate-300">
            Use these practice tools to prepare, then sign up for unlimited mock inspections with AI scoring.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href="/login"
              className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors"
            >
              Start free trial <ArrowRight className="ml-2 h-4 w-4" />
            </a>
            <a
              href="/pricing"
              className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-transparent px-6 py-3.5 text-base font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              View pricing
            </a>
          </div>
          <p className="mt-3 text-sm text-slate-400">3-day free trial · 2 sessions/day · no card required</p>
        </div>
      </section>
    </MarketingLayout>
  );
}

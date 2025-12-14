import React from "react";

type Slide = {
  kicker: string;
  title: string;
  body: string;
  bullets?: string[];
};

const SLIDES: Slide[] = [
  {
    kicker: "Ofsted-ready practice",
    title: "Train for inspection conversations",
    body: "Answer realistic Ofsted-style questions out loud. Get structured feedback on what inspectors listen for.",
    bullets: ["Leadership & management", "Safeguarding", "Quality of care", "Outcomes for children"],
  },
  {
    kicker: "How it works",
    title: "3 steps. Repeatable. Calm.",
    body: "Record your answer → review transcript → get strengths, gaps, and next actions. Practice again and improve fast.",
    bullets: ["Voice → transcript", "AI evaluation", "Follow-ups & actions"],
  },
  {
    kicker: "Benefits",
    title: "Reduce guesswork and prep time",
    body: "Focus on how you explain practice and impact—without spending hours building mock questions or rewriting notes.",
    bullets: ["Clear strengths & gaps", "Practical next actions", "Built for care settings"],
  },
  {
    kicker: "Early feedback (beta)",
    title: "Like a mock inspection, without the pressure",
    body: "Users say it helps them tighten wording, stay outcome-focused, and feel confident when challenged.",
    bullets: ["More confident answers", "More evidence-led", "More consistent language"],
  },
  {
    kicker: "Privacy-first",
    title: "No names. No identifying details.",
    body: "Please keep scenarios anonymous. Use roles and situations only. This is for learning and development.",
    bullets: ["Open access beta", "No billing yet", "Use anonymised scenarios"],
  },
];

function clampIndex(i: number, len: number) {
  return ((i % len) + len) % len;
}

export default function AuthLoopPanel() {
  const [active, setActive] = React.useState(0);

  React.useEffect(() => {
    const id = window.setInterval(() => {
      setActive((a) => clampIndex(a + 1, SLIDES.length));
    }, 5200);
    return () => window.clearInterval(id);
  }, []);

  const slide = SLIDES[active];

  return (
    <div className="relative h-full overflow-hidden rounded-2xl bg-gradient-to-br from-teal-700 via-teal-600 to-emerald-600 text-white">
      <div className="pointer-events-none absolute -left-14 -top-14 h-44 w-44 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute left-10 top-24 h-10 w-10 rotate-12 rounded-lg bg-white/10" />
      <div className="pointer-events-none absolute right-14 top-14 h-8 w-8 rotate-45 rounded-lg bg-white/10" />

      <div className="flex h-full flex-col justify-between p-8 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20 overflow-hidden">
            <img src="/logo.svg" alt="Voice Inspector" className="h-full w-full object-contain" />
          </div>
          <div>
            <div className="text-sm font-semibold leading-5 text-white">Voice Inspector</div>
            <div className="text-xs leading-4 text-white/80">Ofsted inspection practice simulator</div>
          </div>
        </div>

        <div className="relative mt-10 h-full">
          {SLIDES.map((s, i) => (
            <div
              key={i}
              className={`absolute inset-0 transition-all duration-700 ease-out ${
                i === active ? "opacity-100 translate-y-0" : "pointer-events-none translate-y-4 opacity-0"
              }`}
            >
              <div className="text-xs font-semibold tracking-wide text-white/80">{s.kicker.toUpperCase()}</div>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">{s.title}</h2>
              <p className="mt-4 max-w-md text-sm leading-6 text-white/90">{s.body}</p>

              {s.bullets?.length ? (
                <ul className="mt-6 space-y-2 text-sm text-white/90">
                  {s.bullets.map((b, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-white/80" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-10 flex items-center justify-between text-white/90">
          <div className="flex gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={[
                  "h-2.5 w-2.5 rounded-full ring-1 ring-white/40 transition",
                  i === active ? "bg-white" : "bg-white/50 hover:bg-white/80",
                ].join(" ")}
              />
            ))}
          </div>

          <div className="text-xs text-white/80">Open access beta • No billing yet</div>
        </div>
      </div>
    </div>
  );
}

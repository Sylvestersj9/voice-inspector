const COLORS = ["#0D9488", "#F59E0B", "#38BDF8", "#F472B6", "#A3E635"];

type ConfettiBurstProps = {
  active: boolean;
  count?: number;
};

export default function ConfettiBurst({ active, count = 24 }: ConfettiBurstProps) {
  if (!active) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => {
        const left = (i * 100) / count;
        const delay = (i % 6) * 0.08;
        const duration = 1.6 + (i % 5) * 0.15;
        const size = 6 + (i % 4) * 2;
        const color = COLORS[i % COLORS.length];
        return (
          <span
            key={i}
            className="confetti-piece"
            style={{
              left: `${left}%`,
              width: `${size}px`,
              height: `${size * 1.4}px`,
              backgroundColor: color,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
            }}
          />
        );
      })}
    </div>
  );
}

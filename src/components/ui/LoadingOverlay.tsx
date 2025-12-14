import React from "react";

export default function LoadingOverlay({
  show,
  label = "Loading…",
}: {
  show: boolean;
  label?: string;
}) {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/15 backdrop-blur-[2px]"
      aria-busy="true"
      aria-live="polite"
      role="status"
    >
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-white/85 px-6 py-5 shadow-lg ring-1 ring-slate-200">
        <div className="loader" />
        <div className="text-sm font-semibold text-slate-800">{label}</div>
      </div>
    </div>
  );
}

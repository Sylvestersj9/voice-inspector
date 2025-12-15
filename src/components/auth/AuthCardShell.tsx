import React from "react";

export default function AuthCardShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="h-full rounded-[28px] border bg-white p-8 shadow-sm ring-2 ring-teal-200">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {subtitle ? <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p> : null}
      </div>

      <div className="mt-8">{children}</div>

      <div className="mt-8 border-t pt-5 text-xs text-slate-500">
        Open access beta. No billing yet. Please do not include names or identifying details.
      </div>
    </div>
  );
}

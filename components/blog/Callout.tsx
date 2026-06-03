import type { ReactNode } from "react";

type CalloutType = "info" | "warning" | "tip";

const styles: Record<CalloutType, string> = {
  info: "border-blue-200 bg-blue-50 text-blue-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  tip: "border-emerald-200 bg-emerald-50 text-emerald-900",
};

const labels: Record<CalloutType, string> = {
  info: "Info",
  warning: "Warning",
  tip: "Tip",
};

type CalloutProps = {
  type?: CalloutType;
  children: ReactNode;
};

export function Callout({ type = "info", children }: CalloutProps) {
  return (
    <div
      className={`my-6 rounded-lg border px-4 py-3 not-prose ${styles[type]}`}
    >
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide">
        {labels[type]}
      </p>
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}

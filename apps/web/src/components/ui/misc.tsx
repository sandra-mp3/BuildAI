import { cn } from "@/lib/utils";
import type { HTMLAttributes, LabelHTMLAttributes } from "react";

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-xs font-medium text-fg-muted", className)} {...props} />;
}

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-bg-elevated", className)}
      {...props}
    />
  );
}

const badgeStyles: Record<string, string> = {
  ready: "bg-success/10 text-success border-success/25",
  generating: "bg-seam/10 text-seam border-seam/30",
  error: "bg-error/10 text-error border-error/25",
  neutral: "bg-bg-elevated text-fg-muted border-border-strong",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: keyof typeof badgeStyles;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        badgeStyles[tone],
        className
      )}
    >
      {tone === "generating" && (
        <span className="h-1.5 w-1.5 rounded-full bg-seam animate-pulse-glow" />
      )}
      {children}
    </span>
  );
}

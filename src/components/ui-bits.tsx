import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  children,
  className,
  title,
  subtitle,
  action,
  accent,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  accent?: "cyan" | "gold" | "none";
}) {
  return (
    <section
      className={cn(
        "glass-panel rounded-2xl p-5 animate-slide-up",
        accent === "cyan" && "ring-1 ring-primary/20",
        accent === "gold" && "ring-1 ring-gold/20",
        className,
      )}
    >
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 mb-4">
          <div>
            {title && (
              <h3 className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-medium">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-base font-semibold tracking-tight mt-1">{subtitle}</p>
            )}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function Stat({
  label,
  value,
  delta,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  delta?: string;
  tone?: "default" | "good" | "bad" | "warn";
}) {
  return (
    <div>
      <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
      {delta && (
        <div
          className={cn(
            "text-xs mt-0.5 tabular-nums",
            tone === "good" && "text-success",
            tone === "bad" && "text-danger",
            tone === "warn" && "text-warning",
            tone === "default" && "text-muted-foreground",
          )}
        >
          {delta}
        </div>
      )}
    </div>
  );
}

export function Bar({
  value,
  tone = "cyan",
  className,
}: {
  value: number;
  tone?: "cyan" | "gold" | "green" | "red";
  className?: string;
}) {
  const colors: Record<string, string> = {
    cyan: "from-primary to-chart-4",
    gold: "from-gold to-warning",
    green: "from-success to-primary",
    red: "from-danger to-destructive",
  };
  return (
    <div className={cn("h-1.5 rounded-full bg-surface-2 overflow-hidden", className)}>
      <div
        className={cn("h-full rounded-full bg-gradient-to-r transition-all", colors[tone])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function Tag({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "cyan" | "gold" | "green" | "red" | "warn";
}) {
  const tones: Record<string, string> = {
    muted: "bg-surface-2 text-muted-foreground border-border",
    cyan: "bg-primary/10 text-primary border-primary/30",
    gold: "bg-gold/10 text-gold border-gold/30",
    green: "bg-success/10 text-success border-success/30",
    red: "bg-danger/10 text-danger border-danger/30",
    warn: "bg-warning/10 text-warning border-warning/30",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10.5px] uppercase tracking-[0.12em] font-medium border",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

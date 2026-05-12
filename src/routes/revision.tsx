import { createFileRoute } from "@tanstack/react-router";
import { Panel, Stat, Tag, Bar } from "@/components/ui-bits";
import { Brain, Zap } from "lucide-react";

export const Route = createFileRoute("/revision")({ component: Revision });

const cycle = ["D1", "D3", "D7", "D14", "D30"] as const;

const queue = [
  { topic: "Thermodynamics — Laws & Cycles", subject: "Physics", cycle: "D1", strength: 22, tone: "red" as const },
  { topic: "Coordination Compounds — Nomenclature", subject: "Chemistry", cycle: "D3", strength: 54, tone: "cyan" as const },
  { topic: "Rotational Dynamics — Torque problems", subject: "Physics", cycle: "D7", strength: 38, tone: "warn" as const },
  { topic: "Definite Integration — Properties", subject: "Maths", cycle: "D14", strength: 71, tone: "gold" as const },
  { topic: "Probability — Bayes & Conditional", subject: "Maths", cycle: "D30", strength: 64, tone: "gold" as const },
  { topic: "Electrochemistry — Nernst", subject: "Chemistry", cycle: "D7", strength: 41, tone: "warn" as const },
];

const heatmap = Array.from({ length: 70 }, (_, i) => ({
  i,
  v: Math.floor(Math.random() * 5),
}));

function Revision() {
  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto space-y-6">
      <header>
        <div className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
          Revision Vault
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Spaced repetition is the real game.
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          D1 · D3 · D7 · D14 · D30 — auto-scheduled, dynamically rebalanced when you fall behind.
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {cycle.map((c, i) => (
          <Panel key={c} className="!p-4">
            <div className="flex items-center justify-between">
              <Tag tone={i === 0 ? "red" : i === 1 ? "cyan" : i === 2 ? "warn" : "gold"}>{c}</Tag>
              <span className="text-xs text-muted-foreground tabular-nums">{[4, 6, 3, 2, 5][i]}</span>
            </div>
            <div className="mt-3 text-2xl font-semibold tabular-nums">{[4, 6, 3, 2, 5][i]}</div>
            <div className="text-xs text-muted-foreground">due today</div>
          </Panel>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Panel title="Today's revision queue" subtitle="Run actively — not passively" accent="cyan" className="lg:col-span-2">
          <ul className="space-y-2">
            {queue.map((r) => (
              <li key={r.topic} className="group flex items-center gap-4 p-3 rounded-xl bg-surface-2/40 border border-border hover:border-border-strong transition">
                <Tag tone={r.tone}>{r.cycle}</Tag>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{r.topic}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{r.subject}</div>
                </div>
                <div className="w-32 hidden md:block">
                  <div className="flex justify-between text-[10.5px] uppercase tracking-wider text-muted-foreground mb-1">
                    <span>Memory</span>
                    <span className="tabular-nums">{r.strength}%</span>
                  </div>
                  <Bar value={r.strength} tone={r.strength > 60 ? "green" : r.strength > 40 ? "cyan" : "red"} />
                </div>
                <button className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-primary text-primary-foreground opacity-0 group-hover:opacity-100 transition">
                  <Brain className="size-3" /> Recall
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Memory heatmap" subtitle="Last 70 days" accent="gold">
          <div className="grid grid-cols-10 gap-1">
            {heatmap.map((d) => (
              <div
                key={d.i}
                className="aspect-square rounded-sm"
                style={{
                  background:
                    d.v === 0
                      ? "var(--color-surface-2)"
                      : `oklch(0.6 0.14 215 / ${0.18 + d.v * 0.18})`,
                }}
              />
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3 text-[10.5px] uppercase tracking-wider text-muted-foreground">
            Less
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="size-2.5 rounded-sm"
                  style={{
                    background:
                      i === 0
                        ? "var(--color-surface-2)"
                        : `oklch(0.6 0.14 215 / ${0.18 + i * 0.18})`,
                  }}
                />
              ))}
            </div>
            More
          </div>

          <div className="mt-5 pt-5 border-t border-border">
            <div className="flex items-center gap-2 text-sm">
              <Zap className="size-4 text-gold" /> <span className="font-medium">Fast-forgetting</span>
            </div>
            <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
              <li>· Thermodynamics — strength 22%</li>
              <li>· Inverse trig — strength 31%</li>
              <li>· Coordination compounds — strength 38%</li>
            </ul>
          </div>
        </Panel>
      </div>
    </div>
  );
}

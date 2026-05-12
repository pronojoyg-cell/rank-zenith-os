import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Panel, Stat, Tag } from "@/components/ui-bits";
import { Play, Pause, RotateCcw, Volume2, BellOff } from "lucide-react";

export const Route = createFileRoute("/focus")({ component: Focus });

const SESSION = 50 * 60;

function Focus() {
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(SESSION);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    ref.current = window.setInterval(() => {
      setSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => {
      if (ref.current) window.clearInterval(ref.current);
    };
  }, [running]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const progress = ((SESSION - seconds) / SESSION) * 100;

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto space-y-6">
      <header>
        <div className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
          Deep Work Console
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Single task. Zero noise.</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ultra deep work mode. Distractions blocked. Session tagged.
        </p>
      </header>

      <Panel className="relative overflow-hidden" accent="cyan">
        <div className="absolute -right-32 -top-32 size-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="grid lg:grid-cols-2 gap-8 items-center relative">
          <div className="text-center lg:text-left">
            <Tag tone="cyan">Solving — Definite Integration</Tag>
            <div
              className="mt-4 text-7xl lg:text-[120px] font-semibold tracking-tighter tabular-nums"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              <span className="text-gradient-cyan">
                {mm}
                <span className="opacity-30">:</span>
                {ss}
              </span>
            </div>
            <div className="mt-3 h-1 rounded-full bg-surface-2 overflow-hidden max-w-md mx-auto lg:mx-0">
              <div
                className="h-full bg-gradient-to-r from-primary to-chart-4 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-6 flex items-center justify-center lg:justify-start gap-2">
              <button
                onClick={() => setRunning((r) => !r)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90"
              >
                {running ? <><Pause className="size-4" /> Pause</> : <><Play className="size-4" /> Start session</>}
              </button>
              <button
                onClick={() => {
                  setRunning(false);
                  setSeconds(SESSION);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-2 border border-border hover:bg-surface-2/70 text-sm"
              >
                <RotateCcw className="size-4" /> Reset
              </button>
              <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-2 border border-border hover:bg-surface-2/70 text-sm">
                <BellOff className="size-4" /> Block notifications
              </button>
              <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-2 border border-border hover:bg-surface-2/70 text-sm">
                <Volume2 className="size-4" /> Ambient
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Panel className="!p-4 !rounded-xl"><Stat label="Today" value="3h 42m" delta="+38m vs avg" tone="good" /></Panel>
            <Panel className="!p-4 !rounded-xl"><Stat label="Streak" value="12d" delta="Best 18d" /></Panel>
            <Panel className="!p-4 !rounded-xl"><Stat label="Focus score" value="92" delta="3 distractions" tone="good" /></Panel>
            <Panel className="!p-4 !rounded-xl"><Stat label="Peak window" value="11–1pm" delta="+22% accuracy" tone="good" /></Panel>
          </div>
        </div>
      </Panel>

      <div className="grid lg:grid-cols-2 gap-6">
        <Panel title="Productivity heatmap" subtitle="Today by hour">
          <div className="grid grid-cols-12 gap-1">
            {Array.from({ length: 24 }, (_, h) => {
              const v = Math.max(0, Math.sin((h - 6) / 3) + Math.random() * 0.5);
              return (
                <div key={h} className="space-y-1">
                  <div
                    className="h-16 rounded-md"
                    style={{ background: `oklch(0.6 0.14 215 / ${0.1 + Math.min(0.9, v) * 0.7})` }}
                  />
                  <div className="text-[9px] text-center text-muted-foreground tabular-nums">{h}</div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="Recent sessions" subtitle="Tagged & analyzed">
          <ul className="space-y-2">
            {[
              { tag: "Maths · Integration", t: "75 min", focus: 96, dist: 1 },
              { tag: "Physics · Rotation", t: "60 min", focus: 88, dist: 4 },
              { tag: "Chem · Coordination", t: "45 min", focus: 92, dist: 2 },
              { tag: "Mistake reattempt", t: "30 min", focus: 81, dist: 5 },
            ].map((s, i) => (
              <li key={i} className="flex items-center gap-3 p-3 rounded-lg bg-surface-2/40 border border-border">
                <div className="size-9 rounded-md bg-primary/10 border border-primary/20 grid place-items-center">
                  <span className="text-xs font-semibold text-primary tabular-nums">{s.focus}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{s.tag}</div>
                  <div className="text-[11px] text-muted-foreground">{s.t} · {s.dist} distractions</div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

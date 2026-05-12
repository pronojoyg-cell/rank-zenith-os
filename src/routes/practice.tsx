import { createFileRoute } from "@tanstack/react-router";
import { Panel, Stat, Bar, Tag } from "@/components/ui-bits";
import { Target, Clock, Zap, AlertTriangle } from "lucide-react";
import { BarChart, Bar as RBar, ResponsiveContainer, Tooltip, XAxis } from "recharts";

export const Route = createFileRoute("/practice")({ component: Practice });

const dist = [
  { d: "Easy", v: 18 },
  { d: "Med", v: 42 },
  { d: "Hard", v: 24 },
  { d: "Adv", v: 11 },
];

const sets = [
  { name: "Mixed PYQ — JEE Adv 2019–2023", subj: "All", q: 30, time: "90m", tag: "PYQ" as const },
  { name: "Definite Integration — Hard set", subj: "Maths", q: 18, time: "75m", tag: "Hard" as const },
  { name: "Rotational Dynamics — Recovery", subj: "Physics", q: 22, time: "60m", tag: "Weak" as const },
  { name: "Coordination Compounds — Speed drill", subj: "Chemistry", q: 25, time: "30m", tag: "Speed" as const },
];

function Practice() {
  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto space-y-6">
      <header>
        <div className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
          Practice Engine
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Solve with intent.</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Output over hours. Track every attempt — accuracy, speed, intent.
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Panel className="!p-4"><Stat label="Target today" value="120" delta="95 attempted" /></Panel>
        <Panel className="!p-4"><Stat label="Accuracy" value="81%" delta="+4 pts" tone="good" /></Panel>
        <Panel className="!p-4"><Stat label="Avg speed" value="1m 47s" delta="-9s" tone="good" /></Panel>
        <Panel className="!p-4"><Stat label="Skipped" value="6" delta="Review later" tone="warn" /></Panel>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Panel title="Difficulty mix" subtitle="Last 7 days" className="lg:col-span-1">
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dist}>
                <XAxis dataKey="d" axisLine={false} tickLine={false} tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                <RBar dataKey="v" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Today's queued sets" subtitle="Choose your block" accent="cyan" className="lg:col-span-2">
          <ul className="space-y-2">
            {sets.map((s) => (
              <li key={s.name} className="group flex items-center gap-4 p-3 rounded-xl bg-surface-2/40 border border-border hover:border-border-strong hover:bg-surface-2 transition">
                <div className="size-10 rounded-lg bg-gradient-to-br from-primary/20 to-chart-4/20 border border-primary/20 grid place-items-center">
                  <Target className="size-4.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{s.name}</div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-3 mt-0.5">
                    <span>{s.subj}</span>
                    <span className="flex items-center gap-1"><Clock className="size-3" /> {s.time}</span>
                    <span>{s.q} questions</span>
                  </div>
                </div>
                <Tag tone={s.tag === "Hard" ? "red" : s.tag === "Weak" ? "warn" : s.tag === "PYQ" ? "gold" : "cyan"}>{s.tag}</Tag>
                <button className="text-xs font-medium px-3 py-1.5 rounded-lg bg-primary text-primary-foreground opacity-0 group-hover:opacity-100 transition">Start</button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Pattern detection" subtitle="What the data shows" accent="gold">
        <div className="grid md:grid-cols-3 gap-3">
          {[
            { icon: Clock, t: "Speed slows in coordinate geometry", v: "−18%", tone: "warn" as const },
            { icon: AlertTriangle, t: "Accuracy drops after 90 min", v: "−11 pts", tone: "red" as const },
            { icon: Zap, t: "Peak solving window: 11am–1pm", v: "+22%", tone: "good" as const },
          ].map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.t} className="p-3 rounded-xl bg-surface-2/40 border border-border">
                <Icon className={`size-4 ${p.tone === "good" ? "text-success" : p.tone === "warn" ? "text-warning" : "text-danger"}`} />
                <div className="text-sm font-medium mt-2">{p.t}</div>
                <div className={`text-xs mt-1 tabular-nums ${p.tone === "good" ? "text-success" : p.tone === "warn" ? "text-warning" : "text-danger"}`}>{p.v}</div>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

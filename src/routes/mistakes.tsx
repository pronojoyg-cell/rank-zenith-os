import { createFileRoute } from "@tanstack/react-router";
import { Panel, Stat, Tag, Bar } from "@/components/ui-bits";
import { AlertOctagon, Repeat, Camera, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/mistakes")({ component: Mistakes });

const top10 = [
  { rank: 1, type: "Sign error in vector cross product", chapter: "Vectors", subject: "Maths", count: 6, cat: "Silly" as const, status: "Not mastered" },
  { rank: 2, type: "L'Hôpital applied without indeterminate form", chapter: "Limits", subject: "Maths", count: 5, cat: "Concept" as const, status: "Not mastered" },
  { rank: 3, type: "Sign convention in mirrors", chapter: "Geometric Optics", subject: "Physics", count: 4, cat: "Concept" as const, status: "Improving" },
  { rank: 4, type: "Misread units (g vs kg)", chapter: "Stoichiometry", subject: "Chemistry", count: 4, cat: "Calc" as const, status: "Improving" },
  { rank: 5, type: "Forgot to verify domain in inequalities", chapter: "Quadratic", subject: "Maths", count: 3, cat: "Silly" as const, status: "Not mastered" },
  { rank: 6, type: "Missed −1 in inverse trig identities", chapter: "Inverse Trig", subject: "Maths", count: 3, cat: "Memory" as const, status: "Not mastered" },
  { rank: 7, type: "Selected wrong reactant in SN1/SN2", chapter: "Haloalkanes", subject: "Chemistry", count: 3, cat: "Concept" as const, status: "Not mastered" },
  { rank: 8, type: "Used incorrect MOI for hollow vs solid", chapter: "Rotational", subject: "Physics", count: 3, cat: "Memory" as const, status: "Improving" },
];

const catTone: Record<string, "red" | "warn" | "cyan" | "gold"> = {
  Concept: "red",
  Silly: "warn",
  Calc: "cyan",
  Memory: "gold",
};

function Mistakes() {
  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
            Error Intelligence System
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Mistakes are the <span className="text-gradient-cyan">highest-value data</span>.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-xl">
            Every error logged. Every pattern surfaced. Reattempts auto-scheduled until mastery.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90">
          <Camera className="size-4" /> Log mistake
        </button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Panel className="!p-4"><Stat label="Active errors" value="42" delta="−8 this week" tone="good" /></Panel>
        <Panel className="!p-4"><Stat label="Mastered" value="118" delta="+11" tone="good" /></Panel>
        <Panel className="!p-4"><Stat label="Reattempts pending" value="16" delta="6 due today" tone="warn" /></Panel>
        <Panel className="!p-4"><Stat label="Highest leak" value="Maths" delta="Vectors · Limits" tone="bad" /></Panel>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <Panel title="Top 10 recurring errors" subtitle="Ranked by repetition × cost" accent="red" className="lg:col-span-3">
          <ol className="space-y-1.5">
            {top10.map((e) => (
              <li key={e.rank} className="group flex items-center gap-3 p-3 rounded-lg hover:bg-surface-2/60 transition border border-transparent hover:border-border">
                <div className="shrink-0 size-7 rounded-md grid place-items-center bg-surface-2 border border-border text-xs font-semibold tabular-nums text-muted-foreground">
                  {e.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium leading-tight">{e.type}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {e.subject} · {e.chapter}
                  </div>
                </div>
                <div className="text-xs tabular-nums text-danger font-semibold">×{e.count}</div>
                <Tag tone={catTone[e.cat]}>{e.cat}</Tag>
                <ChevronRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
              </li>
            ))}
          </ol>
        </Panel>

        <div className="lg:col-span-2 space-y-6">
          <Panel title="By category" accent="cyan">
            {[
              { name: "Concept gap", v: 18, tone: "red" as const },
              { name: "Silly mistake", v: 12, tone: "warn" as const },
              { name: "Calculation", v: 7, tone: "cyan" as const },
              { name: "Memory", v: 4, tone: "gold" as const },
              { name: "Time pressure", v: 1, tone: "red" as const },
            ].map((c) => (
              <div key={c.name} className="mb-3 last:mb-0">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-foreground/80">{c.name}</span>
                  <span className="tabular-nums text-muted-foreground">{c.v}</span>
                </div>
                <Bar value={c.v * 5} tone={c.tone} />
              </div>
            ))}
          </Panel>

          <Panel title="Reattempt queue" accent="gold" action={<Tag tone="warn"><Repeat className="size-3" /> 6 today</Tag>}>
            <ul className="space-y-2">
              {top10.slice(0, 3).map((e) => (
                <li key={e.rank} className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-2/40 border border-border">
                  <AlertOctagon className="size-4 text-danger shrink-0" />
                  <div className="text-xs flex-1 min-w-0 truncate">{e.type}</div>
                  <button className="text-xs font-medium text-primary">Solve</button>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Panel, Stat, Tag } from "@/components/ui-bits";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Trophy, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/mocks")({ component: Mocks });

const ranks = [
  { m: "M1", r: 4200 },
  { m: "M2", r: 3100 },
  { m: "M3", r: 2400 },
  { m: "M4", r: 1850 },
  { m: "M5", r: 1620 },
  { m: "M6", r: 1240 },
  { m: "M7", r: 980 },
  { m: "M8", r: 780 },
];

function Mocks() {
  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto space-y-6">
      <header>
        <div className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
          Mock War Room
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Project the rank. Find the leak.
        </h1>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Panel className="!p-4"><Stat label="Projected AIR" value="780" delta="−200 vs last" tone="good" /></Panel>
        <Panel className="!p-4"><Stat label="Percentile" value="99.42" delta="+0.18" tone="good" /></Panel>
        <Panel className="!p-4"><Stat label="Mocks taken" value="8" delta="2 left this month" /></Panel>
        <Panel className="!p-4"><Stat label="Pressure perf" value="A−" delta="Improving" tone="good" /></Panel>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Panel title="Rank trajectory" subtitle="Lower is better" accent="gold" className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ranks}>
                <XAxis dataKey="m" axisLine={false} tickLine={false} tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} />
                <YAxis reversed axisLine={false} tickLine={false} tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} formatter={(v) => [`AIR ${v}`, "Rank"]} />
                <Line type="monotone" dataKey="r" stroke="var(--color-gold)" strokeWidth={2.5} dot={{ r: 4, fill: "var(--color-gold)", strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Highest scoring chapters" accent="cyan">
          <ul className="space-y-2">
            {[
              { c: "Definite Integration", s: "Maths", v: "+24" },
              { c: "Coordination Compounds", s: "Chemistry", v: "+19" },
              { c: "Modern Physics", s: "Physics", v: "+17" },
              { c: "Probability", s: "Maths", v: "+15" },
            ].map((x) => (
              <li key={x.c} className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-2/40 border border-border">
                <Trophy className="size-4 text-gold" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{x.c}</div>
                  <div className="text-[11px] text-muted-foreground">{x.s}</div>
                </div>
                <div className="text-xs font-semibold text-success tabular-nums flex items-center gap-1">
                  <TrendingUp className="size-3" /> {x.v}
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Most costly mistakes — last mock" subtitle="Marks lost ranked" accent="red">
        <div className="grid md:grid-cols-2 gap-3">
          {[
            { q: "Q14 Physics — Rotational, sign error", lost: 4, why: "Silly" },
            { q: "Q22 Maths — Integration by parts setup", lost: 4, why: "Concept" },
            { q: "Q31 Chem — Coord nomenclature", lost: 3, why: "Memory" },
            { q: "Q08 Physics — Optics convention", lost: 3, why: "Concept" },
          ].map((m, i) => (
            <div key={i} className="p-3 rounded-xl bg-surface-2/40 border border-border flex items-center gap-3">
              <div className="size-10 rounded-lg bg-danger/10 border border-danger/30 grid place-items-center text-danger font-semibold tabular-nums">
                −{m.lost}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{m.q}</div>
                <div className="text-[11px] text-muted-foreground">{m.why}</div>
              </div>
              <Tag tone="red">Reattempt</Tag>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

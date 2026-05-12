import { createFileRoute } from "@tanstack/react-router";
import {
  Flame,
  Target,
  Zap,
  AlertTriangle,
  Brain,
  Clock,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowUpRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";
import { Panel, Stat, Bar, Tag } from "@/components/ui-bits";

export const Route = createFileRoute("/")({
  component: MissionControl,
});

const focusSeries = [
  { d: "Mon", v: 5.2 },
  { d: "Tue", v: 6.1 },
  { d: "Wed", v: 4.5 },
  { d: "Thu", v: 7.0 },
  { d: "Fri", v: 6.4 },
  { d: "Sat", v: 8.1 },
  { d: "Sun", v: 7.4 },
];

const subjects = [
  {
    name: "Mathematics",
    color: "from-primary to-chart-4",
    solved: 47,
    accuracy: 84,
    speed: "1m 42s",
    confidence: 78,
    trend: "+6%",
    trendUp: true,
    revision: "On track",
  },
  {
    name: "Physics",
    color: "from-chart-4 to-chart-1",
    solved: 32,
    accuracy: 71,
    speed: "2m 11s",
    confidence: 64,
    trend: "-3%",
    trendUp: false,
    revision: "1 due today",
  },
  {
    name: "Chemistry",
    color: "from-gold to-warning",
    solved: 38,
    accuracy: 88,
    speed: "1m 18s",
    confidence: 82,
    trend: "+9%",
    trendUp: true,
    revision: "On track",
  },
];

const dueRevisions = [
  { topic: "Rotational Dynamics", subject: "Physics", cycle: "D7", urgency: "warn" as const },
  { topic: "Coordination Compounds", subject: "Chemistry", cycle: "D3", urgency: "cyan" as const },
  { topic: "Definite Integration", subject: "Maths", cycle: "D14", urgency: "gold" as const },
  { topic: "Thermodynamics", subject: "Physics", cycle: "D1", urgency: "red" as const },
];

const errors = [
  { type: "Sign error in vectors", count: 6, cat: "Silly", tone: "warn" as const },
  { type: "Limits — L'Hôpital misuse", count: 4, cat: "Concept", tone: "red" as const },
  { type: "Stoichiometry unit slip", count: 3, cat: "Calc", tone: "warn" as const },
  { type: "Optics — sign convention", count: 3, cat: "Concept", tone: "red" as const },
];

function MissionControl() {
  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
            <span className="size-1.5 rounded-full bg-success animate-pulse" />
            Mission Control · Day 218 of prep
          </div>
          <h1 className="mt-2 text-3xl lg:text-4xl font-semibold tracking-tight">
            Good morning, Aryan.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-xl">
            One hard topic. One weak attack. One revision block. One timed set.
            <span className="text-foreground/80"> That's the day.</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
              Daily streak
            </div>
            <div className="flex items-center gap-1.5 text-2xl font-semibold tracking-tight">
              <Flame className="size-5 text-gold" />
              <span className="text-gradient-gold">42</span>
              <span className="text-sm text-muted-foreground font-normal">days</span>
            </div>
          </div>
        </div>
      </header>

      {/* Top KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Panel className="!p-4">
          <Stat label="Daily Mission" value="62%" delta="3 of 5 blocks" tone="default" />
          <Bar value={62} className="mt-3" />
        </Panel>
        <Panel className="!p-4">
          <Stat label="Deep Work Today" value="3h 42m" delta="+38m vs avg" tone="good" />
          <Bar value={74} tone="green" className="mt-3" />
        </Panel>
        <Panel className="!p-4">
          <Stat label="Accuracy (7d)" value="81%" delta="+4 pts" tone="good" />
          <Bar value={81} tone="cyan" className="mt-3" />
        </Panel>
        <Panel className="!p-4">
          <Stat label="Burnout Risk" value="Low" delta="Sleep 7.2h · Stress 3/10" tone="good" />
          <Bar value={22} tone="green" className="mt-3" />
        </Panel>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Daily Mission */}
        <Panel
          title="Daily Mission"
          subtitle="Today's non-negotiables"
          accent="cyan"
          className="lg:col-span-2"
          action={<Tag tone="cyan"><Zap className="size-3" /> Locked in</Tag>}
        >
          <ul className="space-y-2.5">
            {[
              {
                icon: Target,
                title: "Hard topic — Definite Integration (Adv level)",
                meta: "75 min · Cengage Ex 3 · 18 problems",
                done: true,
                tone: "cyan",
              },
              {
                icon: AlertTriangle,
                title: "Weak area attack — Rotational Dynamics",
                meta: "60 min · NCERT recap → HCV exemplar",
                done: true,
                tone: "warn",
              },
              {
                icon: Brain,
                title: "Revision block — D7 Coordination Compounds",
                meta: "Active recall · 30 min · 22 cards",
                done: true,
                tone: "gold",
              },
              {
                icon: Clock,
                title: "Timed set — Mixed PYQ (Maths × Physics)",
                meta: "90 min · 30 questions · simulate exam",
                done: false,
                tone: "cyan",
              },
              {
                icon: CheckCircle2,
                title: "Mistake reattempt — 6 from notebook",
                meta: "20 min · Re-solve before sleep",
                done: false,
                tone: "warn",
              },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <li
                  key={m.title}
                  className="group flex items-start gap-3 p-3 rounded-xl bg-surface-2/40 border border-border hover:border-border-strong hover:bg-surface-2 transition"
                >
                  <div
                    className={`shrink-0 size-9 rounded-lg grid place-items-center border ${
                      m.done
                        ? "bg-success/10 border-success/30 text-success"
                        : "bg-surface border-border text-muted-foreground"
                    }`}
                  >
                    {m.done ? <CheckCircle2 className="size-4.5" /> : <Icon className="size-4.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-sm font-medium leading-snug ${
                        m.done ? "text-muted-foreground line-through" : "text-foreground"
                      }`}
                    >
                      {m.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{m.meta}</div>
                  </div>
                  {!m.done && (
                    <button className="opacity-0 group-hover:opacity-100 transition text-xs font-medium text-primary flex items-center gap-1">
                      Start <ArrowUpRight className="size-3" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </Panel>

        {/* Exam readiness radial */}
        <Panel title="Exam Readiness" subtitle="Predicted preparedness" accent="gold">
          <div className="relative h-44">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                innerRadius="70%"
                outerRadius="100%"
                data={[{ name: "ready", value: 68, fill: "var(--color-gold)" }]}
                startAngle={210}
                endAngle={-30}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar dataKey="value" cornerRadius={20} background={{ fill: "var(--color-surface-2)" }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-center">
                <div className="text-4xl font-semibold tracking-tight text-gradient-gold tabular-nums">
                  68
                </div>
                <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground mt-0.5">
                  Readiness Index
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Syllabus</div>
              <div className="text-sm font-semibold mt-0.5 tabular-nums">71%</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">PYQ</div>
              <div className="text-sm font-semibold mt-0.5 tabular-nums">58%</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Mocks</div>
              <div className="text-sm font-semibold mt-0.5 tabular-nums">74%</div>
            </div>
          </div>
        </Panel>
      </div>

      {/* Subject performance grid */}
      <Panel title="Subject Performance" subtitle="Today · across all three" action={<Tag>Live</Tag>}>
        <div className="grid md:grid-cols-3 gap-4">
          {subjects.map((s) => (
            <div
              key={s.name}
              className="relative overflow-hidden rounded-xl bg-surface-2/40 border border-border p-4 hover:border-border-strong transition"
            >
              <div
                className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${s.color}`}
              />
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">{s.name}</div>
                <div
                  className={`flex items-center gap-1 text-xs tabular-nums ${
                    s.trendUp ? "text-success" : "text-danger"
                  }`}
                >
                  {s.trendUp ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                  {s.trend}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <Stat label="Solved" value={s.solved} />
                <Stat label="Accuracy" value={`${s.accuracy}%`} />
                <Stat label="Avg Speed" value={s.speed} />
                <Stat label="Confidence" value={`${s.confidence}%`} />
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
                  <span>Confidence</span>
                  <span>{s.revision}</span>
                </div>
                <Bar value={s.confidence} tone={s.confidence > 75 ? "green" : s.confidence > 65 ? "cyan" : "red"} />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Deep work + revisions + errors */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Panel title="Deep Work" subtitle="7-day focus hours" action={<Tag tone="green"><Activity className="size-3" /> Streak 12d</Tag>}>
          <div className="h-40 -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={focusSeries} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="d" axisLine={false} tickLine={false} tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }} />
                <Tooltip
                  cursor={{ stroke: "var(--color-border-strong)" }}
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "var(--color-muted-foreground)" }}
                  formatter={(v) => [`${v} h`, "Focus"]}
                />
                <Area type="monotone" dataKey="v" stroke="var(--color-primary)" strokeWidth={2} fill="url(#fg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border">
            <Stat label="Today" value="3h 42m" />
            <Stat label="Avg" value="6h 24m" />
            <Stat label="Peak" value="11–1pm" />
          </div>
        </Panel>

        <Panel
          title="Revision Intelligence"
          subtitle={`${dueRevisions.length} due today`}
          accent="gold"
        >
          <ul className="space-y-2">
            {dueRevisions.map((r) => (
              <li
                key={r.topic}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-2/40 border border-border hover:border-border-strong transition"
              >
                <Tag tone={r.urgency}>{r.cycle}</Tag>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{r.topic}</div>
                  <div className="text-[11px] text-muted-foreground">{r.subject}</div>
                </div>
                <button className="text-xs font-medium text-primary hover:underline">Recall</button>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          title="Error Intelligence"
          subtitle="Top recurring mistakes"
          action={<Tag tone="red">16 active</Tag>}
        >
          <ul className="space-y-2">
            {errors.map((e) => (
              <li
                key={e.type}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-2/40 border border-border"
              >
                <div className="size-8 rounded-md grid place-items-center bg-danger/10 border border-danger/30 text-danger text-sm font-semibold tabular-nums">
                  {e.count}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{e.type}</div>
                  <div className="text-[11px] text-muted-foreground">Reattempts pending</div>
                </div>
                <Tag tone={e.tone}>{e.cat}</Tag>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* AI Mentor brief */}
      <Panel accent="cyan" className="relative overflow-hidden">
        <div className="absolute -right-20 -top-20 size-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="flex items-start gap-4 relative">
          <div className="shrink-0 size-11 rounded-xl bg-gradient-to-br from-primary to-chart-4 grid place-items-center glow-cyan">
            <Brain className="size-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold">AI Mentor — daily brief</div>
              <Tag tone="cyan">Strategic</Tag>
            </div>
            <p className="mt-2 text-sm text-foreground/85 leading-relaxed max-w-3xl">
              Your accuracy drops 11 pts after the 90-minute mark — schedule today's PYQ set in
              two 45-min blocks instead of one. Physics confidence is sliding (-3%); Rotational
              Dynamics is the leak. Don't open new chapters this week. Sleep is the lever:
              every +30 min correlates to +4% accuracy in your last 14 days.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="text-xs font-medium px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90">
                Apply to today's plan
              </button>
              <button className="text-xs font-medium px-3 py-1.5 rounded-lg bg-surface-2 border border-border hover:bg-surface-2/70">
                See full analysis
              </button>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}

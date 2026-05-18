import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar as RBar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line,
  ComposedChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  Activity,
  Target,
  Layers,
  AlertOctagon,
  TrendingUp,
  TrendingDown,
  Minus,
  RotateCcw,
} from "lucide-react";
import { Panel } from "@/components/ui-bits";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import kalamBg from "@/assets/kalam-bg.jpg";

const STAGE_COLOR: Record<string, string> = {
  D1: "var(--chart-5)",
  D3: "var(--chart-4)",
  D7: "var(--chart-1)",
  D14: "var(--chart-2)",
  D30: "var(--chart-3)",
  mastered: "var(--gold)",
};

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

const SUBJECTS = ["Physics", "Chemistry", "Maths"] as const;
const SUBJ_COLOR: Record<string, string> = {
  Physics: "var(--chart-1)",
  Chemistry: "var(--chart-2)",
  Maths: "var(--chart-4)",
};
const DIFF_COLOR: Record<string, string> = {
  easy: "var(--chart-3)",
  medium: "var(--chart-1)",
  hard: "var(--chart-5)",
};
const TYPE_LABEL: Record<string, string> = {
  silly: "Silly Mistake",
  concept: "Conceptual Gap",
  calculation: "Calculation Error",
  time: "Time Pressure",
  misread: "Misread",
};
const TYPE_COLOR: Record<string, string> = {
  silly: "var(--chart-2)",
  concept: "var(--chart-5)",
  calculation: "var(--chart-4)",
  time: "var(--chart-1)",
  misread: "var(--chart-3)",
};

const FOCUS_TARGET_HOURS = 35; // weekly target

function MetricCard({
  label,
  value,
  sub,
  delta,
  icon: Icon,
  tone = "cyan",
  loading,
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: number | null;
  icon: any;
  tone?: "cyan" | "gold" | "green" | "red";
  loading?: boolean;
}) {
  const ring =
    tone === "gold"
      ? "ring-gold/30"
      : tone === "green"
        ? "ring-success/30"
        : tone === "red"
          ? "ring-danger/30"
          : "ring-primary/30";
  const glow =
    tone === "gold"
      ? "from-gold/20 to-transparent"
      : tone === "green"
        ? "from-success/20 to-transparent"
        : tone === "red"
          ? "from-danger/20 to-transparent"
          : "from-primary/20 to-transparent";
  const TrendIcon = delta == null ? Minus : delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const trendColor =
    delta == null
      ? "text-muted-foreground"
      : delta > 0
        ? "text-success"
        : delta < 0
          ? "text-danger"
          : "text-muted-foreground";

  return (
    <div className={`relative glass-panel rounded-2xl p-5 ring-1 ${ring} overflow-hidden`}>
      <div
        className={`absolute -top-10 -right-10 size-32 rounded-full bg-gradient-to-br ${glow} blur-2xl pointer-events-none`}
      />
      <div className="flex items-start justify-between gap-3 relative">
        <div className="flex-1 min-w-0">
          <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </div>
          {loading ? (
            <Skeleton className="h-8 w-24 mt-2" />
          ) : (
            <div className="mt-1.5 text-3xl font-semibold tracking-tight tabular-nums">{value}</div>
          )}
          {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
        </div>
        <div
          className={`size-9 rounded-xl grid place-items-center bg-surface-2 border border-border ${
            tone === "gold"
              ? "text-gold"
              : tone === "green"
                ? "text-success"
                : tone === "red"
                  ? "text-danger"
                  : "text-primary"
          }`}
        >
          <Icon className="size-4.5" strokeWidth={2} />
        </div>
      </div>
      {delta != null && !loading && (
        <div className={`mt-3 flex items-center gap-1 text-xs ${trendColor} tabular-nums`}>
          <TrendIcon className="size-3.5" />
          {delta > 0 ? "+" : ""}
          {delta}% vs last week
        </div>
      )}
    </div>
  );
}

const tooltipStyle = {
  backgroundColor: "oklch(0.19 0.014 250)",
  border: "1px solid oklch(0.4 0.02 250 / 80%)",
  borderRadius: "10px",
  fontSize: "12px",
  color: "oklch(0.97 0.005 250)",
};

function EmptyState({ msg }: { msg: string }) {
  return (
    <div className="h-[280px] grid place-items-center text-sm text-muted-foreground">
      <div className="text-center">
        <div className="size-10 rounded-full bg-surface-2 grid place-items-center mx-auto mb-3 border border-border">
          <Activity className="size-4 text-muted-foreground" />
        </div>
        {msg}
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return <Skeleton className="h-[280px] w-full" />;
}

function Dashboard() {
  const { user } = useAuth();
  const now = Date.now();
  const since7 = new Date(now - 7 * 86400000).toISOString();
  const since14 = new Date(now - 14 * 86400000).toISOString();

  const q = useQuery({
    queryKey: ["dashboard", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [practice, mistakes, revisions, focus, mocks] = await Promise.all([
        supabase
          .from("practice_sessions")
          .select("subject, attempted, correct, difficulty, created_at")
          .eq("user_id", user!.id)
          .gte("created_at", since14),
        supabase.from("mistakes").select("subject, type, resolved").eq("user_id", user!.id),
        supabase.from("revisions").select("stage").eq("user_id", user!.id),
        supabase
          .from("focus_sessions")
          .select("duration_sec, distractions, started_at")
          .eq("user_id", user!.id)
          .gte("started_at", since14),
        supabase
          .from("mocks")
          .select("name, taken_on, physics, chemistry, maths, marks, max_marks")
          .eq("user_id", user!.id)
          .order("taken_on", { ascending: true }),
      ]);
      if (practice.error) throw practice.error;
      return {
        practice: practice.data ?? [],
        mistakes: mistakes.data ?? [],
        revisions: revisions.data ?? [],
        focus: focus.data ?? [],
        mocks: mocks.data ?? [],
      };
    },
  });

  const d = q.data;

  // ---------- HERO METRICS ----------
  const hero = useMemo(() => {
    if (!d)
      return {
        focusHours: 0,
        focusPrev: 0,
        focusDelta: null as number | null,
        accuracy: 0,
        accuracyPrev: 0,
        accuracyDelta: null as number | null,
        revQueue: 0,
        openMistakes: 0,
        mistakesPrev: 0,
      };
      
    const cutoff = now - 7 * 86400000;
    const focusSec7 = d.focus
      .filter((f: any) => new Date(f.started_at).getTime() >= cutoff)
      .reduce((a: number, r: any) => a + (r.duration_sec || 0), 0);
    const focusSecPrev = d.focus
      .filter((f: any) => {
        const t = new Date(f.started_at).getTime();
        return t < cutoff && t >= cutoff - 7 * 86400000;
      })
      .reduce((a: number, r: any) => a + (r.duration_sec || 0), 0);

    // accuracy (practice + mocks)
    const p7 = d.practice.filter((p: any) => new Date(p.created_at).getTime() >= cutoff);
    const pPrev = d.practice.filter((p: any) => {
      const t = new Date(p.created_at).getTime();
      return t < cutoff && t >= cutoff - 7 * 86400000;
    });
    const att7 = p7.reduce((a: number, r: any) => a + (r.attempted || 0), 0);
    const cor7 = p7.reduce((a: number, r: any) => a + (r.correct || 0), 0);
    const attPrev = pPrev.reduce((a: number, r: any) => a + (r.attempted || 0), 0);
    const corPrev = pPrev.reduce((a: number, r: any) => a + (r.correct || 0), 0);
    // include mocks
    const mockSum = d.mocks.reduce(
      (acc: any, m: any) => {
        acc.att += m.max_marks || 0;
        acc.cor += m.marks || 0;
        return acc;
      },
      { att: 0, cor: 0 },
    );
    const totalAtt = att7 + mockSum.att;
    const totalCor = cor7 + mockSum.cor;
    const accuracy = totalAtt ? Math.round((totalCor / totalAtt) * 100) : 0;
    const accuracyPrev = attPrev ? Math.round((corPrev / attPrev) * 100) : 0;

    const revActive = d.revisions.filter((r: any) => r.stage !== "mastered").length;
    const openMistakes = d.mistakes.filter((m: any) => !m.resolved).length;

    const focusH = focusSec7 / 3600;
    const focusPrevH = focusSecPrev / 3600;
    const focusDelta =
      focusPrevH > 0 ? Math.round(((focusH - focusPrevH) / focusPrevH) * 100) : focusH > 0 ? 100 : null;
    const accDelta =
      accuracyPrev > 0 ? Math.round(((accuracy - accuracyPrev) / accuracyPrev) * 100) : null;

    return {
      focusHours: focusH,
      focusPrev: focusPrevH,
      focusDelta,
      accuracy,
      accuracyPrev,
      accuracyDelta: accDelta,
      revQueue: revActive,
      openMistakes,
      mistakesPrev: 0,
    };
  }, [d, now]);

  // ---------- ACCURACY BY SUBJECT vs BENCHMARK ----------
  const accuracyBySubject = useMemo(() => {
    if (!d) return [];
    return SUBJECTS.map((s) => {
      const rows = d.practice.filter((p: any) => p.subject === s);
      const att = rows.reduce((a: number, r: any) => a + (r.attempted || 0), 0);
      const cor = rows.reduce((a: number, r: any) => a + (r.correct || 0), 0);
      return {
        subject: s,
        accuracy: att ? Math.round((cor / att) * 100) : 0,
        benchmark: 80,
      };
    });
  }, [d]);

  // ---------- DIFFICULTY DEPTH (stacked) ----------
  const difficultyDepth = useMemo(() => {
    if (!d) return [];
    return SUBJECTS.map((s) => {
      const rows = d.practice.filter((p: any) => p.subject === s);
      const easy = rows.filter((r: any) => r.difficulty === "easy").reduce((a: number, r: any) => a + (r.attempted || 0), 0);
      const medium = rows.filter((r: any) => r.difficulty === "medium").reduce((a: number, r: any) => a + (r.attempted || 0), 0);
      const hard = rows.filter((r: any) => r.difficulty === "hard").reduce((a: number, r: any) => a + (r.attempted || 0), 0);
      return { subject: s, easy, medium, hard };
    });
  }, [d]);

  // ---------- ROOT CAUSE LEAKAGE ----------
  const rootCause = useMemo(() => {
    if (!d) return [];
    const open = d.mistakes.filter((m: any) => !m.resolved);
    const map: Record<string, number> = {};
    for (const m of open as any[]) map[m.type] = (map[m.type] || 0) + 1;
    return Object.entries(map).map(([k, v]) => ({
      name: TYPE_LABEL[k] ?? k,
      key: k,
      value: v,
    }));
  }, [d]);

  // ---------- MISTAKE BY SUBJECT ----------
  const mistakeBySubject = useMemo(() => {
    if (!d) return [];
    const open = d.mistakes.filter((m: any) => !m.resolved);
    return SUBJECTS.map((s) => ({
      name: s,
      value: open.filter((m: any) => m.subject === s).length,
    })).filter((x) => x.value > 0);
  }, [d]);

  // ---------- 7-DAY FOCUS + DISTRACTION ----------
  const focusDaily = useMemo(() => {
    if (!d) return [];
    const days: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now - i * 86400000);
      const key = day.toISOString().slice(0, 10);
      const label = day.toLocaleDateString(undefined, { weekday: "short" });
      const rows = d.focus.filter((f: any) => (f.started_at || "").slice(0, 10) === key);
      const hours = rows.reduce((a: number, r: any) => a + (r.duration_sec || 0), 0) / 3600;
      const distractions = rows.reduce((a: number, r: any) => a + (r.distractions || 0), 0);
      days.push({ day: label, hours: Number(hours.toFixed(2)), distractions });
    }
    return days;
  }, [d, now]);

  // ---------- MOCK TRAJECTORY ----------
  const mockTrajectory = useMemo(() => {
    if (!d) return [];
    return d.mocks.map((m: any) => ({
      name: m.name || new Date(m.taken_on).toLocaleDateString(),
      Physics: m.physics ?? 0,
      Chemistry: m.chemistry ?? 0,
      Maths: m.maths ?? 0,
    }));
  }, [d]);

  // ---------- SUBJECT MASTERY RADAR (composite: accuracy, volume, low-mistake) ----------
  const masteryRadar = useMemo(() => {
    if (!d) return [];
    const maxAttempted = Math.max(
      1,
      ...SUBJECTS.map((s) =>
        d.practice
          .filter((p: any) => p.subject === s)
          .reduce((a: number, r: any) => a + (r.attempted || 0), 0),
      ),
    );
    const openMistakes = d.mistakes.filter((m: any) => !m.resolved);
    const maxMis = Math.max(1, ...SUBJECTS.map((s) => openMistakes.filter((m: any) => m.subject === s).length));
    return SUBJECTS.map((s) => {
      const rows = d.practice.filter((p: any) => p.subject === s);
      const att = rows.reduce((a: number, r: any) => a + (r.attempted || 0), 0);
      const cor = rows.reduce((a: number, r: any) => a + (r.correct || 0), 0);
      const accuracy = att ? Math.round((cor / att) * 100) : 0;
      const volume = Math.round((att / maxAttempted) * 100);
      const mis = openMistakes.filter((m: any) => m.subject === s).length;
      const cleanliness = Math.round((1 - mis / maxMis) * 100);
      const mockRows = d.mocks.filter((m: any) => (m as any)[s.toLowerCase()] != null);
      const mockAvg = mockRows.length
        ? Math.round(
            (mockRows.reduce((a: number, r: any) => a + (r[s.toLowerCase()] || 0), 0) /
              mockRows.length /
              100) *
              100,
          )
        : 0;
      return { subject: s, Accuracy: accuracy, Volume: volume, Cleanliness: cleanliness, Mocks: mockAvg };
    });
  }, [d]);

  // ---------- REVISION STAGE DISTRIBUTION ----------
  const revisionStages = useMemo(() => {
    if (!d) return [];
    const order = ["D1", "D3", "D7", "D14", "D30", "mastered"];
    const map: Record<string, number> = {};
    for (const r of d.revisions as any[]) map[r.stage] = (map[r.stage] || 0) + 1;
    return order
      .filter((k) => map[k])
      .map((k) => ({ name: k === "mastered" ? "Mastered" : k, key: k, value: map[k] }));
  }, [d]);

  const loading = q.isLoading;

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Kalam background */}
      <div className="absolute inset-0 pointer-events-none -z-0">
        <img
          src={kalamBg}
          alt=""
          aria-hidden
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover opacity-[0.18] animate-kalam-drift"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/75 to-background" />
        <div className="absolute -top-32 -left-32 size-[480px] rounded-full bg-primary/10 blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-40 size-[520px] rounded-full bg-gold/10 blur-3xl animate-pulse [animation-delay:1.5s]" />
      </div>

      <div className="relative px-6 lg:px-10 py-8 max-w-[1400px] mx-auto space-y-6">
      <header>
        <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
          <span className="size-1.5 rounded-full bg-primary animate-pulse" />
          Command Dashboard · Live
        </div>
        <h1 className="mt-2 text-3xl lg:text-4xl font-semibold tracking-tight">
          Performance <span className="text-gradient-cyan">Intelligence</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-xl">
          Cross-system telemetry from Practice, Mistakes, Revision, Deep Work and Mocks — unified.
        </p>
        <blockquote className="mt-3 text-xs italic text-muted-foreground/90 border-l-2 border-gold/50 pl-3 max-w-lg">
          “Dream, dream, dream. Dreams transform into thoughts and thoughts result in action.”
          <span className="not-italic font-medium text-gold/80"> — Dr. A.P.J. Abdul Kalam</span>
        </blockquote>
      </header>

      {/* 1. HERO METRICS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-chart-enter delay-100">
        <MetricCard
          label="Focus Velocity"
          value={`${hero.focusHours.toFixed(1)}h`}
          sub={`${Math.round((hero.focusHours / FOCUS_TARGET_HOURS) * 100)}% of ${FOCUS_TARGET_HOURS}h target`}
          delta={hero.focusDelta}
          icon={Activity}
          tone="cyan"
          loading={loading}
        />
        <MetricCard
          label="Global Accuracy"
          value={`${hero.accuracy}%`}
          sub="Practice + Mocks combined"
          delta={hero.accuracyDelta}
          icon={Target}
          tone="green"
          loading={loading}
        />
        <MetricCard
          label="Revision Queue Heat"
          value={`${hero.revQueue}`}
          sub="Active chapters in D1–D30 loop"
          delta={null}
          icon={Layers}
          tone="gold"
          loading={loading}
        />
        <MetricCard
          label="Mistake Volatility"
          value={`${hero.openMistakes}`}
          sub="Unresolved leaks"
          delta={null}
          icon={AlertOctagon}
          tone="red"
          loading={loading}
        />
      </section>

      {/* 2. PRACTICE & DIFFICULTY MATRIX */}
      <section className="grid lg:grid-cols-2 gap-6 animate-chart-enter delay-200">
        <Panel title="Subject-Wise Accuracy" subtitle="vs 80% topper benchmark" accent="cyan">
          {loading ? (
            <ChartSkeleton />
          ) : accuracyBySubject.every((s) => s.accuracy === 0) ? (
            <EmptyState msg="No practice sessions logged yet" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={accuracyBySubject} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 6%)" vertical={false} />
                <XAxis dataKey="subject" stroke="oklch(0.65 0.02 250)" fontSize={12} tickLine={false} />
                <YAxis stroke="oklch(0.65 0.02 250)" fontSize={12} tickLine={false} domain={[0, 100]} unit="%" />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "oklch(1 0 0 / 4%)" }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <ReferenceLine y={80} stroke="var(--gold)" strokeDasharray="4 4" label={{ value: "Topper 80%", fill: "var(--gold)", fontSize: 10, position: "right" }} />
                <RBar dataKey="accuracy" name="Your accuracy" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel title="Difficulty Depth" subtitle="Questions solved by difficulty" accent="cyan">
          {loading ? (
            <ChartSkeleton />
          ) : difficultyDepth.every((s) => s.easy + s.medium + s.hard === 0) ? (
            <EmptyState msg="No practice sessions logged yet" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={difficultyDepth} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 6%)" vertical={false} />
                <XAxis dataKey="subject" stroke="oklch(0.65 0.02 250)" fontSize={12} tickLine={false} />
                <YAxis stroke="oklch(0.65 0.02 250)" fontSize={12} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "oklch(1 0 0 / 4%)" }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <RBar dataKey="easy" stackId="a" fill={DIFF_COLOR.easy} name="Easy" radius={[0, 0, 0, 0]} />
                <RBar dataKey="medium" stackId="a" fill={DIFF_COLOR.medium} name="Medium" />
                <RBar dataKey="hard" stackId="a" fill={DIFF_COLOR.hard} name="Hard" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </section>

      {/* 3. ERROR INTELLIGENCE */}
      <section className="grid lg:grid-cols-2 gap-6 animate-chart-enter delay-300">
        <Panel title="Root Cause Leakage" subtitle="Where marks are bleeding" accent="red">
          {loading ? (
            <ChartSkeleton />
          ) : rootCause.length === 0 ? (
            <EmptyState msg="No open mistakes — nice." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={rootCause}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  stroke="oklch(0.185 0.014 250)"
                  strokeWidth={2}
                >
                  {rootCause.map((e) => (
                    <Cell key={e.key} fill={TYPE_COLOR[e.key] ?? "var(--chart-1)"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel title="Mistake Distribution" subtitle="Open mistakes by subject" accent="red">
          {loading ? (
            <ChartSkeleton />
          ) : mistakeBySubject.length === 0 ? (
            <EmptyState msg="No open mistakes by subject" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={mistakeBySubject}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={100}
                  stroke="oklch(0.185 0.014 250)"
                  strokeWidth={2}
                  label={{ fontSize: 11, fill: "oklch(0.85 0.005 250)" }}
                >
                  {mistakeBySubject.map((e) => (
                    <Cell key={e.name} fill={SUBJ_COLOR[e.name] ?? "var(--chart-1)"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </section>

      {/* 4. DEEP WORK VELOCITY */}
      <Panel title="Deep Work Velocity" subtitle="7-day focus hours + distraction density" accent="cyan">
        {loading ? (
          <ChartSkeleton />
        ) : focusDaily.every((d) => d.hours === 0 && d.distractions === 0) ? (
          <EmptyState msg="No focus sessions yet — start a Deep Work timer." />
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={focusDaily}>
              <defs>
                <linearGradient id="focusGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 6%)" vertical={false} />
              <XAxis dataKey="day" stroke="oklch(0.65 0.02 250)" fontSize={12} tickLine={false} />
              <YAxis yAxisId="left" stroke="oklch(0.65 0.02 250)" fontSize={12} tickLine={false} unit="h" />
              <YAxis yAxisId="right" orientation="right" stroke="oklch(0.65 0.02 250)" fontSize={12} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "oklch(1 0 0 / 10%)" }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="hours"
                name="Focus hours"
                stroke="var(--chart-1)"
                strokeWidth={2}
                fill="url(#focusGrad)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="distractions"
                name="Distractions"
                stroke="var(--chart-5)"
                strokeWidth={2}
                dot={{ r: 3, fill: "var(--chart-5)" }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </Panel>

      {/* 5. MOCK TRAJECTORY */}
      <Panel title="Mock War Room Trajectory" subtitle="Subject scores over time" accent="gold">
        {loading ? (
          <ChartSkeleton />
        ) : mockTrajectory.length === 0 ? (
          <EmptyState msg="No mocks logged yet — open Mock War Room to add one." />
        ) : (
          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={mockTrajectory}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 6%)" vertical={false} />
              <XAxis dataKey="name" stroke="oklch(0.65 0.02 250)" fontSize={12} tickLine={false} />
              <YAxis stroke="oklch(0.65 0.02 250)" fontSize={12} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "oklch(1 0 0 / 10%)" }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="Physics" stroke={SUBJ_COLOR.Physics} strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="Chemistry" stroke={SUBJ_COLOR.Chemistry} strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="Maths" stroke={SUBJ_COLOR.Maths} strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Panel>

      {/* 6. SUBJECT MASTERY RADAR + REVISION STAGES */}
      <section className="grid lg:grid-cols-2 gap-6">
        <Panel title="Subject Mastery Radar" subtitle="Composite signal across 4 axes" accent="cyan">
          {loading ? (
            <ChartSkeleton />
          ) : masteryRadar.every((m) => m.Accuracy + m.Volume + m.Cleanliness + m.Mocks === 0) ? (
            <EmptyState msg="Log practice / mocks to populate radar." />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={masteryRadar} outerRadius="78%">
                <PolarGrid stroke="oklch(1 0 0 / 10%)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "oklch(0.75 0.02 250)", fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "oklch(0.55 0.02 250)", fontSize: 10 }} stroke="oklch(1 0 0 / 10%)" />
                <Radar name="Accuracy" dataKey="Accuracy" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.25} />
                <Radar name="Volume" dataKey="Volume" stroke="var(--chart-3)" fill="var(--chart-3)" fillOpacity={0.2} />
                <Radar name="Cleanliness" dataKey="Cleanliness" stroke="var(--gold)" fill="var(--gold)" fillOpacity={0.18} />
                <Radar name="Mocks" dataKey="Mocks" stroke="var(--chart-5)" fill="var(--chart-5)" fillOpacity={0.18} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel title="Revision Stage Distribution" subtitle="Spaced-repetition pipeline (D1 → Mastered)" accent="gold">
          {loading ? (
            <ChartSkeleton />
          ) : revisionStages.length === 0 ? (
            <EmptyState msg="No revision topics queued yet." />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revisionStages}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={110}
                  paddingAngle={2}
                  stroke="oklch(0.185 0.014 250)"
                  strokeWidth={2}
                  label={{ fontSize: 11, fill: "oklch(0.85 0.005 250)" }}
                >
                  {revisionStages.map((e) => (
                    <Cell key={e.key} fill={STAGE_COLOR[e.key] ?? "var(--chart-1)"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </section>
      </div>
    </div>
  );
}

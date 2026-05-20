import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Loader2, ShieldCheck, Users, Activity, Clock, Brain, Lock } from "lucide-react";
import { Panel } from "@/components/ui-bits";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const DEV_TOKEN = "954128";

const ERROR_CATEGORIES = [
  { key: "silly", label: "Silly Mistakes", color: "var(--chart-2)" },
  { key: "calculation", label: "Calculation Bottlenecks", color: "var(--chart-4)" },
  { key: "concept", label: "Conceptual Blindspots", color: "var(--chart-5)" },
  { key: "time", label: "Time Constraints", color: "var(--chart-1)" },
];

function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground text-sm">
      <Loader2 className="size-4 animate-spin text-primary" />
      {label ?? "Syncing live telemetry…"}
    </div>
  );
}

function DevGate({ onUnlock }: { onUnlock: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code === DEV_TOKEN) {
      onUnlock();
    } else {
      setError("Invalid access token.");
    }
  };

  return (
    <div className="relative glass-panel rounded-2xl p-8 ring-1 ring-primary/30 max-w-md mx-auto overflow-hidden">
      <div className="absolute -top-16 -right-16 size-48 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
      <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.2em] text-primary">
        <Lock className="size-3" /> Restricted
      </div>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight">DEVELOPER SYSTEM CONTROL</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Verify developer access token code to initialize analytics sync.
      </p>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <Input
          inputMode="numeric"
          maxLength={6}
          pattern="[0-9]{6}"
          placeholder="000000"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
            setError(null);
          }}
          className="font-mono tracking-[0.5em] text-center text-lg"
        />
        {error && <p className="text-xs text-danger">{error}</p>}
        <Button type="submit" className="w-full" disabled={code.length !== 6}>
          <ShieldCheck className="size-4 mr-2" /> Initialize
        </Button>
      </form>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  loading,
}: {
  icon: any;
  label: string;
  value: string;
  sub?: string;
  loading?: boolean;
}) {
  return (
    <div className="glass-panel rounded-2xl p-5 ring-1 ring-primary/20 relative overflow-hidden">
      <div className="absolute -top-10 -right-10 size-32 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
      <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
        <Icon className="size-3.5 text-primary" />
        {label}
      </div>
      {loading ? (
        <Loader2 className="mt-3 size-5 animate-spin text-primary" />
      ) : (
        <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>
      )}
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function DevAnalyticsView() {
  const [unlocked, setUnlocked] = useState(false);

  const q = useQuery({
    queryKey: ["dev-analytics"],
    enabled: unlocked,
    refetchInterval: 30_000,
    queryFn: async () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const [profilesC, activeC, focus, mistakes, mocks] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase
          .from("focus_sessions")
          .select("id", { count: "exact", head: true })
          .gte("started_at", oneHourAgo),
        supabase.from("focus_sessions").select("user_id, duration_sec"),
        supabase.from("mistakes").select("type"),
        supabase.from("mocks").select("physics, chemistry, maths, max_marks"),
      ]);
      return {
        totalProfiles: profilesC.count ?? 0,
        activeSessions: activeC.count ?? 0,
        focus: focus.data ?? [],
        mistakes: mistakes.data ?? [],
        mocks: mocks.data ?? [],
      };
    },
  });

  const avgFocusHrs = useMemo(() => {
    const f = q.data?.focus ?? [];
    if (!f.length) return 0;
    const totalMin = f.reduce((a: number, r: any) => a + (r.duration_sec ?? 0) / 60, 0);
    const users = new Set(f.map((r: any) => r.user_id)).size || 1;
    return totalMin / users / 60;
  }, [q.data]);

  const errorDist = useMemo(() => {
    const m = q.data?.mistakes ?? [];
    const counts: Record<string, number> = {};
    m.forEach((r: any) => {
      counts[r.type] = (counts[r.type] ?? 0) + 1;
    });
    const total = m.length || 1;
    return ERROR_CATEGORIES.map((c) => ({
      name: c.label,
      value: counts[c.key] ?? 0,
      pct: Math.round(((counts[c.key] ?? 0) / total) * 100),
      color: c.color,
    }));
  }, [q.data]);

  const subjectMastery = useMemo(() => {
    const m = q.data?.mocks ?? [];
    if (!m.length) return [];
    const per = (key: "physics" | "chemistry" | "maths") => {
      const max = m.reduce((a: number, r: any) => a + (r.max_marks ?? 300) / 3, 0) || 1;
      const got = m.reduce((a: number, r: any) => a + (r[key] ?? 0), 0);
      return Math.round((got / max) * 100);
    };
    return [
      { subject: "Physics", accuracy: per("physics"), fill: "var(--chart-1)" },
      { subject: "Chemistry", accuracy: per("chemistry"), fill: "var(--chart-2)" },
      { subject: "Maths", accuracy: per("maths"), fill: "var(--chart-4)" },
    ];
  }, [q.data]);

  if (!unlocked) return <DevGate onUnlock={() => setUnlocked(true)} />;

  const loading = q.isLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.2em] text-gold">
            <ShieldCheck className="size-3" /> Developer Analytics Mode · Live
          </div>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            System <span className="text-gradient-cyan">Telemetry</span>
          </h2>
        </div>
        {q.isFetching && !loading && <Loader2 className="size-4 animate-spin text-primary" />}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Enrolled Profiles"
          value={String(q.data?.totalProfiles ?? 0)}
          loading={loading}
        />
        <StatCard
          icon={Activity}
          label="Active Sessions (1h)"
          value={String(q.data?.activeSessions ?? 0)}
          loading={loading}
        />
        <StatCard
          icon={Clock}
          label="Avg Focus / User"
          value={`${avgFocusHrs.toFixed(2)} h`}
          sub="hours per active user"
          loading={loading}
        />
        <StatCard
          icon={Brain}
          label="Mistake Records"
          value={String(q.data?.mistakes.length ?? 0)}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Task Failure Categorization" subtitle="Live aggregation of logged errors">
          {loading ? (
            <Spinner />
          ) : (
            <div className="h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={errorDist}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                  >
                    {errorDist.map((e) => (
                      <Cell key={e.name} fill={e.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--panel)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                    }}
                    formatter={(v: any, n: any, p: any) => [`${v} (${p.payload.pct}%)`, n]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel title="Topic Mastery Breakdown" subtitle="Average accuracy across subjects">
          {loading ? (
            <Spinner />
          ) : (
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={subjectMastery}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="subject" stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--panel)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                    }}
                    formatter={(v: any) => [`${v}%`, "Accuracy"]}
                  />
                  <Bar dataKey="accuracy" radius={[8, 8, 0, 0]}>
                    {subjectMastery.map((s) => (
                      <Cell key={s.subject} fill={s.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

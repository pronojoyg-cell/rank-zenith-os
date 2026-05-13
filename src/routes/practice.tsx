import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { BarChart, Bar as RBar, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Panel, Stat, Tag } from "@/components/ui-bits";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/practice")({ component: Practice });

const SUBJECTS = ["Physics", "Chemistry", "Maths"] as const;
const DIFFS = ["easy", "medium", "hard", "advanced"] as const;

function Practice() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const since7 = new Date(Date.now() - 7 * 86400000).toISOString();

  const sessions = useQuery({
    queryKey: ["practice", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("practice_sessions")
        .select("*")
        .eq("user_id", user!.id)
        .gte("created_at", since7)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const [form, setForm] = useState({
    subject: "Physics",
    chapter: "",
    attempted: 10,
    correct: 8,
    duration_min: 30,
    difficulty: "medium",
    notes: "",
  });

  const log = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("practice_sessions").insert({ ...form, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["practice"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Session logged");
      setForm({ ...form, chapter: "", notes: "" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("practice_sessions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["practice"] }),
  });

  const list = sessions.data ?? [];
  const att = list.reduce((a, r: any) => a + r.attempted, 0);
  const cor = list.reduce((a, r: any) => a + r.correct, 0);
  const mins = list.reduce((a, r: any) => a + r.duration_min, 0);
  const accuracy = att ? Math.round((cor / att) * 100) : 0;
  const avgSpeed = att ? (mins * 60) / att : 0;

  const dist = DIFFS.map((d) => ({ d: d[0].toUpperCase() + d.slice(1), v: list.filter((r: any) => r.difficulty === d).reduce((a, r: any) => a + r.attempted, 0) }));

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto space-y-6">
      <header>
        <div className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">Practice Engine</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Solve with intent.</h1>
        <p className="mt-1 text-sm text-muted-foreground">Log every attempt — accuracy, speed, intent.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Panel className="!p-4"><Stat label="Attempted (7d)" value={att} /></Panel>
        <Panel className="!p-4"><Stat label="Accuracy" value={`${accuracy}%`} tone={accuracy >= 75 ? "good" : "warn"} /></Panel>
        <Panel className="!p-4"><Stat label="Avg speed" value={att ? `${Math.floor(avgSpeed / 60)}m ${Math.round(avgSpeed % 60)}s` : "—"} /></Panel>
        <Panel className="!p-4"><Stat label="Sessions" value={list.length} /></Panel>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Panel title="Log a session" subtitle="Be honest. The data is the mentor." accent="cyan">
          <form onSubmit={(e) => { e.preventDefault(); log.mutate(); }} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm">
                {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} className="px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm">
                {DIFFS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <input value={form.chapter} onChange={(e) => setForm({ ...form, chapter: e.target.value })} placeholder="Chapter (optional)" className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm" />
            <div className="grid grid-cols-3 gap-2">
              <label className="text-xs">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Attempted</span>
                <input type="number" min={0} value={form.attempted} onChange={(e) => setForm({ ...form, attempted: +e.target.value })} className="mt-1 w-full px-2 py-1.5 rounded-lg bg-surface-2 border border-border text-sm tabular-nums" />
              </label>
              <label className="text-xs">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Correct</span>
                <input type="number" min={0} value={form.correct} onChange={(e) => setForm({ ...form, correct: +e.target.value })} className="mt-1 w-full px-2 py-1.5 rounded-lg bg-surface-2 border border-border text-sm tabular-nums" />
              </label>
              <label className="text-xs">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Minutes</span>
                <input type="number" min={0} value={form.duration_min} onChange={(e) => setForm({ ...form, duration_min: +e.target.value })} className="mt-1 w-full px-2 py-1.5 rounded-lg bg-surface-2 border border-border text-sm tabular-nums" />
              </label>
            </div>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes (optional)" rows={2} className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm" />
            <button className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-1">
              <Plus className="size-4" /> Log session
            </button>
          </form>
        </Panel>

        <Panel title="Difficulty mix" subtitle="Attempts last 7 days" className="lg:col-span-2">
          {att === 0 ? (
            <div className="h-44 grid place-items-center text-sm text-muted-foreground">Log a session to see your mix.</div>
          ) : (
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dist}>
                  <XAxis dataKey="d" axisLine={false} tickLine={false} tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                  <RBar dataKey="v" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Recent sessions" subtitle="Last 7 days">
        {list.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">No sessions yet. Log your first above.</div>
        ) : (
          <ul className="space-y-2">
            {list.map((s: any) => {
              const acc = s.attempted ? Math.round((s.correct / s.attempted) * 100) : 0;
              return (
                <li key={s.id} className="group flex items-center gap-4 p-3 rounded-xl bg-surface-2/40 border border-border">
                  <Tag tone={s.subject === "Physics" ? "cyan" : s.subject === "Chemistry" ? "gold" : "green"}>{s.subject}</Tag>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{s.chapter || "—"}</div>
                    <div className="text-[11px] text-muted-foreground tabular-nums">
                      {s.correct}/{s.attempted} · {acc}% · {s.duration_min}m · {s.difficulty}
                    </div>
                  </div>
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {new Date(s.created_at).toLocaleDateString()}
                  </span>
                  <button onClick={() => del.mutate(s.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-danger">
                    <Trash2 className="size-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}

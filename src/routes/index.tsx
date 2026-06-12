import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, CheckCircle2, Circle, Brain, ArrowUpRight, Flame } from "lucide-react";
import { Panel, Stat, Bar, Tag } from "@/components/ui-bits";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useDataMode } from "@/hooks/useDataMode";
import { demoFocus, demoMistakes, demoPractice, demoRevisions, demoTasks } from "@/lib/demo-data";

export const Route = createFileRoute("/")({ component: MissionControl });

function MissionControl() {
  const { user } = useAuth();
  const { isDemo } = useDataMode();
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const since7 = new Date(Date.now() - 7 * 86400000).toISOString();

  const tasks = useQuery({
    queryKey: ["tasks", user?.id, today],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_tasks")
        .select("*")
        .eq("user_id", user!.id)
        .eq("task_date", today)
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });

  const stats = useQuery({
    queryKey: ["dashboard-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [practice, focus, mistakes, dueRev] = await Promise.all([
        supabase.from("practice_sessions").select("attempted, correct, duration_min, created_at").eq("user_id", user!.id).gte("created_at", since7),
        supabase.from("focus_sessions").select("duration_sec").eq("user_id", user!.id).gte("started_at", since7),
        supabase.from("mistakes").select("id").eq("user_id", user!.id).eq("resolved", false),
        supabase.from("revisions").select("id, topic, subject, stage, next_review_at").eq("user_id", user!.id).lte("next_review_at", new Date().toISOString()).order("next_review_at").limit(5),
      ]);
      const att = (practice.data ?? []).reduce((a, r: any) => a + r.attempted, 0);
      const cor = (practice.data ?? []).reduce((a, r: any) => a + r.correct, 0);
      const focusSec = (focus.data ?? []).reduce((a, r: any) => a + r.duration_sec, 0);
      return {
        accuracy: att ? Math.round((cor / att) * 100) : 0,
        attempted: att,
        focusHours: focusSec / 3600,
        mistakeCount: mistakes.data?.length ?? 0,
        dueRevisions: dueRev.data ?? [],
      };
    },
  });

  const [newTitle, setNewTitle] = useState("");
  const [newTarget, setNewTarget] = useState(1);

  const addTask = useMutation({
    mutationFn: async () => {
      if (!newTitle.trim()) throw new Error("Title required");
      const { error } = await supabase
        .from("daily_tasks")
        .insert({ user_id: user!.id, task_date: today, title: newTitle.trim(), target: newTarget });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewTitle("");
      setNewTarget(1);
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task added");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleTask = useMutation({
    mutationFn: async (t: any) => {
      const newDone = t.done >= t.target ? 0 : t.target;
      const { error } = await supabase.from("daily_tasks").update({ done: newDone }).eq("id", t.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const delTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("daily_tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const taskList = isDemo ? demoTasks : (tasks.data ?? []);
  const displayStats = isDemo
    ? {
        accuracy: Math.round((demoPractice.reduce((sum, row) => sum + row.correct, 0) / demoPractice.reduce((sum, row) => sum + row.attempted, 0)) * 100),
        attempted: demoPractice.reduce((sum, row) => sum + row.attempted, 0),
        focusHours: demoFocus.reduce((sum, row) => sum + row.duration_sec, 0) / 3600,
        mistakeCount: demoMistakes.filter((row) => !row.resolved).length,
        dueRevisions: demoRevisions.filter((row) => new Date(row.next_review_at).getTime() <= Date.now()),
      }
    : stats.data;
  const completed = taskList.filter((t: any) => t.done >= t.target).length;
  const pct = taskList.length ? Math.round((completed / taskList.length) * 100) : 0;
  const readiness = displayStats
    ? Math.min(100, Math.round((displayStats.accuracy * 0.5 + Math.min(displayStats.focusHours / 35, 1) * 50)))
    : 0;

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
            <span className="size-1.5 rounded-full bg-success animate-pulse" />
            Mission Control · {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
          </div>
          <h1 className="mt-2 text-3xl lg:text-4xl font-semibold tracking-tight">
            Output &gt; hours.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-xl">
            One hard topic. One weak attack. One revision block. One timed set. That's the day.
          </p>
        </div>
        <div className="text-right">
          <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">Today's mission</div>
          <div className="flex items-center gap-1.5 text-2xl font-semibold tracking-tight">
            <Flame className="size-5 text-gold" />
            <span className="text-gradient-gold">{pct}%</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Panel className="!p-4">
          <Stat label="Daily Mission" value={`${pct}%`} delta={`${completed} of ${taskList.length} done`} />
          <Bar value={pct} className="mt-3" />
        </Panel>
        <Panel className="!p-4">
          <Stat label="Focus 7d" value={`${(displayStats?.focusHours ?? 0).toFixed(1)}h`} />
          <Bar value={Math.min(100, ((displayStats?.focusHours ?? 0) / 35) * 100)} tone="green" className="mt-3" />
        </Panel>
        <Panel className="!p-4">
          <Stat label="Accuracy 7d" value={`${displayStats?.accuracy ?? 0}%`} delta={`${displayStats?.attempted ?? 0} attempted`} />
          <Bar value={displayStats?.accuracy ?? 0} tone="cyan" className="mt-3" />
        </Panel>
        <Panel className="!p-4">
          <Stat label="Open mistakes" value={displayStats?.mistakeCount ?? 0} delta="Pending reattempt" tone="warn" />
          <Bar value={Math.min(100, (displayStats?.mistakeCount ?? 0) * 5)} tone="red" className="mt-3" />
        </Panel>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Panel
          title="Daily Mission"
          subtitle="Today's non-negotiables"
          accent="cyan"
          className="lg:col-span-2"
        >
          <form
            onSubmit={(e) => { e.preventDefault(); addTask.mutate(); }}
            className="flex gap-2 mb-3"
          >
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Add a non-negotiable for today…"
              className="flex-1 px-3 py-2 rounded-lg bg-surface-2 border border-border focus:border-primary outline-none text-sm"
            />
            <input
              type="number"
              min={1}
              value={newTarget}
              onChange={(e) => setNewTarget(parseInt(e.target.value) || 1)}
              className="w-16 px-2 py-2 rounded-lg bg-surface-2 border border-border outline-none text-sm tabular-nums"
            />
             <button disabled={isDemo} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-1 disabled:opacity-50">
              <Plus className="size-4" /> Add
            </button>
          </form>
          {taskList.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No tasks yet. Add today's first non-negotiable above.
            </div>
          ) : (
            <ul className="space-y-2">
              {taskList.map((t: any) => {
                const done = t.done >= t.target;
                return (
                  <li
                    key={t.id}
                    className="group flex items-center gap-3 p-3 rounded-xl bg-surface-2/40 border border-border hover:border-border-strong"
                  >
                     <button disabled={isDemo} onClick={() => toggleTask.mutate(t)} className="shrink-0 disabled:opacity-60">
                      {done ? (
                        <CheckCircle2 className="size-5 text-success" />
                      ) : (
                        <Circle className="size-5 text-muted-foreground" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${done ? "line-through text-muted-foreground" : ""}`}>
                        {t.title}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
                        {t.done}/{t.target}
                      </div>
                    </div>
                     {!isDemo && <button
                      onClick={() => delTask.mutate(t.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-danger"
                    >
                      <Trash2 className="size-4" />
                     </button>}
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title="Exam Readiness" subtitle="Composite index" accent="gold">
          <div className="text-center py-6">
            <div className="text-6xl font-semibold tracking-tight text-gradient-gold tabular-nums">
              {readiness}
            </div>
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground mt-1">
              Readiness Index
            </div>
            <Bar value={readiness} tone="gold" className="mt-5" />
            <p className="text-xs text-muted-foreground mt-4">
              Computed from your last 7 days of accuracy + focus hours.
            </p>
          </div>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Panel
          title="Due for revision"
           subtitle={`${displayStats?.dueRevisions.length ?? 0} cards waiting`}
          accent="gold"
          action={
            <Link to="/revision" className="text-xs text-primary hover:underline flex items-center gap-1">
              Open vault <ArrowUpRight className="size-3" />
            </Link>
          }
        >
           {(displayStats?.dueRevisions ?? []).length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">Nothing due. Add topics in the Revision Vault.</div>
          ) : (
            <ul className="space-y-2">
               {displayStats?.dueRevisions.map((r: any) => (
                <li key={r.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-2/40 border border-border">
                  <Tag tone="gold">{r.stage}</Tag>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{r.topic}</div>
                    <div className="text-[11px] text-muted-foreground">{r.subject}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          accent="cyan"
          className="relative overflow-hidden"
          action={
            <Link to="/mentor" className="text-xs text-primary hover:underline flex items-center gap-1">
              Open mentor <ArrowUpRight className="size-3" />
            </Link>
          }
          title="AI Mentor"
          subtitle="Strategic briefing"
        >
          <div className="flex items-start gap-3">
            <div className="shrink-0 size-10 rounded-xl bg-gradient-to-br from-primary to-chart-4 grid place-items-center glow-cyan">
              <Brain className="size-5 text-primary-foreground" />
            </div>
            <p className="text-sm text-foreground/85 leading-relaxed">
              Open the mentor to get a personalised brief based on your live data — accuracy trends, focus patterns and the leaks costing you the most marks.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}

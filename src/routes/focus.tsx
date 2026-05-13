import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Play, Pause, Square, Zap } from "lucide-react";
import { Panel, Stat } from "@/components/ui-bits";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/focus")({ component: Focus });

const SUBJECTS = ["Physics", "Chemistry", "Maths"] as const;

function Focus() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [distractions, setDistractions] = useState(0);
  const [subject, setSubject] = useState<string>("Physics");
  const [label, setLabel] = useState("");
  const startedAtRef = useRef<string | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      tickRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else if (tickRef.current) {
      clearInterval(tickRef.current);
    }
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [running]);

  const sessions = useQuery({
    queryKey: ["focus", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const since = new Date(Date.now() - 7 * 86400000).toISOString();
      const { data, error } = await supabase.from("focus_sessions").select("*").eq("user_id", user!.id).gte("started_at", since).order("started_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("focus_sessions").insert({
        user_id: user!.id,
        subject,
        label: label || null,
        started_at: startedAtRef.current ?? new Date().toISOString(),
        duration_sec: seconds,
        distractions,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["focus"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Session saved");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const start = () => {
    if (!startedAtRef.current) startedAtRef.current = new Date().toISOString();
    setRunning(true);
  };
  const stop = async () => {
    setRunning(false);
    if (seconds < 30) { toast.info("Too short to save"); reset(); return; }
    await save.mutateAsync();
    reset();
  };
  const reset = () => {
    setSeconds(0); setDistractions(0); setLabel(""); startedAtRef.current = null;
  };

  const list = sessions.data ?? [];
  const totalSec = list.reduce((a, s: any) => a + s.duration_sec, 0);
  const distTotal = list.reduce((a, s: any) => a + s.distractions, 0);

  const fmt = (s: number) => `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto space-y-6">
      <header>
        <div className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">Deep Work</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">One block. Zero leaks.</h1>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Panel className="!p-4"><Stat label="Hours (7d)" value={(totalSec / 3600).toFixed(1)} /></Panel>
        <Panel className="!p-4"><Stat label="Sessions" value={list.length} /></Panel>
        <Panel className="!p-4"><Stat label="Distractions" value={distTotal} tone="warn" /></Panel>
        <Panel className="!p-4"><Stat label="Avg session" value={list.length ? `${Math.round(totalSec / list.length / 60)}m` : "—"} /></Panel>
      </div>

      <Panel title="Console" accent="cyan">
        <div className="grid lg:grid-cols-[1fr_auto] gap-6 items-center">
          <div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <select disabled={running} value={subject} onChange={(e) => setSubject(e.target.value)} className="px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm">
                {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
              </select>
              <input disabled={running} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="What are you working on?" className="px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm" />
            </div>
            <div className="text-7xl font-semibold tabular-nums tracking-tight text-gradient-cyan">{fmt(seconds)}</div>
            <div className="text-xs text-muted-foreground mt-1">Distractions: <span className="tabular-nums text-warning">{distractions}</span></div>
          </div>
          <div className="flex flex-col gap-2">
            {!running ? (
              <button onClick={start} className="px-5 py-3 rounded-xl bg-primary text-primary-foreground font-medium flex items-center gap-2"><Play className="size-4" /> Start</button>
            ) : (
              <button onClick={() => setRunning(false)} className="px-5 py-3 rounded-xl bg-surface-2 border border-border font-medium flex items-center gap-2"><Pause className="size-4" /> Pause</button>
            )}
            <button onClick={stop} disabled={!seconds} className="px-5 py-3 rounded-xl bg-danger text-destructive-foreground font-medium flex items-center gap-2 disabled:opacity-50"><Square className="size-4" /> Stop & save</button>
            <button onClick={() => setDistractions((d) => d + 1)} disabled={!running} className="px-5 py-3 rounded-xl border border-warning/40 text-warning font-medium flex items-center gap-2 disabled:opacity-50"><Zap className="size-4" /> Distraction +1</button>
          </div>
        </div>
      </Panel>

      <Panel title="Recent sessions">
        {list.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">No sessions yet. Start one above.</div>
        ) : (
          <ul className="space-y-2">
            {list.map((s: any) => (
              <li key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-2/40 border border-border">
                <div className="text-sm font-medium tabular-nums w-20">{Math.round(s.duration_sec / 60)}m</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{s.label || s.subject}</div>
                  <div className="text-[11px] text-muted-foreground">{s.subject} · {new Date(s.started_at).toLocaleString()}</div>
                </div>
                <span className="text-xs text-warning tabular-nums">{s.distractions} dist</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

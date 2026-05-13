import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Panel, Stat } from "@/components/ui-bits";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/mocks")({ component: Mocks });

function Mocks() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["mocks", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("mocks").select("*").eq("user_id", user!.id).order("taken_on");
      if (error) throw error;
      return data ?? [];
    },
  });

  const [f, setF] = useState({
    name: "", taken_on: new Date().toISOString().slice(0, 10),
    physics: 0, chemistry: 0, maths: 0, max_marks: 300,
    rank_projection: 0, silly_loss: 0, concept_loss: 0, time_loss: 0, notes: "",
  });

  const add = useMutation({
    mutationFn: async () => {
      if (!f.name.trim()) throw new Error("Name required");
      const marks = f.physics + f.chemistry + f.maths;
      const { error } = await supabase.from("mocks").insert({ ...f, marks, user_id: user!.id } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mocks"] }); toast.success("Mock added"); setF({ ...f, name: "", notes: "" }); },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("mocks").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mocks"] }),
  });

  const list = q.data ?? [];
  const trend = list.map((m: any) => ({ d: new Date(m.taken_on).toLocaleDateString(undefined, { month: "short", day: "numeric" }), marks: m.marks, rank: m.rank_projection || null }));
  const last = list[list.length - 1] as any;
  const best = list.reduce((a: any, m: any) => (a && a.marks > m.marks ? a : m), null as any);

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto space-y-6">
      <header>
        <div className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">Mock War Room</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Simulate. Bleed. Fix.</h1>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Panel className="!p-4"><Stat label="Mocks taken" value={list.length} /></Panel>
        <Panel className="!p-4"><Stat label="Last score" value={last ? `${last.marks}/${last.max_marks}` : "—"} /></Panel>
        <Panel className="!p-4"><Stat label="Best" value={best ? `${best.marks}` : "—"} tone="good" /></Panel>
        <Panel className="!p-4"><Stat label="Last AIR proj." value={last?.rank_projection || "—"} /></Panel>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Panel title="Log a mock" accent="cyan">
          <form onSubmit={(e) => { e.preventDefault(); add.mutate(); }} className="space-y-2">
            <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Mock name" className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm" />
            <input type="date" value={f.taken_on} onChange={(e) => setF({ ...f, taken_on: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm" />
            <div className="grid grid-cols-3 gap-2">
              {(["physics", "chemistry", "maths"] as const).map((k) => (
                <label key={k} className="text-xs">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</span>
                  <input type="number" value={(f as any)[k]} onChange={(e) => setF({ ...f, [k]: +e.target.value })} className="mt-1 w-full px-2 py-1.5 rounded-lg bg-surface-2 border border-border text-sm tabular-nums" />
                </label>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Max marks</span>
                <input type="number" value={f.max_marks} onChange={(e) => setF({ ...f, max_marks: +e.target.value })} className="mt-1 w-full px-2 py-1.5 rounded-lg bg-surface-2 border border-border text-sm tabular-nums" />
              </label>
              <label className="text-xs">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">AIR proj.</span>
                <input type="number" value={f.rank_projection} onChange={(e) => setF({ ...f, rank_projection: +e.target.value })} className="mt-1 w-full px-2 py-1.5 rounded-lg bg-surface-2 border border-border text-sm tabular-nums" />
              </label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(["silly_loss", "concept_loss", "time_loss"] as const).map((k) => (
                <label key={k} className="text-xs">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{k.replace("_", " ")}</span>
                  <input type="number" value={(f as any)[k]} onChange={(e) => setF({ ...f, [k]: +e.target.value })} className="mt-1 w-full px-2 py-1.5 rounded-lg bg-surface-2 border border-border text-sm tabular-nums" />
                </label>
              ))}
            </div>
            <button className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-1"><Plus className="size-4" /> Add mock</button>
          </form>
        </Panel>

        <Panel title="Trajectory" subtitle="Marks over time" className="lg:col-span-2">
          {list.length === 0 ? (
            <div className="h-56 grid place-items-center text-sm text-muted-foreground">No mocks yet.</div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <XAxis dataKey="d" axisLine={false} tickLine={false} tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                  <Line type="monotone" dataKey="marks" stroke="var(--color-primary)" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
      </div>

      <Panel title="All mocks">
        {list.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">No mocks logged.</div>
        ) : (
          <ul className="space-y-2">
            {list.slice().reverse().map((m: any) => (
              <li key={m.id} className="group flex items-center gap-3 p-3 rounded-xl bg-surface-2/40 border border-border">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{m.name}</div>
                  <div className="text-[11px] text-muted-foreground tabular-nums">
                    {new Date(m.taken_on).toLocaleDateString()} · P {m.physics} · C {m.chemistry} · M {m.maths} · Loss S{m.silly_loss}/C{m.concept_loss}/T{m.time_loss}
                  </div>
                </div>
                <div className="text-sm font-semibold tabular-nums">{m.marks}/{m.max_marks}</div>
                {m.rank_projection ? <div className="text-xs text-gold tabular-nums">AIR ~{m.rank_projection}</div> : null}
                <button onClick={() => del.mutate(m.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-danger"><Trash2 className="size-4" /></button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

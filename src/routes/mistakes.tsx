import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, Check } from "lucide-react";
import { Panel, Stat, Tag } from "@/components/ui-bits";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useDataMode } from "@/hooks/useDataMode";
import { demoMistakes } from "@/lib/demo-data";

export const Route = createFileRoute("/mistakes")({ component: Mistakes });

const TYPES = ["silly", "concept", "calculation", "time", "misread"] as const;
const SUBJECTS = ["Physics", "Chemistry", "Maths"] as const;

function Mistakes() {
  const { user } = useAuth();
  const { isDemo } = useDataMode();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["mistakes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("mistakes").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const [f, setF] = useState({ subject: "Physics", chapter: "", question: "", type: "concept", mark_cost: 4, notes: "" });

  const add = useMutation({
    mutationFn: async () => {
      if (!f.question.trim()) throw new Error("Describe the mistake");
      const { error } = await supabase.from("mistakes").insert({ ...f, user_id: user!.id } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mistakes"] }); setF({ ...f, question: "", notes: "" }); toast.success("Logged"); },
    onError: (e: any) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async (m: any) => {
      const { error } = await supabase.from("mistakes").update({ resolved: !m.resolved }).eq("id", m.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mistakes"] }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("mistakes").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mistakes"] }),
  });

  const list = isDemo ? demoMistakes : (q.data ?? []);
  const open = list.filter((m: any) => !m.resolved);
  const cost = open.reduce((a, m: any) => a + m.mark_cost, 0);
  const byType = TYPES.map((t) => ({ t, n: list.filter((m: any) => m.type === t).length }));

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto space-y-6">
      <header>
        <div className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">Error Intelligence</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Mistakes are data.</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tag every error. Reattempt until it's gone.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Panel className="!p-4"><Stat label="Open" value={open.length} tone="warn" /></Panel>
        <Panel className="!p-4"><Stat label="Marks at risk" value={cost} tone="bad" /></Panel>
        <Panel className="!p-4"><Stat label="Resolved" value={list.length - open.length} tone="good" /></Panel>
        <Panel className="!p-4"><Stat label="Total logged" value={list.length} /></Panel>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Panel title="Log a mistake" accent="red">
          <form onSubmit={(e) => { e.preventDefault(); add.mutate(); }} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <select value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} className="px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm">
                {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
              </select>
              <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} className="px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm">
                {TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <input value={f.chapter} onChange={(e) => setF({ ...f, chapter: e.target.value })} placeholder="Chapter" className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm" />
            <textarea value={f.question} onChange={(e) => setF({ ...f, question: e.target.value })} placeholder="What went wrong?" rows={2} className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm" />
            <label className="block text-xs">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Mark cost</span>
              <input type="number" min={1} value={f.mark_cost} onChange={(e) => setF({ ...f, mark_cost: +e.target.value })} className="mt-1 w-full px-2 py-1.5 rounded-lg bg-surface-2 border border-border text-sm tabular-nums" />
            </label>
            <textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="Fix / lesson" rows={2} className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm" />
            <button disabled={isDemo} className="w-full py-2 rounded-lg bg-danger text-destructive-foreground text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50"><Plus className="size-4" /> Log mistake</button>
          </form>
        </Panel>

        <Panel title="Pattern by type" className="lg:col-span-2">
          <div className="grid grid-cols-5 gap-2">
            {byType.map((b) => (
              <div key={b.t} className="p-3 rounded-xl bg-surface-2/40 border border-border text-center">
                <div className="text-2xl font-semibold tabular-nums">{b.n}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{b.t}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="All mistakes">
        {list.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">No mistakes logged. Start tagging.</div>
        ) : (
          <ul className="space-y-2">
            {list.map((m: any) => (
              <li key={m.id} className={`group flex items-center gap-3 p-3 rounded-xl bg-surface-2/40 border border-border ${m.resolved ? "opacity-60" : ""}`}>
                <button disabled={isDemo} onClick={() => toggle.mutate(m)} className="size-7 rounded-md border border-border grid place-items-center hover:border-success disabled:opacity-60">
                  {m.resolved && <Check className="size-4 text-success" />}
                </button>
                <Tag tone={m.subject === "Physics" ? "cyan" : m.subject === "Chemistry" ? "gold" : "green"}>{m.subject}</Tag>
                <Tag tone="red">{m.type}</Tag>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium truncate ${m.resolved ? "line-through" : ""}`}>{m.question}</div>
                  {m.notes && <div className="text-[11px] text-muted-foreground truncate">{m.notes}</div>}
                </div>
                <span className="text-xs tabular-nums text-danger">−{m.mark_cost}</span>
                {!isDemo && <button onClick={() => del.mutate(m.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-danger"><Trash2 className="size-4" /></button>}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

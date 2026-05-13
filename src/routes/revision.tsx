import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, RotateCcw } from "lucide-react";
import { Panel, Stat, Tag } from "@/components/ui-bits";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/revision")({ component: Revision });

const SUBJECTS = ["Physics", "Chemistry", "Maths"] as const;

function Revision() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["revisions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("revisions").select("*").eq("user_id", user!.id).order("next_review_at");
      if (error) throw error;
      return data ?? [];
    },
  });

  const [f, setF] = useState({ topic: "", subject: "Physics" });

  const add = useMutation({
    mutationFn: async () => {
      if (!f.topic.trim()) throw new Error("Topic required");
      const { error } = await supabase.from("revisions").insert({ ...f, user_id: user!.id } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["revisions"] }); setF({ ...f, topic: "" }); toast.success("Added to vault"); },
    onError: (e: any) => toast.error(e.message),
  });

  const advance = useMutation({
    mutationFn: async ({ id, confidence }: { id: string; confidence: number }) => {
      const { error } = await supabase.rpc("advance_revision", { _id: id, _confidence: confidence });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["revisions"] }); toast.success("Advanced"); },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("revisions").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["revisions"] }),
  });

  const list = q.data ?? [];
  const now = Date.now();
  const due = list.filter((r: any) => new Date(r.next_review_at).getTime() <= now);
  const mastered = list.filter((r: any) => r.stage === "mastered").length;

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto space-y-6">
      <header>
        <div className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">Revision Vault</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">D1 → D3 → D7 → D14 → D30</h1>
        <p className="mt-1 text-sm text-muted-foreground">Spaced repetition. Forget less.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Panel className="!p-4"><Stat label="Due now" value={due.length} tone="warn" /></Panel>
        <Panel className="!p-4"><Stat label="In rotation" value={list.length - mastered} /></Panel>
        <Panel className="!p-4"><Stat label="Mastered" value={mastered} tone="good" /></Panel>
        <Panel className="!p-4"><Stat label="Total" value={list.length} /></Panel>
      </div>

      <Panel title="Add a topic" accent="gold">
        <form onSubmit={(e) => { e.preventDefault(); add.mutate(); }} className="flex gap-2">
          <select value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} className="px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm">
            {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
          </select>
          <input value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })} placeholder="Topic e.g. Rotational Dynamics" className="flex-1 px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm" />
          <button className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-1"><Plus className="size-4" /> Add</button>
        </form>
      </Panel>

      <Panel title="Vault" subtitle={`${due.length} due`}>
        {list.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Empty vault. Add your first topic above.</div>
        ) : (
          <ul className="space-y-2">
            {list.map((r: any) => {
              const isDue = new Date(r.next_review_at).getTime() <= now;
              return (
                <li key={r.id} className="group flex items-center gap-3 p-3 rounded-xl bg-surface-2/40 border border-border">
                  <Tag tone={isDue ? "red" : r.stage === "mastered" ? "green" : "gold"}>{r.stage}</Tag>
                  <Tag tone={r.subject === "Physics" ? "cyan" : r.subject === "Chemistry" ? "gold" : "green"}>{r.subject}</Tag>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{r.topic}</div>
                    <div className="text-[11px] text-muted-foreground tabular-nums">
                      Next: {new Date(r.next_review_at).toLocaleDateString()}
                    </div>
                  </div>
                  {r.stage !== "mastered" && (
                    <button onClick={() => advance.mutate({ id: r.id, confidence: Math.min(100, r.confidence + 10) })} className="text-xs font-medium px-3 py-1.5 rounded-lg bg-primary text-primary-foreground flex items-center gap-1">
                      <RotateCcw className="size-3" /> Mark revised
                    </button>
                  )}
                  <button onClick={() => del.mutate(r.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-danger"><Trash2 className="size-4" /></button>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}

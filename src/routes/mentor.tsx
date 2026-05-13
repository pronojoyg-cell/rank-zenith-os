import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Brain, Send } from "lucide-react";
import { Panel } from "@/components/ui-bits";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/mentor")({ component: Mentor });

function Mentor() {
  const { user, session } = useAuth();
  const qc = useQueryClient();
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const q = useQuery({
    queryKey: ["mentor", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("mentor_messages").select("*").eq("user_id", user!.id).order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [q.data, streaming]);

  const send = useMutation({
    mutationFn: async () => {
      const text = input.trim();
      if (!text) return;
      setInput("");
      setBusy(true);
      setStreaming("");

      // Persist user message
      await supabase.from("mentor_messages").insert({ user_id: user!.id, role: "user", content: text } as any);
      qc.invalidateQueries({ queryKey: ["mentor"] });

      // Build context from real data
      const since = new Date(Date.now() - 30 * 86400000).toISOString();
      const [practice, mistakes, focus, mocks, revs] = await Promise.all([
        supabase.from("practice_sessions").select("subject, attempted, correct, duration_min, difficulty, created_at").eq("user_id", user!.id).gte("created_at", since),
        supabase.from("mistakes").select("subject, type, mark_cost, resolved").eq("user_id", user!.id),
        supabase.from("focus_sessions").select("duration_sec, distractions, started_at").eq("user_id", user!.id).gte("started_at", since),
        supabase.from("mocks").select("*").eq("user_id", user!.id).order("taken_on", { ascending: false }).limit(5),
        supabase.from("revisions").select("topic, subject, stage, next_review_at").eq("user_id", user!.id),
      ]);

      const ctx = {
        practice: practice.data,
        mistakes: mistakes.data,
        focus: focus.data,
        mocks: mocks.data,
        revisions: revs.data,
      };

      const history = (q.data ?? []).map((m: any) => ({ role: m.role, content: m.content }));

      const resp = await fetch("/api/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ history: [...history, { role: "user", content: text }], context: ctx }),
      });

      if (!resp.ok || !resp.body) {
        const t = await resp.text();
        throw new Error(t || "Mentor unavailable");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let i: number;
        while ((i = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, i); buf = buf.slice(i + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) { acc += c; setStreaming(acc); }
          } catch { buf = line + "\n" + buf; break; }
        }
      }

      await supabase.from("mentor_messages").insert({ user_id: user!.id, role: "assistant", content: acc } as any);
      setStreaming("");
      qc.invalidateQueries({ queryKey: ["mentor"] });
    },
    onError: (e: any) => toast.error(e.message),
    onSettled: () => setBusy(false),
  });

  const messages = q.data ?? [];

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1100px] mx-auto space-y-6 h-screen flex flex-col">
      <header>
        <div className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">AI Mentor</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight flex items-center gap-2">
          <Brain className="size-7 text-primary" /> Strategic briefing
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Powered by Gemini · trained on your last 30 days of data.</p>
      </header>

      <Panel className="flex-1 flex flex-col min-h-0">
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.length === 0 && !streaming && (
            <div className="text-sm text-muted-foreground text-center py-12">
              Ask anything: "What's leaking marks?", "Plan tomorrow", "Where am I weakest?"
            </div>
          )}
          {messages.map((m: any) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-surface-2 border border-border"}`}>
                {m.content}
              </div>
            </div>
          ))}
          {streaming && (
            <div className="flex justify-start">
              <div className="max-w-[80%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap bg-surface-2 border border-border">
                {streaming}<span className="animate-pulse">▋</span>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); send.mutate(); }} className="mt-4 flex gap-2">
          <input
            value={input}
            disabled={busy}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your mentor…"
            className="flex-1 px-4 py-2.5 rounded-xl bg-surface-2 border border-border focus:border-primary outline-none text-sm"
          />
          <button disabled={busy || !input.trim()} className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center gap-1 disabled:opacity-50">
            <Send className="size-4" /> Send
          </button>
        </form>
      </Panel>
    </div>
  );
}

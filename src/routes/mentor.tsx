import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { Panel } from "@/components/ui-bits";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ramanujanImg from "@/assets/mentor-ramanujan.jpg";
import boseImg from "@/assets/mentor-bose.jpg";
import pcrayImg from "@/assets/mentor-pcray.jpg";
import krishnaImg from "@/assets/mentor-krishna.jpg";

export const Route = createFileRoute("/mentor")({ component: Mentor });

type MentorKey = "ramanujan" | "bose" | "pcray" | "krishna";

const MENTORS: Record<MentorKey, { name: string; subject: string; tagline: string; img: string; accent: string }> = {
  ramanujan: { name: "Srinivasa Ramanujan", subject: "Mathematics", tagline: "Intuition of infinity", img: ramanujanImg, accent: "from-amber-500/30 to-orange-600/20" },
  bose:      { name: "Satyendra Nath Bose", subject: "Physics",     tagline: "Precision & first principles", img: boseImg, accent: "from-cyan-500/30 to-blue-600/20" },
  pcray:     { name: "Acharya P.C. Ray",   subject: "Chemistry",   tagline: "Rigour of the lab",      img: pcrayImg, accent: "from-emerald-500/30 to-teal-600/20" },
  krishna:   { name: "Lord Krishna",        subject: "Emotional Support", tagline: "Steadiness of the soul", img: krishnaImg, accent: "from-violet-500/30 to-fuchsia-600/20" },
};

function Mentor() {
  const { user, session } = useAuth();
  const qc = useQueryClient();
  const [mentor, setMentor] = useState<MentorKey>("ramanujan");
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const q = useQuery({
    queryKey: ["mentor", user?.id, mentor],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mentor_messages")
        .select("*")
        .eq("user_id", user!.id)
        .eq("mentor", mentor)
        .order("created_at");
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

      await supabase.from("mentor_messages").insert({ user_id: user!.id, role: "user", content: text, mentor } as any);
      qc.invalidateQueries({ queryKey: ["mentor", user?.id, mentor] });

      const since = new Date(Date.now() - 30 * 86400000).toISOString();
      const [practice, mistakes, focus, mocks, revs] = await Promise.all([
        supabase.from("practice_sessions").select("subject, attempted, correct, duration_min, difficulty, created_at").eq("user_id", user!.id).gte("created_at", since),
        supabase.from("mistakes").select("subject, type, mark_cost, resolved").eq("user_id", user!.id),
        supabase.from("focus_sessions").select("duration_sec, distractions, started_at").eq("user_id", user!.id).gte("started_at", since),
        supabase.from("mocks").select("*").eq("user_id", user!.id).order("taken_on", { ascending: false }).limit(5),
        supabase.from("revisions").select("topic, subject, stage, next_review_at").eq("user_id", user!.id),
      ]);

      const ctx = { practice: practice.data, mistakes: mistakes.data, focus: focus.data, mocks: mocks.data, revisions: revs.data };
      const history = (q.data ?? []).map((m: any) => ({ role: m.role, content: m.content }));

      const resp = await fetch("/api/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ history: [...history, { role: "user", content: text }], context: ctx, mentor }),
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

      await supabase.from("mentor_messages").insert({ user_id: user!.id, role: "assistant", content: acc, mentor } as any);
      setStreaming("");
      qc.invalidateQueries({ queryKey: ["mentor", user?.id, mentor] });
    },
    onError: (e: any) => toast.error(e.message),
    onSettled: () => setBusy(false),
  });

  const active = MENTORS[mentor];
  const messages = q.data ?? [];

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1200px] mx-auto space-y-6 h-screen flex flex-col">
      <header>
        <div className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">AI Mentor Council</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight flex items-center gap-2">
          <Sparkles className="size-7 text-primary" /> Sit with a master
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Four mentors. Each speaks only in their domain — terse, surgical, in character.</p>
      </header>

      {/* Mentor selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(Object.keys(MENTORS) as MentorKey[]).map((k) => {
          const m = MENTORS[k];
          const isActive = k === mentor;
          return (
            <button
              key={k}
              onClick={() => setMentor(k)}
              className={cn(
                "group relative overflow-hidden rounded-2xl border text-left transition-all",
                isActive ? "border-primary shadow-[0_0_0_2px_hsl(var(--primary)/0.3)]" : "border-border hover:border-primary/50",
              )}
            >
              <div className={cn("absolute inset-0 bg-gradient-to-br opacity-60", m.accent)} />
              <div className="relative p-3 flex items-center gap-3">
                <img
                  src={m.img}
                  alt={m.name}
                  width={56}
                  height={56}
                  loading="lazy"
                  className="size-14 rounded-xl object-cover ring-1 ring-white/10 shrink-0"
                />
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{m.subject}</div>
                  <div className="text-sm font-semibold truncate">{m.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{m.tagline}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <Panel className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center gap-3 pb-4 border-b border-border mb-4">
          <img src={active.img} alt={active.name} width={40} height={40} loading="lazy" className="size-10 rounded-lg object-cover ring-1 ring-white/10" />
          <div>
            <div className="text-sm font-semibold">{active.name}</div>
            <div className="text-[11px] text-muted-foreground">Mentor of {active.subject}</div>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.length === 0 && !streaming && (
            <div className="text-sm text-muted-foreground text-center py-12">
              {mentor === "krishna"
                ? "Pour out your fears, doubts, exhaustion. Speak freely."
                : `Ask only about ${active.subject}. Be specific — concept, doubt, or strategy.`}
            </div>
          )}
          {messages.map((m: any) => (
            <div key={m.id} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role !== "user" && (
                <img src={active.img} alt="" width={28} height={28} loading="lazy" className="size-7 rounded-md object-cover ring-1 ring-white/10 shrink-0 mt-1" />
              )}
              <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-surface-2 border border-border"}`}>
                {m.content}
              </div>
            </div>
          ))}
          {streaming && (
            <div className="flex gap-2 justify-start">
              <img src={active.img} alt="" width={28} height={28} loading="lazy" className="size-7 rounded-md object-cover ring-1 ring-white/10 shrink-0 mt-1" />
              <div className="max-w-[78%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap bg-surface-2 border border-border">
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
            placeholder={mentor === "krishna" ? "Speak your heart…" : `Ask ${active.name.split(" ")[0]} about ${active.subject}…`}
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

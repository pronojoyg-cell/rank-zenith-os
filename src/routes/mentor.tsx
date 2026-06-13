import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, Loader2, Send, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import ramanujanImg from "@/assets/mentor-ramanujan.jpg";
import boseImg from "@/assets/mentor-bose.jpg";
import pcrayImg from "@/assets/mentor-pcray.jpg";
import krishnaImg from "@/assets/mentor-krishna.jpg";

export const Route = createFileRoute("/mentor")({ component: Mentor });

const MENTORS = [
  { id: "ramanujan", name: "Srinivasa Ramanujan", subject: "Mathematics", tagline: "Intuition of infinity", greeting: "Bring me a pattern, equation, or mathematical doubt. Let us find its hidden structure.", img: ramanujanImg, accent: "from-amber-500/30 to-orange-600/20" },
  { id: "bose", name: "Satyendra Nath Bose", subject: "Physics", tagline: "Precision & first principles", greeting: "Share your physics question. We will begin from first principles and reason carefully.", img: boseImg, accent: "from-cyan-500/30 to-blue-600/20" },
  { id: "pcray", name: "Acharya P.C. Ray", subject: "Chemistry", tagline: "Rigour of the lab", greeting: "Tell me which reaction, mechanism, or chemical trend is troubling you.", img: pcrayImg, accent: "from-emerald-500/30 to-teal-600/20" },
  { id: "krishna", name: "Lord Krishna", subject: "Emotional Support", tagline: "Steadiness of the soul", greeting: "Speak freely, dear student. What is weighing on your mind today?", img: krishnaImg, accent: "from-violet-500/30 to-fuchsia-600/20" },
];

type Mentor = (typeof MENTORS)[number];
type ChatMessage = { role: "user" | "assistant"; content: string };

async function streamMentorReply(mentor: Mentor, messages: ChatMessage[], onToken: (token: string) => void) {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL;
  const publicKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!baseUrl || !publicKey) throw new Error("The AI Mentor service is unavailable.");

  const { data } = await supabase.auth.getSession();
  const response = await fetch(`${baseUrl}/functions/v1/ai-mentor`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: publicKey,
      Authorization: `Bearer ${data.session?.access_token ?? publicKey}`,
    },
    body: JSON.stringify({ mentor: mentor.id, messages }),
  });
  if (!response.ok || !response.body) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error ?? "The mentor could not respond right now.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const dataLine = line.slice(6).trim();
      if (!dataLine || dataLine === "[DONE]") continue;
      try {
        const token = JSON.parse(dataLine).choices?.[0]?.delta?.content;
        if (typeof token === "string") onToken(token);
      } catch {
        continue;
      }
    }
  }
}

function Mentor() {
  const [activeMentor, setActiveMentor] = useState<Mentor | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  const openMentor = (mentor: Mentor) => {
    setActiveMentor(mentor);
    setMessages([{ role: "assistant", content: mentor.greeting }]);
    setError(null);
  };

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    const prompt = input.trim();
    if (!activeMentor || !prompt || streaming) return;
    const history = [...messages, { role: "user" as const, content: prompt }];
    setInput("");
    setError(null);
    setStreaming(true);
    setMessages([...history, { role: "assistant", content: "" }]);
    try {
      await streamMentorReply(activeMentor, history, (token) => {
        setMessages((current) => {
          const next = [...current];
          const last = next[next.length - 1];
          if (last?.role === "assistant") next[next.length - 1] = { ...last, content: last.content + token };
          return next;
        });
      });
    } catch (cause) {
      setMessages(history);
      setError(cause instanceof Error ? cause.message : "Unable to contact the mentor.");
    } finally {
      setStreaming(false);
    }
  };

  if (activeMentor) {
    return (
      <div className="px-4 sm:px-6 lg:px-10 py-6 sm:py-8 max-w-[1000px] mx-auto">
        <div className="glass-panel rounded-2xl min-h-[calc(100vh-10rem)] flex flex-col overflow-hidden">
          <header className="flex items-center gap-3 border-b border-border p-4">
            <Button variant="ghost" size="icon" onClick={() => setActiveMentor(null)} aria-label="Back to mentor council"><ArrowLeft /></Button>
            <img src={activeMentor.img} alt={activeMentor.name} className="size-11 rounded-xl object-cover" />
            <div className="min-w-0"><h1 className="font-semibold truncate">{activeMentor.name}</h1><p className="text-xs text-muted-foreground">{activeMentor.subject} mentor · AI-powered</p></div>
          </header>
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={cn("flex", message.role === "user" && "justify-end")}>
                <div className={cn("max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6", message.role === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-surface-2 border border-border rounded-bl-md")}>
                  {message.content ? <div className="prose prose-sm prose-invert max-w-none"><ReactMarkdown>{message.content}</ReactMarkdown></div> : <span className="flex items-center gap-2 text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Thinking…</span>}
                </div>
              </div>
            ))}
            {error && <p role="alert" className="text-sm text-danger text-center">{error}</p>}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={sendMessage} className="border-t border-border p-3 sm:p-4 flex items-end gap-2">
            <Textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder={`Ask ${activeMentor.name}…`} maxLength={4000} rows={2} disabled={streaming} className="resize-none" />
            <Button type="submit" size="icon" disabled={!input.trim() || streaming} aria-label="Send message">{streaming ? <Loader2 className="animate-spin" /> : <Send />}</Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6 sm:py-8 max-w-[1200px] mx-auto space-y-6">
      <header>
        <div className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">AI Mentor Council</div>
        <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight flex items-center gap-2">
          <Sparkles className="size-6 sm:size-7 text-primary" /> Sit with a master
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Four mentors, each speaking only in their domain — terse, surgical, in character.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {MENTORS.map((m) => (
          <div
            key={m.name}
            className="group relative overflow-hidden rounded-2xl border border-border"
          >
            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-60", m.accent)} />
            <div className="relative p-4 space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src={m.img}
                  alt={m.name}
                  width={64}
                  height={64}
                  loading="lazy"
                  className="size-16 rounded-xl object-cover ring-1 ring-border shrink-0"
                />
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{m.subject}</div>
                  <div className="text-sm font-semibold truncate">{m.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{m.tagline}</div>
                </div>
              </div>
              <Button className="w-full" size="sm" onClick={() => openMentor(m)}><Sparkles /> Consult mentor</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

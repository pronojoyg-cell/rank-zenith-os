import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpenCheck, FileText, Loader2, Play, Sparkles, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { generatePracticeTest } from "@/lib/practice-engine.functions";
import { PracticeCbt, type GeneratedTest } from "@/components/PracticeCbt";

const accepted = ["application/pdf", "image/png", "image/jpeg", "image/webp"];

async function fileToBase64(file: File) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 8192;
  for (let index = 0; index < bytes.length; index += chunk) binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  return btoa(binary);
}

export function PracticeEngine() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const generate = useServerFn(generatePracticeTest);
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [subject, setSubject] = useState<"Physics" | "Chemistry" | "Maths" | "Mixed">("Mixed");
  const [activeTest, setActiveTest] = useState<GeneratedTest | null>(null);
  const [dragging, setDragging] = useState(false);

  const tests = useQuery({
    queryKey: ["generated-tests", user?.id],
    enabled: !!user && user.id !== "guest",
    queryFn: async () => {
      const { data, error } = await supabase.from("generated_tests" as any).select("*").eq("user_id", user?.id).eq("status", "ready").order("created_at", { ascending: false }).limit(12);
      if (error) throw error;
      return (data ?? []) as unknown as GeneratedTest[];
    },
  });

  const generation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Choose a PDF or image first.");
      if (file.size > 12_000_000) throw new Error("Please keep the upload under 12 MB.");
      if (!accepted.includes(file.type)) throw new Error("Use a PDF, PNG, JPG, or WebP file.");
      return generate({ data: { filename: file.name, mimeType: file.type as "application/pdf" | "image/png" | "image/jpeg" | "image/webp", base64: await fileToBase64(file), subject } });
    },
    onSuccess: (test) => {
      queryClient.invalidateQueries({ queryKey: ["generated-tests"] });
      setActiveTest(test as unknown as GeneratedTest);
      toast.success("10-question CBT generated");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Generation failed"),
  });

  const chooseFile = (nextFile?: File) => {
    if (!nextFile) return;
    if (!accepted.includes(nextFile.type)) return toast.error("Use a PDF, PNG, JPG, or WebP file.");
    setFile(nextFile);
  };

  const submitAttempt = async ({ answers, states, timeSpent }: { answers: Record<number, string>; states: Record<number, string>; timeSpent: number }) => {
    if (!activeTest || !user || user.id === "guest") return;
    const incorrect = activeTest.questions.filter((question, index) => answers[index] && answers[index] !== question.correct_answer);
    const correct = activeTest.questions.filter((question, index) => answers[index] === question.correct_answer).length;
    const unanswered = activeTest.questions.length - correct - incorrect.length;
    const weakPoints = incorrect.map((question) => ({ subject: question.subject, question: question.question, selected: answers[question.question_id - 1], correct: question.correct_answer, explanation: question.explanation }));
    const { error } = await supabase.from("test_attempts" as any).insert({ test_id: activeTest.id, user_id: user.id, answers, question_states: states, score: correct * 4 - incorrect.length, correct_count: correct, incorrect_count: incorrect.length, unanswered_count: unanswered, accuracy: Math.round((correct / activeTest.questions.length) * 100), weak_points: weakPoints, time_spent_seconds: timeSpent });
    if (error) return toast.error(error.message);
    await supabase.from("practice_sessions").insert({ user_id: user.id, subject: activeTest.subject === "Mixed" ? "Physics" : activeTest.subject, chapter: activeTest.title, attempted: activeTest.questions.length, correct, duration_min: Math.max(1, Math.round(timeSpent / 60)), difficulty: "hard", notes: `AI CBT score: ${correct * 4 - incorrect.length}` } as any);
    queryClient.invalidateQueries({ queryKey: ["practice"] });
    queryClient.invalidateQueries({ queryKey: ["mentor-test-performance"] });
    toast.success(`Submitted: ${correct}/${activeTest.questions.length} correct`);
    setActiveTest(null);
  };

  if (activeTest) return <PracticeCbt test={activeTest} candidateName={user?.user_metadata?.display_name ?? user?.email?.split("@")[0] ?? "Candidate"} onExit={() => setActiveTest(null)} onSubmit={submitAttempt} />;

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 px-5 py-8 lg:px-10">
      <header className="flex flex-wrap items-end justify-between gap-4"><div><div className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">Practice Engine · AI CBT Lab</div><h1 className="mt-2 text-3xl font-semibold tracking-tight">Turn your notes into a high-stakes test.</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Upload 5–10 pages of study material. The engine extracts the concepts and builds a timed, 10-question JEE-style CBT.</p></div><div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground"><Sparkles className="size-3.5 text-primary" /> Grounded in your material</div></header>

      <section className="grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-7">
          <div className="mb-5 flex items-center justify-between"><div><h2 className="font-semibold">Generate a new CBT</h2><p className="mt-1 text-xs text-muted-foreground">PDF or image · 12 MB maximum · 5–10 pages recommended</p></div><Select value={subject} onValueChange={(value) => setSubject(value as typeof subject)}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent>{["Mixed", "Physics", "Chemistry", "Maths"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
          <div role="button" tabIndex={0} onClick={() => inputRef.current?.click()} onKeyDown={(event) => event.key === "Enter" && inputRef.current?.click()} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); chooseFile(event.dataTransfer.files[0]); }} className={`grid min-h-64 cursor-pointer place-items-center rounded-2xl border border-dashed p-8 text-center transition ${dragging ? "border-primary bg-primary/10" : "border-border-strong bg-surface hover:border-primary/60 hover:bg-surface-2"}`}>
            <div><div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary"><UploadCloud className="size-7" /></div><h3 className="mt-4 font-medium">{file ? file.name : "Drag & drop your study material"}</h3><p className="mt-1 text-xs text-muted-foreground">{file ? `${(file.size / 1_000_000).toFixed(1)} MB · Ready for analysis` : "or click to browse PDF, PNG, JPG, or WebP"}</p></div>
          </div><input ref={inputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" className="hidden" onChange={(event) => chooseFile(event.target.files?.[0])} />
          {generation.isPending ? <div className="mt-5 rounded-xl border border-primary/30 bg-primary/5 p-4"><div className="flex items-center gap-3 text-sm font-medium"><Loader2 className="size-4 animate-spin text-primary" /> AI is analyzing pages and engineering distractors…</div><Progress value={68} className="mt-3" /><p className="mt-2 text-[11px] text-muted-foreground">Extracting concepts · Calibrating JEE difficulty · Validating answer keys</p></div> : <Button className="mt-5 w-full" size="lg" disabled={!file || !user || user.id === "guest"} onClick={() => generation.mutate()}><Sparkles /> Generate 10-question CBT</Button>}
        </div>

        <aside className="rounded-2xl border border-border bg-surface p-6"><div className="grid size-11 place-items-center rounded-xl bg-gold/10 text-gold"><BookOpenCheck /></div><h2 className="mt-5 text-lg font-semibold">Professional exam flow</h2><ol className="mt-5 space-y-5">{[["01", "Upload", "Provide focused material from one chapter."], ["02", "Generate", "AI creates structured questions and explanations."], ["03", "Attempt", "Enter a distraction-free, timed CBT workspace."], ["04", "Strategic briefing", "Weak points become context for your AI mentors."]].map(([number, title, copy]) => <li key={number} className="flex gap-3"><span className="font-mono text-xs text-primary">{number}</span><div><div className="text-sm font-medium">{title}</div><p className="mt-1 text-xs leading-5 text-muted-foreground">{copy}</p></div></li>)}</ol></aside>
      </section>

      <section><div className="mb-4 flex items-center gap-2"><FileText className="size-4 text-primary" /><h2 className="font-semibold">Generated tests</h2></div>{tests.data?.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{tests.data.map((test) => <article key={test.id} className="rounded-xl border border-border bg-card p-4"><div className="flex items-start justify-between gap-3"><div><span className="text-[10px] uppercase tracking-wider text-primary">{test.subject}</span><h3 className="mt-1 font-medium">{test.title}</h3><p className="mt-1 truncate text-xs text-muted-foreground">{test.source_filename}</p></div><Button size="icon" onClick={() => setActiveTest(test)} aria-label={`Start ${test.title}`}><Play /></Button></div><div className="mt-4 flex gap-4 text-[11px] text-muted-foreground"><span>10 questions</span><span>{test.duration_minutes} min</span><span>{new Date(test.created_at).toLocaleDateString()}</span></div></article>)}</div> : <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Your generated tests will appear here.</div>}</section>
    </div>
  );
}
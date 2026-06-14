import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, Flag, UserRound } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type TestQuestion = { question_id: number; subject: "Physics" | "Chemistry" | "Maths"; question: string; options: string[]; correct_answer: "A" | "B" | "C" | "D"; explanation: string };
export type GeneratedTest = { id: string; title: string; subject: string; source_filename: string; duration_minutes: number; questions: TestQuestion[]; created_at: string };
type QuestionState = "not-visited" | "not-answered" | "answered" | "review" | "answered-review";

const letters = ["A", "B", "C", "D"] as const;

export function PracticeCbt({ test, candidateName, onExit, onSubmit }: { test: GeneratedTest; candidateName: string; onExit: () => void; onSubmit: (result: { answers: Record<number, string>; states: Record<number, QuestionState>; timeSpent: number }) => Promise<void> }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [states, setStates] = useState<Record<number, QuestionState>>({ 0: "not-answered" });
  const [seconds, setSeconds] = useState(test.duration_minutes * 60);
  const [submitting, setSubmitting] = useState(false);
  const [instructions, setInstructions] = useState(false);
  const question = test.questions[index];

  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (seconds === 0 && !submitting) void submitTest();
  }, [seconds]);

  const grouped = useMemo(() => ["Physics", "Chemistry", "Maths"].filter((subject) => test.questions.some((item) => item.subject === subject)), [test.questions]);
  const currentSubject = question?.subject ?? grouped[0];
  const formatTime = `${String(Math.floor(seconds / 3600)).padStart(2, "0")}:${String(Math.floor((seconds % 3600) / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  const visit = (next: number) => {
    setStates((current) => ({ ...current, [next]: current[next] ?? "not-answered" }));
    setIndex(next);
  };
  const moveNext = () => visit(Math.min(test.questions.length - 1, index + 1));
  const saveNext = () => { setStates((current) => ({ ...current, [index]: answers[index] ? "answered" : "not-answered" })); moveNext(); };
  const markNext = () => { setStates((current) => ({ ...current, [index]: answers[index] ? "answered-review" : "review" })); moveNext(); };
  const submitTest = async () => {
    if (submitting) return;
    setSubmitting(true);
    await onSubmit({ answers, states, timeSpent: test.duration_minutes * 60 - seconds });
    setSubmitting(false);
  };
  const paletteStyle = (state: QuestionState | undefined) => state === "answered" ? "bg-success text-primary-foreground" : state === "not-answered" ? "bg-danger text-primary-foreground" : state === "review" || state === "answered-review" ? "bg-chart-4 text-primary-foreground" : "bg-muted text-muted-foreground";

  if (!question) return null;
  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background text-foreground">
      <header className="min-h-20 border-b border-border bg-surface px-5 py-3 flex items-center gap-4">
        <div className="size-12 rounded-full bg-muted grid place-items-center"><UserRound className="size-7 text-muted-foreground" /></div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-2 text-xs leading-5 min-w-64"><dt className="font-semibold">Candidate Name</dt><dd className="text-gold">: {candidateName}</dd><dt className="font-semibold">Test Name</dt><dd>: {test.title}</dd></dl>
        <div className="ml-auto flex items-center gap-4"><div className="rounded-lg border border-border bg-background px-4 py-2 text-center"><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Remaining time</div><div className="font-mono font-semibold text-primary">{formatTime}</div></div><Button variant="outline" onClick={() => setInstructions(true)}>View Instructions</Button></div>
      </header>

      <div className="flex border-b border-border bg-surface px-4">
        {grouped.map((subject) => <button key={subject} onClick={() => { const target = test.questions.findIndex((item) => item.subject === subject); if (target >= 0) visit(target); }} className={cn("px-5 py-3 text-sm border-b-2", currentSubject === subject ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground")}>{subject}</button>)}
      </div>

      <div className="flex flex-1 min-h-0">
        <main className="flex-1 min-w-0 overflow-y-auto p-6 lg:p-8">
          <div className="flex items-center gap-3 border-b border-border pb-4"><h1 className="text-lg font-semibold">Question {index + 1}:</h1><span className="rounded-full border border-border px-2.5 py-1 text-xs">Marks: <b className="text-success">+4</b> / <b className="text-danger">-1</b></span><span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">Type: Single correct</span></div>
          <article className="prose prose-invert max-w-none py-7 text-base leading-7"><ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{question.question}</ReactMarkdown></article>
          <RadioGroup value={answers[index] ?? ""} onValueChange={(value) => setAnswers((current) => ({ ...current, [index]: value }))} className="space-y-3 max-w-3xl">
            {question.options.map((option, optionIndex) => <div key={letters[optionIndex]} className={cn("flex items-start gap-3 rounded-xl border p-4 transition", answers[index] === letters[optionIndex] ? "border-primary bg-primary/10" : "border-border bg-surface hover:bg-surface-2")}><RadioGroupItem value={letters[optionIndex]} id={`option-${optionIndex}`} className="mt-0.5" /><Label htmlFor={`option-${optionIndex}`} className="flex gap-3 text-sm leading-6 cursor-pointer"><b>{letters[optionIndex]}.</b><ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{option}</ReactMarkdown></Label></div>)}
          </RadioGroup>
        </main>

        <aside className="w-80 shrink-0 border-l border-border bg-surface p-5 overflow-y-auto hidden md:block">
          <h2 className="font-semibold">Question Palette</h2><p className="mt-1 text-xs text-muted-foreground">Select a question to navigate</p>
          <div className="mt-5 grid grid-cols-2 gap-2 text-[11px]"><span className="flex items-center gap-2"><i className="size-4 rounded bg-success" /> Answered</span><span className="flex items-center gap-2"><i className="size-4 rounded bg-danger" /> Not answered</span><span className="flex items-center gap-2"><i className="size-4 rounded bg-muted" /> Not visited</span><span className="flex items-center gap-2"><i className="size-4 rounded bg-chart-4" /> Review</span></div>
          <div className="mt-6 grid grid-cols-5 gap-2">{test.questions.map((item, questionIndex) => <button key={item.question_id} onClick={() => visit(questionIndex)} className={cn("aspect-square rounded-md text-xs font-semibold ring-offset-background", paletteStyle(states[questionIndex]), index === questionIndex && "ring-2 ring-primary ring-offset-2")}>{questionIndex + 1}</button>)}</div>
        </aside>
      </div>

      <footer className="border-t border-border bg-surface px-4 py-3 flex flex-wrap items-center gap-2"><Button onClick={saveNext} className="bg-success hover:bg-success/90"><CheckCircle2 /> Save & Next</Button><Button variant="outline" onClick={() => { setAnswers((current) => { const next = { ...current }; delete next[index]; return next; }); setStates((current) => ({ ...current, [index]: "not-answered" })); }}>Clear</Button><Button onClick={() => setStates((current) => ({ ...current, [index]: answers[index] ? "answered-review" : "review" }))}><Flag /> Save & Mark for Review</Button><Button variant="secondary" onClick={markNext}>Mark for Review & Next</Button><Button className="ml-auto" variant="destructive" disabled={submitting} onClick={() => void submitTest()}>{submitting ? <Clock3 className="animate-spin" /> : null} Submit</Button></footer>

      {instructions && <div className="fixed inset-0 z-[110] bg-background/80 backdrop-blur-sm grid place-items-center p-4"><section className="max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl"><div className="flex items-center gap-2"><AlertTriangle className="text-warning" /><h2 className="text-lg font-semibold">Test Instructions</h2></div><ul className="mt-4 list-disc pl-5 space-y-2 text-sm text-muted-foreground"><li>Each correct answer awards 4 marks; each incorrect answer deducts 1 mark.</li><li>Use the palette to navigate and track question status.</li><li>Marked questions remain available until final submission.</li><li>The test submits automatically when the timer reaches zero.</li></ul><Button className="mt-6 w-full" onClick={() => setInstructions(false)}>Continue Test</Button></section></div>}
    </div>
  );
}
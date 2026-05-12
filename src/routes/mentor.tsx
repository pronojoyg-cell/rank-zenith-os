import { createFileRoute } from "@tanstack/react-router";
import { Panel, Tag } from "@/components/ui-bits";
import { Brain, Sparkles } from "lucide-react";

export const Route = createFileRoute("/mentor")({ component: Mentor });

const briefs = [
  {
    title: "Your accuracy collapses past 90 minutes.",
    body: "Across the last 14 days, accuracy drops 11pts after the 90-min mark. Split today's PYQ block into two 45-min sets with a 5-min reset. Expected lift: +3–5pts.",
    tag: "Pattern",
  },
  {
    title: "Don't open new chapters this week.",
    body: "You have 16 unmastered errors, 8 D7 revisions overdue, and Physics confidence is sliding (−3%). Lock the syllabus, attack revision and reattempts, ship one full mock by Saturday.",
    tag: "Strategy",
  },
  {
    title: "Sleep is the highest-leverage variable.",
    body: "Every additional 30 min of sleep correlates with +4% accuracy in your data. You're averaging 6h 48m. Push to 7h 30m for the next 10 days and we'll re-evaluate.",
    tag: "Cognitive",
  },
  {
    title: "Tomorrow's plan is queued.",
    body: "Hard topic: Modern Physics — photoelectric. Weak attack: Inverse Trig. Revision: D3 Coordination, D7 Rotational. Timed: 30Q Maths PYQ (45+45). Mistake reattempt: 6.",
    tag: "Plan",
  },
];

function Mentor() {
  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1100px] mx-auto space-y-6">
      <header className="flex items-center gap-3">
        <div className="size-12 rounded-2xl bg-gradient-to-br from-primary to-chart-4 grid place-items-center glow-cyan">
          <Brain className="size-6 text-primary-foreground" />
        </div>
        <div>
          <div className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
            AI Mentor
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Trained like a top AIR mentor.</h1>
        </div>
      </header>

      <Panel accent="cyan" className="relative overflow-hidden">
        <div className="absolute -right-20 -top-20 size-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="size-4 text-gold" />
            <span className="text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">
              Daily strategic briefing
            </span>
          </div>
          <p className="text-lg leading-relaxed text-foreground/90 max-w-3xl">
            You're trending toward <span className="text-gradient-gold font-semibold">AIR 780</span>.
            To break sub-500, the next 21 days are about removing leakage — not adding new topics.
            Three levers: error reattempts, sleep discipline, and timed PYQ in 45-min splits.
            Stay on this protocol and the next mock should land you under 600.
          </p>
        </div>
      </Panel>

      <div className="space-y-3">
        {briefs.map((b) => (
          <Panel key={b.title}>
            <div className="flex items-start gap-3">
              <Tag tone={b.tag === "Pattern" ? "warn" : b.tag === "Strategy" ? "cyan" : b.tag === "Cognitive" ? "gold" : "green"}>
                {b.tag}
              </Tag>
              <div className="flex-1">
                <div className="text-sm font-semibold">{b.title}</div>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{b.body}</p>
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

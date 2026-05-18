import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Wrench, Lock } from "lucide-react";
import { Panel } from "@/components/ui-bits";
import { cn } from "@/lib/utils";
import ramanujanImg from "@/assets/mentor-ramanujan.jpg";
import boseImg from "@/assets/mentor-bose.jpg";
import pcrayImg from "@/assets/mentor-pcray.jpg";
import krishnaImg from "@/assets/mentor-krishna.jpg";

export const Route = createFileRoute("/mentor")({ component: Mentor });

const MENTORS = [
  { name: "Srinivasa Ramanujan", subject: "Mathematics", tagline: "Intuition of infinity", img: ramanujanImg, accent: "from-amber-500/30 to-orange-600/20" },
  { name: "Satyendra Nath Bose", subject: "Physics", tagline: "Precision & first principles", img: boseImg, accent: "from-cyan-500/30 to-blue-600/20" },
  { name: "Acharya P.C. Ray", subject: "Chemistry", tagline: "Rigour of the lab", img: pcrayImg, accent: "from-emerald-500/30 to-teal-600/20" },
  { name: "Lord Krishna", subject: "Emotional Support", tagline: "Steadiness of the soul", img: krishnaImg, accent: "from-violet-500/30 to-fuchsia-600/20" },
];

function Mentor() {
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

      <Panel className="relative overflow-hidden border-warning/40">
        <div className="absolute inset-0 bg-gradient-to-br from-warning/10 via-transparent to-primary/5 pointer-events-none" />
        <div className="relative flex items-start gap-3 sm:gap-4">
          <div className="size-10 sm:size-12 rounded-xl bg-warning/15 border border-warning/40 grid place-items-center shrink-0">
            <Wrench className="size-5 sm:size-6 text-warning" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-semibold tracking-tight">Under development</h2>
              <span className="text-[10px] uppercase tracking-[0.14em] px-2 py-0.5 rounded-full bg-warning/15 text-warning border border-warning/40">
                Coming soon
              </span>
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">
              The AI Mentor Council is being trained on each master's voice and reasoning style.
              You'll be able to consult them once the system is live.
            </p>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {MENTORS.map((m) => (
          <div
            key={m.name}
            className="group relative overflow-hidden rounded-2xl border border-border opacity-90"
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
                  className="size-16 rounded-xl object-cover ring-1 ring-white/10 shrink-0"
                />
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{m.subject}</div>
                  <div className="text-sm font-semibold truncate">{m.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{m.tagline}</div>
                </div>
              </div>
              <button
                disabled
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-surface-2/70 border border-border text-xs text-muted-foreground cursor-not-allowed"
              >
                <Lock className="size-3.5" /> Consult — coming soon
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

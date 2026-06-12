import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useGamification } from "@/hooks/useGamification";
import { Flame, Trophy, Shield, Sparkles } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useDataMode } from "@/hooks/useDataMode";
import { demoLeaderboard } from "@/lib/demo-data";

export const Route = createFileRoute("/compete")({
  component: ComputePage,
  head: () => ({ meta: [{ title: "Compete — JEE OS" }] }),
});

function Avatar({ name, size = 56, ring }: { name: string; size?: number; ring?: string }) {
  const letter = (name ?? "?").slice(0, 1).toUpperCase();
  return (
    <div
      className="rounded-full grid place-items-center font-semibold text-primary-foreground bg-gradient-to-br from-primary to-chart-4 shrink-0"
      style={{
        width: size,
        height: size,
        boxShadow: ring ? `0 0 0 3px ${ring}, 0 0 24px ${ring}` : undefined,
      }}
    >
      {letter}
    </div>
  );
}

function PodiumCard({ rank, row, color, glow, height }: any) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <Avatar name={row.display_name ?? "?"} size={rank === 1 ? 80 : 64} ring={glow} />
        <span className="absolute -bottom-1 -right-1 flex items-center gap-0.5 rounded-full bg-orange-500/95 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-lg">
          <Flame className="size-3" /> {row.current_streak ?? 0}
        </span>
      </div>
      <div className="text-center">
        <div className="text-sm font-semibold truncate max-w-[120px]">{row.display_name ?? "Anon"}</div>
        <div
          className="mt-0.5 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider animate-pulse"
          style={{ background: `${color}22`, color }}
        >
          <Sparkles className="size-3" /> AIR &lt; {row.target_air ?? "—"}
        </div>
      </div>
      <div
        className="w-full rounded-t-xl flex items-start justify-center pt-2 font-bold"
        style={{
          height,
          background: `linear-gradient(180deg, ${color}55, ${color}10)`,
          border: `1px solid ${color}55`,
          color,
        }}
      >
        #{rank}
      </div>
    </div>
  );
}

function ComputePage() {
  const { user } = useAuth();
  const { profile, trackActivity, setIncognito } = useGamification();
  const { isDemo } = useDataMode();

  const lb = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,display_name,target_air,current_streak,total_points,is_incognito")
        .eq("is_incognito", false)
        .order("total_points", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const live = (lb.data ?? []).filter((r) => r.id !== user?.id || !profile?.is_incognito);
  const realRows = live.map((r) => ({
      id: r.id,
      display_name: r.display_name ?? "Anon",
      target_air: r.target_air ?? 999,
      current_streak: r.current_streak ?? 0,
      total_points: r.total_points ?? 0,
    }));
  const rows = isDemo ? demoLeaderboard : realRows;

  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground flex items-center gap-2">
            <Trophy className="size-3.5" /> Global Arena
          </div>
          <h1 className="mt-1 text-3xl sm:text-4xl font-semibold tracking-tight text-gradient-cyan">
            Compete
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Streaks, points, and ranks — the only scoreboard that matters.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <div className="glass-panel rounded-xl p-3 flex items-center gap-3">
            <Shield className="size-4 text-primary" />
            <div className="text-xs">
              <div className="font-semibold">Incognito Mode</div>
              <div className="text-[10.5px] text-muted-foreground">Hide me from the board</div>
            </div>
            <Switch
              checked={!!profile?.is_incognito}
              disabled={isDemo}
              onCheckedChange={(v) =>
                setIncognito.mutate(v, {
                  onSuccess: () => toast.success(v ? "You're now hidden" : "You're visible again"),
                })
              }
            />
          </div>
        </div>
      </header>

      <div className="rounded-xl border border-border/60 bg-surface/40 px-4 py-3 text-sm text-muted-foreground">
        {isDemo
          ? "Demo mode shows sample leaderboard entries only. Nothing you do here changes your account."
          : "Real mode shows live leaderboard data from actual users."}
      </div>

      {/* Podium */}
      {lb.isLoading ? (
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-56" />)}
        </div>
      ) : top3.length > 0 ? (
        <div className="grid grid-cols-3 gap-3 sm:gap-6 items-end">
          {top3[1] && <PodiumCard rank={2} row={top3[1]} color="#c0c5ce" glow="rgba(192,197,206,0.55)" height={120} />}
          {top3[0] && <PodiumCard rank={1} row={top3[0]} color="#facc15" glow="rgba(250,204,21,0.6)" height={160} />}
          {top3[2] && <PodiumCard rank={3} row={top3[2]} color="#d97a3a" glow="rgba(217,122,58,0.55)" height={96} />}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center">
          <Trophy className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-medium">No real leaderboard data yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Complete activities to become the first ranked aspirant.</p>
        </div>
      )}

      {/* Rankings */}
      <section className="glass-panel rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border/60 flex items-center justify-between">
          <div className="text-sm font-semibold">Rankings</div>
          <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
            Rank 4 +
          </div>
        </div>
        <div className="divide-y divide-border/40">
          <div className="grid grid-cols-12 px-5 py-2 text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
            <div className="col-span-1">#</div>
            <div className="col-span-5">Aspirant</div>
            <div className="col-span-2 text-center">Streak</div>
            <div className="col-span-2 text-center">Target</div>
            <div className="col-span-2 text-right">Points</div>
          </div>
          {rest.length === 0 && rows.length > 0 && (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">More rankings will appear here as users earn points.</div>
          )}
          {rest.map((r, i) => (
            <div
              key={r.id}
              className="grid grid-cols-12 items-center px-5 py-3 text-sm hover:bg-surface-2/40 transition"
            >
              <div className="col-span-1 font-mono text-muted-foreground">{i + 4}</div>
              <div className="col-span-5 flex items-center gap-3 min-w-0">
                <Avatar name={r.display_name} size={32} />
                <div className="truncate">{r.display_name}</div>
              </div>
              <div className="col-span-2 text-center">
                <span className="inline-flex items-center gap-1 text-orange-400 font-semibold">
                  <Flame className="size-3.5" /> {r.current_streak}
                </span>
              </div>
              <div className="col-span-2 text-center text-gradient-gold font-semibold">
                &lt; {r.target_air}
              </div>
              <div className="col-span-2 text-right font-mono font-semibold text-primary">
                {r.total_points.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </section>

      {!isDemo && <div className="flex flex-wrap gap-2">
        <Button onClick={() => trackActivity.mutate("mission")} disabled={trackActivity.isPending}>
          +10 Mission
        </Button>
        <Button variant="outline" onClick={() => trackActivity.mutate("mistake")}>
          +5 Mistake
        </Button>
        <Button variant="outline" onClick={() => trackActivity.mutate("mock")}>
          +1 Mock
        </Button>
        <div className="ml-auto text-xs text-muted-foreground self-center">
          Your streak: <span className="text-orange-400 font-bold">{profile?.current_streak ?? 0}🔥</span> ·{" "}
          Points: <span className="text-primary font-bold">{profile?.total_points ?? 0}</span>
        </div>
      </div>}
    </div>
  );
}

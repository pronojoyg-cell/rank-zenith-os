import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Target,
  AlertOctagon,
  RotateCcw,
  Timer,
  FlaskConical,
  Brain,
  Trophy,
  LogOut,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const nav = [
  { to: "/", label: "Mission Control", icon: LayoutDashboard },
  { to: "/practice", label: "Practice Engine", icon: Target },
  { to: "/mistakes", label: "Error Intelligence", icon: AlertOctagon },
  { to: "/revision", label: "Revision Vault", icon: RotateCcw },
  { to: "/focus", label: "Deep Work", icon: Timer },
  { to: "/mocks", label: "Mock War Room", icon: Trophy },
  { to: "/mentor", label: "AI Mentor", icon: Brain },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  const examDate = profile?.exam_date ? new Date(profile.exam_date) : null;
  const daysToExam = examDate
    ? Math.max(0, Math.ceil((examDate.getTime() - Date.now()) / 86400000))
    : null;

  return (
    <div className="min-h-screen flex">
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border/60 bg-surface/40 backdrop-blur-xl sticky top-0 h-screen">
        <div className="px-5 py-6 flex items-center gap-2.5 border-b border-border/60">
          <div className="size-9 rounded-xl bg-gradient-to-br from-primary to-chart-4 grid place-items-center glow-cyan">
            <FlaskConical className="size-4.5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold tracking-tight">JEE OS</div>
            <div className="text-[10.5px] text-muted-foreground uppercase tracking-[0.14em]">
              Topper Operating System
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                  active
                    ? "bg-surface-2 text-foreground shadow-[inset_0_1px_0_0_oklch(1_0_0/6%)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-2/50",
                )}
              >
                <Icon className={cn("size-4", active ? "text-primary" : "")} strokeWidth={2} />
                <span className="flex-1">{item.label}</span>
                {active && <span className="size-1.5 rounded-full bg-primary glow-cyan" />}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-4 space-y-3">
          <Link to="/" className="block glass-panel rounded-xl p-4 hover:bg-surface-2/50 transition">
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
              Target AIR
            </div>
            <div className="text-2xl font-semibold tracking-tight text-gradient-gold">
              &lt; {profile?.target_air ?? 100}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {daysToExam !== null ? `${daysToExam} days to exam` : "Set your exam date"}
            </div>
          </Link>

          <div className="flex items-center gap-2 px-2">
            <div className="size-8 rounded-full bg-gradient-to-br from-primary to-chart-4 grid place-items-center text-xs font-semibold text-primary-foreground">
              {(profile?.display_name ?? user?.email ?? "?").slice(0, 1).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">{profile?.display_name ?? user?.email}</div>
              <div className="text-[10px] text-muted-foreground truncate">{user?.email}</div>
            </div>
            <button
              onClick={async () => {
                await signOut();
                navigate({ to: "/auth" });
              }}
              className="size-8 rounded-lg grid place-items-center text-muted-foreground hover:text-foreground hover:bg-surface-2"
              title="Sign out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}

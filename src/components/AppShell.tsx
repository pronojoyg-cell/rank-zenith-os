import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Target,
  Timer,
  FlaskConical,
  Brain,
  Trophy,
  Flame,
  LogOut,
  Menu,
  Swords,
  MessageCircle,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { FeedbackButton } from "@/components/FeedbackButton";
import { useDataMode } from "@/hooks/useDataMode";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/chat", label: "Chat with Peers", icon: MessageCircle },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/", label: "Mission Control", icon: Flame },
  { to: "/practice", label: "Practice Engine", icon: Target },
  { to: "/focus", label: "Deep Work", icon: Timer },
  { to: "/mocks", label: "Mock War Room", icon: Trophy },
  { to: "/compete", label: "Compete", icon: Swords },
  { to: "/mentor", label: "AI Mentor", icon: Brain },
] as const;

function SidebarContent({
  pathname,
  profile,
  user,
  daysToExam,
  onSignOut,
  onNavigate,
}: {
  pathname: string;
  profile: any;
  user: any;
  daysToExam: number | null;
  onSignOut: () => void;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="px-5 py-5 flex items-center gap-2.5 border-b border-border/60">
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

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map((item) => {
          const active = pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-all",
                active
                  ? "bg-surface-2 text-foreground shadow-[inset_0_1px_0_0_oklch(1_0_0/6%)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-2/50 active:bg-surface-2",
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
        <Link to="/" onClick={onNavigate} className="block glass-panel rounded-xl p-4 hover:bg-surface-2/50 transition">
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
            onClick={onSignOut}
            className="size-8 rounded-lg grid place-items-center text-muted-foreground hover:text-foreground hover:bg-surface-2"
            title="Sign out"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </>
  );
}

function DataModeSwitch() {
  const { mode, setMode } = useDataMode();
  return (
    <div className="inline-flex rounded-xl border border-border bg-surface p-1 shadow-sm" aria-label="Choose app data mode">
      <Button size="sm" variant={mode === "real" ? "default" : "ghost"} onClick={() => setMode("real")} className="h-7 px-3 text-xs">
        Real
      </Button>
      <Button size="sm" variant={mode === "demo" ? "default" : "ghost"} onClick={() => setMode("demo")} className="h-7 px-3 text-xs">
        Demo
      </Button>
    </div>
  );
}

function DesktopTopBar({ showModeSwitch }: { showModeSwitch: boolean }) {
  return (
    <div className="hidden lg:grid sticky top-0 z-30 grid-cols-3 items-center px-6 h-12 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div />
      <div className="flex justify-center">{showModeSwitch && <DataModeSwitch />}</div>
      <div className="flex justify-end">
      <FeedbackButton />
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

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

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/auth" });
  };

  const activeItem = nav.find((n) => n.to === pathname);
  const showModeSwitch = pathname !== "/mentor";

  return (
    <div className="min-h-screen flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border/60 bg-surface/40 backdrop-blur-xl sticky top-0 h-screen">
        <SidebarContent
          pathname={pathname}
          profile={profile}
          user={user}
          daysToExam={daysToExam}
          onSignOut={handleSignOut}
        />
      </aside>

      <main className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-40 flex items-center gap-3 px-4 h-14 border-b border-border/60 bg-background/85 backdrop-blur-xl">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                className="size-10 -ml-2 rounded-lg grid place-items-center text-foreground hover:bg-surface-2 active:bg-surface-2"
                aria-label="Open menu"
              >
                <Menu className="size-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[85vw] max-w-[320px] flex flex-col bg-surface/95 backdrop-blur-xl border-border/60">
              <SidebarContent
                pathname={pathname}
                profile={profile}
                user={user}
                daysToExam={daysToExam}
                onSignOut={handleSignOut}
                onNavigate={() => setMobileOpen(false)}
              />
            </SheetContent>
          </Sheet>

          <Link to="/" className="flex items-center gap-2 min-w-0">
            <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-chart-4 grid place-items-center glow-cyan shrink-0">
              <FlaskConical className="size-4 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold leading-tight truncate">
                {activeItem?.label ?? "JEE OS"}
              </div>
              <div className="text-[9.5px] text-muted-foreground uppercase tracking-[0.14em] leading-tight">
                {daysToExam !== null ? `${daysToExam}d to exam` : "JEE OS"}
              </div>
            </div>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            {showModeSwitch && <DataModeSwitch />}
            <FeedbackButton compact />
            <div className="text-right leading-tight hidden sm:block">
              <div className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Target</div>
              <div className="text-xs font-semibold text-gradient-gold">&lt; {profile?.target_air ?? 100}</div>
            </div>
            <div className="size-8 rounded-full bg-gradient-to-br from-primary to-chart-4 grid place-items-center text-xs font-semibold text-primary-foreground">
              {(profile?.display_name ?? user?.email ?? "?").slice(0, 1).toUpperCase()}
            </div>
          </div>
        </header>

        <DesktopTopBar showModeSwitch={showModeSwitch} />

        <div className="flex-1 min-w-0 pb-[env(safe-area-inset-bottom)]">{children}</div>
      </main>
    </div>
  );
}

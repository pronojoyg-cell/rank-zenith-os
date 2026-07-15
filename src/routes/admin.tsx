import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Shield,
  Users,
  DollarSign,
  AlertTriangle,
  Ticket,
  Search,
  MoreVertical,
  Lock,
  Ban,
  Coins,
  Crown,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RTooltip,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

const IDLE_MS = 15 * 60 * 1000;

/* ------------------------------ Root gate ------------------------------ */
function AdminPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<"loading" | "admin" | "user" | "none">("loading");
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (loading) return;
      if (!user) {
        setRole("none");
        return;
      }
      const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      if (cancelled) return;
      setRole((data as any)?.role === "admin" ? "admin" : "user");
    })();
    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  // Idle timer
  useEffect(() => {
    if (!verified) return;
    let t: number;
    const reset = () => {
      window.clearTimeout(t);
      t = window.setTimeout(async () => {
        setVerified(false);
        await supabase.auth.signOut();
        toast.error("Admin session expired (idle timeout)");
        navigate({ to: "/" });
      }, IDLE_MS);
    };
    const evts = ["mousemove", "keydown", "click", "touchstart"];
    evts.forEach((e) => window.addEventListener(e, reset));
    reset();
    return () => {
      window.clearTimeout(t);
      evts.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [verified, navigate]);

  if (loading || role === "loading") {
    return (
      <div className="min-h-screen grid place-items-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
      </div>
    );
  }

  // Hard 404 for non-admins (no leak)
  if (role !== "admin") return <NotFound />;

  if (!verified) return <PasscodeGate onSuccess={() => setVerified(true)} />;

  return <AdminConsole />;
}

function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center bg-slate-950 text-slate-500">
      <div className="text-center">
        <div className="text-7xl font-semibold">404</div>
        <div className="text-xs uppercase tracking-[0.2em] mt-2">Page not found</div>
      </div>
    </div>
  );
}

/* --------------------------- Passcode Gate ----------------------------- */
function PasscodeGate({ onSuccess }: { onSuccess: () => void }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 4) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("verify_admin_passcode", { input_passcode: code });
    setBusy(false);
    if (error) {
      toast.error("Verification failed");
      return;
    }
    if (data === true) {
      toast.success("Vault unlocked");
      onSuccess();
    } else {
      toast.error("⚠ Security breach logged");
      await supabase.auth.signOut();
      setTimeout(() => navigate({ to: "/" }), 800);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(16,185,129,0.08),transparent_60%)]" />
      <form
        onSubmit={submit}
        className="relative w-full max-w-md rounded-2xl border border-emerald-500/20 bg-slate-900/70 p-8 backdrop-blur-xl shadow-[0_0_60px_-15px_rgba(16,185,129,0.35)]"
      >
        <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.24em] text-emerald-400">
          <Lock className="size-3" /> Restricted Vault
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-100">
          Master Passcode
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Server-side verification. Failed attempts are logged.
        </p>
        <Input
          type="password"
          inputMode="numeric"
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="••••••"
          className="mt-6 h-14 text-center text-2xl tracking-[0.6em] font-mono bg-slate-950/70 border-emerald-500/20 focus-visible:ring-emerald-500/40"
        />
        <Button
          type="submit"
          disabled={busy || code.length < 4}
          className="mt-4 w-full h-11 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : "Unlock Command Center"}
        </Button>
      </form>
    </div>
  );
}

/* --------------------------- Admin Console ----------------------------- */
function AdminConsole() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.24em] text-emerald-400">
            <Shield className="size-3" /> Executive Command Center · Live
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">JEE OS · Admin</h1>
        </div>
      </header>

      <VitalRibbon />
      <UserRegistry />
      <TriageDesk />
    </div>
  );
}

/* --------------------------- Vital Ribbon ------------------------------ */
function VitalRibbon() {
  const q = useQuery({
    queryKey: ["admin-vitals"],
    refetchInterval: 30_000,
    queryFn: async () => {
      const [profiles, analytics, complaints, flags] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("user_analytics").select("credits_burned, active_devices, profile_id"),
        supabase.from("complaints").select("id", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("ai_error_flags").select("id", { count: "exact", head: true }).eq("status", "open"),
      ]);
      const burned = (analytics.data ?? []).reduce((a: number, r: any) => a + (r.credits_burned ?? 0), 0);
      const breaches = (analytics.data ?? []).filter((r: any) => (r.active_devices ?? 0) > 2).length;
      return {
        aspirants: profiles.count ?? 0,
        cost: burned * 0.002, // $ estimate
        breaches,
        tickets: (complaints.count ?? 0) + (flags.count ?? 0),
      };
    },
  });

  const cards = [
    { label: "Active Aspirants", value: q.data?.aspirants ?? 0, icon: Users, color: "emerald" },
    { label: "Compute Cost", value: `$${(q.data?.cost ?? 0).toFixed(2)}`, icon: DollarSign, color: "cyan" },
    { label: "Breach Alerts", value: q.data?.breaches ?? 0, icon: AlertTriangle, color: "rose" },
    { label: "Pending Tickets", value: q.data?.tickets ?? 0, icon: Ticket, color: "amber" },
  ] as const;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="relative rounded-2xl border border-slate-800 bg-slate-900/60 p-5 overflow-hidden group hover:border-emerald-500/30 transition"
        >
          <div className={`absolute -top-10 -right-10 size-32 rounded-full bg-${c.color}-500/10 blur-2xl`} />
          <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.18em] text-slate-400">
            <c.icon className={`size-3.5 text-${c.color}-400`} />
            {c.label}
          </div>
          {q.isLoading ? (
            <Skeleton className="mt-3 h-8 w-24 bg-slate-800" />
          ) : (
            <div className="mt-2 text-3xl font-semibold tracking-tight">{c.value}</div>
          )}
        </div>
      ))}
    </div>
  );
}

/* --------------------------- User Registry ----------------------------- */
type ProfileRow = {
  id: string;
  full_name: string | null;
  display_name: string | null;
  phone: string | null;
  created_at: string;
  current_tier: "free" | "monthly" | "elite";
  ai_credits: number;
  is_suspended: boolean;
};

function UserRegistry() {
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<ProfileRow | null>(null);
  const [tokenModal, setTokenModal] = useState<ProfileRow | null>(null);
  const qc = useQueryClient();
  const PAGE = 15;

  const q = useQuery({
    queryKey: ["admin-users", search, tier, page],
    queryFn: async () => {
      let base = supabase
        .from("profiles")
        .select("id, full_name, display_name, phone, created_at, current_tier, ai_credits, is_suspended", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE, page * PAGE + PAGE - 1);
      if (tier !== "all") base = base.eq("current_tier", tier as any);
      if (search) base = base.or(`full_name.ilike.%${search}%,display_name.ilike.%${search}%,phone.ilike.%${search}%`);
      const { data, count } = await base;
      const ids = (data ?? []).map((r: any) => r.id);
      const analytics = ids.length
        ? (await supabase.from("user_analytics").select("*").in("profile_id", ids)).data ?? []
        : [];
      const byId = new Map(analytics.map((a: any) => [a.profile_id, a]));
      return { rows: (data ?? []) as ProfileRow[], count: count ?? 0, analytics: byId };
    },
  });

  const updateTier = useMutation({
    mutationFn: async ({ id, current_tier }: { id: string; current_tier: string }) => {
      const { error } = await supabase.from("profiles").update({ current_tier } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tier updated");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleSuspend = useMutation({
    mutationFn: async (row: ProfileRow) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_suspended: !row.is_suspended } as any)
        .eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status toggled");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateCredits = useMutation({
    mutationFn: async ({ id, credits }: { id: string; credits: number }) => {
      const { error } = await supabase.from("profiles").update({ ai_credits: credits } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Credits updated");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setTokenModal(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <>
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="p-4 flex flex-col md:flex-row md:items-center gap-3 border-b border-slate-800">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
            <Input
              placeholder="Search name or phone…"
              value={search}
              onChange={(e) => {
                setPage(0);
                setSearch(e.target.value);
              }}
              className="pl-9 bg-slate-950/50 border-slate-800"
            />
          </div>
          <Select value={tier} onValueChange={(v) => { setPage(0); setTier(v); }}>
            <SelectTrigger className="w-40 bg-slate-950/50 border-slate-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tiers</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="elite">Elite</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[10.5px] uppercase tracking-[0.14em] text-slate-500 bg-slate-950/40">
              <tr>
                <th className="text-left px-4 py-3">Aspirant</th>
                <th className="text-left px-4 py-3">Phone</th>
                <th className="text-left px-4 py-3">Joined</th>
                <th className="text-left px-4 py-3">Tier</th>
                <th className="text-right px-4 py-3">Credits</th>
                <th className="text-right px-4 py-3">Devices</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {q.isLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-t border-slate-800/60">
                    <td colSpan={7} className="px-4 py-3">
                      <Skeleton className="h-6 w-full bg-slate-800/70" />
                    </td>
                  </tr>
                ))}
              {!q.isLoading && (q.data?.rows.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500 text-sm">
                    No aspirants match your filters.
                  </td>
                </tr>
              )}
              {q.data?.rows.map((r) => {
                const a: any = q.data.analytics.get(r.id) ?? {};
                const devices = a.active_devices ?? 1;
                return (
                  <tr
                    key={r.id}
                    onClick={() => setSelected(r)}
                    className="border-t border-slate-800/60 hover:bg-slate-800/30 cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{r.full_name ?? r.display_name ?? "—"}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{r.id.slice(0, 8)}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{r.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-400">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3"><TierBadge tier={r.current_tier} /></td>
                    <td className="px-4 py-3 text-right font-mono">{r.ai_credits}</td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={
                          devices > 2
                            ? "inline-flex items-center gap-1 rounded-md bg-rose-500/15 text-rose-300 px-2 py-0.5 font-mono animate-pulse"
                            : "font-mono text-slate-300"
                        }
                      >
                        {devices}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <button className="p-1.5 rounded hover:bg-slate-800">
                            <MoreVertical className="size-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem onSelect={() => setTokenModal(r)}>
                            <Coins className="size-4 mr-2" /> Modify Tokens
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => {
                              const next = prompt("New tier (free/monthly/elite)", r.current_tier);
                              if (next && ["free", "monthly", "elite"].includes(next))
                                updateTier.mutate({ id: r.id, current_tier: next });
                            }}
                          >
                            <Crown className="size-4 mr-2" /> Alter Tier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-rose-400"
                            onSelect={() => toggleSuspend.mutate(r)}
                          >
                            <Ban className="size-4 mr-2" />
                            {r.is_suspended ? "Reinstate" : "Purge/Ban"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between p-3 border-t border-slate-800 text-xs text-slate-500">
          <div>
            {q.data ? `${page * PAGE + 1}-${Math.min((page + 1) * PAGE, q.data.count)} of ${q.data.count}` : ""}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Prev
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!q.data || (page + 1) * PAGE >= q.data.count}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </section>

      {selected && (
        <UserTelemetry row={selected} onClose={() => setSelected(null)} />
      )}

      <TokenModal
        row={tokenModal}
        onClose={() => setTokenModal(null)}
        onSubmit={(credits) => tokenModal && updateCredits.mutate({ id: tokenModal.id, credits })}
        pending={updateCredits.isPending}
      />
    </>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const style =
    tier === "elite"
      ? "bg-amber-500/15 text-amber-300 ring-amber-500/30"
      : tier === "monthly"
        ? "bg-sky-500/15 text-sky-300 ring-sky-500/30"
        : "bg-slate-500/15 text-slate-300 ring-slate-500/30";
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ${style} capitalize`}>
      {tier}
    </span>
  );
}

function TokenModal({
  row,
  onClose,
  onSubmit,
  pending,
}: {
  row: ProfileRow | null;
  onClose: () => void;
  onSubmit: (n: number) => void;
  pending: boolean;
}) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    setVal(row?.ai_credits ?? 0);
  }, [row]);
  return (
    <Dialog open={!!row} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-slate-900 border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle>Modify AI credits</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <div className="text-xs text-slate-400">{row?.full_name ?? row?.display_name}</div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setVal((v) => Math.max(0, v - 50))}>−50</Button>
            <Input
              type="number"
              value={val}
              onChange={(e) => setVal(parseInt(e.target.value || "0"))}
              className="bg-slate-950 border-slate-800 text-center font-mono"
            />
            <Button variant="outline" onClick={() => setVal((v) => v + 50)}>+50</Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={pending} onClick={() => onSubmit(val)} className="bg-emerald-500 hover:bg-emerald-400 text-slate-950">
            {pending ? <Loader2 className="size-4 animate-spin" /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------- User Telemetry ----------------------------- */
function UserTelemetry({ row, onClose }: { row: ProfileRow; onClose: () => void }) {
  const q = useQuery({
    queryKey: ["admin-user-detail", row.id],
    queryFn: async () => {
      const { data } = await supabase.from("user_analytics").select("*").eq("profile_id", row.id).maybeSingle();
      return data as any;
    },
  });

  const peakData = useMemo(() => {
    const raw = q.data?.peak_usage_hours ?? {};
    return Array.from({ length: 24 }, (_, h) => ({
      hour: `${h}h`,
      minutes: Number(raw?.[String(h)] ?? 0),
    }));
  }, [q.data]);

  const revenue = (q.data?.revenue_cents ?? 0) / 100;
  const cost = (q.data?.cost_cents ?? 0) / 100;
  const isLoss = cost > revenue && revenue > 0;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-3xl">
        <DialogHeader>
          <DialogTitle>{row.full_name ?? row.display_name ?? "Aspirant"} · Telemetry</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Ring label="CBTs Generated" value={q.data?.total_cbts_generated ?? 0} max={100} />
            <Ring label="Deep Work (min)" value={q.data?.deep_work_minutes ?? 0} max={3000} />
            <Ring label="Mistakes Logged" value={q.data?.total_mistakes_logged ?? 0} max={200} />
          </div>

          <div className={`rounded-xl border border-slate-800 p-4 ${isLoss ? "bg-rose-950/30" : "bg-slate-950/40"}`}>
            <div className="text-[10.5px] uppercase tracking-[0.18em] text-slate-400">Financial Delta</div>
            <div className="mt-1 flex items-baseline gap-4">
              <div>
                <div className="text-xs text-slate-400">Revenue</div>
                <div className="text-lg font-semibold text-emerald-400">${revenue.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">API Cost</div>
                <div className={`text-lg font-semibold ${isLoss ? "text-rose-400" : "text-slate-200"}`}>
                  ${cost.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="text-[10.5px] uppercase tracking-[0.18em] text-slate-400 mb-2">
              Chronological Usage Heatmap
            </div>
            <div className="h-48">
              <ResponsiveContainer>
                <BarChart data={peakData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="hour" stroke="#64748b" fontSize={10} interval={2} />
                  <YAxis stroke="#64748b" fontSize={10} />
                  <RTooltip
                    contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
                  />
                  <Bar dataKey="minutes" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Ring({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-center">
      <div className="relative mx-auto size-20">
        <svg viewBox="0 0 36 36" className="size-20 -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1e293b" strokeWidth="3" />
          <circle
            cx="18"
            cy="18"
            r="15.9"
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeDasharray={`${pct} 100`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-sm font-semibold">{value}</div>
      </div>
      <div className="mt-2 text-[10.5px] uppercase tracking-[0.14em] text-slate-400">{label}</div>
    </div>
  );
}

/* ---------------------------- Triage Desk ------------------------------ */
function TriageDesk() {
  const qc = useQueryClient();
  const complaints = useQuery({
    queryKey: ["admin-complaints"],
    queryFn: async () => {
      const { data } = await supabase
        .from("complaints")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  const flags = useQuery({
    queryKey: ["admin-flags"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ai_error_flags")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const resolveComplaint = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("complaints").update({ status: "resolved" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Resolved");
      qc.invalidateQueries({ queryKey: ["admin-complaints"] });
    },
  });

  const correctFlag = useMutation({
    mutationFn: async ({ id, corrected_answer }: { id: string; corrected_answer: string }) => {
      const { error } = await supabase
        .from("ai_error_flags")
        .update({ corrected_answer, status: "corrected" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Correction saved");
      qc.invalidateQueries({ queryKey: ["admin-flags"] });
    },
  });

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="text-[10.5px] uppercase tracking-[0.18em] text-slate-400 mb-3">Triage Desk</div>
      <Tabs defaultValue="complaints">
        <TabsList className="bg-slate-950/50">
          <TabsTrigger value="complaints">Platform Feedback</TabsTrigger>
          <TabsTrigger value="flags">AI Content Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="complaints" className="mt-4 space-y-2">
          {complaints.isLoading && <Skeleton className="h-20 bg-slate-800" />}
          {!complaints.isLoading && complaints.data?.length === 0 && (
            <div className="text-sm text-slate-500 py-8 text-center">No complaints logged.</div>
          )}
          {complaints.data?.map((c: any) => (
            <div key={c.id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  {c.category} · {new Date(c.created_at).toLocaleString()}
                </div>
                {c.status === "open" ? (
                  <Button size="sm" variant="outline" onClick={() => resolveComplaint.mutate(c.id)}>
                    Mark Resolved
                  </Button>
                ) : (
                  <span className="text-[10.5px] uppercase tracking-[0.14em] text-emerald-400">Resolved</span>
                )}
              </div>
              <p className="mt-2 text-sm text-slate-200">{c.message}</p>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="flags" className="mt-4 space-y-2">
          {flags.isLoading && <Skeleton className="h-20 bg-slate-800" />}
          {!flags.isLoading && flags.data?.length === 0 && (
            <div className="text-sm text-slate-500 py-8 text-center">No flagged questions.</div>
          )}
          {flags.data?.map((f: any) => (
            <FlagCard key={f.id} flag={f} onSave={(v) => correctFlag.mutate({ id: f.id, corrected_answer: v })} />
          ))}
        </TabsContent>
      </Tabs>
    </section>
  );
}

function FlagCard({ flag, onSave }: { flag: any; onSave: (v: string) => void }) {
  const [val, setVal] = useState(flag.corrected_answer ?? "");
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
      <div className="text-xs text-slate-400 flex justify-between">
        <span>Q: {flag.question_id?.slice(0, 8) ?? "—"}</span>
        <span>{new Date(flag.created_at).toLocaleString()}</span>
      </div>
      <p className="mt-2 text-sm text-slate-200">{flag.user_feedback}</p>
      <Textarea
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="Correct answer key…"
        className="mt-3 bg-slate-950/70 border-slate-800"
      />
      <div className="mt-2 flex justify-between items-center">
        <span className="text-[10.5px] uppercase tracking-[0.14em] text-slate-500">Status: {flag.status}</span>
        <Button size="sm" onClick={() => onSave(val)} className="bg-emerald-500 hover:bg-emerald-400 text-slate-950">
          Save Correction
        </Button>
      </div>
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FlaskConical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [user, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      const uid = data.user?.id;
      if (uid) {
        await supabase.from("profiles").upsert({ id: uid, display_name: trimmed });
      }
      navigate({ to: "/" });
    } catch (e: any) {
      toast.error(e.message ?? "Could not start session");
    } finally {
      setBusy(false);
    }
  };

  const [guestName, setGuestName] = useState("");
  const enterGuest = () => {
    const n = guestName.trim() || "Guest";
    localStorage.setItem("guest_mode", "1");
    localStorage.setItem("guest_name", n);
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm glass-panel rounded-2xl p-7 space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-gradient-to-br from-primary to-chart-4 grid place-items-center glow-cyan">
            <FlaskConical className="size-4.5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">JEE OS</div>
            <div className="text-[10.5px] text-muted-foreground uppercase tracking-[0.14em]">
              Enter your name to begin
            </div>
          </div>
        </div>

        <div>
          <label className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">Your name</label>
          <input
            autoFocus
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Arjun"
            className="mt-1 w-full px-3 py-2 rounded-lg bg-surface-2 border border-border focus:border-primary outline-none text-sm"
          />
        </div>
        <button
          disabled={busy}
          className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Starting…" : "Enter Command Center"}
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/60" /></div>
          <div className="relative flex justify-center text-[10.5px] uppercase tracking-wider">
            <span className="bg-background px-3 text-muted-foreground">or</span>
          </div>
        </div>

        <div className="space-y-2">
          <input
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="Enter guest name (optional)"
            className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border focus:border-primary outline-none text-sm"
          />
          <button
            type="button"
            onClick={enterGuest}
            className="w-full py-2.5 rounded-lg border border-border bg-surface text-foreground font-medium text-sm hover:bg-surface-2 transition"
          >
            Continue as Guest
          </button>
          <p className="text-[10px] text-center text-muted-foreground/60">
            Guest mode is local-only. Data won&apos;t sync to the cloud.
          </p>
        </div>
      </form>
    </div>
  );
}

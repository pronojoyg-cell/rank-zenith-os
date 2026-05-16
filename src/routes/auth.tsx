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
        <p className="text-[10.5px] text-center text-muted-foreground">
          No password. No email. Your progress stays on this device.
        </p>
      </form>
    </div>
  );
}

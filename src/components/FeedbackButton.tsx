import { useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { Lightbulb, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

const CATEGORIES = [
  { id: "recommendation", label: "Recommendation" },
  { id: "bug", label: "Bug" },
  { id: "question", label: "Question" },
  { id: "other", label: "Other" },
] as const;

export function FeedbackButton({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["id"]>("recommendation");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const trimmed = message.trim();
    if (trimmed.length < 3) {
      toast.error("Please write a few more words");
      return;
    }
    if (trimmed.length > 4000) {
      toast.error("Message is too long");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("feedback").insert({
      user_id: user && user.id !== "guest" ? user.id : null,
      email: email.trim() || (user?.email && user.email.includes("@") ? user.email : null),
      category,
      message: trimmed,
      page: pathname,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Thanks! Your feedback was sent.");
    setMessage("");
    setEmail("");
    setCategory("recommendation");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className={
            compact
              ? "size-9 rounded-lg grid place-items-center text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/20 transition"
              : "hidden sm:inline-flex items-center gap-2 h-9 px-3 rounded-lg text-xs font-medium text-amber-200 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/20 transition"
          }
          aria-label="Send a recommendation"
          title="Send a recommendation"
        >
          <Lightbulb className="size-4" />
          {!compact && <span>Feedback</span>}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="size-4 text-amber-300" />
            Send a recommendation
          </DialogTitle>
          <DialogDescription>
            Tell us what to improve. We read every message.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={`px-2.5 py-1 rounded-full text-[11px] border transition ${
                  category === c.id
                    ? "bg-primary/15 border-primary/40 text-primary"
                    : "bg-surface border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What should we improve?"
            rows={5}
            maxLength={4000}
          />

          {(!user || user.id === "guest" || !user.email?.includes("@")) && (
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email (optional, so we can reply)"
              type="email"
              maxLength={320}
            />
          )}
        </div>

        <DialogFooter>
          <button
            onClick={submit}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 w-full sm:w-auto"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            {busy ? "Sending…" : "Send"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

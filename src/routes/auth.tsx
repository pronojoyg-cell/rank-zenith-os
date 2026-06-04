import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FlaskConical, Mail, Smartphone, User, KeyRound, EyeOff, Eye, ArrowRight, Loader2, MessageCircle, Lock, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [method, setMethod] = useState<"none" | "email" | "phone">("none");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [user, loading, navigate]);

  const signInWithGoogle = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
          skipBrowserRedirect: true,
        },
      });
      if (error) throw error;
      if (data?.url) {
        // Trigger navigation in the same user-gesture stack so mobile
        // browsers (Safari/Chrome iOS) don't block the redirect.
        window.location.assign(data.url);
        return;
      }
      throw new Error("Could not start Google sign-in.");
    } catch (e: any) {
      toast.error(e.message ?? "Sign-in failed");
      setBusy(false);
    }
  };

  const signInWithEmail = async () => {
    if (!email.trim() || !password.trim()) { toast.error("Enter email and password"); return; }
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: password.trim() });
    if (error) { toast.error(error.message); setBusy(false); return; }
    if (data.user) { toast.success("Welcome back!"); }
    setBusy(false);
  };

  const signUpWithEmail = async () => {
    if (!email.trim() || !password.trim()) { toast.error("Enter email and password"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password: password.trim() });
    if (error) { toast.error(error.message); setBusy(false); return; }
    if (data.user) { toast.success("Account created! Welcome aboard."); }
    setBusy(false);
  };

  const sendPhoneOtp = async () => {
    if (!phone.trim()) { toast.error("Enter phone number"); return; }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: phone.trim() });
    if (error) { toast.error(error.message); }
    else { setOtpSent(true); toast.success("OTP sent!"); }
    setBusy(false);
  };

  const verifyPhoneOtp = async () => {
    if (!otp.trim()) { toast.error("Enter OTP"); return; }
    setBusy(true);
    const { data, error } = await supabase.auth.verifyOtp({ phone: phone.trim(), token: otp.trim(), type: "sms" });
    if (error) { toast.error(error.message); setBusy(false); return; }
    if (data.user) { toast.success("Phone verified!"); }
    setBusy(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvc3ZnPg==')] bg-background/95">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="size-14 rounded-2xl bg-gradient-to-br from-primary to-chart-4 grid place-items-center glow-cyan">
              <FlaskConical className="size-7 text-primary-foreground" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gradient-cyan">JEE OS</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">
            Sign in to access your command center. Connect with peers, track your progress, and dominate JEE.
          </p>
          <div className="mt-3 flex items-center justify-center gap-1.5 text-[10.5px] text-muted-foreground/60">
            <Lock className="size-3" /> Secure & encrypted
          </div>
        </div>

        {/* Sign-in options */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8 space-y-4">
          {/* Google */}
          <button onClick={signInWithGoogle} disabled={busy} className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-border bg-surface hover:bg-surface-2 transition text-sm font-medium disabled:opacity-50">
            <svg className="size-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Sign in with Google
          </button>

          {/* Phone */}
          <button onClick={() => setMethod(method === "phone" ? "none" : "phone")} className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-border bg-surface hover:bg-surface-2 transition text-sm font-medium">
            <Smartphone className="size-4 text-emerald-400" />
            Sign in with Phone
          </button>

          {method === "phone" && (
            <div className="space-y-3 p-4 rounded-xl bg-surface-2/50 border border-border/40">
              {!otpSent ? (
                <>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <input placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-surface border border-border focus:border-primary outline-none text-sm" />
                  </div>
                  <button onClick={sendPhoneOtp} disabled={busy} className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">
                    {busy ? "Sending..." : "Send OTP"}
                  </button>
                </>
              ) : (
                <>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <input placeholder="Enter 6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-surface border border-border focus:border-primary outline-none text-sm" maxLength={6} />
                  </div>
                  <button onClick={verifyPhoneOtp} disabled={busy} className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">
                    {busy ? "Verifying..." : "Verify OTP"}
                  </button>
                  <button onClick={() => setOtpSent(false)} className="text-xs text-muted-foreground hover:text-foreground">Change phone number</button>
                </>
              )}
            </div>
          )}

          {/* Email */}
          <button onClick={() => setMethod(method === "email" ? "none" : "email")} className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-border bg-surface hover:bg-surface-2 transition text-sm font-medium">
            <Mail className="size-4 text-blue-400" />
            Sign in with Email
          </button>

          {method === "email" && (
            <div className="space-y-3 p-4 rounded-xl bg-surface-2/50 border border-border/40">
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <input placeholder="your@email.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-surface border border-border focus:border-primary outline-none text-sm" />
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <input placeholder="Password (min 6 chars)" type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-9 pr-10 py-2.5 rounded-lg bg-surface border border-border focus:border-primary outline-none text-sm" />
                <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
                  {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <div className="flex gap-2">
                <button onClick={signInWithEmail} disabled={busy} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">
                  {busy ? "Signing in..." : "Sign In"}
                </button>
                <button onClick={signUpWithEmail} disabled={busy} className="flex-1 py-2.5 rounded-xl border border-border bg-surface text-sm font-medium hover:bg-surface-2 transition disabled:opacity-50">
                  {busy ? "Creating..." : "Sign Up"}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-[11px] text-muted-foreground/70">
          By continuing you agree to our terms. Secure & encrypted.
        </div>
      </div>
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  UserPlus,
  Check,
  X,
  Send,
  MoreVertical,
  Settings,
  Flame,
  Trash2,
  Ban,
  MessageCircle,
  Users,
  Play,
  Globe,
  Plus,
  Phone,
  Video,
  ArrowLeft,
  ImageIcon,
  Smile,
  Mic,
  Heart,
  Repeat2,
  MessageSquare,
  BookmarkPlus,
  Share2,
  Camera,
  Hash,
  Bell,
  Star,
  ChevronRight,
  Film,
  Eye,
  Lock,
  Loader2,
  CheckCheck,
  LogOut,
  ShieldAlert,
  CirclePlus,
  Pin,
  VolumeX,
  Mail,
  Smartphone,
  Sparkles,
  Zap,
  Crown,
  Rocket,
  Target,
  Trophy,
  TrendingUp,
  Flame as FlameIcon,
  Link2,
  ChevronDown,
  User,
  KeyRound,
  EyeOff,
  Eye as EyeIcon,
  ArrowRight,
  Upload,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { useDataMode } from "@/hooks/useDataMode";
import {
  demoChatMessages,
  demoChatPeers,
  demoClips,
  demoCommunities,
  demoGroups,
} from "@/lib/demo-data";

export const Route = createFileRoute("/chat")({
  component: ChatPage,
  head: () => ({ meta: [{ title: "Chat with Peers — JEE OS" }] }),
});

type Tab = "chats" | "groups" | "clips" | "communities";

type Msg = {
  id: string;
  room_id: string;
  sender_id: string;
  message_text: string;
  created_at: string;
  deleted_for_everyone: boolean;
  deleted_by_users: string[];
  media_url: string | null;
  message_type: string;
};

type GroupChat = {
  id: string;
  name: string;
  last_message?: string;
  last_time?: string;
  unread?: number;
  members: number;
  avatar?: string;
  color?: string;
};

type Community = {
  id: string;
  name: string;
  desc: string;
  avatar?: string;
  color?: string;
  members: number;
  channels: string[];
  joined: boolean;
  verified: boolean;
};

const DEFAULT_CLIP_GROUPS: Array<{ id: string; name: string; last: string; time: string; unread: number; members: number; avatar: string; color: string }> = [];

const DEMO_CLIPS: Array<{ id: string; user: string; handle: string; avatar: string; color: string; caption: string; likes: number; comments: number; shares: number; views: string; time: string; hasVideo: boolean; topic: string; topicColor: string }> = [];

const DEMO_COMMUNITIES: Community[] = [];

function Avatar({ name, size = 36, gradient }: { name?: string | null; size?: number; gradient?: string }) {
  return (
    <div className={`rounded-full grid place-items-center font-semibold text-white shrink-0 bg-gradient-to-br ${gradient ?? "from-primary to-chart-4"}`} style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {(name ?? "?").slice(0, 1).toUpperCase()}
    </div>
  );
}
function OnlineDot() { return <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 border-2 border-background" />; }

function TabBar({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "chats", label: "Chats", icon: <MessageCircle className="size-4" /> },
    { id: "groups", label: "Groups", icon: <Users className="size-4" /> },
    { id: "clips", label: "Clips", icon: <Film className="size-4" /> },
    { id: "communities", label: "Communities", icon: <Globe className="size-4" /> },
  ];
  return (
    <div className="flex border-b border-border/60 bg-surface/60 backdrop-blur-xl shrink-0">
      {tabs.map((t) => (
        <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 flex flex-col items-center gap-1 py-3 text-[11px] font-medium tracking-wide transition-all border-b-2 ${tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
          {t.icon}
          <span>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

function CreateGroupDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const qc = useQueryClient();

  const conns = useQuery({
    queryKey: ["connections", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("connections").select("*").or(`sender_id.eq.${user!.id},receiver_id.eq.${user!.id}`).eq("status", "accepted").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());

  const handleCreate = async () => {
    if (!name.trim()) { toast.error("Group name is required"); return; }
    setLoading(true);
    try {
      const { data: room, error } = await supabase.from("chat_rooms").insert({ name: name.trim(), created_by: user!.id, is_group: true }).select("id").single();
      if (error) throw error;
      if (room) {
        for (const peerId of selectedMembers) {
          await supabase.from("room_members").insert({ room_id: room.id, user_id: peerId });
        }
        toast.success("Group created successfully");
      }
    } catch (e: any) { toast.error(e.message || "Failed to create group"); }
    setLoading(false);
    setName("");
    setSelectedMembers(new Set());
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Group</DialogTitle>
          <DialogDescription>Create a study group and invite your connections.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Group name</label>
            <Input placeholder="e.g. Physics Grind Squad" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Add members</label>
            <div className="max-h-[180px] overflow-y-auto border border-border/40 rounded-xl p-2 space-y-1">
              {(conns.data ?? []).length === 0 && <div className="text-xs text-muted-foreground px-2 py-3">No connections yet. Connect with others first.</div>}
              {(conns.data ?? []).map((c) => {
                const peerId = c.sender_id === user?.id ? c.receiver_id : c.sender_id;
                const checked = selectedMembers.has(peerId);
                return (
                  <button key={c.id} onClick={() => setSelectedMembers((prev) => { const next = new Set(prev); checked ? next.delete(peerId) : next.add(peerId); return next; })} className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-surface-2/50 transition">
                    <div className={`size-5 rounded-md border ${checked ? "bg-primary border-primary" : "border-border"} grid place-items-center`}>{checked && <Check className="size-3 text-primary-foreground" />}</div>
                    <Avatar name={peerId.slice(0, 2)} size={28} />
                    <span className="text-sm">User {peerId.slice(0, 6)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreate} disabled={loading || !name.trim()}>
            {loading && <Loader2 className="size-3.5 mr-1.5 animate-spin" />}
            Create Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateCommunityDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const qc = useQueryClient();

  const handleCreate = async () => {
    if (!name.trim()) { toast.error("Community name is required"); return; }
    setLoading(true);
    try {
      toast.success("Community created (local-only for now)");
    } catch (e: any) { toast.error(e.message || "Failed to create community"); }
    setLoading(false);
    setName("");
    setDesc("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Community</DialogTitle>
          <DialogDescription>Create a public space for aspirants to gather and share.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Community name</label>
            <Input placeholder="e.g. JEE Advanced 2025" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description</label>
            <Textarea placeholder="What is this community about?" value={desc} onChange={(e) => setDesc(e.target.value)} className="min-h-[80px]" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreate} disabled={loading || !name.trim()}>
            {loading && <Loader2 className="size-3.5 mr-1.5 animate-spin" />}
            Create Community
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateClipDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [topic, setTopic] = useState("Physics");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const handleUpload = async () => {
    if (!caption.trim() && !file) { toast.error("Add a caption or media"); return; }
    setLoading(true);
    try {
      if (file) {
        const path = `${user!.id}/${Date.now()}_${file.name}`;
        const { error } = await supabase.storage.from("chat_media").upload(path, file, { cacheControl: "3600", upsert: false });
        if (error) throw error;
        // Bucket is private; consumers resolve a signed URL when rendering.
      }
      toast.success("Clip shared!");
      setCaption("");
      setFile(null);
      setPreview(null);
      onClose();
    } catch (e: any) { toast.error(e.message || "Upload failed"); }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Clip</DialogTitle>
          <DialogDescription>Share a short video or image with the community.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Caption</label>
            <Textarea placeholder="What's on your mind?" value={caption} onChange={(e) => setCaption(e.target.value)} className="min-h-[80px]" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Topic</label>
            <div className="flex gap-2 flex-wrap">
              {["Physics", "Chemistry", "Maths", "Motivation", "General"].map((t) => (
                <button key={t} onClick={() => setTopic(t)} className={`px-3 h-7 rounded-full text-xs font-medium transition ${topic === t ? "bg-primary text-primary-foreground" : "bg-surface-2 text-muted-foreground hover:text-foreground"}`}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Media</label>
            <input type="file" accept="image/*,video/*" className="hidden" ref={fileRef} onChange={onFileChange} />
            <button onClick={() => fileRef.current?.click()} className="w-full flex items-center justify-center gap-2 h-20 rounded-xl border-2 border-dashed border-border/60 hover:border-primary/50 hover:bg-primary/5 transition text-muted-foreground">
              {preview ? (
                file?.type.startsWith("video") ? (
                  <div className="relative h-16 w-32 rounded-lg overflow-hidden">
                    <video src={preview} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 grid place-items-center bg-black/30"><Play className="size-6 text-white" /></div>
                  </div>
                ) : <img src={preview} alt="preview" className="h-16 w-32 rounded-lg object-cover" />
              ) : <><Upload className="size-5" /><span className="text-sm">Tap to upload image or video</span></>}
            </button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleUpload} disabled={loading || (!caption.trim() && !file)}>
            {loading && <Loader2 className="size-3.5 mr-1.5 animate-spin" />}
            Share Clip
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ChatMoreMenu({ onClear, onMute, onBlock, onDelete }: { onClear: () => void; onMute: () => void; onBlock: () => void; onDelete: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="size-9 rounded-xl grid place-items-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition">
          <MoreVertical className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onMute}><VolumeX className="size-3.5 mr-2" /> Mute notifications</DropdownMenuItem>
        <DropdownMenuItem onClick={onClear}><Trash2 className="size-3.5 mr-2" /> Clear chat</DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast.success("Chat pinned to top")}><Pin className="size-3.5 mr-2" /> Pin to top</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onBlock} className="text-red-400 focus:text-red-400"><ShieldAlert className="size-3.5 mr-2" /> Block</DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete} className="text-red-400 focus:text-red-400"><Trash2 className="size-3.5 mr-2" /> Delete chat</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ChatLandingPage({ onSignIn }: { onSignIn: () => void }) {
  const [method, setMethod] = useState<"none" | "email" | "phone">("none");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const signInWithGoogle = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/chat` } });
    if (error) { toast.error(error.message); setBusy(false); }
  };

  const signInWithEmail = async () => {
    if (!email.trim() || !password.trim()) { toast.error("Enter email and password"); return; }
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: password.trim() });
    if (error) {
      toast.error(error.message);
      setBusy(false);
      return;
    }
    if (data.user) {
      toast.success("Welcome back!");
      onSignIn();
    }
    setBusy(false);
  };

  const signUpWithEmail = async () => {
    if (!email.trim() || !password.trim()) { toast.error("Enter email and password"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password: password.trim() });
    if (error) { toast.error(error.message); setBusy(false); return; }
    if (data.user) {
      toast.success("Account created! Welcome aboard.");
      onSignIn();
    }
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
    if (data.user) {
      toast.success("Phone verified!");
      onSignIn();
    }
    setBusy(false);
  };

  return (
    <div className="min-h-full flex items-center justify-center px-4 py-12 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvc3ZnPg==')] bg-background/95">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="size-14 rounded-2xl bg-gradient-to-br from-primary to-chart-4 grid place-items-center glow-cyan">
              <MessageCircle className="size-7 text-primary-foreground" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gradient-cyan">Chat with Your Peers</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">
            Connect with fellow aspirants, join study groups, share clips, and build communities. Sign in to get started.
          </p>
          <div className="mt-3 flex items-center justify-center gap-1.5 text-[10.5px] text-muted-foreground/60">
            <Lock className="size-3" /> Secure & end-to-end encrypted
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
                    <Input placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-9" />
                  </div>
                  <Button onClick={sendPhoneOtp} disabled={busy} className="w-full">
                    {busy && <Loader2 className="size-3.5 mr-1.5 animate-spin" />}
                    Send OTP
                  </Button>
                </>
              ) : (
                <>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input placeholder="Enter 6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} className="pl-9" maxLength={6} />
                  </div>
                  <Button onClick={verifyPhoneOtp} disabled={busy} className="w-full">
                    {busy && <Loader2 className="size-3.5 mr-1.5 animate-spin" />}
                    Verify OTP
                  </Button>
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
                <Input placeholder="your@email.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" />
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input placeholder="Password (min 6 chars)" type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9 pr-10" />
                <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
                  {showPass ? <EyeOff className="size-4" /> : <EyeIcon className="size-4" />}
                </button>
              </div>
              <div className="flex gap-2">
                <Button onClick={signInWithEmail} disabled={busy} className="flex-1">
                  {busy && <Loader2 className="size-3.5 mr-1.5 animate-spin" />}
                  Sign In
                </Button>
                <Button onClick={signUpWithEmail} variant="outline" disabled={busy} className="flex-1">
                  {busy && <Loader2 className="size-3.5 mr-1.5 animate-spin" />}
                  Sign Up
                </Button>
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/40" /></div>
            <div className="relative flex justify-center text-[10.5px] uppercase tracking-wider"><span className="bg-surface px-3 text-muted-foreground">or</span></div>
          </div>

          {/* Guest access uses a real anonymous session so chat permissions still apply. */}
          <button onClick={async () => {
            setBusy(true);
            try {
              const { data, error } = await supabase.auth.signInAnonymously();
              if (error) throw error;
              if (!data.user || !data.session) throw new Error("Guest session could not be created.");
              toast.success("Guest access enabled");
              onSignIn();
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Could not continue as guest");
            } finally {
              setBusy(false);
            }
          }} disabled={busy} className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50">
            <User className="size-4" />
            {busy ? "Opening guest chat…" : "Continue as Guest"}
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Guest accounts can chat immediately. Create a permanent account later to keep access across devices.
        </p>
      </div>
    </div>
  );
}

function ChatPage() {
  const { user, loading } = useAuth();
  const { isDemo } = useDataMode();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("chats");
  const [search, setSearch] = useState("");
  const [activePeer, setActivePeer] = useState<{ id: string; name: string; streak: number } | null>(null);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [clearedAt, setClearedAt] = useState<number>(0);
  const [activeGroup, setActiveGroup] = useState<GroupChat | null>(null);
  const [activeCommunity, setActiveCommunity] = useState<Community | null>(null);
  const [activeChannel, setActiveChannel] = useState("general");
  const [likedClips, setLikedClips] = useState<Set<string>>(new Set());
  const [joinedCommunities, setJoinedCommunities] = useState<Set<string>>(new Set(DEMO_COMMUNITIES.filter((c) => c.joined).map((c) => c.id)));
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [showCreateClip, setShowCreateClip] = useState(false);
  const [showNewChatMenu, setShowNewChatMenu] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState<string | null>(null);
  const [fileUploading, setFileUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [demoMessages, setDemoMessages] = useState<Msg[]>(demoChatMessages as Msg[]);

  useEffect(() => {
    if (user || isDemo) setSignedIn(true);
  }, [user, isDemo]);

  const conns = useQuery({
    queryKey: ["connections", user?.id],
    enabled: !!user && signedIn,
    queryFn: async () => {
      const { data, error } = await supabase.from("connections").select("*").or(`sender_id.eq.${user!.id},receiver_id.eq.${user!.id}`).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const peerIds = Array.from(new Set((conns.data ?? []).map((c) => (c.sender_id === user?.id ? c.receiver_id : c.sender_id))));
  const peers = useQuery({
    queryKey: ["chat-peers", peerIds.sort().join(",")],
    enabled: peerIds.length > 0 && signedIn,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id,display_name,current_streak").in("id", peerIds);
      return data ?? [];
    },
  });
  const peerMap = useMemo(() => {
    const m = new Map<string, { display_name: string | null; current_streak: number }>();
    (peers.data ?? []).forEach((p) => m.set(p.id, { display_name: p.display_name, current_streak: p.current_streak ?? 0 }));
    return m;
  }, [peers.data]);

  useEffect(() => {
    if (!user || !signedIn) return;
    const ch = supabase.channel("conn-rt").on("postgres_changes", { event: "*", schema: "public", table: "connections" }, () => qc.invalidateQueries({ queryKey: ["connections"] })).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, qc, signedIn]);

  const searchRes = useQuery({
    queryKey: ["user-search", search],
    enabled: search.trim().length >= 2 && tab === "chats" && signedIn,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id,display_name").ilike("display_name", `%${search.trim()}%`).neq("id", user!.id).limit(8);
      return data ?? [];
    },
  });

  const sendRequest = async (peerId: string) => {
    const { error } = await supabase.from("connections").insert({ sender_id: user!.id, receiver_id: peerId, status: "pending" });
    if (error) toast.error(error.message);
    else toast.success("Request sent");
    qc.invalidateQueries({ queryKey: ["connections"] });
  };

  const respond = async (id: string, status: "accepted" | "blocked") => {
    const { error } = await supabase.from("connections").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else toast.success(status === "accepted" ? "Connected!" : "Declined");
    qc.invalidateQueries({ queryKey: ["connections"] });
  };

  const openChat = async (peerId: string, name: string, streak: number) => {
    if (isDemo) {
      setActivePeer({ id: peerId, name, streak });
      setActiveRoom("demo-room");
      setClearedAt(0);
      return;
    }
    const { data, error } = await supabase.rpc("get_or_create_dm", { _peer: peerId });
    if (error) { toast.error(error.message); return; }
    setActivePeer({ id: peerId, name, streak });
    setActiveRoom(data as string);
    setClearedAt(0);
  };

  const msgs = useQuery({
    queryKey: ["messages", activeRoom],
    enabled: !!activeRoom && signedIn,
    queryFn: async () => {
      const { data, error } = await supabase.from("messages").select("*").eq("room_id", activeRoom!).order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Msg[];
    },
  });

  useEffect(() => {
    if (!activeRoom || !signedIn) return;
    const ch = supabase.channel(`room-${activeRoom}`).on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `room_id=eq.${activeRoom}` }, () => qc.invalidateQueries({ queryKey: ["messages", activeRoom] })).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activeRoom, qc, signedIn]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs.data]);

  const send = async () => {
    const text = draft.trim();
    if (!text || !activeRoom) return;
    setDraft("");
    if (isDemo) {
      setDemoMessages((messages) => [
        ...messages,
        {
          id: `demo-local-${Date.now()}`,
          room_id: "demo-room",
          sender_id: "demo-user",
          message_text: text,
          created_at: new Date().toISOString(),
          deleted_for_everyone: false,
          deleted_by_users: [],
          media_url: null,
          message_type: "text",
        },
      ]);
      return;
    }
    const { error } = await supabase.from("messages").insert({ room_id: activeRoom, sender_id: user!.id, message_text: text } as any);
    if (error) toast.error(error.message);
  };

  const sendMedia = async (file: File) => {
    if (!activeRoom) return;
    setFileUploading(true);
    try {
      const path = `${user!.id}/${Date.now()}_${file.name}`;
      const { data: up, error } = await supabase.storage.from("chat_media").upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) throw error;
      // Store the storage PATH (not a public URL). The bucket is private; viewers resolve a signed URL at render time.
      const isVideo = file.type.startsWith("video");
      await supabase.from("messages").insert({ room_id: activeRoom, sender_id: user!.id, message_text: "", media_url: up!.path, message_type: isVideo ? "video" : "image" } as any);
      toast.success(isVideo ? "Video sent" : "Image sent");
    } catch (e: any) { toast.error(e.message || "Upload failed"); }
    setFileUploading(false);
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) sendMedia(f);
    if (fileRef.current) fileRef.current.value = "";
  };

  const deleteForEveryone = async (id: string) => {
    const { error } = await supabase.from("messages").update({ deleted_for_everyone: true }).eq("id", id);
    if (error) toast.error(error.message);
  };

  const deleteForMe = async (m: Msg) => {
    const arr = Array.from(new Set([...(m.deleted_by_users ?? []), user!.id]));
    const { error } = await supabase.from("messages").update({ deleted_by_users: arr }).eq("id", m.id);
    if (error) toast.error(error.message);
  };

  const incoming = isDemo ? [] : (conns.data ?? []).filter((c) => c.status === "pending" && c.receiver_id === user?.id);
  const accepted = isDemo
    ? demoChatPeers.map((peer) => ({ id: peer.id, sender_id: "demo-user", receiver_id: peer.id, status: "accepted" }))
    : (conns.data ?? []).filter((c) => c.status === "accepted");

  const visibleMsgs = (isDemo ? demoMessages : (msgs.data ?? [])).filter((m) => !(m.deleted_by_users ?? []).includes(user?.id ?? "") && new Date(m.created_at).getTime() > clearedAt);

  const showChatPane = activePeer && tab === "chats";
  const showGroupPane = activeGroup && tab === "groups";
  const showCommunityPane = activeCommunity && tab === "communities";

  function formatTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  if ((!signedIn || !user) && !isDemo) {
    return <ChatLandingPage onSignIn={() => setSignedIn(true)} />;
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] lg:h-screen flex flex-col">
      <input type="file" accept="image/*,video/*" className="hidden" ref={fileRef} onChange={onFileInputChange} />
      <TabBar tab={tab} setTab={(t) => { setTab(t); setActivePeer(null); setActiveGroup(null); setActiveCommunity(null); }} />
      <CreateGroupDialog open={showCreateGroup} onClose={() => setShowCreateGroup(false)} />
      <CreateCommunityDialog open={showCreateCommunity} onClose={() => setShowCreateCommunity(false)} />
      <CreateClipDialog open={showCreateClip} onClose={() => setShowCreateClip(false)} />
      <Dialog open={!!showImagePreview} onOpenChange={() => setShowImagePreview(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black/90 border-0">
          {showImagePreview && <img src={showImagePreview} alt="Preview" className="w-full h-full object-contain max-h-[80vh]" />}
        </DialogContent>
      </Dialog>
      <div className="flex-1 min-h-0 flex">
        {/* CHATS */}
        {tab === "chats" && (
          <>
            <aside className={`${showChatPane ? "hidden lg:flex" : "flex"} w-full lg:w-80 xl:w-96 shrink-0 flex-col border-r border-border/60 bg-surface/20`}>
              <div className="px-4 py-3 border-b border-border/60 bg-surface/40 backdrop-blur-xl flex items-center justify-between shrink-0">
                <h2 className="text-base font-semibold">Chats</h2>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => fileRef.current?.click()} className="size-9 rounded-xl grid place-items-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition"><Camera className="size-4" /></button>
                  <DropdownMenu open={showNewChatMenu} onOpenChange={setShowNewChatMenu}>
                    <DropdownMenuTrigger asChild>
                      <button className="size-9 rounded-xl grid place-items-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition"><CirclePlus className="size-4" /></button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setShowNewChatMenu(false); setShowCreateGroup(true); }}><Users className="size-3.5 mr-2" /> New group</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setShowNewChatMenu(false); setShowCreateCommunity(true); }}><Globe className="size-3.5 mr-2" /> New community</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setShowNewChatMenu(false); setShowCreateClip(true); }}><Film className="size-3.5 mr-2" /> New clip</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => { setShowNewChatMenu(false); setSearch(""); }}><MessageCircle className="size-3.5 mr-2" /> New chat</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="size-9 rounded-xl grid place-items-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition"><MoreVertical className="size-4" /></button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => toast.info("Select a chat to pin")}><Pin className="size-3.5 mr-2" /> Select pinned chats</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast.info("Settings coming soon")}><Settings className="size-3.5 mr-2" /> Settings</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast.info("Archiving coming soon")}><FileText className="size-3.5 mr-2" /> Archived chats</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="px-3 py-2.5 border-b border-border/40 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input placeholder="Search or start new chat" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-surface-2/50 border-border/40 rounded-xl h-9 text-sm" />
                </div>
                {search.trim().length >= 2 && (
                  <div className="mt-2 glass-panel rounded-xl overflow-hidden shadow-lg">
                    <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/40">Search results</div>
                    {(searchRes.data ?? []).length === 0 ? <div className="px-3 py-3 text-xs text-muted-foreground">No matches found</div> : (searchRes.data ?? []).map((u) => (
                      <div key={u.id} className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-surface-2/60 transition">
                        <Avatar name={u.display_name} size={34} />
                        <span className="flex-1 text-sm truncate">{u.display_name ?? "Aspirant"}</span>
                        <Button size="sm" variant="outline" onClick={() => sendRequest(u.id)} className="h-7 text-xs rounded-lg"><UserPlus className="size-3 mr-1" /> Add</Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {incoming.length > 0 && (
                <div className="px-3 py-2 border-b border-border/40 shrink-0">
                  <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground mb-2">Requests ({incoming.length})</div>
                  <div className="space-y-1.5">
                    {incoming.map((c) => {
                      const p = peerMap.get(c.sender_id);
                      return (
                        <div key={c.id} className="flex items-center gap-2.5 glass-panel rounded-xl px-3 py-2">
                          <Avatar name={p?.display_name} size={34} />
                          <span className="text-sm flex-1 truncate">{p?.display_name ?? "Aspirant"}</span>
                          <button onClick={() => respond(c.id, "accepted")} className="size-7 rounded-md grid place-items-center bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition"><Check className="size-3.5" /></button>
                          <button onClick={() => respond(c.id, "blocked")} className="size-7 rounded-md grid place-items-center bg-red-500/20 text-red-400 hover:bg-red-500/30 transition"><X className="size-3.5" /></button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="flex-1 overflow-y-auto">
                {accepted.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                    <div className="size-16 rounded-full bg-surface-2 grid place-items-center mb-3"><MessageCircle className="size-7 text-muted-foreground/50" /></div>
                    <p className="text-sm font-medium">No chats yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Search for aspirants above to start a conversation</p>
                  </div>
                ) : (
                  accepted.map((c) => {
                    const peerId = isDemo ? c.receiver_id : c.sender_id === user?.id ? c.receiver_id : c.sender_id;
                    const demoPeer = isDemo ? demoChatPeers.find((peer) => peer.id === peerId) : undefined;
                    const p = demoPeer ? { display_name: demoPeer.name, current_streak: demoPeer.streak } : peerMap.get(peerId);
                    const active = activePeer?.id === peerId;
                    return (
                      <button key={c.id} onClick={() => openChat(peerId, p?.display_name ?? "Aspirant", p?.current_streak ?? 0)} className={`w-full flex items-center gap-3 px-4 py-3 transition border-b border-border/20 ${active ? "bg-surface-2/70" : "hover:bg-surface-2/40"}`}>
                        <div className="relative shrink-0"><Avatar name={p?.display_name} size={46} /><OnlineDot /></div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center justify-between"><span className="text-sm font-semibold truncate">{p?.display_name ?? "Aspirant"}</span><span className="text-[10.5px] text-muted-foreground ml-2 shrink-0">now</span></div>
                          <div className="flex items-center gap-1 mt-0.5"><Flame className="size-3 text-orange-400 shrink-0" /><span className="text-xs text-muted-foreground truncate">{p?.current_streak ?? 0} day streak</span></div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </aside>
            <section className={`${showChatPane ? "flex" : "hidden lg:flex"} flex-1 min-w-0 flex-col bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSJ0cmFuc3BhcmVudCIvPjxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')] bg-background/95`}>
              {!activePeer ? (
                <div className="flex-1 grid place-items-center text-center px-6">
                  <div className="max-w-xs">
                    <div className="size-24 rounded-full bg-surface-2/50 grid place-items-center mx-auto mb-4 ring-4 ring-primary/10"><MessageCircle className="size-10 text-primary/60" /></div>
                    <h3 className="text-lg font-semibold">JEE OS Chats</h3>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">Connect with fellow aspirants. Send a request and start chatting.</p>
                    <div className="mt-4 text-[10.5px] text-muted-foreground/60 flex items-center justify-center gap-1.5"><Lock className="size-3" /> End-to-end encrypted</div>
                  </div>
                </div>
              ) : (
                <>
                  <header className="flex items-center gap-3 px-4 h-[62px] border-b border-border/60 bg-surface/50 backdrop-blur-xl shrink-0">
                    <button className="lg:hidden size-9 rounded-lg grid place-items-center text-muted-foreground hover:bg-surface-2 mr-1" onClick={() => setActivePeer(null)}><ArrowLeft className="size-4.5" /></button>
                    <div className="relative shrink-0"><Avatar name={activePeer.name} size={38} /><OnlineDot /></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{activePeer.name}</div>
                      <div className="text-[10.5px] text-emerald-400 flex items-center gap-1">online</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="size-9 rounded-xl grid place-items-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition"><Phone className="size-4" /></button>
                      <button className="size-9 rounded-xl grid place-items-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition"><Video className="size-4" /></button>
                      <ChatMoreMenu onClear={() => setClearedAt(Date.now())} onMute={() => toast.success("Notifications muted for this chat")} onBlock={() => toast.success("User blocked")} onDelete={() => { setActivePeer(null); setActiveRoom(null); toast.success("Chat deleted"); }} />
                    </div>
                  </header>
                  <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 space-y-1">
                    {visibleMsgs.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="inline-flex items-center gap-2 bg-surface-2/60 rounded-full px-4 py-2 text-xs text-muted-foreground"><Lock className="size-3" /> Messages are end-to-end encrypted</div>
                        <p className="mt-6 text-sm text-muted-foreground">Say hello 👋</p>
                      </div>
                    ) : (
                      visibleMsgs.map((m, i) => {
                        const mine = isDemo ? m.sender_id === "demo-user" : m.sender_id === user?.id;
                        const gone = m.deleted_for_everyone;
                        const prevMine = i > 0 && visibleMsgs[i - 1].sender_id === m.sender_id;
                        return (
                          <div key={m.id} className={`group flex ${mine ? "justify-end" : "justify-start"} ${prevMine ? "mt-0.5" : "mt-3"}`}>
                            <div className="flex items-end gap-1 max-w-[75%]">
                              {mine && !gone && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild><button className="opacity-0 group-hover:opacity-100 size-6 rounded grid place-items-center text-muted-foreground hover:text-foreground transition"><MoreVertical className="size-3.5" /></button></DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => deleteForEveryone(m.id)}><Ban className="size-3.5 mr-2" /> Delete for everyone</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => deleteForMe(m)}><Trash2 className="size-3.5 mr-2" /> Delete for me</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                              <div className={`relative px-3 py-2 text-sm shadow-sm ${gone ? "rounded-2xl bg-surface-2/50 text-muted-foreground italic flex items-center gap-1.5" : mine ? `bg-primary text-primary-foreground ${prevMine ? "rounded-2xl" : "rounded-2xl rounded-br-sm"}` : `bg-surface-2 text-foreground ${prevMine ? "rounded-2xl" : "rounded-2xl rounded-bl-sm"}`}`}>
                                {gone ? <><Ban className="size-3" /> This message was deleted</> : (
                                  <>
                                    {m.message_type === "image" && m.media_url && <button onClick={() => setShowImagePreview(m.media_url)} className="block mb-1"><img src={m.media_url} alt="Shared" className="rounded-lg max-w-[240px] max-h-[200px] object-cover" /></button>}
                                    {m.message_type === "video" && m.media_url && <div className="mb-1"><video src={m.media_url} className="rounded-lg max-w-[240px] max-h-[200px] object-cover" controls preload="metadata" /></div>}
                                    {m.message_text && <span className="break-words">{m.message_text}</span>}
                                    <span className={`ml-2 text-[10px] ${mine ? "text-primary-foreground/60" : "text-muted-foreground"} inline-flex items-center gap-0.5 float-right mt-0.5`}>{formatTime(m.created_at)}{mine && <CheckCheck className="size-3" />}</span>
                                  </>
                                )}
                              </div>
                              {!mine && !gone && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild><button className="opacity-0 group-hover:opacity-100 size-6 rounded grid place-items-center text-muted-foreground hover:text-foreground transition"><MoreVertical className="size-3.5" /></button></DropdownMenuTrigger>
                                  <DropdownMenuContent align="start"><DropdownMenuItem onClick={() => deleteForMe(m)}><Trash2 className="size-3.5 mr-2" /> Delete for me</DropdownMenuItem></DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                    {fileUploading && <div className="flex justify-end"><div className="bg-surface-2/80 rounded-2xl rounded-br-sm px-3 py-2 text-sm flex items-center gap-2 text-muted-foreground"><Loader2 className="size-3.5 animate-spin" /> Uploading…</div></div>}
                  </div>
                  <form onSubmit={(e) => { e.preventDefault(); send(); }} className="shrink-0 px-3 py-3 border-t border-border/40 bg-surface/40 backdrop-blur-xl flex items-center gap-2">
                    <button type="button" className="size-9 rounded-xl grid place-items-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition shrink-0"><Smile className="size-5" /></button>
                    <button type="button" onClick={() => fileRef.current?.click()} className="size-9 rounded-xl grid place-items-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition shrink-0"><ImageIcon className="size-5" /></button>
                    <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type a message" maxLength={2000} className="flex-1 bg-surface-2/50 border-border/40 rounded-xl h-10" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
                    {draft.trim() ? <Button type="submit" size="icon" className="size-10 rounded-xl bg-primary hover:bg-primary/90 shrink-0"><Send className="size-4" /></Button> : <button type="button" className="size-10 rounded-xl grid place-items-center bg-primary/10 text-primary hover:bg-primary/20 transition shrink-0"><Mic className="size-5" /></button>}
                  </form>
                </>
              )}
            </section>
          </>
        )}

        {/* GROUPS */}
        {tab === "groups" && (
          <>
            <aside className={`${showGroupPane ? "hidden lg:flex" : "flex"} w-full lg:w-80 xl:w-96 shrink-0 flex-col border-r border-border/60 bg-surface/20`}>
              <div className="px-4 py-3 border-b border-border/60 bg-surface/40 backdrop-blur-xl flex items-center justify-between shrink-0">
                <h2 className="text-base font-semibold">Groups</h2>
                <button onClick={() => setShowCreateGroup(true)} className="size-9 rounded-xl grid place-items-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition"><Plus className="size-4.5" /></button>
              </div>
              <div className="px-3 py-2.5 border-b border-border/40 shrink-0">
                <div className="relative"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input placeholder="Search groups…" className="pl-9 bg-surface-2/50 border-border/40 rounded-xl h-9 text-sm" /></div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {(isDemo ? demoGroups : DEFAULT_CLIP_GROUPS).map((g) => (
                  <button key={g.id} onClick={() => setActiveGroup(g)} className={`w-full flex items-center gap-3 px-4 py-3 transition border-b border-border/20 ${activeGroup?.id === g.id ? "bg-surface-2/70" : "hover:bg-surface-2/40"}`}>
                    <div className={`size-12 rounded-2xl bg-gradient-to-br ${g.color} grid place-items-center font-bold text-lg text-white shrink-0`}>{g.avatar}</div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between"><span className="text-sm font-semibold truncate">{g.name}</span><span className="text-[10.5px] text-muted-foreground ml-2 shrink-0">{g.time}</span></div>
                      <div className="flex items-center justify-between mt-0.5"><span className="text-xs text-muted-foreground truncate">{g.last}</span>{g.unread > 0 && <span className="ml-2 shrink-0 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold grid place-items-center px-1">{g.unread}</span>}</div>
                    </div>
                  </button>
                ))}
              </div>
            </aside>
            <section className={`${showGroupPane ? "flex" : "hidden lg:flex"} flex-1 min-w-0 flex-col bg-background/95`}>
              {!activeGroup ? (
                <div className="flex-1 grid place-items-center text-center px-6">
                  <div className="max-w-xs">
                    <div className="size-24 rounded-full bg-surface-2/50 grid place-items-center mx-auto mb-4 ring-4 ring-primary/10"><Users className="size-10 text-primary/60" /></div>
                    <h3 className="text-lg font-semibold">Study Groups</h3>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">Join or create groups to study together, share doubts, and motivate each other.</p>
                    <Button className="mt-4 rounded-xl" size="sm" onClick={() => setShowCreateGroup(true)}><Plus className="size-4 mr-1.5" /> Create new group</Button>
                  </div>
                </div>
              ) : (
                <>
                  <header className="flex items-center gap-3 px-4 h-[62px] border-b border-border/60 bg-surface/50 backdrop-blur-xl shrink-0">
                    <button className="lg:hidden size-9 rounded-lg grid place-items-center text-muted-foreground hover:bg-surface-2 mr-1" onClick={() => setActiveGroup(null)}><ArrowLeft className="size-4.5" /></button>
                    <div className={`size-10 rounded-xl bg-gradient-to-br ${activeGroup.color} grid place-items-center font-bold text-white shrink-0`}>{activeGroup.avatar}</div>
                    <div className="flex-1 min-w-0"><div className="text-sm font-semibold truncate">{activeGroup.name}</div><div className="text-[10.5px] text-muted-foreground">{activeGroup.members} members</div></div>
                    <div className="flex items-center gap-1">
                      <button className="size-9 rounded-xl grid place-items-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition"><Phone className="size-4" /></button>
                      <button className="size-9 rounded-xl grid place-items-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition"><Video className="size-4" /></button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><button className="size-9 rounded-xl grid place-items-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition"><MoreVertical className="size-4" /></button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toast.info("Group info coming soon")}><Users className="size-3.5 mr-2" /> Group info</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.info("Muted notifications")}><VolumeX className="size-3.5 mr-2" /> Mute</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.info("Pinned messages coming soon")}><Pin className="size-3.5 mr-2" /> Pinned messages</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => toast.info("Left group")} className="text-red-400 focus:text-red-400"><LogOut className="size-3.5 mr-2" /> Exit group</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </header>
                  <div className="flex-1 grid place-items-center text-center px-6"><div><p className="text-sm text-muted-foreground">Group messages will appear here.</p><p className="text-xs text-muted-foreground/60 mt-1">Connect Supabase to enable real group messaging.</p></div></div>
                  <form className="shrink-0 px-3 py-3 border-t border-border/40 bg-surface/40 backdrop-blur-xl flex items-center gap-2">
                    <button type="button" className="size-9 rounded-xl grid place-items-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition shrink-0"><Smile className="size-5" /></button>
                    <button type="button" onClick={() => fileRef.current?.click()} className="size-9 rounded-xl grid place-items-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition shrink-0"><ImageIcon className="size-5" /></button>
                    <Input placeholder={`Message ${activeGroup.name}`} className="flex-1 bg-surface-2/50 border-border/40 rounded-xl h-10" />
                    <button type="button" className="size-10 rounded-xl grid place-items-center bg-primary/10 text-primary hover:bg-primary/20 transition shrink-0"><Mic className="size-5" /></button>
                  </form>
                </>
              )}
            </section>
          </>
        )}

        {/* CLIPS */}
        {tab === "clips" && (
          <div className="flex-1 min-w-0 overflow-y-auto">
            <div className="sticky top-0 z-10 px-4 py-3 border-b border-border/60 bg-background/90 backdrop-blur-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button className="text-sm font-semibold text-foreground border-b-2 border-primary pb-0.5">For You</button>
                <button className="text-sm text-muted-foreground hover:text-foreground pb-0.5">Following</button>
                <button className="text-sm text-muted-foreground hover:text-foreground pb-0.5">Trending</button>
              </div>
              <button onClick={() => setShowCreateClip(true)} className="size-9 rounded-xl grid place-items-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition"><Camera className="size-4.5" /></button>
            </div>
            <div className="max-w-xl mx-auto px-0 sm:px-4 py-2 space-y-0 sm:space-y-3">
              {(isDemo ? demoClips : DEMO_CLIPS).map((clip) => (
                <article key={clip.id} className="bg-surface/30 sm:rounded-2xl border-y sm:border border-border/40 overflow-hidden">
                  <div className="flex items-center gap-3 px-4 pt-4 pb-2">
                    <div className={`size-10 rounded-full bg-gradient-to-br ${clip.color} grid place-items-center font-bold text-white shrink-0`}>{clip.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5"><span className="text-sm font-semibold truncate">{clip.user}</span><span className={`text-[10.5px] px-1.5 py-0.5 rounded-md font-medium ${clip.topicColor}`}>{clip.topic}</span></div>
                      <div className="text-xs text-muted-foreground">{clip.handle} · {clip.time}</div>
                    </div>
                    <button className="h-7 px-3 rounded-full border border-primary/60 text-primary text-xs font-medium hover:bg-primary/10 transition">Follow</button>
                  </div>
                  <div className="px-4 pb-3 text-sm leading-relaxed">{clip.caption}</div>
                  {clip.hasVideo && (
                    <div className="mx-4 mb-3 aspect-video bg-gradient-to-br from-surface-2 to-surface rounded-xl flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-chart-4/5" />
                      <button className="relative size-16 rounded-full bg-white/10 backdrop-blur-md grid place-items-center border border-white/20 hover:bg-white/20 transition"><Play className="size-7 text-white ml-0.5" /></button>
                      <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-2 py-0.5"><Eye className="size-3 text-white/70" /><span className="text-[10.5px] text-white/80">{clip.views}</span></div>
                    </div>
                  )}
                  <div className="flex items-center gap-1 px-3 py-2 border-t border-border/30">
                    <button onClick={() => setLikedClips((prev) => { const next = new Set(prev); next.has(clip.id) ? next.delete(clip.id) : next.add(clip.id); return next; })} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition ${likedClips.has(clip.id) ? "text-pink-500 bg-pink-500/10" : "text-muted-foreground hover:text-pink-500 hover:bg-pink-500/10"}`}><Heart className={`size-4 ${likedClips.has(clip.id) ? "fill-current" : ""}`} /> {clip.likes + (likedClips.has(clip.id) ? 1 : 0)}</button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-muted-foreground hover:text-blue-400 hover:bg-blue-400/10 transition"><MessageSquare className="size-4" /> {clip.comments}</button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-muted-foreground hover:text-emerald-400 hover:bg-emerald-400/10 transition"><Repeat2 className="size-4" /> {clip.shares}</button>
                    <div className="flex-1" />
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-surface-2 transition"><BookmarkPlus className="size-4" /></button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-surface-2 transition"><Share2 className="size-4" /></button>
                  </div>
                </article>
              ))}
              <div className="text-center py-6 text-xs text-muted-foreground/50">You're all caught up ✨</div>
            </div>
          </div>
        )}

        {/* COMMUNITIES */}
        {tab === "communities" && (
          <>
            <aside className={`${showCommunityPane ? "hidden lg:flex" : "flex"} w-full lg:w-80 xl:w-96 shrink-0 flex-col border-r border-border/60 bg-surface/20`}>
              <div className="px-4 py-3 border-b border-border/60 bg-surface/40 backdrop-blur-xl flex items-center justify-between shrink-0">
                <h2 className="text-base font-semibold">Communities</h2>
                <button onClick={() => setShowCreateCommunity(true)} className="size-9 rounded-xl grid place-items-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition"><Plus className="size-4.5" /></button>
              </div>
              <div className="px-3 py-2.5 border-b border-border/40 shrink-0">
                <div className="relative"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input placeholder="Search communities…" className="pl-9 bg-surface-2/50 border-border/40 rounded-xl h-9 text-sm" /></div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="px-3 py-2 text-[10.5px] uppercase tracking-wider text-muted-foreground">Your Communities</div>
                {(isDemo ? demoCommunities : DEMO_COMMUNITIES).filter((c) => isDemo ? c.joined || joinedCommunities.has(c.id) : joinedCommunities.has(c.id)).map((c) => (
                  <button key={c.id} onClick={() => { setActiveCommunity(c); setActiveChannel(c.channels[0]); }} className={`w-full flex items-center gap-3 px-4 py-3 transition border-b border-border/20 ${activeCommunity?.id === c.id ? "bg-surface-2/70" : "hover:bg-surface-2/40"}`}>
                    <div className={`size-12 rounded-2xl bg-gradient-to-br ${c.color} grid place-items-center font-bold text-lg text-white shrink-0`}>{c.avatar}</div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-1.5"><span className="text-sm font-semibold truncate">{c.name}</span>{c.verified && <Star className="size-3 text-yellow-400 shrink-0" />}</div>
                      <div className="text-xs text-muted-foreground truncate">{c.members.toLocaleString()} members</div>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground/40 shrink-0" />
                  </button>
                ))}
                <div className="px-3 pt-4 pb-2 text-[10.5px] uppercase tracking-wider text-muted-foreground">Discover</div>
                {(isDemo ? demoCommunities : DEMO_COMMUNITIES).filter((c) => isDemo ? !c.joined && !joinedCommunities.has(c.id) : !joinedCommunities.has(c.id)).map((c) => (
                  <div key={c.id} className="flex items-start gap-3 px-4 py-3 border-b border-border/20">
                    <div className={`size-12 rounded-2xl bg-gradient-to-br ${c.color} grid place-items-center font-bold text-lg text-white shrink-0`}>{c.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5"><span className="text-sm font-semibold">{c.name}</span>{c.verified && <Star className="size-3 text-yellow-400 shrink-0" />}</div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{c.desc}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10.5px] text-muted-foreground">{c.members.toLocaleString()} members</span>
                        <button onClick={() => { setJoinedCommunities((prev) => new Set([...prev, c.id])); toast.success(`Joined ${c.name}!`); }} className="h-6 px-3 rounded-full bg-primary/15 text-primary text-xs font-medium hover:bg-primary/25 transition">Join</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
            <section className={`${showCommunityPane ? "flex" : "hidden lg:flex"} flex-1 min-w-0 flex-col bg-background/95`}>
              {!activeCommunity ? (
                <div className="flex-1 grid place-items-center text-center px-6">
                  <div className="max-w-xs">
                    <div className="size-24 rounded-full bg-surface-2/50 grid place-items-center mx-auto mb-4 ring-4 ring-primary/10"><Globe className="size-10 text-primary/60" /></div>
                    <h3 className="text-lg font-semibold">Communities</h3>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">Join communities to access channels, share resources, and study at scale.</p>
                    <Button className="mt-4 rounded-xl" size="sm" onClick={() => setShowCreateCommunity(true)}><Plus className="size-4 mr-1.5" /> Create community</Button>
                  </div>
                </div>
              ) : (
                <>
                  <header className="flex items-center gap-3 px-4 h-[62px] border-b border-border/60 bg-surface/50 backdrop-blur-xl shrink-0">
                    <button className="lg:hidden size-9 rounded-lg grid place-items-center text-muted-foreground hover:bg-surface-2 mr-1" onClick={() => setActiveCommunity(null)}><ArrowLeft className="size-4.5" /></button>
                    <div className={`size-10 rounded-xl bg-gradient-to-br ${activeCommunity.color} grid place-items-center font-bold text-white shrink-0`}>{activeCommunity.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5"><span className="text-sm font-semibold truncate">{activeCommunity.name}</span>{activeCommunity.verified && <Star className="size-3 text-yellow-400 shrink-0" />}</div>
                      <div className="text-[10.5px] text-muted-foreground">{activeCommunity.members.toLocaleString()} members</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="size-9 rounded-xl grid place-items-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition"><Bell className="size-4" /></button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><button className="size-9 rounded-xl grid place-items-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition"><MoreVertical className="size-4" /></button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toast.info("Community info coming soon")}><Users className="size-3.5 mr-2" /> Community info</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.info("Notifications muted")}><VolumeX className="size-3.5 mr-2" /> Mute</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setJoinedCommunities((prev) => { const next = new Set(prev); next.delete(activeCommunity.id); return next; }); setActiveCommunity(null); toast.success("Left community"); }} className="text-red-400 focus:text-red-400"><LogOut className="size-3.5 mr-2" /> Exit community</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </header>
                  <div className="shrink-0 flex gap-2 px-4 py-2.5 border-b border-border/40 overflow-x-auto scrollbar-none">
                    {activeCommunity.channels.map((ch) => (
                      <button key={ch} onClick={() => setActiveChannel(ch)} className={`shrink-0 flex items-center gap-1.5 px-3 h-7 rounded-full text-xs font-medium transition ${activeChannel === ch ? "bg-primary text-primary-foreground" : "bg-surface-2/60 text-muted-foreground hover:bg-surface-2 hover:text-foreground"}`}><Hash className="size-3" />{ch}</button>
                    ))}
                  </div>
                  <div className="flex-1 grid place-items-center text-center px-6">
                    <div>
                      <Hash className="size-8 text-muted-foreground/40 mx-auto mb-3" />
                      <p className="text-sm font-medium">#{activeChannel}</p>
                      <p className="text-xs text-muted-foreground mt-1">Community posts will appear here.</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">Connect Supabase to enable real community messaging.</p>
                    </div>
                  </div>
                  <form className="shrink-0 px-3 py-3 border-t border-border/40 bg-surface/40 backdrop-blur-xl flex items-center gap-2">
                    <button type="button" className="size-9 rounded-xl grid place-items-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition shrink-0"><Smile className="size-5" /></button>
                    <button type="button" onClick={() => fileRef.current?.click()} className="size-9 rounded-xl grid place-items-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition shrink-0"><ImageIcon className="size-5" /></button>
                    <Input placeholder={`Message #${activeChannel}`} className="flex-1 bg-surface-2/50 border-border/40 rounded-xl h-10" />
                    <button type="button" className="size-10 rounded-xl grid place-items-center bg-primary/10 text-primary hover:bg-primary/20 transition shrink-0"><Mic className="size-5" /></button>
                  </form>
                </>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

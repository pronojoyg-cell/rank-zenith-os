import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
  ThumbsUp,
  Eye,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/chat")({
  component: ChatPage,
  head: () => ({ meta: [{ title: "OS Chat — JEE OS" }] }),
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
};

const DEMO_GROUPS = [
  {
    id: "g1",
    name: "JEE 2025 – Physics Grind",
    last: "Rohan: Anyone solved SHM problem 47?",
    time: "2m",
    unread: 5,
    members: 48,
    avatar: "P",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "g2",
    name: "Organic Chem Warriors",
    last: "You: Check this mechanism 🧪",
    time: "18m",
    unread: 0,
    members: 31,
    avatar: "C",
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "g3",
    name: "Maths Integration Club",
    last: "Priya: By-parts trick for ln(x)",
    time: "1h",
    unread: 12,
    members: 62,
    avatar: "M",
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "g4",
    name: "AIR < 100 Aspirants",
    last: "Vikram: 14hrs today 🔥",
    time: "3h",
    unread: 0,
    members: 19,
    avatar: "A",
    color: "from-orange-500 to-red-500",
  },
];

const DEMO_CLIPS = [
  {
    id: "c1",
    user: "Aryan Sharma",
    handle: "@aryanjee25",
    avatar: "A",
    color: "from-blue-500 to-cyan-500",
    caption: "Solved this optics problem in 90 seconds using the mirror formula trick 🪞✨ #JEE2025 #Physics",
    likes: 847,
    comments: 63,
    shares: 124,
    views: "12.4K",
    time: "3m ago",
    hasVideo: true,
    topic: "Physics",
    topicColor: "text-blue-400 bg-blue-400/10",
  },
  {
    id: "c2",
    user: "Meera Patel",
    handle: "@meerachemsit",
    avatar: "M",
    color: "from-green-500 to-teal-500",
    caption: "The BEST way to memorize hybridization states — my colour-coded notes system 📝🎨 Drop a ❤️ if this helped!",
    likes: 2341,
    comments: 189,
    shares: 412,
    views: "38.7K",
    time: "47m ago",
    hasVideo: true,
    topic: "Chemistry",
    topicColor: "text-green-400 bg-green-400/10",
  },
  {
    id: "c3",
    user: "Rohan Gupta",
    handle: "@rohangupta_iit",
    avatar: "R",
    color: "from-purple-500 to-pink-500",
    caption: "Day 312 of JEE prep. Mock score today: 287/300. The grind never stops 💪 #JEE2025 #Maths",
    likes: 5812,
    comments: 321,
    shares: 891,
    views: "94.2K",
    time: "2h ago",
    hasVideo: false,
    topic: "Maths",
    topicColor: "text-purple-400 bg-purple-400/10",
  },
  {
    id: "c4",
    user: "Siya Verma",
    handle: "@siyaverma_jee",
    avatar: "S",
    color: "from-orange-500 to-yellow-500",
    caption: "Rotational mechanics made easy — this single diagram covers 80% of JEE questions on the topic. Save this! 🔄",
    likes: 3129,
    comments: 244,
    shares: 678,
    views: "51.1K",
    time: "4h ago",
    hasVideo: true,
    topic: "Physics",
    topicColor: "text-blue-400 bg-blue-400/10",
  },
];

const DEMO_COMMUNITIES = [
  {
    id: "com1",
    name: "JEE Advanced 2025",
    desc: "Official study community for JEE Advanced aspirants. Share notes, strategies & doubts.",
    members: "24.8K",
    avatar: "J",
    color: "from-primary to-chart-4",
    channels: ["#announcements", "#physics", "#chemistry", "#maths", "#doubts", "#motivation"],
    joined: true,
    verified: true,
  },
  {
    id: "com2",
    name: "IIT Delhi – Admits 2025",
    desc: "For students who got into IIT Delhi or are aiming for it. Connect before joining.",
    members: "8.2K",
    avatar: "D",
    color: "from-blue-500 to-indigo-500",
    channels: ["#general", "#hostel-life", "#branch-advice", "#memes"],
    joined: true,
    verified: true,
  },
  {
    id: "com3",
    name: "Fiitjee Students Hub",
    desc: "All Fiitjee students — share notes, test papers, and batch experiences here.",
    members: "41.3K",
    avatar: "F",
    color: "from-green-500 to-emerald-500",
    channels: ["#general", "#test-papers", "#teacher-notes", "#results"],
    joined: false,
    verified: false,
  },
  {
    id: "com4",
    name: "Night Owls Study Club",
    desc: "For those who study past midnight. 11PM–4AM study sessions with daily check-ins.",
    members: "6.7K",
    avatar: "N",
    color: "from-indigo-500 to-purple-500",
    channels: ["#check-in", "#focus-room", "#break-chat", "#streaks"],
    joined: false,
    verified: false,
  },
];

function Avatar({
  name,
  size = 36,
  gradient,
}: {
  name?: string | null;
  size?: number;
  gradient?: string;
}) {
  return (
    <div
      className={`rounded-full grid place-items-center font-semibold text-white shrink-0 bg-gradient-to-br ${gradient ?? "from-primary to-chart-4"}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {(name ?? "?").slice(0, 1).toUpperCase()}
    </div>
  );
}

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
        <button
          key={t.id}
          onClick={() => setTab(t.id)}
          className={`flex-1 flex flex-col items-center gap-1 py-3 text-[11px] font-medium tracking-wide transition-all border-b-2 ${
            tab === t.id
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {t.icon}
          <span>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

function OnlineDot() {
  return <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 border-2 border-background" />;
}

function ChatPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("chats");
  const [search, setSearch] = useState("");
  const [activePeer, setActivePeer] = useState<{
    id: string;
    name: string;
    streak: number;
  } | null>(null);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [clearedAt, setClearedAt] = useState<number>(0);
  const [activeGroup, setActiveGroup] = useState<(typeof DEMO_GROUPS)[0] | null>(null);
  const [activeCommunity, setActiveCommunity] = useState<(typeof DEMO_COMMUNITIES)[0] | null>(null);
  const [activeChannel, setActiveChannel] = useState("#general");
  const [likedClips, setLikedClips] = useState<Set<string>>(new Set());
  const [joinedCommunities, setJoinedCommunities] = useState<Set<string>>(
    new Set(DEMO_COMMUNITIES.filter((c) => c.joined).map((c) => c.id)),
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  const conns = useQuery({
    queryKey: ["connections", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("connections")
        .select("*")
        .or(`sender_id.eq.${user!.id},receiver_id.eq.${user!.id}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const peerIds = Array.from(
    new Set(
      (conns.data ?? []).map((c) => (c.sender_id === user?.id ? c.receiver_id : c.sender_id)),
    ),
  );
  const peers = useQuery({
    queryKey: ["chat-peers", peerIds.sort().join(",")],
    enabled: peerIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id,display_name,current_streak")
        .in("id", peerIds);
      return data ?? [];
    },
  });
  const peerMap = useMemo(() => {
    const m = new Map<string, { display_name: string | null; current_streak: number }>();
    (peers.data ?? []).forEach((p) =>
      m.set(p.id, { display_name: p.display_name, current_streak: p.current_streak ?? 0 }),
    );
    return m;
  }, [peers.data]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("conn-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "connections" }, () => {
        qc.invalidateQueries({ queryKey: ["connections"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, qc]);

  const searchRes = useQuery({
    queryKey: ["user-search", search],
    enabled: search.trim().length >= 2 && tab === "chats",
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id,display_name")
        .ilike("display_name", `%${search.trim()}%`)
        .neq("id", user!.id)
        .limit(8);
      return data ?? [];
    },
  });

  const sendRequest = async (peerId: string) => {
    const { error } = await supabase
      .from("connections")
      .insert({ sender_id: user!.id, receiver_id: peerId, status: "pending" });
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
    const { data, error } = await supabase.rpc("get_or_create_dm", { _peer: peerId });
    if (error) { toast.error(error.message); return; }
    setActivePeer({ id: peerId, name, streak });
    setActiveRoom(data as string);
    setClearedAt(0);
  };

  const msgs = useQuery({
    queryKey: ["messages", activeRoom],
    enabled: !!activeRoom,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("room_id", activeRoom!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Msg[];
    },
  });

  useEffect(() => {
    if (!activeRoom) return;
    const ch = supabase
      .channel(`room-${activeRoom}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `room_id=eq.${activeRoom}` },
        () => qc.invalidateQueries({ queryKey: ["messages", activeRoom] }),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activeRoom, qc]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs.data]);

  const send = async () => {
    const text = draft.trim();
    if (!text || !activeRoom) return;
    setDraft("");
    const { error } = await supabase.from("messages").insert({
      room_id: activeRoom,
      sender_id: user!.id,
      message_text: text,
    });
    if (error) toast.error(error.message);
  };

  const deleteForEveryone = async (id: string) => {
    const { error } = await supabase
      .from("messages")
      .update({ deleted_for_everyone: true })
      .eq("id", id);
    if (error) toast.error(error.message);
  };

  const deleteForMe = async (m: Msg) => {
    const arr = Array.from(new Set([...(m.deleted_by_users ?? []), user!.id]));
    const { error } = await supabase
      .from("messages")
      .update({ deleted_by_users: arr })
      .eq("id", m.id);
    if (error) toast.error(error.message);
  };

  const incoming = (conns.data ?? []).filter(
    (c) => c.status === "pending" && c.receiver_id === user?.id,
  );
  const accepted = (conns.data ?? []).filter((c) => c.status === "accepted");

  const visibleMsgs = (msgs.data ?? []).filter(
    (m) =>
      !(m.deleted_by_users ?? []).includes(user?.id ?? "") &&
      new Date(m.created_at).getTime() > clearedAt,
  );

  const showChatPane = activePeer && tab === "chats";
  const showGroupPane = activeGroup && tab === "groups";
  const showCommunityPane = activeCommunity && tab === "communities";

  function formatTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] lg:h-screen flex flex-col">
      <TabBar tab={tab} setTab={(t) => { setTab(t); setActivePeer(null); setActiveGroup(null); setActiveCommunity(null); }} />

      <div className="flex-1 min-h-0 flex">
        {/* ─── CHATS TAB ─── */}
        {tab === "chats" && (
          <>
            {/* Sidebar */}
            <aside
              className={`${showChatPane ? "hidden lg:flex" : "flex"} w-full lg:w-80 xl:w-96 shrink-0 flex-col border-r border-border/60 bg-surface/20`}
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-border/60 bg-surface/40 backdrop-blur-xl flex items-center justify-between shrink-0">
                <h2 className="text-base font-semibold">Chats</h2>
                <div className="flex items-center gap-1.5">
                  <button className="size-9 rounded-xl grid place-items-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition">
                    <Camera className="size-4" />
                  </button>
                  <button className="size-9 rounded-xl grid place-items-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition">
                    <Plus className="size-4" />
                  </button>
                  <button className="size-9 rounded-xl grid place-items-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition">
                    <MoreVertical className="size-4" />
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="px-3 py-2.5 border-b border-border/40 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search or start new chat"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 bg-surface-2/50 border-border/40 rounded-xl h-9 text-sm"
                  />
                </div>
                {search.trim().length >= 2 && (
                  <div className="mt-2 glass-panel rounded-xl overflow-hidden shadow-lg">
                    <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/40">
                      Search results
                    </div>
                    {(searchRes.data ?? []).length === 0 ? (
                      <div className="px-3 py-3 text-xs text-muted-foreground">No matches found</div>
                    ) : (
                      (searchRes.data ?? []).map((u) => (
                        <div
                          key={u.id}
                          className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-surface-2/60 transition"
                        >
                          <Avatar name={u.display_name} size={34} />
                          <span className="flex-1 text-sm truncate">{u.display_name ?? "Aspirant"}</span>
                          <Button size="sm" variant="outline" onClick={() => sendRequest(u.id)} className="h-7 text-xs rounded-lg">
                            <UserPlus className="size-3 mr-1" /> Add
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Requests */}
              {incoming.length > 0 && (
                <div className="px-3 py-2 border-b border-border/40 shrink-0">
                  <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground mb-2">
                    Requests ({incoming.length})
                  </div>
                  <div className="space-y-1.5">
                    {incoming.map((c) => {
                      const p = peerMap.get(c.sender_id);
                      return (
                        <div
                          key={c.id}
                          className="flex items-center gap-2.5 glass-panel rounded-xl px-3 py-2"
                        >
                          <Avatar name={p?.display_name} size={34} />
                          <span className="text-sm flex-1 truncate">{p?.display_name ?? "Aspirant"}</span>
                          <button
                            onClick={() => respond(c.id, "accepted")}
                            className="size-7 rounded-lg grid place-items-center bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition"
                          >
                            <Check className="size-3.5" />
                          </button>
                          <button
                            onClick={() => respond(c.id, "blocked")}
                            className="size-7 rounded-lg grid place-items-center bg-red-500/20 text-red-400 hover:bg-red-500/30 transition"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Chat List */}
              <div className="flex-1 overflow-y-auto">
                {accepted.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                    <div className="size-16 rounded-full bg-surface-2 grid place-items-center mb-3">
                      <MessageCircle className="size-7 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm font-medium">No chats yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Search for aspirants above to start a conversation
                    </p>
                  </div>
                ) : (
                  accepted.map((c) => {
                    const peerId = c.sender_id === user?.id ? c.receiver_id : c.sender_id;
                    const p = peerMap.get(peerId);
                    const active = activePeer?.id === peerId;
                    return (
                      <button
                        key={c.id}
                        onClick={() =>
                          openChat(peerId, p?.display_name ?? "Aspirant", p?.current_streak ?? 0)
                        }
                        className={`w-full flex items-center gap-3 px-4 py-3 transition border-b border-border/20 ${
                          active ? "bg-surface-2/70" : "hover:bg-surface-2/40"
                        }`}
                      >
                        <div className="relative shrink-0">
                          <Avatar name={p?.display_name} size={46} />
                          <OnlineDot />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold truncate">{p?.display_name ?? "Aspirant"}</span>
                            <span className="text-[10.5px] text-muted-foreground ml-2 shrink-0">now</span>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Flame className="size-3 text-orange-400 shrink-0" />
                            <span className="text-xs text-muted-foreground truncate">
                              {p?.current_streak ?? 0} day streak
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </aside>

            {/* Chat Pane */}
            <section
              className={`${showChatPane ? "flex" : "hidden lg:flex"} flex-1 min-w-0 flex-col bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSJ0cmFuc3BhcmVudCIvPjxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')] bg-background/95`}
            >
              {!activePeer ? (
                <div className="flex-1 grid place-items-center text-center px-6">
                  <div className="max-w-xs">
                    <div className="size-24 rounded-full bg-surface-2/50 grid place-items-center mx-auto mb-4 ring-4 ring-primary/10">
                      <MessageCircle className="size-10 text-primary/60" />
                    </div>
                    <h3 className="text-lg font-semibold">JEE OS Chats</h3>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                      Connect with fellow aspirants. Send a request and start chatting.
                    </p>
                    <div className="mt-4 text-[10.5px] text-muted-foreground/60 flex items-center justify-center gap-1.5">
                      <Lock className="size-3" /> End-to-end encrypted
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Chat header */}
                  <header className="flex items-center gap-3 px-4 h-[62px] border-b border-border/60 bg-surface/50 backdrop-blur-xl shrink-0">
                    <button
                      className="lg:hidden size-9 rounded-lg grid place-items-center text-muted-foreground hover:bg-surface-2 mr-1"
                      onClick={() => setActivePeer(null)}
                    >
                      <ArrowLeft className="size-4.5" />
                    </button>
                    <div className="relative shrink-0">
                      <Avatar name={activePeer.name} size={38} />
                      <OnlineDot />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{activePeer.name}</div>
                      <div className="text-[10.5px] text-emerald-400 flex items-center gap-1">
                        online
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="size-9 rounded-xl grid place-items-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition">
                        <Phone className="size-4" />
                      </button>
                      <button className="size-9 rounded-xl grid place-items-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition">
                        <Video className="size-4" />
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="size-9 rounded-xl grid place-items-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition">
                            <MoreVertical className="size-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setClearedAt(Date.now())}>
                            <Trash2 className="size-3.5 mr-2" /> Clear chat
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </header>

                  {/* Messages */}
                  <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 space-y-1"
                  >
                    {visibleMsgs.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="inline-flex items-center gap-2 bg-surface-2/60 rounded-full px-4 py-2 text-xs text-muted-foreground">
                          <Lock className="size-3" /> Messages are end-to-end encrypted
                        </div>
                        <p className="mt-6 text-sm text-muted-foreground">Say hello 👋</p>
                      </div>
                    ) : (
                      visibleMsgs.map((m, i) => {
                        const mine = m.sender_id === user?.id;
                        const gone = m.deleted_for_everyone;
                        const prevMine =
                          i > 0 && visibleMsgs[i - 1].sender_id === m.sender_id;
                        return (
                          <div
                            key={m.id}
                            className={`group flex ${mine ? "justify-end" : "justify-start"} ${prevMine ? "mt-0.5" : "mt-3"}`}
                          >
                            <div className="flex items-end gap-1 max-w-[75%]">
                              {mine && !gone && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="opacity-0 group-hover:opacity-100 size-6 rounded grid place-items-center text-muted-foreground hover:text-foreground transition">
                                      <MoreVertical className="size-3.5" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => deleteForEveryone(m.id)}>
                                      <Ban className="size-3.5 mr-2" /> Delete for everyone
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => deleteForMe(m)}>
                                      <Trash2 className="size-3.5 mr-2" /> Delete for me
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                              <div
                                className={`relative px-3 py-2 text-sm break-words shadow-sm ${
                                  gone
                                    ? "rounded-2xl bg-surface-2/50 text-muted-foreground italic flex items-center gap-1.5"
                                    : mine
                                      ? `bg-primary text-primary-foreground ${prevMine ? "rounded-2xl" : "rounded-2xl rounded-br-sm"}`
                                      : `bg-surface-2 text-foreground ${prevMine ? "rounded-2xl" : "rounded-2xl rounded-bl-sm"}`
                                }`}
                              >
                                {gone ? (
                                  <><Ban className="size-3" /> This message was deleted</>
                                ) : (
                                  <>
                                    {m.message_text}
                                    <span className={`ml-2 text-[10px] ${mine ? "text-primary-foreground/60" : "text-muted-foreground"} inline-flex items-center gap-0.5 float-right mt-0.5`}>
                                      {formatTime(m.created_at)}
                                      {mine && <Check className="size-3" />}
                                    </span>
                                  </>
                                )}
                              </div>
                              {!mine && !gone && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="opacity-0 group-hover:opacity-100 size-6 rounded grid place-items-center text-muted-foreground hover:text-foreground transition">
                                      <MoreVertical className="size-3.5" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start">
                                    <DropdownMenuItem onClick={() => deleteForMe(m)}>
                                      <Trash2 className="size-3.5 mr-2" /> Delete for me
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Input bar */}
                  <form
                    onSubmit={(e) => { e.preventDefault(); send(); }}
                    className="shrink-0 px-3 py-3 border-t border-border/40 bg-surface/40 backdrop-blur-xl flex items-center gap-2"
                  >
                    <button type="button" className="size-9 rounded-xl grid place-items-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition shrink-0">
                      <Smile className="size-5" />
                    </button>
                    <button type="button" className="size-9 rounded-xl grid place-items-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition shrink-0">
                      <ImageIcon className="size-5" />
                    </button>
                    <Input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Type a message"
                      maxLength={2000}
                      className="flex-1 bg-surface-2/50 border-border/40 rounded-xl h-10"
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                    />
                    {draft.trim() ? (
                      <Button type="submit" size="icon" className="size-10 rounded-xl bg-primary hover:bg-primary/90 shrink-0">
                        <Send className="size-4" />
                      </Button>
                    ) : (
                      <button type="button" className="size-10 rounded-xl grid place-items-center bg-primary/10 text-primary hover:bg-primary/20 transition shrink-0">
                        <Mic className="size-5" />
                      </button>
                    )}
                  </form>
                </>
              )}
            </section>
          </>
        )}

        {/* ─── GROUPS TAB ─── */}
        {tab === "groups" && (
          <>
            <aside
              className={`${showGroupPane ? "hidden lg:flex" : "flex"} w-full lg:w-80 xl:w-96 shrink-0 flex-col border-r border-border/60 bg-surface/20`}
            >
              <div className="px-4 py-3 border-b border-border/60 bg-surface/40 backdrop-blur-xl flex items-center justify-between shrink-0">
                <h2 className="text-base font-semibold">Groups</h2>
                <button className="size-9 rounded-xl grid place-items-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition">
                  <Plus className="size-4.5" />
                </button>
              </div>
              <div className="px-3 py-2.5 border-b border-border/40 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search groups…"
                    className="pl-9 bg-surface-2/50 border-border/40 rounded-xl h-9 text-sm"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {DEMO_GROUPS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setActiveGroup(g)}
                    className={`w-full flex items-center gap-3 px-4 py-3 transition border-b border-border/20 ${
                      activeGroup?.id === g.id ? "bg-surface-2/70" : "hover:bg-surface-2/40"
                    }`}
                  >
                    <div className={`size-12 rounded-2xl bg-gradient-to-br ${g.color} grid place-items-center font-bold text-lg text-white shrink-0`}>
                      {g.avatar}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold truncate">{g.name}</span>
                        <span className="text-[10.5px] text-muted-foreground ml-2 shrink-0">{g.time}</span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-xs text-muted-foreground truncate">{g.last}</span>
                        {g.unread > 0 && (
                          <span className="ml-2 shrink-0 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold grid place-items-center px-1">
                            {g.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </aside>

            <section
              className={`${showGroupPane ? "flex" : "hidden lg:flex"} flex-1 min-w-0 flex-col bg-background/95`}
            >
              {!activeGroup ? (
                <div className="flex-1 grid place-items-center text-center px-6">
                  <div className="max-w-xs">
                    <div className="size-24 rounded-full bg-surface-2/50 grid place-items-center mx-auto mb-4 ring-4 ring-primary/10">
                      <Users className="size-10 text-primary/60" />
                    </div>
                    <h3 className="text-lg font-semibold">Study Groups</h3>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                      Join or create groups to study together, share doubts, and motivate each other.
                    </p>
                    <Button className="mt-4 rounded-xl" size="sm">
                      <Plus className="size-4 mr-1.5" /> Create new group
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <header className="flex items-center gap-3 px-4 h-[62px] border-b border-border/60 bg-surface/50 backdrop-blur-xl shrink-0">
                    <button
                      className="lg:hidden size-9 rounded-lg grid place-items-center text-muted-foreground hover:bg-surface-2 mr-1"
                      onClick={() => setActiveGroup(null)}
                    >
                      <ArrowLeft className="size-4.5" />
                    </button>
                    <div className={`size-10 rounded-xl bg-gradient-to-br ${activeGroup.color} grid place-items-center font-bold text-white shrink-0`}>
                      {activeGroup.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{activeGroup.name}</div>
                      <div className="text-[10.5px] text-muted-foreground">
                        {activeGroup.members} members
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="size-9 rounded-xl grid place-items-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition">
                        <Phone className="size-4" />
                      </button>
                      <button className="size-9 rounded-xl grid place-items-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition">
                        <Video className="size-4" />
                      </button>
                      <button className="size-9 rounded-xl grid place-items-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition">
                        <MoreVertical className="size-4" />
                      </button>
                    </div>
                  </header>
                  <div className="flex-1 grid place-items-center text-center px-6">
                    <div>
                      <p className="text-sm text-muted-foreground">Group messages will appear here.</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">Connect Supabase to enable real group messaging.</p>
                    </div>
                  </div>
                  <form className="shrink-0 px-3 py-3 border-t border-border/40 bg-surface/40 backdrop-blur-xl flex items-center gap-2">
                    <button type="button" className="size-9 rounded-xl grid place-items-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition shrink-0">
                      <Smile className="size-5" />
                    </button>
                    <Input
                      placeholder={`Message ${activeGroup.name}`}
                      className="flex-1 bg-surface-2/50 border-border/40 rounded-xl h-10"
                    />
                    <button type="button" className="size-10 rounded-xl grid place-items-center bg-primary/10 text-primary hover:bg-primary/20 transition shrink-0">
                      <Mic className="size-5" />
                    </button>
                  </form>
                </>
              )}
            </section>
          </>
        )}

        {/* ─── CLIPS TAB ─── */}
        {tab === "clips" && (
          <div className="flex-1 min-w-0 overflow-y-auto">
            {/* Top bar */}
            <div className="sticky top-0 z-10 px-4 py-3 border-b border-border/60 bg-background/90 backdrop-blur-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button className="text-sm font-semibold text-foreground border-b-2 border-primary pb-0.5">
                  For You
                </button>
                <button className="text-sm text-muted-foreground hover:text-foreground pb-0.5">
                  Following
                </button>
                <button className="text-sm text-muted-foreground hover:text-foreground pb-0.5">
                  Trending
                </button>
              </div>
              <button className="size-9 rounded-xl grid place-items-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition">
                <Camera className="size-4.5" />
              </button>
            </div>

            {/* Feed */}
            <div className="max-w-xl mx-auto px-0 sm:px-4 py-2 space-y-0 sm:space-y-3">
              {DEMO_CLIPS.map((clip) => (
                <article
                  key={clip.id}
                  className="bg-surface/30 sm:rounded-2xl border-y sm:border border-border/40 overflow-hidden"
                >
                  {/* Author row */}
                  <div className="flex items-center gap-3 px-4 pt-4 pb-2">
                    <div className={`size-10 rounded-full bg-gradient-to-br ${clip.color} grid place-items-center font-bold text-white shrink-0`}>
                      {clip.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold truncate">{clip.user}</span>
                        <span className={`text-[10.5px] px-1.5 py-0.5 rounded-md font-medium ${clip.topicColor}`}>
                          {clip.topic}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {clip.handle} · {clip.time}
                      </div>
                    </div>
                    <button className="h-7 px-3 rounded-full border border-primary/60 text-primary text-xs font-medium hover:bg-primary/10 transition">
                      Follow
                    </button>
                  </div>

                  {/* Caption */}
                  <div className="px-4 pb-3 text-sm leading-relaxed">{clip.caption}</div>

                  {/* Video placeholder */}
                  {clip.hasVideo && (
                    <div className="mx-4 mb-3 aspect-video bg-gradient-to-br from-surface-2 to-surface rounded-xl flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-chart-4/5" />
                      <button className="relative size-16 rounded-full bg-white/10 backdrop-blur-md grid place-items-center border border-white/20 hover:bg-white/20 transition">
                        <Play className="size-7 text-white ml-0.5" />
                      </button>
                      <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-2 py-0.5">
                        <Eye className="size-3 text-white/70" />
                        <span className="text-[10.5px] text-white/80">{clip.views}</span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1 px-3 py-2 border-t border-border/30">
                    <button
                      onClick={() =>
                        setLikedClips((prev) => {
                          const next = new Set(prev);
                          next.has(clip.id) ? next.delete(clip.id) : next.add(clip.id);
                          return next;
                        })
                      }
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition ${
                        likedClips.has(clip.id)
                          ? "text-pink-500 bg-pink-500/10"
                          : "text-muted-foreground hover:text-pink-500 hover:bg-pink-500/10"
                      }`}
                    >
                      <Heart className={`size-4 ${likedClips.has(clip.id) ? "fill-current" : ""}`} />
                      {clip.likes + (likedClips.has(clip.id) ? 1 : 0)}
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-muted-foreground hover:text-blue-400 hover:bg-blue-400/10 transition">
                      <MessageSquare className="size-4" /> {clip.comments}
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-muted-foreground hover:text-emerald-400 hover:bg-emerald-400/10 transition">
                      <Repeat2 className="size-4" /> {clip.shares}
                    </button>
                    <div className="flex-1" />
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-surface-2 transition">
                      <BookmarkPlus className="size-4" />
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-surface-2 transition">
                      <Share2 className="size-4" />
                    </button>
                  </div>
                </article>
              ))}

              <div className="text-center py-6 text-xs text-muted-foreground/50">
                You're all caught up ✨
              </div>
            </div>
          </div>
        )}

        {/* ─── COMMUNITIES TAB ─── */}
        {tab === "communities" && (
          <>
            <aside
              className={`${showCommunityPane ? "hidden lg:flex" : "flex"} w-full lg:w-80 xl:w-96 shrink-0 flex-col border-r border-border/60 bg-surface/20`}
            >
              <div className="px-4 py-3 border-b border-border/60 bg-surface/40 backdrop-blur-xl flex items-center justify-between shrink-0">
                <h2 className="text-base font-semibold">Communities</h2>
                <button className="size-9 rounded-xl grid place-items-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition">
                  <Plus className="size-4.5" />
                </button>
              </div>
              <div className="px-3 py-2.5 border-b border-border/40 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search communities…"
                    className="pl-9 bg-surface-2/50 border-border/40 rounded-xl h-9 text-sm"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="px-3 py-2 text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  Your Communities
                </div>
                {DEMO_COMMUNITIES.filter((c) => joinedCommunities.has(c.id)).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => { setActiveCommunity(c); setActiveChannel(c.channels[0]); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 transition border-b border-border/20 ${
                      activeCommunity?.id === c.id ? "bg-surface-2/70" : "hover:bg-surface-2/40"
                    }`}
                  >
                    <div className={`size-12 rounded-2xl bg-gradient-to-br ${c.color} grid place-items-center font-bold text-lg text-white shrink-0`}>
                      {c.avatar}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold truncate">{c.name}</span>
                        {c.verified && <Star className="size-3 text-yellow-400 shrink-0" />}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {c.members} members
                      </div>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground/40 shrink-0" />
                  </button>
                ))}
                <div className="px-3 pt-4 pb-2 text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  Discover
                </div>
                {DEMO_COMMUNITIES.filter((c) => !joinedCommunities.has(c.id)).map((c) => (
                  <div
                    key={c.id}
                    className="flex items-start gap-3 px-4 py-3 border-b border-border/20"
                  >
                    <div className={`size-12 rounded-2xl bg-gradient-to-br ${c.color} grid place-items-center font-bold text-lg text-white shrink-0`}>
                      {c.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold">{c.name}</span>
                        {c.verified && <Star className="size-3 text-yellow-400 shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{c.desc}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10.5px] text-muted-foreground">{c.members} members</span>
                        <button
                          onClick={() => {
                            setJoinedCommunities((prev) => new Set([...prev, c.id]));
                            toast.success(`Joined ${c.name}!`);
                          }}
                          className="h-6 px-3 rounded-full bg-primary/15 text-primary text-xs font-medium hover:bg-primary/25 transition"
                        >
                          Join
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </aside>

            <section
              className={`${showCommunityPane ? "flex" : "hidden lg:flex"} flex-1 min-w-0 flex-col bg-background/95`}
            >
              {!activeCommunity ? (
                <div className="flex-1 grid place-items-center text-center px-6">
                  <div className="max-w-xs">
                    <div className="size-24 rounded-full bg-surface-2/50 grid place-items-center mx-auto mb-4 ring-4 ring-primary/10">
                      <Globe className="size-10 text-primary/60" />
                    </div>
                    <h3 className="text-lg font-semibold">Communities</h3>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                      Join communities to access channels, share resources, and study at scale.
                    </p>
                    <Button className="mt-4 rounded-xl" size="sm">
                      <Plus className="size-4 mr-1.5" /> Create community
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <header className="flex items-center gap-3 px-4 h-[62px] border-b border-border/60 bg-surface/50 backdrop-blur-xl shrink-0">
                    <button
                      className="lg:hidden size-9 rounded-lg grid place-items-center text-muted-foreground hover:bg-surface-2 mr-1"
                      onClick={() => setActiveCommunity(null)}
                    >
                      <ArrowLeft className="size-4.5" />
                    </button>
                    <div className={`size-10 rounded-xl bg-gradient-to-br ${activeCommunity.color} grid place-items-center font-bold text-white shrink-0`}>
                      {activeCommunity.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold truncate">{activeCommunity.name}</span>
                        {activeCommunity.verified && <Star className="size-3 text-yellow-400 shrink-0" />}
                      </div>
                      <div className="text-[10.5px] text-muted-foreground">
                        {activeCommunity.members} members
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="size-9 rounded-xl grid place-items-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition">
                        <Bell className="size-4" />
                      </button>
                      <button className="size-9 rounded-xl grid place-items-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition">
                        <MoreVertical className="size-4" />
                      </button>
                    </div>
                  </header>

                  {/* Channels */}
                  <div className="shrink-0 flex gap-2 px-4 py-2.5 border-b border-border/40 overflow-x-auto scrollbar-none">
                    {activeCommunity.channels.map((ch) => (
                      <button
                        key={ch}
                        onClick={() => setActiveChannel(ch)}
                        className={`shrink-0 flex items-center gap-1.5 px-3 h-7 rounded-full text-xs font-medium transition ${
                          activeChannel === ch
                            ? "bg-primary text-primary-foreground"
                            : "bg-surface-2/60 text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                        }`}
                      >
                        <Hash className="size-3" />
                        {ch.replace("#", "")}
                      </button>
                    ))}
                  </div>

                  <div className="flex-1 grid place-items-center text-center px-6">
                    <div>
                      <Hash className="size-8 text-muted-foreground/40 mx-auto mb-3" />
                      <p className="text-sm font-medium">{activeChannel}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Community posts will appear here.
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        Connect Supabase to enable real community messaging.
                      </p>
                    </div>
                  </div>

                  <form className="shrink-0 px-3 py-3 border-t border-border/40 bg-surface/40 backdrop-blur-xl flex items-center gap-2">
                    <button type="button" className="size-9 rounded-xl grid place-items-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition shrink-0">
                      <Smile className="size-5" />
                    </button>
                    <Input
                      placeholder={`Message ${activeChannel}`}
                      className="flex-1 bg-surface-2/50 border-border/40 rounded-xl h-10"
                    />
                    <button type="button" className="size-10 rounded-xl grid place-items-center bg-primary/10 text-primary hover:bg-primary/20 transition shrink-0">
                      <Mic className="size-5" />
                    </button>
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

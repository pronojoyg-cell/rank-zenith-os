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
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/chat")({
  component: ChatPage,
  head: () => ({ meta: [{ title: "OS Chat — JEE OS" }] }),
});

type Msg = {
  id: string;
  room_id: string;
  sender_id: string;
  message_text: string;
  created_at: string;
  deleted_for_everyone: boolean;
  deleted_by_users: string[];
};

function Avatar({ name, size = 36 }: { name?: string | null; size?: number }) {
  return (
    <div
      className="rounded-full grid place-items-center font-semibold text-primary-foreground bg-gradient-to-br from-primary to-chart-4 shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {(name ?? "?").slice(0, 1).toUpperCase()}
    </div>
  );
}

function ChatPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [activePeer, setActivePeer] = useState<{ id: string; name: string; streak: number } | null>(
    null,
  );
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [clearedAt, setClearedAt] = useState<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Connections
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

  // Peer profiles for connections
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

  // Realtime: refresh connections
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("conn-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "connections" }, () => {
        qc.invalidateQueries({ queryKey: ["connections"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, qc]);

  // Search users
  const searchRes = useQuery({
    queryKey: ["user-search", search],
    enabled: search.trim().length >= 2,
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
    if (error) {
      toast.error(error.message);
      return;
    }
    setActivePeer({ id: peerId, name, streak });
    setActiveRoom(data as string);
    setClearedAt(0);
  };

  // Messages
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

  // Realtime messages
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
    return () => {
      supabase.removeChannel(ch);
    };
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

  return (
    <div className="h-[calc(100vh-3.5rem)] lg:h-screen flex flex-col lg:flex-row">
      {/* LEFT: connections */}
      <aside className="w-full lg:w-80 shrink-0 border-b lg:border-b-0 lg:border-r border-border/60 bg-surface/30 backdrop-blur-xl flex flex-col max-h-[45vh] lg:max-h-none">
        <div className="px-4 py-3 border-b border-border/60">
          <div className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground flex items-center gap-1.5">
            <MessageCircle className="size-3.5" /> OS Chat
          </div>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">Connections</h2>
        </div>

        <div className="p-3 space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search aspirants…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          {search.trim().length >= 2 && (
            <div className="glass-panel rounded-lg overflow-hidden">
              {(searchRes.data ?? []).length === 0 ? (
                <div className="px-3 py-2 text-xs text-muted-foreground">No matches</div>
              ) : (
                (searchRes.data ?? []).map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-2/40"
                  >
                    <Avatar name={u.display_name} size={28} />
                    <span className="flex-1 truncate">{u.display_name ?? "Anon"}</span>
                    <Button size="sm" variant="outline" onClick={() => sendRequest(u.id)}>
                      <UserPlus className="size-3.5" /> Connect
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {incoming.length > 0 && (
          <div className="px-3 pb-2">
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-1.5">
              Requests
            </div>
            <div className="space-y-1.5">
              {incoming.map((c) => {
                const p = peerMap.get(c.sender_id);
                return (
                  <div
                    key={c.id}
                    className="flex items-center gap-2 glass-panel rounded-lg px-2 py-1.5"
                  >
                    <Avatar name={p?.display_name} size={28} />
                    <span className="text-xs flex-1 truncate">{p?.display_name ?? "Aspirant"}</span>
                    <button
                      onClick={() => respond(c.id, "accepted")}
                      className="size-7 rounded-md grid place-items-center bg-primary/20 text-primary hover:bg-primary/30"
                    >
                      <Check className="size-3.5" />
                    </button>
                    <button
                      onClick={() => respond(c.id, "blocked")}
                      className="size-7 rounded-md grid place-items-center bg-destructive/20 text-destructive hover:bg-destructive/30"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-2 pb-3">
          <div className="px-1 py-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Friends
          </div>
          {accepted.length === 0 ? (
            <div className="text-xs text-muted-foreground px-2 py-3">
              No connections yet. Search above to send a request.
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
                  className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition ${
                    active ? "bg-surface-2" : "hover:bg-surface-2/50"
                  }`}
                >
                  <Avatar name={p?.display_name} size={34} />
                  <div className="flex-1 min-w-0 text-left">
                    <div className="font-medium truncate">{p?.display_name ?? "Aspirant"}</div>
                    <div className="text-[10.5px] text-muted-foreground flex items-center gap-1">
                      <Flame className="size-3 text-orange-400" /> {p?.current_streak ?? 0} streak
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* RIGHT: chat pane */}
      <section className="flex-1 min-w-0 flex flex-col bg-background/40">
        {!activePeer ? (
          <div className="flex-1 grid place-items-center text-center px-6">
            <div>
              <MessageCircle className="size-10 mx-auto text-muted-foreground/50" />
              <h3 className="mt-3 text-lg font-semibold">Pick a connection</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Accepted connections only. Text and emoji — attachments are disabled to keep things lean.
              </p>
            </div>
          </div>
        ) : (
          <>
            <header className="flex items-center gap-3 px-4 sm:px-6 h-14 border-b border-border/60 bg-surface/40 backdrop-blur-xl">
              <Avatar name={activePeer.name} size={36} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{activePeer.name}</div>
                <div className="text-[10.5px] text-muted-foreground flex items-center gap-1">
                  <Flame className="size-3 text-orange-400" /> {activePeer.streak} day streak
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="size-9 rounded-lg grid place-items-center hover:bg-surface-2 text-muted-foreground hover:text-foreground">
                    <Settings className="size-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setClearedAt(Date.now())}>
                    <Trash2 className="size-3.5" /> Clear chat (for me)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-2">
              {visibleMsgs.length === 0 ? (
                <div className="text-center text-xs text-muted-foreground pt-12">
                  Say hello 👋
                </div>
              ) : (
                visibleMsgs.map((m) => {
                  const mine = m.sender_id === user?.id;
                  const gone = m.deleted_for_everyone;
                  return (
                    <div
                      key={m.id}
                      className={`group flex ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div className="flex items-center gap-1 max-w-[80%]">
                        {mine && !gone && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="opacity-0 group-hover:opacity-100 size-7 rounded-md grid place-items-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition">
                                <MoreVertical className="size-3.5" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => deleteForEveryone(m.id)}>
                                <Ban className="size-3.5" /> Delete for everyone
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => deleteForMe(m)}>
                                <Trash2 className="size-3.5" /> Delete for me
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                        <div
                          className={`px-3 py-2 rounded-2xl text-sm break-words ${
                            gone
                              ? "bg-surface-2/60 text-muted-foreground italic flex items-center gap-1.5"
                              : mine
                                ? "bg-primary text-primary-foreground rounded-br-sm"
                                : "bg-surface-2 text-foreground rounded-bl-sm"
                          }`}
                        >
                          {gone ? (
                            <>
                              <Ban className="size-3.5" /> This message was deleted
                            </>
                          ) : (
                            m.message_text
                          )}
                        </div>
                        {!mine && !gone && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="opacity-0 group-hover:opacity-100 size-7 rounded-md grid place-items-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition">
                                <MoreVertical className="size-3.5" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuItem onClick={() => deleteForMe(m)}>
                                <Trash2 className="size-3.5" /> Delete for me
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

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="border-t border-border/60 p-3 sm:px-6 flex items-center gap-2 bg-surface/40 backdrop-blur-xl"
            >
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Message (text & emoji only)…"
                maxLength={2000}
                className="flex-1"
              />
              <Button type="submit" disabled={!draft.trim()}>
                <Send className="size-4" />
              </Button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}

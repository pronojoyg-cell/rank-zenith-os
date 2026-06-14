import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Ctx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isGuest: boolean;
  guestName: string | null;
};

const AuthCtx = createContext<Ctx>({ user: null, session: null, loading: true, signOut: async () => {}, isGuest: false, guestName: null });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [guestName, setGuestName] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const g = localStorage.getItem("guest_mode") === "1";
    const gn = localStorage.getItem("guest_name");
    setIsGuest(g);
    setGuestName(gn);

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setLoading(false);
    });
    const loadingFallback = window.setTimeout(() => {
      if (active) setLoading(false);
    }, 2500);
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
      window.clearTimeout(loadingFallback);
    }).catch(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
      window.clearTimeout(loadingFallback);
      sub.subscription.unsubscribe();
    };
  }, []);

  const user = session?.user ?? null;
  const guestUser = isGuest ? ({ id: "guest", email: guestName || "Guest", user_metadata: {} } as User) : null;

  return (
    <AuthCtx.Provider
      value={{
        session,
        user: user ?? guestUser,
        loading: isGuest ? false : loading,
        isGuest,
        guestName,
        signOut: async () => {
          localStorage.removeItem("guest_mode");
          localStorage.removeItem("guest_name");
          await supabase.auth.signOut();
        },
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);

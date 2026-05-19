import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type GamAction = "mission" | "mistake" | "mock";
const POINTS: Record<GamAction, number> = { mission: 10, mistake: 5, mock: 1 };

function dayDiff(a: Date, b: Date) {
  const da = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const db = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((da.getTime() - db.getTime()) / 86400000);
}

export function useGamification() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const profile = useQuery({
    queryKey: ["gam-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("current_streak,last_activity_date,total_points,is_incognito,display_name,target_air")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const trackActivity = useMutation({
    mutationFn: async (action: GamAction) => {
      if (!user) throw new Error("Not signed in");
      const { data: p } = await supabase
        .from("profiles")
        .select("current_streak,last_activity_date,total_points")
        .eq("id", user.id)
        .maybeSingle();
      const now = new Date();
      const last = p?.last_activity_date ? new Date(p.last_activity_date) : null;
      const diff = last ? dayDiff(now, last) : null;
      let streak = p?.current_streak ?? 0;
      if (diff === null || diff > 1) streak = 1;
      else if (diff === 1) streak = streak + 1;
      // diff === 0 → preserve
      const total = (p?.total_points ?? 0) + POINTS[action];
      const { error } = await supabase
        .from("profiles")
        .update({
          current_streak: streak,
          last_activity_date: now.toISOString(),
          total_points: total,
        })
        .eq("id", user.id);
      if (error) throw error;
      return { streak, total };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gam-profile"] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  const setIncognito = useMutation({
    mutationFn: async (v: boolean) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("profiles").update({ is_incognito: v }).eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gam-profile"] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });

  return { profile: profile.data, isLoading: profile.isLoading, trackActivity, setIncognito };
}

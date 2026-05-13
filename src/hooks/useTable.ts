import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useUserId() {
  const { user } = useAuth();
  return user?.id ?? null;
}

export function useTable<T = any>(table: string, options?: { orderBy?: string; ascending?: boolean; limit?: number }) {
  const uid = useUserId();
  return useQuery({
    queryKey: [table, uid],
    enabled: !!uid,
    queryFn: async () => {
      let q = supabase.from(table as any).select("*").eq("user_id", uid!);
      if (options?.orderBy) q = q.order(options.orderBy, { ascending: options.ascending ?? false });
      if (options?.limit) q = q.limit(options.limit);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as T[];
    },
  });
}

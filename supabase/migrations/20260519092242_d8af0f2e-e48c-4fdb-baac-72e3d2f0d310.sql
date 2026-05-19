
-- Extend profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS current_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_activity_date timestamptz,
  ADD COLUMN IF NOT EXISTS total_points integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_incognito boolean NOT NULL DEFAULT false;

-- Public leaderboard view (hides incognito; only safe columns)
CREATE OR REPLACE VIEW public.leaderboard_public
WITH (security_invoker = on) AS
SELECT id, display_name, target_air, current_streak, total_points
FROM public.profiles
WHERE is_incognito = false;

-- Allow any authenticated user to read non-incognito public leaderboard rows
DROP POLICY IF EXISTS profiles_select_leaderboard ON public.profiles;
CREATE POLICY profiles_select_leaderboard ON public.profiles
  FOR SELECT TO authenticated
  USING (is_incognito = false);

-- CONNECTIONS
DO $$ BEGIN
  CREATE TYPE public.connection_status_t AS ENUM ('pending','accepted','blocked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  status public.connection_status_t NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sender_id, receiver_id),
  CHECK (sender_id <> receiver_id)
);
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS conn_select ON public.connections;
CREATE POLICY conn_select ON public.connections FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
DROP POLICY IF EXISTS conn_insert ON public.connections;
CREATE POLICY conn_insert ON public.connections FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);
DROP POLICY IF EXISTS conn_update ON public.connections;
CREATE POLICY conn_update ON public.connections FOR UPDATE TO authenticated
  USING (auth.uid() = receiver_id OR auth.uid() = sender_id);
DROP POLICY IF EXISTS conn_delete ON public.connections;
CREATE POLICY conn_delete ON public.connections FOR DELETE TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- CHAT ROOMS
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_group boolean NOT NULL DEFAULT false,
  name text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.room_members (
  room_id uuid NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (room_id, user_id)
);
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;

-- Security-definer helper to avoid recursive RLS
CREATE OR REPLACE FUNCTION public.is_room_member(_room uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.room_members WHERE room_id = _room AND user_id = _user);
$$;

DROP POLICY IF EXISTS room_select ON public.chat_rooms;
CREATE POLICY room_select ON public.chat_rooms FOR SELECT TO authenticated
  USING (public.is_room_member(id, auth.uid()));
DROP POLICY IF EXISTS room_insert ON public.chat_rooms;
CREATE POLICY room_insert ON public.chat_rooms FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS rm_select ON public.room_members;
CREATE POLICY rm_select ON public.room_members FOR SELECT TO authenticated
  USING (public.is_room_member(room_id, auth.uid()));
DROP POLICY IF EXISTS rm_insert ON public.room_members;
CREATE POLICY rm_insert ON public.room_members FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.chat_rooms r WHERE r.id = room_id AND r.created_by = auth.uid())
  );
DROP POLICY IF EXISTS rm_delete ON public.room_members;
CREATE POLICY rm_delete ON public.room_members FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- MESSAGES
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  message_text text NOT NULL CHECK (char_length(message_text) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_for_everyone boolean NOT NULL DEFAULT false,
  deleted_by_users uuid[] NOT NULL DEFAULT '{}'
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS messages_room_created_idx ON public.messages(room_id, created_at);

DROP POLICY IF EXISTS msg_select ON public.messages;
CREATE POLICY msg_select ON public.messages FOR SELECT TO authenticated
  USING (public.is_room_member(room_id, auth.uid()));
DROP POLICY IF EXISTS msg_insert ON public.messages;
CREATE POLICY msg_insert ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND public.is_room_member(room_id, auth.uid()));
DROP POLICY IF EXISTS msg_update ON public.messages;
CREATE POLICY msg_update ON public.messages FOR UPDATE TO authenticated
  USING (public.is_room_member(room_id, auth.uid()));

-- Realtime
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.connections REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.connections;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Helper RPC: get-or-create 1:1 chat room between auth user and a peer (only if accepted connection)
CREATE OR REPLACE FUNCTION public.get_or_create_dm(_peer uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _me uuid := auth.uid();
  _room uuid;
BEGIN
  IF _me IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _me = _peer THEN RAISE EXCEPTION 'Cannot DM yourself'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.connections
    WHERE status = 'accepted'
      AND ((sender_id = _me AND receiver_id = _peer) OR (sender_id = _peer AND receiver_id = _me))
  ) THEN
    RAISE EXCEPTION 'Not connected';
  END IF;

  SELECT r.id INTO _room
  FROM public.chat_rooms r
  JOIN public.room_members m1 ON m1.room_id = r.id AND m1.user_id = _me
  JOIN public.room_members m2 ON m2.room_id = r.id AND m2.user_id = _peer
  WHERE r.is_group = false
  LIMIT 1;

  IF _room IS NULL THEN
    INSERT INTO public.chat_rooms (is_group, created_by) VALUES (false, _me) RETURNING id INTO _room;
    INSERT INTO public.room_members (room_id, user_id) VALUES (_room, _me), (_room, _peer);
  END IF;
  RETURN _room;
END $$;
